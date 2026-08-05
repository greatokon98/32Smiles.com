import { PrismaClient } from "@prisma/client"

const globalForDirectPrisma = globalThis as unknown as {
  prismaDirect: PrismaClient | undefined
}

// Chat reads/writes use the session pooler (DIRECT_URL, port 5432), which
// measures ~0.3s/query vs ~1.3s through the transaction pooler (DATABASE_URL).
// The pool is capped at 2 connections so it can never saturate the session
// pool; only the message endpoints use this client.
function buildDirectUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    url.searchParams.set("connection_limit", "2")
    // Respect an explicit sslmode (e.g. sslmode=disable for local Postgres);
    // default to `prefer` (TLS when the server supports it) for Supabase.
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "prefer")
    }
    return url.href
  } catch {
    return raw
  }
}

const DIRECT_URL = buildDirectUrl(process.env.DIRECT_URL)

export const prismaDirect =
  globalForDirectPrisma.prismaDirect ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    ...(DIRECT_URL ? { datasources: { db: { url: DIRECT_URL } } } : {}),
  })

if (process.env.NODE_ENV !== "production") globalForDirectPrisma.prismaDirect = prismaDirect

export default prismaDirect
