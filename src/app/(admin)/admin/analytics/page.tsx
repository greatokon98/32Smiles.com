import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AnalyticsDashboard from "./analytics-dashboard"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [groupedViews, rawPageViews, events] = await Promise.all([
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { _count: { path: "desc" } },
      take: 20,
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ])

  const totalViews = events.filter((e) => e.event === "page_view").length || groupedViews.reduce((sum, p) => sum + p._count, 0)
  const uniqueSessions = new Set(events.map((e) => e.metadata && typeof e.metadata === "object" ? (e.metadata as any).sessionId : null).filter(Boolean)).size || 1

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin/dashboard" className="text-xl font-bold text-primary-600">32Smiles Admin</a>
          <span className="text-sm text-gray-500">Analytics</span>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnalyticsDashboard
          totalViews={totalViews}
          uniqueVisitors={uniqueSessions}
          topPages={groupedViews.map((p) => ({ page: p.path, views: p._count }))}
          recentEvents={events.map((e) => ({
            id: e.id,
            event: e.event,
            page: e.page,
            source: e.source || "direct",
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
