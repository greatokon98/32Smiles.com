import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/ai/service"
import { createAuditLog } from "@/lib/audit"
import { guardPermission } from "@/lib/require-permission-route"

const TEMPLATES_MAP: Record<string, string> = {
  blog: "blog-post-writer",
  service: "service-description",
  education: "content-rewriter",
  faq: "faq-generator",
  seo: "seo-meta-writer",
  image: "image-prompt-generator",
  rewrite: "content-rewriter",
}

const TONE_MAP: Record<string, string> = {
  "professional-warm": "professional and warm",
  friendly: "friendly and casual",
  clinical: "clinical and informative",
  educational: "educational and detailed",
}

const AUDIENCE_MAP: Record<string, string> = {
  patients: "dental patients",
  professionals: "dental professionals",
  general: "general public",
}

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("ai-studio", "create")
  if (response) return response

  const startTime = Date.now()

  try {
    const body = await request.json()
    const {
      contentType,
      topic,
      audience,
      tone,
      wordCount,
      includeFaq,
      includeCta,
      keyTopics,
      provider,
      templateSlug,
      brandVoiceId,
      useKnowledgeBase,
    } = body

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    let knowledgeBaseContext: string | undefined

    if (useKnowledgeBase) {
      try {
        const { knowledgeBaseService } = await import("@/ai/rag/knowledge-base")
        const searchResults = await knowledgeBaseService.search(topic, 3)
        if (searchResults.length > 0) {
          knowledgeBaseContext = searchResults
            .map((r: any) => `Source: ${r.title}\n${r.content.slice(0, 500)}`)
            .join("\n\n---\n\n")
        }
      } catch {
        // KB not available, continue without
      }
    }

    const result = await aiService.generate({
      templateSlug: templateSlug || TEMPLATES_MAP[contentType] || "blog-post-writer",
      variables: {
        topic,
        title: topic,
        target_audience: AUDIENCE_MAP[audience] || "dental patients",
        tone_of_voice: TONE_MAP[tone] || "professional and warm",
        word_count: String(wordCount || 800),
        key_topics: keyTopics?.join(", ") || topic,
        include_faq: includeFaq ? "Yes" : "No",
        include_cta: includeCta ? "Yes, include a call-to-action to book an appointment" : "No",
      },
      options: {
        provider: provider || "openai",
        temperature: 0.7,
        maxTokens: Math.min(4096, (wordCount || 800) * 2),
        knowledgeBaseContext,
      },
      userId: session.user.id,
    })

    const latency = Date.now() - startTime

    createAuditLog({
      userId: session.user.id,
      action: "GENERATE",
      resource: "ai_content",
      newValues: { contentType, topic, provider: result.response.provider },
    })

    return NextResponse.json({
      content: result.content,
      tokens: {
        input: result.response.usage.promptTokens,
        output: result.response.usage.completionTokens,
      },
      cost: result.response.usage.estimatedCostUsd,
      provider: result.response.provider,
      model: result.response.model,
      latency,
      safetyCheck: result.safetyCheck,
    })
  } catch (error: any) {
    console.error("AI generation error:", error)
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    )
  }
}
