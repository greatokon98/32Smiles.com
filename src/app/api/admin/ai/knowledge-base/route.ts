import { NextRequest, NextResponse } from "next/server"
import { knowledgeBaseService } from "@/ai/rag/knowledge-base"
import { guardPermission } from "@/lib/require-permission-route"

// GET /api/admin/ai/knowledge-base - List entries
export async function GET(request: NextRequest) {
  const { response } = await guardPermission("ai-settings", "read")
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams
    const result = await knowledgeBaseService.list({
      sourceType: searchParams.get("sourceType") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] KB list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
