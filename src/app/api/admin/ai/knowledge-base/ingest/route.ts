import { NextRequest, NextResponse } from "next/server"
import { knowledgeBaseService } from "@/ai/rag/knowledge-base"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/ai/knowledge-base/ingest - Ingest content
export async function POST(request: NextRequest) {
  const { response } = await guardPermission("ai-settings", "create")
  if (response) return response

  try {
    const body = await request.json()

    // If bulk=true, ingest all published content
    if (body.bulk) {
      const count = await knowledgeBaseService.ingestAllContent()
      return NextResponse.json({ success: true, ingested: count })
    }

    // Single entry ingestion
    const entryId = await knowledgeBaseService.ingest({
      title: body.title,
      content: body.content,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      sourceUrl: body.sourceUrl,
      author: body.author,
      tags: body.tags,
    })

    return NextResponse.json({ success: true, entryId }, { status: 201 })
  } catch (error) {
    console.error("[API] KB ingest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
