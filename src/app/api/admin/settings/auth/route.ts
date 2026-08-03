import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"

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

function getEnvOverrides(): Record<string, string> {
  return {
    google_oauth_configured: process.env.GOOGLE_CLIENT_ID ? "true" : "false",
    google_oauth_enabled: process.env.GOOGLE_CLIENT_ID ? "true" : "false",
  }
}

export async function GET() {
  const { response } = await guardPermission("settings", "read")
  if (response) return response

  try {
    const settings = await prisma.setting.findMany({
      where: { group: "auth" },
      select: { key: true, value: true },
    })

    const settingsMap: Record<string, string> = { ...DEFAULT_AUTH_SETTINGS }
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({ ...settingsMap, ...getEnvOverrides() })
  } catch (error) {
    console.error("[API] Auth settings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await guardPermission("settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const upserts = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, group: "auth" },
        create: { key, value, type: "string", group: "auth" },
      })
    )

    await prisma.$transaction(upserts)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Auth settings PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
