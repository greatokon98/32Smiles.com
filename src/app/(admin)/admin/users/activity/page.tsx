import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import UserActivityClient from "./user-activity-client"

export const dynamic = "force-dynamic"

interface AuditLogEntry {
  id: string
  action: string
  resource: string
  createdAt: Date
  user: {
    name: string
    email: string
    role: string
  } | null
}

export default async function UserActivityPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
    },
  })

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  })

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  const filteredLogs = isSuperAdmin
    ? logs
    : logs.filter((log) => log.user?.role !== "SUPER_ADMIN")

  const filteredUsers = isSuperAdmin
    ? users
    : users.filter((u) => u.role !== "SUPER_ADMIN")

  const serialized = filteredLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }))

  return (
    <UserActivityClient
      initialLogs={serialized}
      users={filteredUsers}
    />
  )
}
