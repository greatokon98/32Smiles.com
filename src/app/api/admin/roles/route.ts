import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { guardPermission } from "@/lib/require-permission-route"

export async function GET() {
  const { session, response } = await guardPermission("roles", "read")
  if (response) return response

  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { permissions: true } },
      },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("[API] Roles GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("roles", "manage")
  if (response) return response

  try {
    const body = await request.json()
    const { name, description } = body as { name?: string; description?: string }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    const existing = await prisma.role.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 })
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "role",
      resourceId: role.id,
      newValues: { name: role.name, description: role.description },
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error("[API] Roles POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
