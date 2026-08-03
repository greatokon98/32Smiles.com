import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AppointmentList from "./appointment-list"

export const dynamic = "force-dynamic"

export default async function AppointmentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const appointments = await prisma.appointment.findMany({
    orderBy: [{ date: "desc" }, { time: "desc" }],
    select: {
      id: true,
      patientName: true,
      patientEmail: true,
      patientPhone: true,
      date: true,
      time: true,
      endTime: true,
      service: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const serialized = appointments.map((a) => ({
    ...a,
    date: a.date.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  return <AppointmentList initialAppointments={serialized} />
}
