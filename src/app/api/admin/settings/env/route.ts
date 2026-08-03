import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"

const WHITELIST_PREFIXES = ["NEXT_PUBLIC_", "SMTP_"]
const WHITELIST_KEYS = [
  "RESEND_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "EMAIL_FROM",
  "NODE_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OLLAMA_BASE_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE",
  "BLOB_READ_WRITE_TOKEN",
  "UPLOAD_DIR",
  "AUTH_SECRET",
  "AUTH_URL",
]

function getWhitelistedEnvVars(): Record<string, string> {
  const vars: Record<string, string> = {}

  for (const key of WHITELIST_KEYS) {
    vars[key] = process.env[key] || "(not set)"
  }

  for (const prefix of WHITELIST_PREFIXES) {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && !vars[key]) {
        vars[key] = value || "(not set)"
      }
    }
  }

  return vars
}

const SENSITIVE_KEYS = [
  "RESEND_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "SMTP_PASS",
]

function maskValue(key: string, value: string): string {
  if (!SENSITIVE_KEYS.includes(key)) return value
  if (value === "(not set)") return value
  if (value.length <= 4) return "****"
  return value.slice(0, 2) + "****" + value.slice(-2)
}

export async function GET() {
  const { session, response } = await guardPermission("settings", "read")
  if (response) return response

  try {
    const envVars = getWhitelistedEnvVars()

    const overrides = await prisma.setting.findMany({
      where: { group: "env" },
      select: { key: true, value: true },
    })

    const overridesMap: Record<string, string> = {}
    for (const o of overrides) {
      overridesMap[o.key] = o.value
    }

    const merged: Record<string, { value: string; overridden: boolean }> = {}
    for (const [key, value] of Object.entries(envVars)) {
      merged[key] = {
        value: maskValue(key, overridesMap[key] ?? value),
        overridden: key in overridesMap,
      }
    }

    for (const [key, value] of Object.entries(overridesMap)) {
      if (!(key in merged)) {
        merged[key] = {
          value: maskValue(key, value),
          overridden: false,
        }
      }
    }

    return NextResponse.json({ vars: merged, isSuperAdmin: session.user.role === "SUPER_ADMIN" })
  } catch (error) {
    console.error("[API] Env settings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await guardPermission("settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const { overrides } = body as { overrides: Record<string, string> }

    if (!overrides || typeof overrides !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const upserts = Object.entries(overrides).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, group: "env" },
        create: { key, value, type: "string", group: "env" },
      })
    )

    await prisma.$transaction(upserts)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Env settings PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
