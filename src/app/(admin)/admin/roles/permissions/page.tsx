"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Shield, Loader2, Check, X, Save, Lock } from "lucide-react"
import { ALL_RESOURCES, ALL_ACTIONS, ROLE_PERMISSIONS } from "@/lib/permissions"
import type { Resource, Action } from "@/lib/permissions"

interface Role {
  id: string
  name: string
}

interface Permission {
  resource: string
  action: string
}

const BUILT_IN_ROLES: Role[] = [
  { id: "builtin:SUPER_ADMIN", name: "SUPER_ADMIN" },
  { id: "builtin:ADMIN", name: "ADMIN" },
  { id: "builtin:EDITOR", name: "EDITOR" },
  { id: "builtin:RECEPTIONIST", name: "RECEPTIONIST" },
  { id: "builtin:VIEWER", name: "VIEWER" },
]

export default function PermissionsPage() {
  const searchParams = useSearchParams()
  const roleIdParam = searchParams.get("roleId")

  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState(roleIdParam || "")
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data) => {
        const customRoles = Array.isArray(data) ? data : []
        const allRoles = [...BUILT_IN_ROLES, ...customRoles]
        setRoles(allRoles)
        if (!roleIdParam && allRoles.length > 0) {
          setSelectedRoleId(allRoles[0].id)
        }
      })
      .catch(() => setError("Failed to load roles"))
  }, [roleIdParam])

  const isBuiltInRole = useCallback((roleId: string) => {
    return roleId.startsWith("builtin:")
  }, [])

  const loadPermissions = useCallback(async (roleId: string) => {
    if (!roleId) return
    setLoading(true)
    setError("")
    try {
      if (isBuiltInRole(roleId)) {
        const roleName = roleId.replace("builtin:", "")
        const perms = ROLE_PERMISSIONS[roleName] || []
        setPermissions(perms)
        setOriginalPermissions(perms)
        setLoading(false)
        return
      }
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`)
      if (!res.ok) throw new Error("Failed to load permissions")
      const data = await res.json()
      const perms = Array.isArray(data) ? data : data.permissions || []
      setPermissions(perms)
      setOriginalPermissions(perms)
    } catch {
      setError("Failed to load permissions")
    } finally {
      setLoading(false)
    }
  }, [isBuiltInRole])

  useEffect(() => {
    if (selectedRoleId) {
      loadPermissions(selectedRoleId)
    }
  }, [selectedRoleId, loadPermissions])

  function hasPermission(resource: string, action: string): boolean {
    return permissions.some((p) => p.resource === resource && p.action === action)
  }

  function togglePermission(resource: string, action: string) {
    setPermissions((prev) => {
      const exists = prev.some((p) => p.resource === resource && p.action === action)
      if (exists) {
        return prev.filter((p) => !(p.resource === resource && p.action === action))
      }
      return [...prev, { resource, action }]
    })
  }

  function hasChanges(): boolean {
    if (permissions.length !== originalPermissions.length) return true
    return !permissions.every((p) =>
      originalPermissions.some((op) => op.resource === p.resource && op.action === p.action)
    )
  }

  async function handleSave() {
    if (!selectedRoleId) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save permissions")
      }
      const data = await res.json()
      const perms = Array.isArray(data) ? data : data.permissions || []
      setPermissions(perms)
      setOriginalPermissions(perms)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save permissions")
    } finally {
      setSaving(false)
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId)
  const isBuiltIn = selectedRoleId ? isBuiltInRole(selectedRoleId) : false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permission Matrix</h1>
        <p className="text-gray-500 text-sm mt-1">Configure which actions each role can perform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Role:</label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">Select a role...</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {selectedRole && (
            <span className="text-xs text-gray-400">
              Editing: <strong>{selectedRole.name}</strong>
              {isBuiltIn && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Built-in
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {isBuiltIn && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Built-in role permissions are defined in code and cannot be modified
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : selectedRoleId ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-40">Resource</th>
                  {ALL_ACTIONS.map((action) => (
                    <th key={action} className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {ALL_RESOURCES.map((resource) => (
                  <tr key={resource} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 capitalize">{resource}</td>
                    {ALL_ACTIONS.map((action) => {
                      const checked = hasPermission(resource, action)
                      return (
                        <td key={action} className="text-center px-2 py-3">
                          <button
                            type="button"
                            onClick={() => !isBuiltIn && togglePermission(resource, action)}
                            disabled={isBuiltIn}
                            className={`w-7 h-7 rounded flex items-center justify-center mx-auto transition-colors ${
                              checked
                                ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                                : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                            } ${isBuiltIn ? "cursor-default opacity-75" : ""}`}
                          >
                            {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {permissions.length} permission{permissions.length !== 1 ? "s" : ""} selected
            </span>
            {!isBuiltIn && (
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-4">Select a role to manage its permissions</p>
        </div>
      )}
    </div>
  )
}
