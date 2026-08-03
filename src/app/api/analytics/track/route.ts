import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (limit.count >= 60) return false
  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const body = await request.json()
    const { page, event, source, metadata } = body

    if (!page || !event) {
      return NextResponse.json({ error: "page and event are required" }, { status: 400 })
    }

    await prisma.analyticsEvent.create({
      data: {
        event,
        page,
        source: source || "direct",
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: true })
  }
}
