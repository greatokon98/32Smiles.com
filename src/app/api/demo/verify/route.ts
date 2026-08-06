import { NextResponse } from "next/server"
import {
  DEMO_COOKIE_NAME,
  createDemoToken,
  getSessionSeconds,
  isDemoModeEnabled,
  verifyDemoPassword,
} from "@/lib/demo-gate"

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const windowStart = Date.now() - WINDOW_MS
  const recent = (attempts.get(ip) || []).filter((t) => t > windowStart)
  return recent.length >= MAX_ATTEMPTS
}

function recordAttempt(ip: string): void {
  const windowStart = Date.now() - WINDOW_MS
  const recent = (attempts.get(ip) || []).filter((t) => t > windowStart)
  recent.push(Date.now())
  attempts.set(ip, recent)
  if (attempts.size > 5000) attempts.clear()
}

export async function POST(req: Request) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ error: "Demo access is disabled" }, { status: 404 })
  }

  const expected = process.env.DEMO_PASSWORD || ""
  if (!expected) {
    return NextResponse.json(
      { error: "Demo access is not configured. Please contact the site owner." },
      { status: 503 }
    )
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    )
  }

  let input = ""
  try {
    const body = await req.json()
    input = typeof body?.password === "string" ? body.password : ""
  } catch {
    input = ""
  }

  if (!verifyDemoPassword(input, expected)) {
    recordAttempt(ip)
    return NextResponse.json(
      { error: "Incorrect password. Please try again." },
      { status: 401 }
    )
  }

  const token = await createDemoToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(DEMO_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    path: "/",
    maxAge: getSessionSeconds(),
  })
  return response
}
