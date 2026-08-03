import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/ai/service"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/ai/image-prompt - Generate image prompt
export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("ai-studio", "create")
  if (response) return response

  try {
    const body = await request.json()

    const result = await aiService.generateImagePrompt({
      description: body.description,
      style: body.style,
      mood: body.mood,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] AI image prompt error:", error)
    const message = error instanceof Error ? error.message : "Image prompt generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
