import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const isRead = body.isRead !== undefined ? Boolean(body.isRead) : true

    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("[API] User notification update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] User notification delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
