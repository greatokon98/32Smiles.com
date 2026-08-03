import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"

export async function GET(request: NextRequest) {
  const { response } = await guardPermission("ai-templates", "read")
  if (response) return response

  try {
    const category = request.nextUrl.searchParams.get("category") || undefined
    const templates = await prisma.promptTemplate.findMany({
      where: category ? { category } : {},
      orderBy: { name: "asc" },
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error("[API] Templates list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("ai-templates", "create")
  if (response) return response

  try {
    const body = await request.json()
    const { name, category, description, template, systemPrompt, variables, isActive } =
      body as {
        name: string
        category: string
        description?: string | null
        template: string
        systemPrompt?: string | null
        variables?: string[]
        isActive?: boolean
      }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!category?.trim()) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.promptTemplate.findUnique({
      where: { name: name.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: "A template with this name already exists" },
        { status: 409 }
      )
    }

    const created = await prisma.promptTemplate.create({
      data: {
        name: name.trim(),
        category: category.trim().toUpperCase(),
        description: description || null,
        template: template || "",
        systemPrompt: systemPrompt || null,
        variables: variables || [],
        isActive: isActive ?? true,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("[API] Template create error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to create template"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
