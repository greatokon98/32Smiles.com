import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import EnvVarsManager from "./env-vars-manager"

export const dynamic = "force-dynamic"

export default async function EnvSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  return <EnvVarsManager isSuperAdmin={session.user.role === "SUPER_ADMIN"} />
}
