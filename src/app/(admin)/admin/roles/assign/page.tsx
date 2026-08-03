"use client"

import { useState, useEffect } from "react"
import { Shield, Loader2, UserCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface CustomRole {
  id: string
  name: string
}

const BUILT_IN_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "SUPER_ADMIN", label: "SUPER_ADMIN — Full system access" },
  { value: "ADMIN", label: "ADMIN — Administrative access" },
  { value: "EDITOR", label: "EDITOR — Content editor access" },
  { value: "RECEPTIONIST", label: "RECEPTIONIST — Front desk access" },
  { value: "VIEWER", label: "VIEWER — Read-only access" },
]

export default function AssignRolePage() {
  const [users, setUsers] = useState<User[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || data || [])
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomRoles(data)
      })
      .catch(() => setCustomRoles([]))
  }, [])

  const roleOptions = [
    ...BUILT_IN_ROLE_OPTIONS,
    ...customRoles.map((r) => ({ value: r.name, label: `${r.name} — Custom role` })),
  ]

  const selectedUser = users.find((u) => u.id === selectedUserId)

  useEffect(() => {
    if (selectedUser) {
      setSelectedRole(selectedUser.role)
    }
  }, [selectedUser])

  async function handleAssign() {
    if (!selectedUserId || !selectedRole) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to assign role")
      }
      setSuccess(`Role "${selectedRole}" assigned to ${selectedUser!.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/roles"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Assign Role</h1>
        <p className="text-gray-500 text-sm mt-1">Assign a role to a user</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Current role</p>
                <p className="text-sm text-gray-500">{selectedUser.role}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select a role...</option>
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={handleAssign}
              disabled={saving || !selectedUserId || !selectedRole}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              {saving ? "Assigning..." : "Assign Role"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
