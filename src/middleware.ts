import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkAdminRouteAccess } from "@/lib/admin-access"
import { isAdminRole } from "@/lib/role-permissions"
import type { Permission } from "@/lib/role-permissions"

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
  ],
}
