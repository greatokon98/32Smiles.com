import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus, Prisma } from "@prisma/client"

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
  const limit = Math.min(Number(searchParams.get("limit") || "3"), 6)

  const services = await prisma.content.findMany({
    where: {
      type: ContentType.SERVICE,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      slug: { not: exclude },
    },
    include: {
      service: true,
      featuredImage: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json(serializeContent(services))
}
