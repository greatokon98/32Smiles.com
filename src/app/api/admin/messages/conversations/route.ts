import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canonicalPair, getOtherParticipant } from "@/lib/messages"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const me = session.user.id
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      orderBy: { lastMessageAt: "desc" },
      include: {
        userA: { select: { id: true, name: true, email: true, role: true } },
        userB: { select: { id: true, name: true, email: true, role: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    })

    const conversationIds = conversations.map((c) => c.id)
    const unreadGroups =
      conversationIds.length > 0
        ? await prisma.message.groupBy({
            by: ["conversationId"],
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: me },
              isRead: false,
            },
            _count: { _all: true },
          })
        : []

    const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]))

    const serialized = conversations.map((c) => {
      const other = getOtherParticipant(c, me)
      const last = c.messages[0] || null
      return {
        id: c.id,
        lastMessageAt: c.lastMessageAt.toISOString(),
        otherUser: {
          id: other.id,
          name: other.name,
          email: other.email,
          role: other.role,
        },
        lastMessage: last
          ? {
              body: last.body,
              senderId: last.senderId,
              createdAt: last.createdAt.toISOString(),
              isRead: last.isRead,
            }
          : null,
        unreadCount: unreadMap.get(c.id) || 0,
      }
    })

    return NextResponse.json({ conversations: serialized })
  } catch (error) {
    console.error("[API] Conversations fetch error:", error)
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
    const { participantId } = body as { participantId?: string }

    if (!participantId || participantId === me) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 400 })
    }

    const participant = await prisma.user.findFirst({
      where: {
        id: participantId,
        role: { not: "VIEWER" },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!participant) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const [userAId, userBId] = canonicalPair(me, participantId)

    let conversation = await prisma.conversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      include: {
        userA: { select: { id: true, name: true, email: true, role: true } },
        userB: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId,
          userBId,
          lastMessageAt: new Date(),
        },
        include: {
          userA: { select: { id: true, name: true, email: true, role: true } },
          userB: { select: { id: true, name: true, email: true, role: true } },
        },
      })
    }

    const other = getOtherParticipant(conversation, me)

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: {
          id: other.id,
          name: other.name,
          email: other.email,
          role: other.role,
        },
      },
    })
  } catch (error) {
    console.error("[API] Conversation create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
