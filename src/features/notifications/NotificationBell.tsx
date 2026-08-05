"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Bell, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  TYPE_ICONS,
  TYPE_COLORS,
  getNotificationLink,
  formatTimeAgo,
  markNotificationRead,
} from "@/features/notifications/notification-utils"

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

export default function NotificationBell(_props: NotificationBellProps) {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isPatient = session?.user?.role === "VIEWER"
  const notificationsApi = isPatient ? "/api/user/notifications" : "/api/admin/notifications"

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${notificationsApi}?limit=10`)
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (status !== "authenticated" || !session?.user?.id) {
    return null
  }

  function handleOpenNotification(id: string) {
    setIsOpen(false)
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id)
      if (target && !target.isRead) {
        markNotificationRead(notificationsApi, id)
        setUnreadCount((count) => Math.max(0, count - 1))
        return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      }
      return prev
    })
  }

  async function handleMarkAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      await Promise.all(unreadIds.map((id) => markNotificationRead(notificationsApi, id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
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
                  const Icon = TYPE_ICONS[notification.type] || Bell
                  const colorClass =
                    TYPE_COLORS[notification.type] ||
                    "bg-gray-100 text-gray-700"
                  const link = getNotificationLink(
                    notification.type,
                    notification.data,
                    isPatient
                  )

                  const content = (
                    <>
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
                        <span className="text-[11px] text-gray-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </>
                  )

                  const rowClassName = cn(
                    "flex items-start gap-3 px-4 py-3 w-full text-left transition-colors",
                    link && "hover:bg-gray-50 cursor-pointer",
                    !link && "cursor-default",
                    !notification.isRead && "bg-blue-50/30"
                  )

                  return (
                    <div key={notification.id} className="relative">
                      {link ? (
                        <Link
                          href={link}
                          onClick={() => handleOpenNotification(notification.id)}
                          className={rowClassName}
                          title={notification.title}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleOpenNotification(notification.id)}
                          className={rowClassName}
                        >
                          {content}
                        </button>
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
