import { NextRequest } from "next/server"
import prismaDirect from "@/lib/prisma-direct"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const encoder = new TextEncoder()

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const me = session.user.id

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let lastCheck = Date.now()

      const safeSend = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }

      const heartbeat = setInterval(() => {
        safeSend(": ping\n\n")
      }, 15000)

      const tick = setInterval(async () => {
        if (closed) return
        try {
          const since = new Date(lastCheck - 5000)
          const changed = new Set<string>()

          const touchedConversations = await prismaDirect.conversation.findMany({
            where: { OR: [{ userAId: me }, { userBId: me }], lastMessageAt: { gt: since } },
            select: { id: true },
          })
          for (const c of touchedConversations) changed.add(c.id)

          const touchedMessages = await prismaDirect.message.findMany({
            where: {
              conversation: { OR: [{ userAId: me }, { userBId: me }] },
              OR: [
                { createdAt: { gt: since } },
                { editedAt: { gt: since } },
                { deletedAt: { gt: since } },
                { deliveredAt: { gt: since } },
                { readAt: { gt: since } },
              ],
            },
            select: { conversationId: true },
          })
          for (const m of touchedMessages) changed.add(m.conversationId)

          if (changed.size > 0) {
            safeSend(sse("update", { conversationIds: [...changed] }))
          }
          lastCheck = Date.now()
        } catch (error) {
          console.error("[SSE] tick error:", error)
        }
      }, 2000)

      request.signal.addEventListener("abort", () => {
        closed = true
        clearInterval(tick)
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
