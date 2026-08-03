import { NextRequest, NextResponse } from "next/server"
import { contentService } from "@/services/content.service"
import { serializeContent } from "@/lib/utils"
import { guardPermission } from "@/lib/require-permission-route"

// GET /api/admin/content/[type]/[id] - Get single content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { session, response } = await guardPermission("content", "read")
  if (response) return response

  try {
    const { id } = await params
    const content = await contentService.getById(id)

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    return NextResponse.json(serializeContent(content))
  } catch (error) {
    console.error("[API] Content get error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/content/[type]/[id] - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { session, response } = await guardPermission("content", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()

    const content = await contentService.update(id, body, session.user.id)
    return NextResponse.json(serializeContent(content))
  } catch (error) {
    console.error("[API] Content update error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/content/[type]/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { session, response } = await guardPermission("content", "delete")
  if (response) return response

  try {
    const { id } = await params
    await contentService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Content delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
