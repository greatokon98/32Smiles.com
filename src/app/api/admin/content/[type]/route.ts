import { NextRequest, NextResponse } from "next/server"
import { contentService } from "@/services/content.service"
import { ContentTypeSchema } from "@/domains/content/validation"
import { serializeContent } from "@/lib/utils"
import { guardPermission } from "@/lib/require-permission-route"
import { revalidateContentPaths } from "@/lib/revalidate-paths"

// GET /api/admin/content/[type] - List content by type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { session, response } = await guardPermission("content", "read")
  if (response) return response

  try {
    const { type } = await params
    const typeResult = ContentTypeSchema.safeParse(type)
    if (!typeResult.success) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get("status")
    const validStatuses = ["DRAFT","AI_GENERATED","AI_ASSISTED","UNDER_REVIEW","REVISIONS_REQUESTED","REJECTED","APPROVED","SEO_REVIEW","SEO_APPROVED","PUBLISHED","ARCHIVED"] as const
    const query = {
      type: typeResult.data,
      status: statusParam && validStatuses.includes(statusParam as typeof validStatuses[number]) ? statusParam as typeof validStatuses[number] : undefined,
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      sortBy: (searchParams.get("sortBy") as "createdAt" | "updatedAt" | "title") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    }

    const result = await contentService.list(query)
    return NextResponse.json(serializeContent(result))
  } catch (error) {
    console.error("[API] Content list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/content/[type] - Create content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { session, response } = await guardPermission("content", "create")
  if (response) return response

  try {
    const { type } = await params
    const typeResult = ContentTypeSchema.safeParse(type)
    if (!typeResult.success) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const body = await request.json()
    const content = await contentService.create(
      { ...body, type: typeResult.data },
      session.user.id
    )

    await revalidateContentPaths(content.type, content.slug)

    return NextResponse.json(serializeContent(content), { status: 201 })
  } catch (error) {
    console.error("[API] Content create error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
