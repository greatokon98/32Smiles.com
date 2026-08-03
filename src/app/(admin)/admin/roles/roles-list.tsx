"use client"

import { Shield, Plus, Edit2 } from "lucide-react"
import Link from "next/link"

interface Role {
  id: string
  name: string
  description: string | null
  permissionCount: number
  createdAt: string
  isBuiltIn?: boolean
}

export default function RolesList({ initialRoles }: { initialRoles: Role[] }) {
  function formatDate(iso: string) {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {initialRoles.length} role{initialRoles.length !== 1 ? "s" : ""} — manage access control for the system
          </p>
        </div>
        <Link
          href="/admin/roles/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {initialRoles.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No roles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Permissions</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          <Shield className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{role.name}</span>
                          {role.isBuiltIn && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Built-in
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{role.description || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                        {role.permissionCount} permission{role.permissionCount !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(role.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {role.isBuiltIn ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <Link
                          href={`/admin/roles/permissions?roleId=${role.id}`}
                          className="text-xs font-medium px-3 py-1.5 rounded-md text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Link>
                      )}
                    </td>
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
