import { NextRequest, NextResponse } from "next/server"
import { contentService } from "@/services/content.service"
import { guardPermission } from "@/lib/require-permission-route"

// POST /api/admin/content/[id]/publish - Publish content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("content", "publish")
  if (response) return response

  try {
    const { id } = await params
    const content = await contentService.publish(id, session.user.id)
    return NextResponse.json(content)
  } catch (error) {
    console.error("[API] Content publish error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
