import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import InviteUserForm from "./invite-user-form"

export const dynamic = "force-dynamic"

export default async function InviteUserPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invite User</h1>
        <p className="text-gray-500 text-sm mt-1">
          Send an invitation to a new user
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <InviteUserForm />
      </div>
    </div>
  )
}
