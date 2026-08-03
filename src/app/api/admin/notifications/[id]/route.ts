import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { isRead } = body as { isRead?: boolean }

    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "isRead must be a boolean" },
        { status: 400 }
      )
    }

    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] Notification update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Notification delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
