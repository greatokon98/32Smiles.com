"use client"

import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import Image from "@tiptap/extension-image"
import { useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type ImageAlign = "center" | "left" | "right" | "float-left" | "float-right"

export const IMAGE_PRESETS = [
  { label: "Small", value: 40 },
  { label: "Medium", value: 65 },
  { label: "Full", value: 100 },
]

export function clampImageWidth(n: number) {
  return Math.min(100, Math.max(15, Math.round(n)))
}

// Inline style applied to the <img> in the stored HTML so public pages honor
// resize + alignment without extra class rules.
export function imageAttrsToStyle(width: number | null, align: ImageAlign | null): string {
  const parts: string[] = ["display:block"]
  if (align === "float-left") {
    parts.push("float:left", "width:45%", "margin:0 1.5rem 1rem 0")
    return parts.join(";")
  }
  if (align === "float-right") {
    parts.push("float:right", "width:45%", "margin:0 0 1rem 1.5rem")
    return parts.join(";")
  }
  if (width) parts.push(`width:${width}%`)
  if (align === "left") parts.push("margin:2rem auto 2rem 0")
  else if (align === "right") parts.push("margin:2rem 0 2rem auto")
  else parts.push("margin:2rem auto")
  return parts.join(";")
}

// Editor-only styles for the node view wrapper. Kept visually identical to the
// inline styles emitted by imageAttrsToStyle so the editor matches the public
// page: block layout with margin-based centering (no relative/translate tricks).
function wrapperStyle(width: number | null, align: ImageAlign | null): CSSProperties {
  const style: CSSProperties = { position: "relative", display: "block", maxWidth: "100%", margin: "2rem auto" }
  if (align === "float-left") {
    return { position: "relative", display: "block", width: `${width ?? 45}%`, margin: "0 1.5rem 1rem 0", float: "left" }
  }
  if (align === "float-right") {
    return { position: "relative", display: "block", width: `${width ?? 45}%`, margin: "0 0 1rem 1.5rem", float: "right" }
  }
  if (width) style.width = `${width}%`
  if (align === "left") style.margin = "2rem auto 2rem 0"
  else if (align === "right") style.margin = "2rem 0 2rem auto"
  return style
}

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, align } = node.attrs as { src: string; alt: string; width: number | null; align: ImageAlign | null }
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startPct: number; parentPx: number } | null>(null)

  function onGripPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    const parentPx = containerRef.current?.parentElement?.getBoundingClientRect().width ?? 600
    const startPct = typeof width === "number" ? width : 100
    dragRef.current = { startX: e.clientX, startPct, parentPx }
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // synthetic / unsupported pointers can ignore capture
    }
  }

  function onGripPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const deltaPx = e.clientX - drag.startX
    updateAttributes({ width: clampImageWidth(drag.startPct + (deltaPx / drag.parentPx) * 100) })
  }

  function onGripPointerUp() {
    dragRef.current = null
  }

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={cn(selected && "rounded-xl ring-2 ring-primary-500")}
      style={wrapperStyle(width, align)}
    >
      <img
        src={src}
        alt={alt || ""}
        draggable={false}
        className="rounded-xl h-auto max-w-full w-full block select-none"
      />
      {selected && (
        <div
          className="absolute -bottom-1 -right-1 z-10 w-3.5 h-3.5 bg-primary-600 border-2 border-white rounded-sm cursor-nwse-resize touch-none"
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          title="Drag to resize"
        />
      )}
    </NodeViewWrapper>
  )
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const raw = element.style.width
          if (raw && raw.trim().endsWith("%")) {
            const n = parseInt(raw, 10)
            if (!Number.isNaN(n)) return clampImageWidth(n)
          }
          return null
        },
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const s = element.style
          if (s.cssFloat === "left" || s.float === "left") return "float-left"
          if (s.cssFloat === "right" || s.float === "right") return "float-right"
          const ml = s.marginLeft
          const mr = s.marginRight
          if (ml === "auto" && mr === "auto") return "center"
          if (ml === "auto") return "right"
          if (mr === "auto") return "left"
          return "center"
        },
        renderHTML: (attributes) => ({
          style: imageAttrsToStyle(attributes.width ?? null, attributes.align ?? null),
        }),
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})
