import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  CalendarDays,
  Activity,
  Edit2,
} from "lucide-react"

export const dynamic = "force-dynamic"

const ROLE_BADGES: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  EDITOR: "bg-green-100 text-green-800",
  VIEWER: "bg-gray-100 text-gray-600",
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          appointments: true,
          contents: true,
          auditLogs: true,
          uploads: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  if (user.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    notFound()
  }

  function formatDate(date: Date | null) {
    if (!date) return null
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  function formatDateTime(date: Date | null) {
    if (!date) return null
    return date.toLocaleString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm mt-1">User details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit User
          </Link>
          <Link
            href="/admin/users/activity"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-4 w-4" />
            View Activity
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    user.isActive ? "bg-primary-100" : "bg-gray-100"
                  }`}
                >
                  <span
                    className={`text-lg font-medium ${
                      user.isActive ? "text-primary-600" : "text-gray-400"
                    }`}
                  >
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        ROLE_BADGES[user.role]
                      }`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">
                        <UserX className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-600">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{ROLE_LABELS[user.role]}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">
                    Member since {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">
                    {user.lastLoginAt
                      ? `Last login ${formatDateTime(user.lastLoginAt)}`
                      : "Never logged in"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Related Data
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Appointments</span>
                <span className="text-lg font-semibold text-gray-900">
                  {user._count.appointments}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Content Items</span>
                <span className="text-lg font-semibold text-gray-900">
                  {user._count.contents}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Activity Logs</span>
                <span className="text-lg font-semibold text-gray-900">
                  {user._count.auditLogs}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Uploads</span>
                <span className="text-lg font-semibold text-gray-900">
                  {user._count.uploads}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
