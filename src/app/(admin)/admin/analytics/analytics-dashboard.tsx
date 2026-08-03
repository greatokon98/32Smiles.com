"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Eye, Users, TrendingUp, BarChart3 } from "lucide-react"

interface Props {
  totalViews: number
  uniqueVisitors: number
  topPages: { page: string; views: number }[]
  recentEvents: { id: string; event: string; page: string; source: string; createdAt: string }[]
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function AnalyticsDashboard({ totalViews, uniqueVisitors, topPages, recentEvents }: Props) {
  const sourceData = useMemo(() => {
    const map = new Map<string, number>()
    recentEvents.forEach((e) => {
      map.set(e.source, (map.get(e.source) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [recentEvents])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary-600" />
        Analytics Dashboard
      </h1>
      <p className="text-gray-500 mb-8">Last 30 days</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Visitors</p>
              <p className="text-2xl font-bold">{uniqueVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Top Page Views</p>
              <p className="text-2xl font-bold">{topPages[0]?.views || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Events Tracked</p>
              <p className="text-2xl font-bold">{recentEvents.length.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPages.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="page" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Traffic Sources</h2>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Event</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Page</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.slice(0, 20).map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-600">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-2">{e.event}</td>
                  <td className="py-3 px-2 text-gray-600">{e.page}</td>
                  <td className="py-3 px-2 capitalize">{e.source}</td>
                </tr>
              ))}
              {recentEvents.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">No events tracked yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
