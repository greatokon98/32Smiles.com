"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Bell,
  BellRing,
  Calendar,
  CalendarX,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  MessageSquare,
  MessagesSquare,
  UserCheck,
  Sparkles,
  FileText,
  Settings,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  userId?: string
}

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
  CONTACT_ASSIGNED: UserCheck,
  MESSAGE_RECEIVED: MessagesSquare,
  AI_CONTENT_READY: Sparkles,
  AI_CONTENT_APPROVED: Sparkles,
  AI_CONTENT_REJECTED: Sparkles,
  CONTENT_PUBLISHED: FileText,
  SYSTEM_ALERT: Settings,
}

const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT_CONFIRMED: "bg-green-100 text-green-700",
  APPOINTMENT_REMINDER: "bg-blue-100 text-blue-700",
  APPOINTMENT_UPDATED: "bg-yellow-100 text-yellow-700",
  APPOINTMENT_CANCELLED: "bg-red-100 text-red-700",
  APPOINTMENT_BOOKED: "bg-indigo-100 text-indigo-700",
  CONTACT_RECEIVED: "bg-purple-100 text-purple-700",
  CONTACT_ASSIGNED: "bg-violet-100 text-violet-700",
  MESSAGE_RECEIVED: "bg-teal-100 text-teal-700",
  AI_CONTENT_READY: "bg-indigo-100 text-indigo-700",
  AI_CONTENT_APPROVED: "bg-green-100 text-green-700",
  AI_CONTENT_REJECTED: "bg-red-100 text-red-700",
  CONTENT_PUBLISHED: "bg-emerald-100 text-emerald-700",
  SYSTEM_ALERT: "bg-orange-100 text-orange-700",
}

function getNotificationLink(
  type: string,
  data: Record<string, unknown> | null,
  isPatient: boolean
): string | null {
  if (data && typeof data === "object") {
    if ("appointmentId" in data) return isPatient ? "/dashboard/appointments" : "/admin/appointments"
    if ("orderId" in data || "orderNumber" in data) return isPatient ? "/dashboard/orders" : "/admin/orders"
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

export default function NotificationBell(_props: NotificationBellProps) {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isPatient = session?.user?.role === "VIEWER"
  const notificationsApi = isPatient ? "/api/user/notifications" : "/api/admin/notifications"

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `${notificationsApi}?limit=10`
      )
      if (res.ok) {
        return await res.json()
      }
    } catch {
      console.error("Failed to fetch notifications")
    }
    return null
  }, [notificationsApi])

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false

    async function load() {
      const data = await fetchNotifications()
      if (!cancelled && data) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    }

    load()
    const interval = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [fetchNotifications, status])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (status !== "authenticated" || !session?.user?.id) {
    return null
  }

  async function handleMarkAsRead(id: string) {
    setMarkingId(id)
    try {
      const res = await fetch(`${notificationsApi}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      console.error("Failed to mark notification as read")
    } finally {
      setMarkingId(null)
    }
  }

  async function handleMarkAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`${notificationsApi}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
      )
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
    } catch {
      console.error("Failed to mark all as read")
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          isOpen
            ? "bg-gray-100 text-gray-700"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        )}
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-h-[480px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-500 mt-3">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const Icon =
                    TYPE_ICONS[notification.type] || Bell
                  const colorClass =
                    TYPE_COLORS[notification.type] ||
                    "bg-gray-100 text-gray-700"
                  const link = getNotificationLink(
                    notification.type,
                    notification.data,
                    isPatient
                  )

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                        !notification.isRead && "bg-blue-50/30"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          colorClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              !notification.isRead
                                ? "font-semibold text-gray-900"
                                : "text-gray-700"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <button
                              onClick={() =>
                                handleMarkAsRead(notification.id)
                              }
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
                        </div>
                      </div>
                      {link && (
                        <Link
                          href={link}
                          onClick={() => {
                            setIsOpen(false)
                            if (!notification.isRead) {
                              handleMarkAsRead(notification.id)
                            }
                          }}
                          className="shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Go to related page"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href={isPatient ? "/dashboard/notifications" : "/admin/notifications"}
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
