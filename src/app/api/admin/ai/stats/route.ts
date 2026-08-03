import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/ai/service"
import { guardPermission } from "@/lib/require-permission-route"

// GET /api/admin/ai/stats - Get AI usage stats
export async function GET(request: NextRequest) {
  const { response } = await guardPermission("ai-usage", "read")
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get("provider") as "openai" | "anthropic" | "gemini" | "groq" | "ollama" | null

    const stats = await aiService.getStats(provider || undefined)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("[API] AI stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
