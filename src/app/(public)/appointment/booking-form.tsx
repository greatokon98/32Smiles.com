"use client"

import { useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays,
  Clock,
  User,
  Mail,
  Phone,
  Stethoscope,
  FileText,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"

const DENTAL_SERVICES = [
  "General Checkup & Cleaning",
  "Teeth Whitening",
  "Root Canal Treatment",
  "Dental Implants",
  "Cosmetic Dentistry",
  "Wisdom Teeth Removal",
  "Dental Veneers",
  "Orthodontics / Braces",
  "Emergency Dental Care",
  "Pediatric Dentistry",
  "Gum Disease Treatment",
  "Dental Crown & Bridge",
  "Other",
]

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
]

function getDateConstraints() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  return {
    min: tomorrow.toISOString().split("T")[0],
    max: maxDate.toISOString().split("T")[0],
  }
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function BookingForm({
  initialUser = null,
}: {
  initialUser?: { name: string; email: string; phone: string } | null
}) {
  const dateConstraints = getDateConstraints()
  const [form, setForm] = useState({
    patientName: initialUser?.name || "",
    patientEmail: initialUser?.email || "",
    patientPhone: initialUser?.phone || "",
    appointmentDate: "",
    appointmentTime: "",
    serviceType: "",
    notes: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState<string | ReactNode>("")
  const [confirmation, setConfirmation] = useState<{
    id: string
    date: string
    time: string
    service: string
  } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!form.patientName.trim()) newErrors.patientName = "Name is required"
    if (!form.patientEmail.trim()) {
      newErrors.patientEmail = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patientEmail)) {
      newErrors.patientEmail = "Invalid email address"
    }
    if (!form.patientPhone.trim()) newErrors.patientPhone = "Phone number is required"
    if (!form.appointmentDate) newErrors.appointmentDate = "Please select a date"
    if (!form.appointmentTime) newErrors.appointmentTime = "Please select a time"
    if (!form.serviceType) newErrors.serviceType = "Please select a service"

    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function handleTimeSelect(time: string) {
    setForm((prev) => ({ ...prev, appointmentTime: time }))
    if (fieldErrors.appointmentTime) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.appointmentTime
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus("loading")
    setError("")

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: form.patientName.trim(),
          patientEmail: form.patientEmail.trim(),
          patientPhone: form.patientPhone.trim(),
          appointmentDate: form.appointmentDate,
          appointmentTime: form.appointmentTime,
          serviceType: form.serviceType,
          notes: form.notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setConfirmation({
          id: data.appointment.id,
          date: form.appointmentDate,
          time: data.appointment.time,
          service: data.appointment.service,
        })
        setStatus("success")
      } else if (res.status === 409 && data.code === "EMAIL_EXISTS") {
        setError(
          <>
            This email is already registered. Please log in to manage your appointments.
            {" "}<a href="/admin/login" className="font-semibold underline">Go to Login →</a>
          </>
        )
        setStatus("error")
      } else {
        setError(data.error || "Failed to book appointment")
        setStatus("error")
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  function handleReset() {
    setForm({
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      appointmentDate: "",
      appointmentTime: "",
      serviceType: "",
      notes: "",
    })
    setStatus("idle")
    setError("")
    setConfirmation(null)
    setFieldErrors({})
  }

  if (status === "success" && confirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
        <p className="text-gray-600 mb-8">
          We&apos;ve received your booking request. Our team will confirm your appointment shortly.
        </p>

        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono font-medium text-gray-900">{confirmation.id.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">{formatDateDisplay(confirmation.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-gray-900">{confirmation.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-900">{confirmation.service}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Confirmation
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          A confirmation will be sent to <strong>{form.patientEmail || "your email"}</strong>
        </p>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Book another appointment
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h2>
      <p className="text-gray-500 text-sm mb-8">
        Fill in the details below and we&apos;ll confirm your appointment within 24 hours.
      </p>

      {initialUser && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 mb-6 text-sm flex items-center justify-between gap-3 flex-wrap">
          <span>
            Booking as <strong>{initialUser.name}</strong> ({initialUser.email}). Your details
            are pre-filled from your account.
          </span>
          <a href="/dashboard/profile" className="font-semibold underline whitespace-nowrap">
            Update profile
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patientName"
              value={form.patientName}
              onChange={handleChange}
              disabled={!!initialUser}
              className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                fieldErrors.patientName ? "border-red-400 bg-red-50" : "border-gray-300"
              } ${initialUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
              placeholder="John Doe"
            />
            {fieldErrors.patientName && <p className="mt-1 text-sm text-red-600">{fieldErrors.patientName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                name="patientEmail"
                value={form.patientEmail}
                onChange={handleChange}
                disabled={!!initialUser}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                  fieldErrors.patientEmail ? "border-red-400 bg-red-50" : "border-gray-300"
                } ${initialUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                placeholder="john@example.com"
              />
            </div>
            {fieldErrors.patientEmail && <p className="mt-1 text-sm text-red-600">{fieldErrors.patientEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                name="patientPhone"
                value={form.patientPhone}
                onChange={handleChange}
                disabled={!!initialUser}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                  fieldErrors.patientPhone ? "border-red-400 bg-red-50" : "border-gray-300"
                } ${initialUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                placeholder="+234 xxx xxx xxxx"
              />
            </div>
            {fieldErrors.patientPhone && <p className="mt-1 text-sm text-red-600">{fieldErrors.patientPhone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Service <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={handleChange}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition appearance-none ${
                  fieldErrors.serviceType ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">Select a service</option>
                {DENTAL_SERVICES.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.serviceType && <p className="mt-1 text-sm text-red-600">{fieldErrors.serviceType}</p>}
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary-600" />
          Date & Time
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Appointment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="appointmentDate"
              value={form.appointmentDate}
              onChange={handleChange}
              min={dateConstraints.min}
              max={dateConstraints.max}
              className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                fieldErrors.appointmentDate ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {fieldErrors.appointmentDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.appointmentDate}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Available from tomorrow up to 3 months ahead. Closed on Saturdays.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-600" />
            Preferred Time <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleTimeSelect(slot)}
                className={`px-2 sm:px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium border transition ${
                  form.appointmentTime === slot
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          {fieldErrors.appointmentTime && <p className="mt-1 text-sm text-red-600">{fieldErrors.appointmentTime}</p>}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-600" />
          Additional Notes
        </h3>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
          placeholder="Any specific concerns or requests? Let us know..."
        />
        <p className="mt-1 text-xs text-gray-400">Optional</p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-primary-600 text-white py-3.5 rounded-lg font-semibold text-base hover:bg-primary-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Booking Appointment...
          </>
        ) : (
          <>
            <CalendarDays className="h-5 w-5" />
            Book Appointment
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-gray-400">
        By booking, you agree to our clinic&apos;s appointment policies.
        We&apos;ll contact you to confirm your slot.
      </p>
    </form>
  )
}
