import { NextRequest, NextResponse } from "next/server"
import { contentService } from "@/services/content.service"
import { guardPermission } from "@/lib/require-permission-route"

// PUT /api/admin/content/[id]/seo - Update SEO metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await guardPermission("content", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()

    const seo = await contentService.updateSEO(id, {
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      ogTitle: body.ogTitle,
      ogDescription: body.ogDescription,
      ogImage: body.ogImage,
      focusKeyword: body.focusKeyword,
      canonicalUrl: body.canonicalUrl,
    })

    return NextResponse.json(seo)
  } catch (error) {
    console.error("[API] SEO update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/admin/content/[id]/seo - Get SEO metadata
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await guardPermission("content", "read")
  if (response) return response

  try {
    const { id } = await params
    const seo = await contentService.getSEO(id)
    return NextResponse.json(seo || {})
  } catch (error) {
    console.error("[API] SEO get error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
