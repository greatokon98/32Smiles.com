"use client"

import { useEffect } from "react"

const WATERMARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260">
  <g transform="rotate(-18 60 130)" fill="#0f766e" fill-opacity="0.09" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="1">
    <text x="40" y="80">32Smiles Demo</text>
    <text x="40" y="180">Confidential</text>
  </g>
</svg>`

const WATERMARK_URL = `url("data:image/svg+xml,${encodeURIComponent(WATERMARK_SVG)}")`

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true
  if (el.isContentEditable) return true
  return false
}

export default function DemoProtection() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault()
    }
    const onCopyCut = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) e.preventDefault()
    }
    const onSelectStart = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault()
    }
    const onDragStart = (e: DragEvent) => {
      if (!isEditable(e.target)) e.preventDefault()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      const printable = ["U", "P", "S"].includes(key)
      const blocked =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && printable)
      if (blocked && !(printable && isEditable(e.target))) {
        e.preventDefault()
        return false
      }
    }
    const onBeforePrint = (e: Event) => e.preventDefault()

    document.addEventListener("contextmenu", onContextMenu)
    document.addEventListener("copy", onCopyCut)
    document.addEventListener("cut", onCopyCut)
    document.addEventListener("selectstart", onSelectStart)
    document.addEventListener("dragstart", onDragStart)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("beforeprint", onBeforePrint)

    // Gentle devtools-open heuristic — console notice only, never breaks the page.
    const checkDevtools = () => {
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      if (widthDiff > 160 || heightDiff > 160) {
        console.warn(
          "%c32Smiles Demo",
          "color:#0d9488;font-weight:bold",
          "Developer tools detected. This is a confidential evaluation build."
        )
      }
    }
    const interval = window.setInterval(checkDevtools, 2500)

    return () => {
      document.removeEventListener("contextmenu", onContextMenu)
      document.removeEventListener("copy", onCopyCut)
      document.removeEventListener("cut", onCopyCut)
      document.removeEventListener("selectstart", onSelectStart)
      document.removeEventListener("dragstart", onDragStart)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("beforeprint", onBeforePrint)
      window.clearInterval(interval)
    }
  }, [])

  return (
    <>
      <style>{`
        body {
          -webkit-user-select: none;
          user-select: none;
        }
        input,
        textarea,
        [contenteditable="true"] {
          -webkit-user-select: text;
          user-select: text;
        }
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: "none",
          backgroundImage: WATERMARK_URL,
          backgroundSize: "360px 260px",
        }}
      />
    </>
  )
}
