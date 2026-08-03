"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export default function AnalyticsProvider() {
  const pathname = usePathname()
  const startTime = useRef(Date.now())
  const sessionId = useRef(typeof window !== "undefined" ? crypto.randomUUID() : "")

  useEffect(() => {
    startTime.current = Date.now()

    const sendPageView = () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000)
      const scrollDepth = Math.round(
        (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
      )

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pathname,
          event: "page_view",
          source: document.referrer || "direct",
          metadata: {
            sessionId: sessionId.current,
            duration,
            scrollDepth,
            userAgent: navigator.userAgent,
          },
        }),
      }).catch(() => {})
    }

    const handleBeforeUnload = () => {
      if (navigator.sendBeacon) {
        const duration = Math.round((Date.now() - startTime.current) / 1000)
        navigator.sendBeacon(
          "/api/analytics/track",
          JSON.stringify({
            page: pathname,
            event: "page_leave",
            source: document.referrer || "direct",
            metadata: { sessionId: sessionId.current, duration },
          })
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      sendPageView()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [pathname])

  return null
}
