import { NextRequest, NextResponse } from "next/server"
import { ContentType } from "@prisma/client"
import prisma from "@/lib/prisma"

const RESULT_LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()
    const type = searchParams.get("type")?.trim()
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : RESULT_LIMIT

    if (!q) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const searchTerms = q.split(/\s+/).filter(Boolean)

    const contentWhere: Record<string, unknown> = {
      status: "PUBLISHED",
      deletedAt: null,
      OR: searchTerms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" } },
        { excerpt: { contains: term, mode: "insensitive" } },
      ]),
    }

    if (type && type !== "ALL") {
      const typeMap: Record<string, ContentType[]> = {
        SERVICES: [ContentType.SERVICE],
        BLOG: [ContentType.BLOG_POST],
        PRODUCTS: [ContentType.PRODUCT],
        TEAM: [ContentType.TEAM_MEMBER],
        EDUCATION: [ContentType.EDUCATION_PATIENT, ContentType.EDUCATION_PROFESSIONAL],
      }
      const contentTypes = typeMap[type.toUpperCase()]
      if (contentTypes) {
        contentWhere.type = { in: contentTypes }
      }
    }

    const contents = await prisma.content.findMany({
      where: contentWhere,
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        service: {
          select: {
            id: true,
          },
        },
        blogPost: {
          select: {
            id: true,
          },
        },
        product: {
          select: {
            id: true,
          },
        },
        teamMember: {
          select: {
            id: true,
          },
        },
        educationArticle: {
          select: {
            id: true,
            educationType: true,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: limit,
    })

    const results = contents.map((content) => {
      let url = `/${content.slug}`

      switch (content.type) {
        case "SERVICE":
          url = `/services/${content.slug}`
          break
        case "BLOG_POST":
          url = `/blog/${content.slug}`
          break
        case "PRODUCT":
          url = `/products/${content.slug}`
          break
        case "TEAM_MEMBER":
          url = `/team/${content.slug}`
          break
        case "EDUCATION_PATIENT":
          url = `/education/patient/${content.slug}`
          break
        case "EDUCATION_PROFESSIONAL":
          url = `/education/professional/${content.slug}`
          break
      }

      return {
        id: content.id,
        type: content.type,
        title: content.title,
        excerpt: content.excerpt,
        url,
        date: content.publishedAt?.toISOString() ?? null,
      }
    })

    // Log search asynchronously
    prisma.searchLog
      .create({
        data: {
          query: q,
          results: results.length,
        },
      })
      .catch(() => {})

    return NextResponse.json({
      results,
      total: results.length,
      query: q,
    })
  } catch (error) {
    console.error("[API] Search error:", error)
    return NextResponse.json(
      { error: "Search failed", results: [], total: 0 },
      { status: 500 }
    )
  }
}
