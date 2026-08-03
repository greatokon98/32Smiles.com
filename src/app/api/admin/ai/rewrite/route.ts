import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/ai/service"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/ai/rewrite - Rewrite content
export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("ai-studio", "create")
  if (response) return response

  try {
    const body = await request.json()

    const result = await aiService.rewrite({
      content: body.content,
      instructions: body.instructions,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] AI rewrite error:", error)
    const message = error instanceof Error ? error.message : "Rewrite failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
