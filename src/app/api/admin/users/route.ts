import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createAuditLog } from "@/lib/audit"
import { BUILT_IN_ROLES } from "@/lib/permissions"
import { guardPermission } from "@/lib/require-permission-route"

export const dynamic = "force-dynamic"

async function roleExists(role: string): Promise<boolean> {
  if ((BUILT_IN_ROLES as readonly string[]).includes(role)) return true
  const custom = await prisma.role.findUnique({ where: { name: role }, select: { id: true } })
  return !!custom
}

export async function GET() {
  const { session, response } = await guardPermission("users", "read")
  if (response) return response

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(session.user.role !== "SUPER_ADMIN" ? { role: { not: "SUPER_ADMIN" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[API] Users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("users", "create")
  if (response) return response
  const callerRole = session.user.role || "VIEWER"

  try {
    const body = await request.json()
    const { name, email, password, role } = body as {
      name?: string
      email?: string
      password?: string
      role?: string
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    let userRole = "VIEWER"
    if (role !== undefined) {
      if (typeof role !== "string" || !(await roleExists(role))) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      userRole = role
    }

    if (callerRole === "ADMIN" && userRole === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot create super admin accounts" },
        { status: 403 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "user",
      resourceId: user.id,
      newValues: { name: user.name, email: user.email, role: user.role },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("[API] User create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
