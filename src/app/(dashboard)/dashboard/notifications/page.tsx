"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Bell,
  Calendar,
  CalendarX,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  APPOINTMENT_CONFIRMED: CalendarCheck,
  APPOINTMENT_REMINDER: CalendarClock,
  APPOINTMENT_UPDATED: Calendar,
  APPOINTMENT_CANCELLED: CalendarX,
  APPOINTMENT_BOOKED: CalendarPlus,
  CONTACT_RECEIVED: MessageSquare,
}

const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT_CONFIRMED: "bg-green-100 text-green-700",
  APPOINTMENT_REMINDER: "bg-blue-100 text-blue-700",
  APPOINTMENT_UPDATED: "bg-yellow-100 text-yellow-700",
  APPOINTMENT_CANCELLED: "bg-red-100 text-red-700",
  APPOINTMENT_BOOKED: "bg-indigo-100 text-indigo-700",
  CONTACT_RECEIVED: "bg-purple-100 text-purple-700",
}

function getNotificationLink(type: string, data: Record<string, unknown> | null): string | null {
  if (data && typeof data === "object") {
    if ("appointmentId" in data) return "/dashboard/appointments"
    if ("orderId" in data || "orderNumber" in data) return "/dashboard/orders"
  }
  if (type.startsWith("APPOINTMENT_")) return "/dashboard/appointments"
  if ("orderNumber" in (data || {})) return "/dashboard/orders"
  return "/dashboard"
}

function formatTimeAgo(dateStr: string): string {
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

export default function NotificationsPage() {
  const { status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications?limit=100")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status, load])

  async function handleMarkAsRead(id: string) {
    setMarkingId(id)
    try {
      const res = await fetch(`/api/user/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      }
    } catch {
      // ignore
    } finally {
      setMarkingId(null)
    }
  }

  async function handleMarkAllAsRead() {
    const unread = notifications.filter((n) => !n.isRead)
    await Promise.all(
      unread.map((n) =>
        fetch(`/api/user/notifications/${n.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        })
      )
    )
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Updates about your appointments and orders
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 text-gray-300 animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 mt-4">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell
            const colorClass = TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-700"
            const link = getNotificationLink(notification.type, notification.data)
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-4",
                  !notification.isRead && "bg-blue-50/40"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm leading-snug", !notification.isRead ? "font-semibold text-gray-900" : "text-gray-700")}>
                      {notification.title}
                    </p>
                    {!notification.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markingId === notification.id}
                        className="text-[11px] text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                      >
                        {markingId === notification.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Mark read
                      </button>
                    )}
                    {link && (
                      <Link href={link} className="text-[11px] text-gray-500 hover:text-primary-600 font-medium">
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
