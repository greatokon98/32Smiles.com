import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const me = session.user.id
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      select: { id: true },
    })

    const conversationIds = conversations.map((c) => c.id)
    const unreadCount =
      conversationIds.length > 0
        ? await prisma.message.count({
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: me },
              isRead: false,
            },
          })
        : 0

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("[API] Unread messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
