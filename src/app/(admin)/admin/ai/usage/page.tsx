import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import UsageDashboard from "./usage-dashboard"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function UsagePage() {
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [logs, totals] = await Promise.all([
    prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, estimatedCost: true },
      _count: true,
      _avg: { totalTokens: true },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </a>
          <span className="text-sm text-gray-500">AI Usage Dashboard</span>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <UsageDashboard
          logs={logs.map((l) => ({
            id: l.id,
            provider: l.provider,
            model: l.model,
            inputTokens: l.inputTokens,
            outputTokens: l.outputTokens,
            totalTokens: l.totalTokens,
            estimatedCost: l.estimatedCost,
            createdAt: l.createdAt.toISOString(),
          }))}
          totals={{
            totalRequests: totals._count,
            totalInputTokens: totals._sum.inputTokens || 0,
            totalOutputTokens: totals._sum.outputTokens || 0,
            totalTokens: totals._sum.totalTokens || 0,
            totalCost: totals._sum.estimatedCost || 0,
          }}
        />
      </div>
    </div>
  )
}
