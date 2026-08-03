import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { encrypt } from "@/lib/crypto"
import { guardPermission } from "@/lib/require-permission-route"

export async function GET() {
  const { response } = await guardPermission("settings", "read")
  if (response) return response

  try {
    const providers = await prisma.aIProviderConfig.findMany({
      orderBy: [{ priority: "asc" }, { provider: "asc" }],
    })

    const serialized = providers.map((p) => ({
      id: p.id,
      provider: p.provider,
      displayName: p.displayName,
      apiKeyConfigured: !!p.apiKeyEnc,
      baseUrl: p.baseUrl,
      defaultModel: p.defaultModel,
      status: p.status,
      priority: p.priority,
      rateLimit: p.rateLimit,
      monthlyBudget: p.monthlyBudget ? Number(p.monthlyBudget) : null,
      monthlySpend: p.monthlySpend ? Number(p.monthlySpend) : null,
      lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
      errorCount: p.errorCount,
      lastError: p.lastError,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("[API] AI providers GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await guardPermission("settings", "create")
  if (response) return response

  try {
    const body = await request.json()
    const { provider, displayName, defaultModel, apiKey, baseUrl } = body

    if (!provider || !displayName || !defaultModel) {
      return NextResponse.json(
        { error: "Provider, displayName, and defaultModel are required" },
        { status: 400 }
      )
    }

    const existing = await prisma.aIProviderConfig.findUnique({
      where: { provider },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Provider "${provider}" already exists` },
        { status: 409 }
      )
    }

    const created = await prisma.aIProviderConfig.create({
      data: {
        provider,
        displayName,
        defaultModel,
        apiKeyEnc: apiKey ? encrypt(apiKey) : null,
        baseUrl: baseUrl || null,
        status: apiKey ? "ACTIVE" : "INACTIVE",
      },
    })

    createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "ai_provider",
      resourceId: created.id,
      newValues: { provider: created.provider, displayName: created.displayName, defaultModel: created.defaultModel },
    })

    return NextResponse.json({
      id: created.id,
      provider: created.provider,
      displayName: created.displayName,
      apiKeyConfigured: !!created.apiKeyEnc,
      baseUrl: created.baseUrl,
      defaultModel: created.defaultModel,
      status: created.status,
      priority: created.priority,
      rateLimit: created.rateLimit,
      monthlyBudget: created.monthlyBudget ? Number(created.monthlyBudget) : null,
      monthlySpend: created.monthlySpend ? Number(created.monthlySpend) : null,
      lastUsedAt: created.lastUsedAt?.toISOString() ?? null,
      errorCount: created.errorCount,
      lastError: created.lastError,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("[API] AI providers POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
