import { PrismaClient } from "@prisma/client"

// Guard against the Supabase pooler foot-gun: connecting in SESSION mode
// (port 5432) from serverless saturates the 15-connection pool and takes
// the whole site down. The transaction pooler (port 6543) reuses connections
// per request and is safe. If DATABASE_URL points at the session pooler, or
// is missing the pgBouncer params, normalize it before the client is built.
function normalizeDatabaseUrl(raw: string | undefined): string {
  if (!raw) return ""

  try {
    const url = new URL(raw)

    if (url.hostname.includes("pooler.supabase.com")) {
      let changed = false

      // Session pooler (5432 or implicit) -> transaction pooler (6543)
      if (url.port === "" || url.port === "5432") {
        url.port = "6543"
        changed = true
      }

      const params = new URLSearchParams(url.search)
      const additions: Array<[string, string]> = [
        ["pgbouncer", "true"],
        ["connection_limit", "5"],
        ["pool_timeout", "15"],
        ["sslmode", "require"],
      ]
      for (const [key, value] of additions) {
        if (params.get(key) !== value) {
          params.set(key, value)
          changed = true
        }
      }
      if (changed) url.search = params.toString()

      if (url.href !== raw) {
        console.warn("[prisma] DATABASE_URL normalized (pooler guard):", url.href)
      }
      return url.href
    }
  } catch {
    // Invalid URL — leave untouched and let Prisma surface the real error.
  }

  return raw
}

const DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    ...(DATABASE_URL ? { datasources: { db: { url: DATABASE_URL } } } : {}),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
