import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  Calendar,
  ShoppingBag,
  User,
  ArrowRight,
  FileText,
  CalendarDays,
  Clock,
} from "lucide-react"

export const dynamic = "force-dynamic"

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-600",
}

export default async function DashboardOverview() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/admin/login?callbackUrl=/dashboard")
  }

  const email = session.user.email

  const [user, appointmentCount, orderCount, recentOrders, recentAppointments] =
    await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { createdAt: true },
      }),
      prisma.appointment.count({ where: { patientEmail: email } }),
      prisma.order.count({ where: { customerEmail: email } }),
      prisma.order.findMany({
        where: { customerEmail: email },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.appointment.findMany({
        where: { patientEmail: email },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          date: true,
          time: true,
          service: true,
          status: true,
        },
      }),
    ])

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "N/A"

  const initials = session.user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PT"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name || "Patient"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Member since {memberSince}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
            Patient
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {appointmentCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{orderCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Files</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Profile</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">100%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/appointment"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <Calendar className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-700">Book Appointment</span>
          </Link>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <ShoppingBag className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-700">View Orders</span>
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <User className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-700">Edit Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Appointments
            </h3>
            <Link
              href="/dashboard/appointments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No appointments yet.{" "}
              <Link href="/appointment" className="text-primary-600 font-medium">
                Book one now
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.service || "Appointment"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(appointment.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at {appointment.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      APPOINTMENT_STATUS_STYLES[appointment.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No orders yet.{" "}
              <Link href="/products" className="text-primary-600 font-medium">
                Browse products
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      ₦{Number(order.total).toLocaleString()}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        ORDER_STATUS_STYLES[order.status] ||
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
