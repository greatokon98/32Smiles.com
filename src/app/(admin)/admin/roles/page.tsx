import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import RolesList from "./roles-list"
import { ALL_RESOURCES, ALL_ACTIONS } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export default async function RolesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { permissions: true } },
    },
  })

  const serialized = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissionCount: r._count.permissions,
    createdAt: r.createdAt.toISOString(),
    isBuiltIn: false,
  }))

  const builtInRoles = [
    { name: "SUPER_ADMIN", description: "Full system access", isBuiltIn: true, permissionCount: ALL_RESOURCES.length * ALL_ACTIONS.length },
    { name: "ADMIN", description: "Administrative access", isBuiltIn: true, permissionCount: 26 },
    { name: "EDITOR", description: "Content editor access", isBuiltIn: true, permissionCount: 12 },
    { name: "RECEPTIONIST", description: "Front desk access", isBuiltIn: true, permissionCount: 10 },
    { name: "VIEWER", description: "Read-only access", isBuiltIn: true, permissionCount: 5 },
  ].map((r) => ({ ...r, id: r.name, createdAt: "" }))

  const allRoles = [...builtInRoles, ...serialized]

  return (
    <RolesList initialRoles={allRoles} />
  )
}
