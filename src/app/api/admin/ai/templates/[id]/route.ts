import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await guardPermission("ai-templates", "read")
  if (response) return response

  try {
    const { id } = await params
    const template = await prisma.promptTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("[API] Template get error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await guardPermission("ai-templates", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { name, category, description, template, systemPrompt, variables, isActive } =
      body as {
        name?: string
        category?: string
        description?: string | null
        template?: string
        systemPrompt?: string | null
        variables?: string[]
        isActive?: boolean
      }

    const existing = await prisma.promptTemplate.findUnique({
      where: { id },
      select: { id: true, name: true, isSystem: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.promptTemplate.findUnique({
        where: { name: name.trim() },
        select: { id: true },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (category !== undefined) updateData.category = category.trim().toUpperCase()
    if (description !== undefined) updateData.description = description || null
    if (template !== undefined) updateData.template = template
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt || null
    if (variables !== undefined) updateData.variables = variables
    if (isActive !== undefined) updateData.isActive = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    updateData.version = { increment: 1 }

    const updated = await prisma.promptTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] Template update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await guardPermission("ai-templates", "delete")
  if (response) return response

  try {
    const { id } = await params
    const existing = await prisma.promptTemplate.findUnique({
      where: { id },
      select: { id: true, isSystem: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "System templates cannot be deleted" },
        { status: 403 }
      )
    }

    const hasLogs = await prisma.aIGenerationLog.findFirst({
      where: { promptTemplateId: id },
      select: { id: true },
    })

    if (hasLogs) {
      await prisma.promptTemplate.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        message:
          "Template has generation logs and was deactivated instead of deleted",
      })
    }

    await prisma.promptTemplate.delete({ where: { id } })
    return NextResponse.json({ message: "Template deleted" })
  } catch (error) {
    console.error("[API] Template delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
