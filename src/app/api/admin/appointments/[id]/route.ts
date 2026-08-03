import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { AppointmentStatus } from "@prisma/client"
import { notifyAppointmentStatusChange } from "@/lib/notifications"
import { guardPermission } from "@/lib/require-permission-route"

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

function isValidTransition(
  current: AppointmentStatus,
  next: AppointmentStatus
): boolean {
  if (next === "CANCELLED") return current !== "CANCELLED" && current !== "COMPLETED"
  return VALID_TRANSITIONS[current].includes(next)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("appointments", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body as { status?: AppointmentStatus }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const validStatuses: AppointmentStatus[] = [
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        patientEmail: true,
        patientName: true,
        date: true,
        time: true,
        service: true,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    if (!isValidTransition(appointment.status, status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${appointment.status} to ${status}`,
        },
        { status: 400 }
      )
    }

    const now = new Date()
    const updateData: Record<string, unknown> = { status }

    if (status === "CONFIRMED") updateData.confirmedAt = now
    if (status === "COMPLETED") updateData.completedAt = now
    if (status === "CANCELLED") updateData.cancelledAt = now

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        confirmedAt: true,
        completedAt: true,
        cancelledAt: true,
      },
    })

    notifyAppointmentStatusChange(
      {
        id: appointment.id,
        patientEmail: appointment.patientEmail,
        patientName: appointment.patientName,
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
      },
      status
    ).catch(() => {})

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] Appointment update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
