import { createHash, timingSafeEqual } from "node:crypto"
import { encode, decode } from "next-auth/jwt"

export const DEMO_COOKIE_NAME = "demo_access"
export const DEMO_SALT = "demo-gate"
export const DEFAULT_SESSION_HOURS = 8

export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === "true"
}

export function getSessionSeconds(): number {
  const hours = Number(process.env.DEMO_SESSION_HOURS ?? "")
  const safe = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_SESSION_HOURS
  return Math.round(safe * 3600)
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest()
}

export function verifyDemoPassword(input: string, expected: string): boolean {
  if (!expected || !input) return false
  const a = digest(input)
  const b = digest(expected)
  return timingSafeEqual(a, b)
}

export async function createDemoToken(): Promise<string> {
  return encode({
    token: { demo: true, ts: Date.now() },
    secret: process.env.AUTH_SECRET || "",
    salt: DEMO_SALT,
    maxAge: getSessionSeconds(),
  })
}

export async function decodeDemoToken(token: string | undefined): Promise<{ demo: boolean } | null> {
  if (!token) return null
  try {
    return await decode({
      token,
      secret: process.env.AUTH_SECRET || "",
      salt: DEMO_SALT,
    })
  } catch {
    return null
  }
}
