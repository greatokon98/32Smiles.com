import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/ai/service"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/ai/seo - Generate SEO metadata
export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("ai-studio", "create")
  if (response) return response

  try {
    const body = await request.json()

    const result = await aiService.generateSEO({
      title: body.title,
      content: body.content,
      keyword: body.keyword,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] AI SEO error:", error)
    const message = error instanceof Error ? error.message : "SEO generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
