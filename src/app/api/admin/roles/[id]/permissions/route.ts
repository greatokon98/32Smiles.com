import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
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
      select: { id: true },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const permissions = await prisma.permission.findMany({
      where: { roleId: id },
      select: { resource: true, action: true },
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("[API] Role permissions GET error:", error)
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
    const { permissions } = body as { permissions?: { resource: string; action: string }[] }

    const role = await prisma.role.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "permissions must be an array" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.permission.deleteMany({ where: { roleId: id } })

      if (permissions.length > 0) {
        await tx.permission.createMany({
          data: permissions.map((p) => ({
            resource: p.resource,
            action: p.action,
            roleId: id,
          })),
        })
      }

      return tx.permission.findMany({
        where: { roleId: id },
        select: { resource: true, action: true },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Role permissions PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
