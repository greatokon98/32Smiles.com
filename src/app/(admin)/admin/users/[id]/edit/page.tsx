import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { ArrowLeft } from "lucide-react"
import EditUserForm from "./edit-user-form"

export const dynamic = "force-dynamic"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!user) {
    redirect("/admin/users")
  }

  if (user.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/users")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/users/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-500 text-sm mt-1">
            Update user information for {user.name}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <EditUserForm user={user} />
      </div>
    </div>
  )
}
