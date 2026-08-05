import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus, Prisma } from "@prisma/client"
import { getProductFallbackImages } from "@/lib/product-images"

function serializeContent(content: unknown): unknown {
  if (content === null || content === undefined) return content
  if (content instanceof Prisma.Decimal) return Number(content.toString())
  if (Array.isArray(content)) return content.map(serializeContent)
  if (typeof content === "object") {
    const obj = content as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeContent(value)
    }
    return result
  }
  return content
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const exclude = searchParams.get("exclude") || ""
  const categoryId = searchParams.get("categoryId") || ""
  const limit = Math.min(Number(searchParams.get("limit") || "4"), 8)

  const [products, productImages] = await Promise.all([
    prisma.product.findMany({
      where: {
        content: {
          type: ContentType.PRODUCT,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
          slug: { not: exclude },
        },
        ...(categoryId && { productCategoryId: categoryId }),
      },
      include: {
        content: {
          include: {
            featuredImage: true,
          },
        },
        productCategory: true,
      },
      orderBy: [{ isFeatured: "desc" }, { content: { createdAt: "desc" } }],
      take: limit,
    }),
    getProductFallbackImages(),
  ])

  const enriched = products.map((p) => ({
    ...p,
    content: {
      ...p.content,
      featuredImage: p.content.featuredImage || {
        url: productImages[p.content.slug],
      },
    },
  }))

  return NextResponse.json(serializeContent(enriched))
}
