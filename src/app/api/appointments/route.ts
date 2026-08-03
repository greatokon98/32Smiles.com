import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { sendAppointmentConfirmation } from "@/lib/email"

const appointmentSchema = z.object({
  patientName: z.string().min(1, "Name is required").max(200),
  patientEmail: z.string().email("Invalid email address"),
  patientPhone: z.string().min(1, "Phone number is required").max(30),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  serviceType: z.string().min(1, "Service type is required"),
  notes: z.string().max(1000).optional(),
})

function generateTempPassword(): string {
  return Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 6).toUpperCase() + "1!"
}

const VALID_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
]

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const my = searchParams.get("my")

  if (my === "true") {
    const appointments = await prisma.appointment.findMany({
      where: { patientEmail: session.user.email },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        time: true,
        endTime: true,
        service: true,
        status: true,
        notes: true,
      },
    })

    const serialized = appointments.map((a) => ({
      ...a,
      date: a.date.toISOString(),
    }))

    return NextResponse.json(serialized)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = appointmentSchema.parse(body)

    if (!VALID_SLOTS.includes(data.appointmentTime)) {
      return NextResponse.json(
        { error: "Invalid time slot" },
        { status: 400 }
      )
    }

    const appointmentDate = new Date(data.appointmentDate + "T00:00:00")
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    if (appointmentDate < tomorrow) {
      return NextResponse.json(
        { error: "Appointments must be booked at least one day in advance" },
        { status: 400 }
      )
    }

    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    maxDate.setHours(23, 59, 59, 999)

    if (appointmentDate > maxDate) {
      return NextResponse.json(
        { error: "Appointments cannot be booked more than 3 months in advance" },
        { status: 400 }
      )
    }

    const dayOfWeek = appointmentDate.getDay()
    if (dayOfWeek === 6) {
      return NextResponse.json(
        { error: "We are closed on Saturdays. Please choose another day." },
        { status: 400 }
      )
    }

    const startOfDay = new Date(appointmentDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(appointmentDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingSlot = await prisma.appointment.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        time: data.appointmentTime,
        status: { not: "CANCELLED" },
      },
    })

    if (existingSlot) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose another." },
        { status: 409 }
      )
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayBookings = await prisma.appointment.count({
      where: {
        patientEmail: data.patientEmail,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    })

    if (todayBookings >= 3) {
      return NextResponse.json(
        { error: "You have reached the maximum of 3 bookings per day. Please try again tomorrow." },
        { status: 429 }
      )
    }

    const session = await auth()
    const sessionEmail = session?.user?.email?.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: data.patientEmail },
      select: { id: true },
    })

    if (existingUser && sessionEmail !== data.patientEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in to manage your appointments.", code: "EMAIL_EXISTS" },
        { status: 409 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        patientPhone: data.patientPhone,
        date: appointmentDate,
        time: data.appointmentTime,
        service: data.serviceType,
        notes: data.notes || null,
      },
      select: {
        id: true,
        patientName: true,
        patientEmail: true,
        date: true,
        time: true,
        service: true,
        status: true,
        createdAt: true,
      },
    })

    try {
      const staff = await prisma.user.findMany({
        where: {
          role: { in: ["RECEPTIONIST", "ADMIN"] },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      })
      if (staff.length > 0) {
        const bookingDate = new Date(appointment.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        await prisma.notification.createMany({
          data: staff.map((s) => ({
            userId: s.id,
            type: "APPOINTMENT_BOOKED",
            channel: "IN_APP",
            title: "New Appointment Booking",
            message: `${appointment.patientName} booked ${appointment.service} on ${bookingDate} at ${appointment.time}.`,
            data: {
              appointmentId: appointment.id,
              patientEmail: appointment.patientEmail,
              status: "PENDING",
            },
          })),
        })
      }
    } catch (notifyError) {
      console.error("[API] Failed to notify staff of new booking:", notifyError)
    }

    let accountCreated = false
    if (!existingUser) {
      const tempPassword = generateTempPassword()
      const passwordHash = await bcrypt.hash(tempPassword, 12)
      await prisma.user.create({
        data: {
          email: data.patientEmail,
          name: data.patientName,
          passwordHash,
          isActive: true,
          role: "VIEWER",
        },
      })
      accountCreated = true

      try {
        await sendAppointmentConfirmation({
          patientName: appointment.patientName,
          patientEmail: appointment.patientEmail,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          tempPassword,
        })
      } catch (emailError) {
        console.error("[API] Failed to send appointment confirmation email:", emailError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        appointment: {
          id: appointment.id,
          patientName: appointment.patientName,
          date: appointment.date.toISOString(),
          time: appointment.time,
          service: appointment.service,
          status: appointment.status,
        },
        accountCreated,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("[API] Appointment booking error:", error)
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    )
  }
}
