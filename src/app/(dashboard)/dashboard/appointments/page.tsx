"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Calendar, Clock, AlertCircle } from "lucide-react"

interface Appointment {
  id: string
  date: string
  time: string
  endTime: string | null
  service: string | null
  status: string
  notes: string | null
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-600",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
}

export default function AppointmentsPage() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await fetch("/api/appointments?my=true")
        if (res.ok) {
          const data = await res.json()
          setAppointments(data)
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
          <p className="text-gray-500 mb-6">Book your first appointment to get started.</p>
          <Link
            href="/appointment"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <Link
          href="/appointment"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Book Appointment
        </Link>
      </div>

      <div className="space-y-4">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(appt.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    {appt.time}
                    {appt.endTime && ` - ${appt.endTime}`}
                  </span>
                </div>
                {appt.service && (
                  <p className="text-sm font-medium text-gray-900">
                    {appt.service}
                  </p>
                )}
                {appt.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{appt.notes}</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  statusStyles[appt.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {statusLabels[appt.status] || appt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
