import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkAdminRouteAccess } from "@/lib/admin-access"
import { isAdminRole } from "@/lib/role-permissions"
import type { Permission } from "@/lib/role-permissions"
import { DEMO_COOKIE_NAME, decodeDemoToken, isDemoModeEnabled } from "@/lib/demo-gate"

// Allowlist for the demo gate: framework runtime assets, favicon/app icons,
// the gate page itself, and the API routes that must stay reachable
// (demo password auth, NextAuth, scheduled cron jobs).
function isDemoAllowlisted(pathname: string): boolean {
  if (
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png"
  ) {
    return true
  }
  if (pathname.startsWith("/_next/static")) return true
  if (pathname.startsWith("/demo-access")) return true
  if (pathname.startsWith("/api/demo")) return true
  if (pathname.startsWith("/api/auth")) return true
  if (pathname.startsWith("/api/cron")) return true
  return false
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Demo password gate. When DEMO_MODE is enabled, every route except the
  // allowlist above requires a valid demo session cookie. Pages are
  // redirected to the gate, APIs and asset fetches return 401.
  if (isDemoModeEnabled() && !isDemoAllowlisted(pathname)) {
    const demoSession = await decodeDemoToken(
      req.cookies.get(DEMO_COOKIE_NAME)?.value
    )
    if (!demoSession) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Demo access required" }, { status: 401 })
      }
      const gateUrl = new URL("/demo-access", req.url)
      gateUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search)
      return NextResponse.redirect(gateUrl)
    }
  }

  // Skip middleware for login page, auth callbacks, and public user APIs
  if (
    pathname === "/admin/login" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/user")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  })
  const isAdminApi = pathname.startsWith("/api/admin")
  const isAdminPage = pathname.startsWith("/admin")
  const isDashboard = pathname.startsWith("/dashboard")

  // Protect dashboard routes — any authenticated user
  if (isDashboard) {
    if (!token) {
      const loginUrl = new URL("/admin/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Admin pages and APIs — staff roles only, then per-resource permission check
  if (isAdminApi || isAdminPage) {
    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      const loginUrl = new URL("/admin/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = (token.role as string) || "VIEWER"
    const permissions = token.permissions as Permission[] | undefined

    if (!isAdminRole(role)) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    const { allowed } = checkAdminRouteAccess({
      pathname,
      isApi: isAdminApi,
      method: req.method,
      role,
      permissions,
    })

    if (!allowed) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Stamp the requested path so the admin layout can re-verify access server-side.
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-admin-path", pathname)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

// Only framework runtime assets and app icons are exempt; everything else
// flows through the proxy so the demo gate applies to pages, APIs, the
// image optimizer, and direct asset fetches alike.
export const config = {
  matcher: ["/((?!_next/static|favicon\\.ico|icon\\.png|apple-icon\\.png).*)"],
}
