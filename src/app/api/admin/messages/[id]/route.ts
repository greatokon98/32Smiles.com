import { NextRequest, NextResponse } from "next/server"
import prismaDirect from "@/lib/prisma-direct"
import { auth } from "@/lib/auth"
import { messageSelect, serializeMessage } from "@/lib/messages"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const me = session.user.id
  const { id } = await params

  try {
    const body = await request.json()
    const { message } = body as { message?: string }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 })
    }

    const existing = await prismaDirect.message.findFirst({
      where: { id, senderId: me, deletedAt: null },
      select: { id: true, conversationId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const updated = await prismaDirect.message.update({
      where: { id },
      data: { body: message.trim(), editedAt: new Date() },
      select: messageSelect,
    })

    try {
      const conversation = await prismaDirect.conversation.findFirst({
        where: {
          id: existing.conversationId,
          OR: [{ userAId: me }, { userBId: me }],
        },
        select: { userAId: true, userBId: true },
      })
      if (conversation) {
        const otherId = conversation.userAId === me ? conversation.userBId : conversation.userAId
        const meRow = await prismaDirect.user.findUnique({
          where: { id: me },
          select: { name: true },
        })
        await prismaDirect.notification.create({
          data: {
            userId: otherId,
            type: "MESSAGE_EDITED",
            channel: "IN_APP",
            title: `${meRow?.name || "Staff"} edited a message`,
            message: updated.body.slice(0, 200),
            data: {
              conversationId: existing.conversationId,
              messageId: id,
              senderId: me,
            },
          },
        })
      }
    } catch (notifyError) {
      console.error("[API] Message edit notification error:", notifyError)
    }

    return NextResponse.json({ message: serializeMessage(updated) })
  } catch (error) {
    console.error("[API] Message edit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

  const me = session.user.id
  const { id } = await params

  try {
    const existing = await prismaDirect.message.findFirst({
      where: { id, senderId: me, deletedAt: null },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    await prismaDirect.message.update({
      where: { id },
      data: { deletedAt: new Date(), isRead: true, readAt: new Date() },
      select: { id: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[API] Message delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
