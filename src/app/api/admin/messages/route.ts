import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canonicalPair, getOtherParticipant } from "@/lib/messages"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const me = session.user.id
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, OR: [{ userAId: me }, { userBId: me }] },
      include: {
        userA: { select: { id: true, name: true, email: true, role: true } },
        userB: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        body: true,
        isRead: true,
        createdAt: true,
      },
    })

    const now = new Date()
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: me }, isRead: false },
      data: { isRead: true, readAt: now },
    })

    await prisma.notification.updateMany({
      where: {
        userId: me,
        type: "MESSAGE_RECEIVED",
        isRead: false,
        data: { path: ["conversationId"], equals: conversationId },
      },
      data: { isRead: true, readAt: now },
    })

    const other = getOtherParticipant(conversation, me)

    return NextResponse.json({
      conversationId: conversation.id,
      otherUser: {
        id: other.id,
        name: other.name,
        email: other.email,
        role: other.role,
      },
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[API] Messages fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const me = session.user.id
    const body = await request.json()
    const { participantId, message } = body as {
      participantId?: string
      message?: string
    }

    if (!participantId || participantId === me) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 400 })
    }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 })
    }

    const participant = await prisma.user.findFirst({
      where: {
        id: participantId,
        role: { not: "VIEWER" },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!participant) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const meRow = await prisma.user.findUnique({
      where: { id: me },
      select: { name: true },
    })
    const meName = meRow?.name || "Staff"

    const [userAId, userBId] = canonicalPair(me, participantId)

    const conversation = await prisma.conversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: { lastMessageAt: new Date() },
      create: {
        userAId,
        userBId,
        lastMessageAt: new Date(),
      },
      include: {
        userA: { select: { id: true, name: true, email: true, role: true } },
        userB: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    const created = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: me,
        body: message.trim(),
      },
      select: {
        id: true,
        senderId: true,
        body: true,
        isRead: true,
        createdAt: true,
      },
    })

    try {
      await prisma.notification.create({
        data: {
          userId: participantId,
          type: "MESSAGE_RECEIVED",
          channel: "IN_APP",
          title: `New message from ${meName}`,
          message: message.trim(),
          data: {
            conversationId: conversation.id,
            senderId: me,
          },
        },
      })
    } catch (notifyError) {
      console.error("[API] Message notification error:", notifyError)
    }

    return NextResponse.json(
      {
        conversationId: conversation.id,
        message: {
          ...created,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API] Message send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
