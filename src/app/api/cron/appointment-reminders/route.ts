import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendAppointmentReminder } from "@/lib/email"

export const dynamic = "force-dynamic"

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = request.headers.get("authorization")
  const query = request.nextUrl.searchParams.get("secret")
  return header === `Bearer ${secret}` || query === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: now, lte: windowEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      id: true,
      patientName: true,
      patientEmail: true,
      date: true,
      time: true,
      service: true,
    },
  })

  let reminded = 0
  let skipped = 0

  for (const appointment of appointments) {
    const existing = await prisma.notification.findFirst({
      where: {
        type: "APPOINTMENT_REMINDER",
        channel: "IN_APP",
        data: { path: ["appointmentId"], equals: appointment.id },
      },
      select: { id: true },
    })

    if (existing) {
      skipped++
      continue
    }

    try {
      await sendAppointmentReminder({
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
      })

      const patient = await prisma.user.findUnique({
        where: { email: appointment.patientEmail },
        select: { id: true },
      })

      if (patient) {
        await prisma.notification.create({
          data: {
            userId: patient.id,
            type: "APPOINTMENT_REMINDER",
            channel: "IN_APP",
            title: "Upcoming Appointment Reminder",
            message: `Reminder: your ${appointment.service || "appointment"} is on ${appointment.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${appointment.time}.`,
            data: { appointmentId: appointment.id },
          },
        })
      }
      reminded++
    } catch (error) {
      console.error("[Cron] Failed to send reminder for appointment:", appointment.id, error)
    }
  }

  return NextResponse.json({ success: true, reminded, skipped, total: appointments.length })
}
