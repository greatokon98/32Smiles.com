import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"
import { revalidateAllPublicPaths } from "@/lib/revalidate-paths"

export async function GET() {
  const { response } = await guardPermission("settings", "read")
  if (response) return response

  try {
    const settings = await prisma.setting.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
      select: {
        key: true,
        value: true,
        type: true,
        group: true,
        label: true,
        helpText: true,
        isPublic: true,
      },
    })

    const settingsObject: Record<string, string> = {}
    for (const s of settings) {
      settingsObject[s.key] = s.value
    }

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error("[API] Settings GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await guardPermission("settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const { settings } = body as {
      settings: Record<string, string>
    }

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const upserts = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          type: "string",
          group: "general",
        },
      })
    )

    await prisma.$transaction(upserts)

    await revalidateAllPublicPaths()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Settings PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
