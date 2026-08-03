"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Save, Search, Edit3, X, Check, RefreshCw } from "lucide-react"

interface EnvVarEntry {
  value: string
  overridden: boolean
}

interface EnvVarManagerProps {
  isSuperAdmin: boolean
}

export default function EnvVarsManager({ isSuperAdmin }: EnvVarManagerProps) {
  const [vars, setVars] = useState<Record<string, EnvVarEntry>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchVars = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings/env")
      if (res.ok) {
        const data = await res.json()
        setVars(data.vars)
      }
    } catch {
      toast.error("Failed to load environment variables")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVars()
  }, [fetchVars])

  const filteredEntries = Object.entries(vars).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(key: string, currentValue: string) {
    setEditing(key)
    setEditValue(currentValue === "(not set)" ? "" : currentValue)
  }

  function cancelEdit() {
    setEditing(null)
    setEditValue("")
  }

  async function saveEdit(key: string) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/env", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: { [key]: editValue } }),
      })
      if (res.ok) {
        setVars((prev) => ({
          ...prev,
          [key]: { value: editValue, overridden: true },
        }))
        setEditing(null)
        toast.success("Saved")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Environment Variables</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSuperAdmin ? "View and override environment variables" : "View environment variables"}
          </p>
        </div>
        <button
          onClick={fetchVars}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No environment variables found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  {isSuperAdmin && <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map(([key, entry]) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-900">{key}</code>
                        {entry.overridden && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                            overridden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editing === key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm font-mono"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(key)}
                            disabled={saving}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : entry.value === "(not set)" ? (
                        <span className="text-sm font-mono text-gray-400 italic">(not set)</span>
                      ) : (
                        <code className="text-sm font-mono text-gray-600">{entry.value}</code>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-right">
                        {editing !== key && (
                          <button
                            onClick={() => startEdit(key, entry.value)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
