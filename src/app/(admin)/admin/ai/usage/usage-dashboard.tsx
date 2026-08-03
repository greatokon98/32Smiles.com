"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { BarChart3, Coins, Activity, Zap } from "lucide-react"

interface LogEntry {
  id: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  createdAt: string
}

interface Totals {
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
}

interface Props {
  logs: LogEntry[]
  totals: Totals
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function UsageDashboard({ logs, totals }: Props) {
  const dailyData = useMemo(() => {
    const map = new Map<string, { requests: number; cost: number; tokens: number }>()
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      map.set(key, { requests: 0, cost: 0, tokens: 0 })
    }
    logs.forEach((log) => {
      const key = log.createdAt.split("T")[0]
      const entry = map.get(key)
      if (entry) {
        entry.requests++
        entry.cost += log.estimatedCost
        entry.tokens += log.totalTokens
      }
    })
    return Array.from(map.entries()).map(([date, data]) => ({
      date: date.slice(5),
      ...data,
      cost: Number(data.cost.toFixed(4)),
    }))
  }, [logs])

  const providerData = useMemo(() => {
    const map = new Map<string, { requests: number; cost: number }>()
    logs.forEach((log) => {
      const existing = map.get(log.provider) || { requests: 0, cost: 0 }
      existing.requests++
      existing.cost += log.estimatedCost
      map.set(log.provider, existing)
    })
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      value: data.requests,
      cost: Number(data.cost.toFixed(4)),
    }))
  }, [logs])

  const costOverTime = useMemo(() => {
    let cumulative = 0
    return dailyData.map((d) => {
      cumulative += d.cost
      return { date: d.date, cost: Number(cumulative.toFixed(4)) }
    })
  }, [dailyData])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary-600" />
        AI Usage Dashboard
      </h1>
      <p className="text-gray-500 mb-8">Last 30 days</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold">{totals.totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tokens</p>
              <p className="text-2xl font-bold">{totals.totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold">${totals.totalCost.toFixed(4)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Tokens/Request</p>
              <p className="text-2xl font-bold">
                {totals.totalRequests > 0
                  ? Math.round(totals.totalTokens / totals.totalRequests).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Daily Requests Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Daily Requests</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">By Provider</h2>
          {providerData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={providerData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {providerData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {providerData.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{p.name}</span>
                    </div>
                    <span className="text-gray-500">{p.value} reqs / ${p.cost}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      {/* Cost Over Time */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Cumulative Cost</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={costOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
            <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Generations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Provider</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Model</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">Tokens</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 capitalize">{log.provider}</td>
                  <td className="py-3 px-2 text-gray-600">{log.model}</td>
                  <td className="py-3 px-2 text-right">{log.totalTokens.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right">${log.estimatedCost.toFixed(4)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No usage data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
