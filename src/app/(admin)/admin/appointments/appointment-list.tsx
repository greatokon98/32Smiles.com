"use client"

import { useState, useMemo } from "react"
import { Pagination } from "@/components/admin/pagination"
import {
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
} from "lucide-react"

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

interface Appointment {
  id: string
  patientName: string
  patientEmail: string
  patientPhone: string
  date: string
  time: string
  endTime: string | null
  service: string | null
  notes: string | null
  status: AppointmentStatus
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-600",
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
}

const ITEMS_PER_PAGE = 15

export default function AppointmentList({
  initialAppointments,
}: {
  initialAppointments: Appointment[]
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("")
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = appointments

    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.patientEmail.toLowerCase().includes(q)
      )
    }

    return result
  }, [appointments, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function formatTime(time: string) {
    return time
  }

  async function handleStatusChange(id: string, newStatus: AppointmentStatus) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: updated.status, updatedAt: updated.updatedAt } : a))
        )
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update appointment")
      }
    } catch {
      alert("Failed to update appointment")
    } finally {
      setUpdatingId(null)
    }
  }

  function getAvailableActions(status: AppointmentStatus) {
    switch (status) {
      case "PENDING":
        return [
          { label: "Confirm", status: "CONFIRMED" as const, color: "text-blue-600 hover:bg-blue-50" },
          { label: "Cancel", status: "CANCELLED" as const, color: "text-red-600 hover:bg-red-50" },
        ]
      case "CONFIRMED":
        return [
          { label: "Complete", status: "COMPLETED" as const, color: "text-green-600 hover:bg-green-50" },
          { label: "Cancel", status: "CANCELLED" as const, color: "text-red-600 hover:bg-red-50" },
        ]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
            {statusFilter && ` (${STATUS_LABELS[statusFilter]})`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AppointmentStatus | "")
            setPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Service
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((appointment) => {
                  const actions = getAvailableActions(appointment.status)
                  const isUpdating = updatingId === appointment.id

                  return (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {appointment.patientName}
                            </p>
                            {appointment.notes && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[180px]">{appointment.patientEmail}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{appointment.patientPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(appointment.date)}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatTime(appointment.time)}
                            {appointment.endTime && ` – ${appointment.endTime}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {appointment.service ? (
                          <span className="text-sm text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-gray-400" />
                            {appointment.service}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[appointment.status]}`}
                        >
                          {STATUS_LABELS[appointment.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {actions.length > 0 && (
                          <div className="flex items-center justify-end gap-1">
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                              actions.map((action) => (
                                <button
                                  key={action.status}
                                  onClick={() =>
                                    handleStatusChange(appointment.id, action.status)
                                  }
                                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${action.color}`}
                                >
                                  {action.status === "CONFIRMED" && (
                                    <CheckCircle className="h-3 w-3 inline mr-1" />
                                  )}
                                  {action.status === "COMPLETED" && (
                                    <CheckCircle className="h-3 w-3 inline mr-1" />
                                  )}
                                  {action.status === "CANCELLED" && (
                                    <XCircle className="h-3 w-3 inline mr-1" />
                                  )}
                                  {action.label}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
