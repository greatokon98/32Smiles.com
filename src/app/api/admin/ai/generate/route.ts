import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/ai/service"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/ai/generate - Generate content
export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("ai-studio", "create")
  if (response) return response

  try {
    const body = await request.json()

    const result = await aiService.generate({
      templateId: body.templateId,
      templateSlug: body.templateSlug,
      variables: body.variables,
      prompt: body.prompt,
      systemPrompt: body.systemPrompt,
      options: {
        provider: body.provider,
        model: body.model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        knowledgeBaseContext: body.knowledgeBaseContext,
      },
      contentId: body.contentId,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] AI generate error:", error)
    const message = error instanceof Error ? error.message : "Generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
