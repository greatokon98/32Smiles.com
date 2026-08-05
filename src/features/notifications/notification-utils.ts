"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  Calendar,
  CalendarX,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  MessageSquare,
  MessagesSquare,
  UserCheck,
  Sparkles,
  Pencil,
  FileText,
  Settings,
} from "lucide-react"

export const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  APPOINTMENT_CONFIRMED: CalendarCheck,
  APPOINTMENT_REMINDER: CalendarClock,
  APPOINTMENT_UPDATED: Calendar,
  APPOINTMENT_CANCELLED: CalendarX,
  APPOINTMENT_BOOKED: CalendarPlus,
  CONTACT_RECEIVED: MessageSquare,
  CONTACT_ASSIGNED: UserCheck,
  MESSAGE_RECEIVED: MessagesSquare,
  MESSAGE_EDITED: Pencil,
  AI_CONTENT_READY: Sparkles,
  AI_CONTENT_APPROVED: Sparkles,
  AI_CONTENT_REJECTED: Sparkles,
  CONTENT_PUBLISHED: FileText,
  SYSTEM_ALERT: Settings,
}

export const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT_CONFIRMED: "bg-green-100 text-green-700",
  APPOINTMENT_REMINDER: "bg-blue-100 text-blue-700",
  APPOINTMENT_UPDATED: "bg-yellow-100 text-yellow-700",
  APPOINTMENT_CANCELLED: "bg-red-100 text-red-700",
  APPOINTMENT_BOOKED: "bg-indigo-100 text-indigo-700",
  CONTACT_RECEIVED: "bg-purple-100 text-purple-700",
  CONTACT_ASSIGNED: "bg-violet-100 text-violet-700",
  MESSAGE_RECEIVED: "bg-teal-100 text-teal-700",
  MESSAGE_EDITED: "bg-amber-100 text-amber-700",
  AI_CONTENT_READY: "bg-indigo-100 text-indigo-700",
  AI_CONTENT_APPROVED: "bg-green-100 text-green-700",
  AI_CONTENT_REJECTED: "bg-red-100 text-red-700",
  CONTENT_PUBLISHED: "bg-emerald-100 text-emerald-700",
  SYSTEM_ALERT: "bg-orange-100 text-orange-700",
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

function withHighlight(base: string, id: unknown): string {
  if (typeof id !== "string" || id.length === 0) return base
  const sep = base.includes("?") ? "&" : "?"
  return `${base}${sep}highlight=${encodeURIComponent(id)}`
}

export function getNotificationLink(
  type: string,
  data: Record<string, unknown> | null,
  isPatient: boolean
): string | null {
  if (data && typeof data === "object") {
    if ("appointmentId" in data)
      return withHighlight(isPatient ? "/dashboard/appointments" : "/admin/appointments", data.appointmentId)
    if ("orderId" in data)
      return withHighlight(isPatient ? "/dashboard/orders" : "/admin/orders", data.orderId)
    if ("orderNumber" in data)
      return isPatient ? "/dashboard/orders" : "/admin/orders"
    if ("contactId" in data) return "/admin/contacts"
    if ("conversationId" in data)
      return isPatient
        ? "/dashboard/notifications"
        : `/admin/communication?conversationId=${data.conversationId}`
    if ("contentId" in data) return "/admin/content"
    if ("draftId" in data) return "/admin/ai-studio"
  }

  if (type.startsWith("APPOINTMENT_")) return isPatient ? "/dashboard/appointments" : "/admin/appointments"
  if (type === "CONTACT_RECEIVED") return "/admin/contacts"
  if (type.startsWith("AI_")) return "/admin/ai-studio"
  if (type === "CONTENT_PUBLISHED") return "/admin/content"
  return isPatient ? "/dashboard" : "/admin/dashboard"
}

export async function markNotificationRead(apiBase: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function useNotificationHighlight(dataLength: number) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("highlight")
    if (!raw) return
    setActiveId(raw)
    const timer = setTimeout(() => setActiveId(null), 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!activeId) return
    const el = document.getElementById(`hl-${activeId}`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [activeId, dataLength])

  return {
    highlightedId: activeId,
    isHighlighted: (id: string) => activeId === id,
  }
}
