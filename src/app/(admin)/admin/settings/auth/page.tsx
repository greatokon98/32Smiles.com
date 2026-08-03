import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AuthSettingsManager from "./auth-settings-manager"

export const dynamic = "force-dynamic"

const DEFAULT_AUTH_SETTINGS = {
  google_oauth_enabled: process.env.GOOGLE_CLIENT_ID ? "true" : "false",
  google_oauth_configured: process.env.GOOGLE_CLIENT_ID ? "true" : "false",
  github_oauth_enabled: "false",
  github_oauth_configured: "false",
  session_duration_hours: "24",
  max_login_attempts: "5",
  password_min_length: "8",
  password_require_special: "true",
  password_require_numbers: "true",
  password_require_uppercase: "true",
}

export default async function AuthSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const settings = await prisma.setting.findMany({
    where: { group: "auth" },
    select: { key: true, value: true },
  })

  const settingsMap: Record<string, string> = { ...DEFAULT_AUTH_SETTINGS }
  for (const s of settings) {
    settingsMap[s.key] = s.value
  }

  if (process.env.GOOGLE_CLIENT_ID) {
    settingsMap.google_oauth_configured = "true"
  }

  return <AuthSettingsManager initialSettings={settingsMap} />
}
