import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AIProviderManager from "./ai-provider-manager"

export const dynamic = "force-dynamic"

export default async function AISettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

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

  return <AIProviderManager initialProviders={serialized} />
}
