"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Bell, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  TYPE_ICONS,
  TYPE_COLORS,
  getNotificationLink,
  formatTimeAgo,
  markNotificationRead,
} from "@/features/notifications/notification-utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

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

  function handleOpen(id: string) {
    const notification = notifications.find((n) => n.id === id)
    if (notification && !notification.isRead) {
      markNotificationRead("/api/user/notifications", id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    }
  }

  async function handleMarkAllAsRead() {
    const unread = notifications.filter((n) => !n.isRead)
    await Promise.all(
      unread.map((n) => markNotificationRead("/api/user/notifications", n.id))
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
            const colorClass =
              TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-700"
            const link = getNotificationLink(notification.type, notification.data, true)

            const content = (
              <>
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    {notification.message}
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
              </>
            )

            const rowClassName = cn(
              "flex items-start gap-3 px-4 py-4 w-full text-left transition-colors",
              link && "hover:bg-gray-50 cursor-pointer",
              !notification.isRead && "bg-blue-50/40"
            )

            return (
              <div key={notification.id}>
                {link ? (
                  <Link
                    href={link}
                    onClick={() => handleOpen(notification.id)}
                    className={rowClassName}
                    title={notification.title}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleOpen(notification.id)}
                    className={rowClassName}
                  >
                    {content}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
