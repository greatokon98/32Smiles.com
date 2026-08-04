import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { guardPermission } from "@/lib/require-permission-route"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const isRead = searchParams.get("isRead")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const cursor = searchParams.get("cursor")

    const where: Record<string, unknown> = { userId: session.user.id }

    if (type) {
      where.type = type
    }

    if (isRead !== null && isRead !== undefined && isRead !== "") {
      where.isRead = isRead === "true"
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const hasMore = notifications.length > limit
    if (hasMore) {
      notifications.pop()
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
    })
  } catch (error) {
    console.error("[API] Notifications fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("notifications", "create")
  if (response) return response

  try {
    const body = await request.json()
    const { userId, type, title, message, data, channel } = body as {
      userId: string
      type: string
      title: string
      message: string
      data?: Record<string, unknown>
      channel?: string
    }

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title, and message are required" },
        { status: 400 }
      )
    }

    const validTypes = [
      "APPOINTMENT_CONFIRMED",
      "APPOINTMENT_REMINDER",
      "APPOINTMENT_UPDATED",
      "APPOINTMENT_CANCELLED",
      "APPOINTMENT_BOOKED",
      "CONTACT_RECEIVED",
      "CONTACT_ASSIGNED",
      "MESSAGE_RECEIVED",
      "MESSAGE_EDITED",
      "AI_CONTENT_READY",
      "AI_CONTENT_APPROVED",
      "AI_CONTENT_REJECTED",
      "CONTENT_PUBLISHED",
      "SYSTEM_ALERT",
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as never,
        channel: channel === "EMAIL" ? "EMAIL" : "IN_APP",
        title,
        message,
        data: data ? (JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("[API] Notification create error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
