import { NextRequest, NextResponse } from "next/server"
import { contentService } from "@/services/content.service"
import { guardPermission } from "@/lib/require-permission-route"

// DELETE /api/admin/content/[type]/[id]/discard-draft - Discard unpublished edits
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { response } = await guardPermission("content", "update")
  if (response) return response

  try {
    const { id } = await params
    await contentService.discardDraft(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Discard draft error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
