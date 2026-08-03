import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { BUILT_IN_ROLES } from "@/lib/permissions"
import { guardPermission } from "@/lib/require-permission-route"

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("users", "invite")
  if (response) return response
  const callerRole = session.user.role || "VIEWER"

  try {
    const body = await request.json()
    const { email, role, message } = body as {
      email?: string
      role?: string
      message?: string
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    let userRole = "VIEWER"
    if (role !== undefined) {
      if (typeof role !== "string") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      const isBuiltIn = (BUILT_IN_ROLES as readonly string[]).includes(role)
      if (isBuiltIn) {
        userRole = role
      } else {
        const custom = await prisma.role.findUnique({
          where: { name: role },
          select: { id: true },
        })
        if (!custom) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }
        userRole = role
      }
    }

    if (callerRole === "ADMIN" && userRole === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot invite super admin users" },
        { status: 403 }
      )
    }

    const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        passwordHash,
        role: userRole,
        isActive: false,
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

    return NextResponse.json(
      { user, message: "User invited successfully. Email sending to be implemented." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API] User invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
