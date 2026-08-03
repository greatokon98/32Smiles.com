"use client"

import { useState, useMemo } from "react"
import { Pagination } from "@/components/admin/pagination"
import {
  Search,
  Bell,
  BellOff,
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
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationUser {
  id: string
  name: string
  email: string
}

interface Notification {
  id: string
  userId: string
  type: string
  channel: string
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  sentAt: string | null
  createdAt: string
  user: NotificationUser | null
}

interface NotificationsListProps {
  initialNotifications: Notification[]
  initialUnreadCount: number
  currentUserId: string
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

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_CONFIRMED: "Appointment Confirmed",
  APPOINTMENT_REMINDER: "Appointment Reminder",
  APPOINTMENT_UPDATED: "Appointment Updated",
  APPOINTMENT_CANCELLED: "Appointment Cancelled",
  APPOINTMENT_BOOKED: "Appointment Booked",
  CONTACT_RECEIVED: "Contact Received",
  CONTACT_ASSIGNED: "Contact Assigned",
  MESSAGE_RECEIVED: "New Message",
  AI_CONTENT_READY: "AI Content Ready",
  AI_CONTENT_APPROVED: "AI Content Approved",
  AI_CONTENT_REJECTED: "AI Content Rejected",
  CONTENT_PUBLISHED: "Content Published",
  SYSTEM_ALERT: "System Alert",
}

const ALL_TYPES = Object.keys(TYPE_LABELS)

type ReadFilter = "" | "read" | "unread"

const ITEMS_PER_PAGE = 15

export default function NotificationsList({
  initialNotifications,
  initialUnreadCount,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [readFilter, setReadFilter] = useState<ReadFilter>("")
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = notifications

    if (typeFilter) {
      result = result.filter((n) => n.type === typeFilter)
    }

    if (readFilter === "read") {
      result = result.filter((n) => n.isRead)
    } else if (readFilter === "unread") {
      result = result.filter((n) => !n.isRead)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.user?.name?.toLowerCase().includes(q) ||
          n.user?.email?.toLowerCase().includes(q)
      )
    }

    return result
  }, [notifications, typeFilter, readFilter, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function handleToggleRead(id: string) {
    setUpdatingId(id)
    try {
      const notification = notifications.find((n) => n.id === id)
      if (!notification) return

      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !notification.isRead }),
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  isRead: !n.isRead,
                  readAt: !n.isRead ? new Date().toISOString() : null,
                }
              : n
          )
        )
        setUnreadCount((prev) =>
          notification.isRead ? prev + 1 : Math.max(0, prev - 1)
        )
      }
    } catch {
      alert("Failed to update notification")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        const notification = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } else {
        const err = await res.json()
        alert(err.error || "Failed to delete notification")
      }
    } catch {
      alert("Failed to delete notification")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/admin/notifications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
      )
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
    } catch {
      alert("Failed to mark notifications as read")
    }
  }

  function handleExport() {
    const csvHeader = "Title,Type,User,Read,Created At\n"
    const csvRows = filtered
      .map((n) => {
        const title = `"${n.title.replace(/"/g, '""')}"`
        const type = TYPE_LABELS[n.type] || n.type
        const user = n.user?.name || n.user?.email || "System"
        const read = n.isRead ? "Yes" : "No"
        const date = formatDateTime(n.createdAt)
        return `${title},${type},${user},${read},${date}`
      })
      .join("\n")

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notifications-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-blue-600 font-medium">
                <BellRing className="h-3 w-3" />
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none min-w-[180px]"
            >
              <option value="">All Types</option>
              {ALL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <select
            value={readFilter}
            onChange={(e) => {
              setReadFilter(e.target.value as ReadFilter)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y">
            {paginated.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] || Bell
              const colorClass =
                TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-700"
              const isUpdating = updatingId === notification.id
              const isDeleting = deletingId === notification.id

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors",
                    !notification.isRead && "bg-blue-50/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      colorClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.isRead
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0",
                          colorClass
                        )}
                      >
                        {TYPE_LABELS[notification.type] || notification.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{formatDateTime(notification.createdAt)}</span>
                      {notification.user && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>
                            {notification.user.name || notification.user.email}
                          </span>
                        </>
                      )}
                      {notification.channel === "EMAIL" && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-green-600">Email sent</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleRead(notification.id)}
                      disabled={isUpdating || isDeleting}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        notification.isRead
                          ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          : "text-blue-500 hover:bg-blue-50 hover:text-blue-700",
                        (isUpdating || isDeleting) && "opacity-50"
                      )}
                      title={
                        notification.isRead
                          ? "Mark as unread"
                          : "Mark as read"
                      }
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : notification.isRead ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={isUpdating || isDeleting}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete notification"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
