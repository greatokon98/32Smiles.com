import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import UserList from "./user-list"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(session.user.role !== "SUPER_ADMIN" ? { role: { not: "SUPER_ADMIN" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  const serialized = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <UserList
      initialUsers={serialized}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  )
}
