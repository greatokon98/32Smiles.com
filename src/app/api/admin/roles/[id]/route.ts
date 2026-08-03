import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { guardPermission } from "@/lib/require-permission-route"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("roles", "read")
  if (response) return response

  try {
    const { id } = await params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { resource: true, action: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("[API] Role GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("roles", "manage")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description } = body as { name?: string; description?: string }

    const role = await prisma.role.findUnique({ where: { id } })
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Role name cannot be empty" }, { status: 400 })
      }

      const existing = await prisma.role.findUnique({ where: { name: name.trim() } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 })
      }

      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await prisma.role.update({
      where: { id },
      data: updateData,
    })

    createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "role",
      resourceId: id,
      oldValues: { name: role.name, description: role.description },
      newValues: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] Role PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("roles", "manage")
  if (response) return response

  try {
    const { id } = await params

    const role = await prisma.role.findUnique({ where: { id } })
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.permission.deleteMany({ where: { roleId: id } }),
      prisma.role.delete({ where: { id } }),
    ])

    createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "role",
      resourceId: id,
      oldValues: { name: role.name, description: role.description },
    })

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("[API] Role DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
