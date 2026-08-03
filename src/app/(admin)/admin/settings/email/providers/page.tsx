import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import EmailProvidersManager from "./email-providers-manager"

export const dynamic = "force-dynamic"

const SMTP_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"] as const
const RESEND_KEY = "RESEND_API_KEY"
const ALL_KEYS = [...SMTP_KEYS, RESEND_KEY] as const

function maskValue(value: string): string {
  if (!value || value.length <= 4) return "****"
  return value.slice(0, 2) + "****" + value.slice(-2)
}

export default async function EmailProvidersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const dbSettings = await prisma.setting.findMany({
    where: { key: { in: ALL_KEYS as unknown as string[] } },
    select: { key: true, value: true },
  })

  const dbMap: Record<string, string> = {}
  for (const s of dbSettings) {
    dbMap[s.key] = s.value
  }

  const resendApiKey = dbMap.RESEND_API_KEY || process.env.RESEND_API_KEY || ""

  return (
    <EmailProvidersManager
      userEmail={session.user.email || ""}
      resendConfigured={!!resendApiKey}
      resendApiKey={resendApiKey ? maskValue(resendApiKey) : ""}
      smtpConfig={{
        host: dbMap.SMTP_HOST || process.env.SMTP_HOST || "",
        port: dbMap.SMTP_PORT || process.env.SMTP_PORT || "",
        user: dbMap.SMTP_USER || process.env.SMTP_USER || "",
        pass: dbMap.SMTP_PASS || process.env.SMTP_PASS || "",
        from: dbMap.SMTP_FROM || process.env.SMTP_FROM || "",
        secure: dbMap.SMTP_SECURE || process.env.SMTP_SECURE || "",
      }}
    />
  )
}
