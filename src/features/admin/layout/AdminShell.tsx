"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import AdminSidebar from "./AdminSidebar"
import AdminHeader from "./AdminHeader"
import type { Permission } from "@/lib/permissions"

const STORAGE_KEY = "admin-sidebar-collapsed"

export default function AdminShell({ children, userId }: { children: React.ReactNode; userId: string }) {
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const userName = session?.user?.name || "Admin"
  const userRole = session?.user?.role || ""
  const userPermissions = (session?.user as { permissions?: Permission[] } | undefined)?.permissions
  const onSignOut = () => signOut({ callbackUrl: "/admin/login" })

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setCollapsed(stored === "true")
    }

    const mq = window.matchMedia("(min-width: 1024px)")
    setIsDesktop(mq.matches)

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const handleMobileClose = useCallback(() => setMobileOpen(false), [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />
      </div>
    )
  }

  const sidebarWidth = isDesktop ? (collapsed ? 64 : 256) : 0

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        userName={userName}
        userRole={userRole}
        userPermissions={userPermissions}
        onSignOut={onSignOut}
      />

      <div
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        <AdminHeader
          onMobileMenuToggle={() => setMobileOpen((prev) => !prev)}
          userId={userId}
          userName={userName}
          userRole={userRole}
          onSignOut={onSignOut}
        />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
