import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createAuditLog } from "@/lib/audit"
import { BUILT_IN_ROLES } from "@/lib/permissions"
import { guardPermission } from "@/lib/require-permission-route"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("users", "delete")
  if (response) return response

  try {
    const { id } = await params

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, deletedAt: true },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN", deletedAt: null },
      })
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last super admin account" },
          { status: 400 }
        )
      }
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })

    createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "user",
      resourceId: user.id,
      oldValues: { name: user.name, email: user.email, role: user.role },
    })

    return NextResponse.json({ success: true, id: user.id })
  } catch (error) {
    console.error("[API] User delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("users", "update")
  if (response) return response
  const callerRole = session.user.role || "VIEWER"

  try {
    const { id } = await params
    const body = await request.json()
    const { role, isActive, name, email, password } = body as {
      role?: string
      isActive?: boolean
      name?: string
      email?: string
      password?: string
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot modify your own account" },
        { status: 400 }
      )
    }

    if (callerRole === "ADMIN" && user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot modify super admin accounts" },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (role !== undefined) {
      if (typeof role !== "string") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      const isBuiltIn = (BUILT_IN_ROLES as readonly string[]).includes(role)
      if (!isBuiltIn) {
        const custom = await prisma.role.findUnique({
          where: { name: role },
          select: { id: true },
        })
        if (!custom) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }
      }

      if (callerRole === "ADMIN" && role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Admins cannot assign super admin role" },
          { status: 403 }
        )
      }

      updateData.role = role
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        )
      }
      if (name.length > 200) {
        return NextResponse.json(
          { error: "Name must be at most 200 characters" },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        )
      }
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 409 }
        )
      }
      updateData.email = email
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        )
      }
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (password !== undefined) {
      try {
        const { sendPasswordResetEmail } = await import("@/lib/email")
        await sendPasswordResetEmail({
          name: updated.name,
          email: updated.email,
          newPassword: password,
        })
      } catch (emailError) {
        console.error("[API] Failed to send password reset email:", emailError)
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] User update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
