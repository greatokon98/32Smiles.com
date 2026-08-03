import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"

const SMTP_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"] as const
const RESEND_KEY = "RESEND_API_KEY"
const ALL_KEYS = [...SMTP_KEYS, RESEND_KEY] as const

function maskValue(value: string): string {
  if (!value || value.length <= 4) return "****"
  return value.slice(0, 2) + "****" + value.slice(-2)
}

export async function GET() {
  const { response } = await guardPermission("settings", "read")
  if (response) return response

  try {
    const dbSettings = await prisma.setting.findMany({
      where: { key: { in: ALL_KEYS as unknown as string[] } },
      select: { key: true, value: true },
    })

    const dbMap: Record<string, string> = {}
    for (const s of dbSettings) {
      dbMap[s.key] = s.value
    }

    const resendApiKey = dbMap.RESEND_API_KEY || process.env.RESEND_API_KEY || ""
    const hasResend = !!resendApiKey

    return NextResponse.json({
      resend: {
        configured: hasResend,
        apiKey: hasResend ? maskValue(resendApiKey) : "",
      },
      smtp: {
        host: dbMap.SMTP_HOST || process.env.SMTP_HOST || "",
        port: dbMap.SMTP_PORT || process.env.SMTP_PORT || "",
        user: dbMap.SMTP_USER || process.env.SMTP_USER || "",
        from: dbMap.SMTP_FROM || process.env.SMTP_FROM || "",
        secure: dbMap.SMTP_SECURE || process.env.SMTP_SECURE || "",
        passConfigured: !!(dbMap.SMTP_PASS || process.env.SMTP_PASS),
        configured: !!(dbMap.SMTP_HOST || process.env.SMTP_HOST),
      },
    })
  } catch (error) {
    console.error("[API] Email providers GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await guardPermission("settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const { type, settings } = body as {
      type: "resend" | "smtp"
      settings: Record<string, string>
    }

    const upserts = Object.entries(settings)
      .filter(([, value]) => value)
      .map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value, group: "email" },
          create: { key, value, type: "string", group: "email" },
        })
      )

    if (upserts.length > 0) {
      await prisma.$transaction(upserts)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Email providers PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
