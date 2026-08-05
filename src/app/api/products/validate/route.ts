import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { ContentStatus, ContentType } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const productIds: string[] = Array.isArray(body?.productIds)
      ? body.productIds.filter((id: unknown): id is string => typeof id === "string")
      : []

    if (productIds.length === 0) {
      return NextResponse.json({ valid: [], invalid: [] })
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        content: {
          type: ContentType.PRODUCT,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      select: { id: true },
    })

    const found = new Set(products.map((p) => p.id))
    const valid = productIds.filter((id) => found.has(id))
    const invalid = productIds.filter((id) => !found.has(id))

    return NextResponse.json({ valid, invalid })
  } catch (error) {
    console.error("[API] Product validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
