import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { encrypt } from "@/lib/crypto"
import { guardPermission } from "@/lib/require-permission-route"

async function getProvider(id: string) {
  const provider = await prisma.aIProviderConfig.findUnique({ where: { id } })
  if (!provider) return null
  return {
    id: provider.id,
    provider: provider.provider,
    displayName: provider.displayName,
    apiKeyConfigured: !!provider.apiKeyEnc,
    baseUrl: provider.baseUrl,
    defaultModel: provider.defaultModel,
    status: provider.status,
    priority: provider.priority,
    rateLimit: provider.rateLimit,
    monthlyBudget: provider.monthlyBudget ? Number(provider.monthlyBudget) : null,
    monthlySpend: provider.monthlySpend ? Number(provider.monthlySpend) : null,
    lastUsedAt: provider.lastUsedAt?.toISOString() ?? null,
    errorCount: provider.errorCount,
    lastError: provider.lastError,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await guardPermission("settings", "read")
  if (response) return response

  try {
    const { id } = await params
    const provider = await getProvider(id)
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }
    return NextResponse.json(provider)
  } catch (error) {
    console.error("[API] AI provider GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("settings", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { displayName, defaultModel, apiKey, baseUrl, status } = body

    const existing = await prisma.aIProviderConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (displayName !== undefined) data.displayName = displayName
    if (defaultModel !== undefined) data.defaultModel = defaultModel
    if (baseUrl !== undefined) data.baseUrl = baseUrl
    if (status !== undefined) data.status = status
    if (apiKey !== undefined && apiKey !== "") {
      data.apiKeyEnc = encrypt(apiKey)
    }

    await prisma.aIProviderConfig.update({
      where: { id },
      data,
    })

    const updated = await getProvider(id)

    createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "ai_provider",
      resourceId: id,
      oldValues: {
        displayName: existing.displayName,
        defaultModel: existing.defaultModel,
        baseUrl: existing.baseUrl,
        status: existing.status,
      },
      newValues: data as Record<string, unknown>,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] AI provider PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("settings", "delete")
  if (response) return response

  try {
    const { id } = await params
    const existing = await prisma.aIProviderConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    await prisma.aIProviderConfig.delete({ where: { id } })

    createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "ai_provider",
      resourceId: id,
      oldValues: {
        provider: existing.provider,
        displayName: existing.displayName,
        defaultModel: existing.defaultModel,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] AI provider DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
