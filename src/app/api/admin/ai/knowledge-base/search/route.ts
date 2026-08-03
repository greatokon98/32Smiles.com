import { NextRequest, NextResponse } from "next/server"
import { knowledgeBaseService } from "@/ai/rag/knowledge-base"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/ai/knowledge-base/search - Search knowledge base
export async function POST(request: NextRequest) {
  const { response } = await guardPermission("ai-settings", "read")
  if (response) return response

  try {
    const body = await request.json()
    const results = await knowledgeBaseService.search(body.query, body.limit || 5)
    return NextResponse.json(results)
  } catch (error) {
    console.error("[API] KB search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
