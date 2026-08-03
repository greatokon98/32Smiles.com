import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { hasPermission, ROLE_LABELS } from "@/lib/permissions"
import {
  FileText,
  Users,
  Calendar,
  Settings,
  MessageSquare,
  CheckCircle,
  ShoppingCart,
  Newspaper,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const role = session.user.role || "VIEWER"
  const customPermissions = session.user.permissions
  const can = (resource: Parameters<typeof hasPermission>[1], action: Parameters<typeof hasPermission>[2]) =>
    hasPermission(role, resource, action, customPermissions)

  const roleLabel = ROLE_LABELS[role] || role

  const [
    totalContent,
    publishedContent,
    totalAppointments,
    pendingAppointments,
    totalUsers,
    unreadContacts,
    recentAppointments,
    recentContacts,
    recentContent,
  ] = await Promise.all([
    can("content", "read")
      ? prisma.content.count({ where: { deletedAt: null } })
      : Promise.resolve(0),
    can("content", "read")
      ? prisma.content.count({ where: { status: "PUBLISHED", deletedAt: null } })
      : Promise.resolve(0),
    can("appointments", "read")
      ? prisma.appointment.count()
      : Promise.resolve(0),
    can("appointments", "read")
      ? prisma.appointment.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    can("users", "read")
      ? prisma.user.count({ where: { isActive: true } })
      : Promise.resolve(0),
    can("contacts", "read")
      ? prisma.contactSubmission.count({ where: { isRead: false } })
      : Promise.resolve(0),
    can("appointments", "read")
      ? prisma.appointment.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            patientName: true,
            service: true,
            date: true,
            time: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    can("contacts", "read")
      ? prisma.contactSubmission.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            isRead: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    can("content", "read")
      ? prisma.content.findMany({
          orderBy: { updatedAt: "desc" },
          take: 5,
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ])

  const stats = [
    can("content", "read") && {
      label: "Total Content",
      value: totalContent.toString(),
      icon: FileText,
      color: "bg-blue-500",
    },
    can("content", "read") && {
      label: "Published",
      value: publishedContent.toString(),
      icon: CheckCircle,
      color: "bg-green-500",
    },
    can("appointments", "read") && {
      label: "Appointments",
      value: totalAppointments.toString(),
      icon: Calendar,
      color: "bg-purple-500",
      detail: `${pendingAppointments} pending`,
    },
    can("users", "read") && {
      label: "Users",
      value: totalUsers.toString(),
      icon: Users,
      color: "bg-orange-500",
    },
    can("contacts", "read") && {
      label: "Unread Contacts",
      value: unreadContacts.toString(),
      icon: MessageSquare,
      color: "bg-red-500",
    },
  ].filter(Boolean) as Array<{
    label: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    detail?: string
  }>

  const quickLinks = [
    can("appointments", "read") && {
      label: "Appointments",
      href: "/admin/appointments",
      icon: Calendar,
    },
    can("orders", "read") && {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    can("users", "read") && {
      label: "Users",
      href: "/admin/users",
      icon: Users,
    },
    can("settings", "read") && {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    can("content", "read") && {
      label: "Content",
      href: "/admin/content",
      icon: FileText,
    },
  ].filter(Boolean) as Array<{
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }>

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-gray-100 text-gray-600",
  }

  function formatDate(iso: Date) {
    return new Date(iso).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    })
  }

  function formatDateTime(iso: Date) {
    return new Date(iso).toLocaleString("en-NG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session.user.name}
          </h1>
          <span className="inline-flex items-center gap-2 self-start sm:self-auto text-xs bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full font-medium">
            {roleLabel}
          </span>
        </div>

        {stats.length > 0 && (
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${
              stats.length > 3 ? "lg:grid-cols-5" : ""
            }`}
          >
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    {stat.detail && (
                      <p className="text-xs text-gray-400">{stat.detail}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {quickLinks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <link.icon className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-700">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {can("appointments", "read") && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Appointments
                </h2>
                <Link
                  href="/admin/appointments"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </Link>
              </div>
              {recentAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-gray-400 text-sm mt-2">
                    No appointments yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appt.patientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appt.service || "General"} &middot; {formatDate(appt.date)} at{" "}
                          {appt.time}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {can("contacts", "read") && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Contacts
                </h2>
                <Link
                  href="/admin/contacts"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </Link>
              </div>
              {recentContacts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-gray-400 text-sm mt-2">
                    No contact submissions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </p>
                          {!contact.isRead && (
                            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {contact.subject}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-3">
                        {formatDateTime(contact.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {can("content", "read") && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Content
                </h2>
                <Link
                  href="/admin/content"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </Link>
              </div>
              {recentContent.length === 0 ? (
                <div className="text-center py-8">
                  <Newspaper className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-gray-400 text-sm mt-2">
                    No content yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContent.map((content) => (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {content.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {content.type.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          STATUS_COLORS[content.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {content.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
