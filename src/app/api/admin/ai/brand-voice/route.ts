import { NextRequest, NextResponse } from "next/server"
import { promptService } from "@/ai/prompts/service"
import { guardPermission } from "@/lib/require-permission-route"

// GET /api/admin/ai/brand-voice - Get active brand voice
export async function GET() {
  const { response } = await guardPermission("ai-settings", "read")
  if (response) return response

  try {
    const voice = await promptService.getActiveBrandVoice()
    return NextResponse.json(voice || {})
  } catch (error) {
    console.error("[API] Brand voice get error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/ai/brand-voice - Update brand voice
export async function PUT(request: NextRequest) {
  const { response } = await guardPermission("ai-settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const voice = await promptService.updateBrandVoice(body)
    return NextResponse.json(voice)
  } catch (error) {
    console.error("[API] Brand voice update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
