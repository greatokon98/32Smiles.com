"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Pagination } from "@/components/admin/pagination"
import {
  Search,
  Users,
  Shield,
  Loader2,
  UserCheck,
  UserX,
  Edit2,
  Check,
  X,
  Clock,
  Mail,
  Trash2,
} from "lucide-react"
import { ROLE_LABELS } from "@/lib/role-permissions"
import { useRoleOptions } from "@/hooks/use-role-options"

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  EDITOR: "bg-green-100 text-green-800",
  RECEPTIONIST: "bg-amber-100 text-amber-800",
  VIEWER: "bg-gray-100 text-gray-600",
}

const DEFAULT_ROLE_COLOR = "bg-teal-100 text-teal-800"

const ITEMS_PER_PAGE = 15

export default function UserList({
  initialUsers,
  currentUserId,
  currentUserRole,
}: {
  initialUsers: User[]
  currentUserId: string
  currentUserRole: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState("VIEWER")
  const { roleOptions } = useRoleOptions()

  const router = useRouter()
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN"

  const filtered = useMemo(() => {
    let result = users

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }

    return result
  }, [users, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function handleRoleChange(userId: string) {
    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (res.ok) {
        const updated = await res.json()
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: updated.role } : u
          )
        )
        setEditingRoleUserId(null)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update user role")
      }
    } catch {
      alert("Failed to update user role")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleToggleActive(userId: string) {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    if (userId === currentUserId) {
      alert("You cannot deactivate your own account")
      return
    }

    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (res.ok) {
        const updated = await res.json()
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isActive: updated.isActive } : u
          )
        )
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update user")
      }
    } catch {
      alert("Failed to update user")
    } finally {
      setUpdatingId(null)
    }
  }

  function startEditRole(user: User) {
    setEditingRoleUserId(user.id)
    setSelectedRole(user.role)
  }

  function canEditUser(user: User): boolean {
    if (user.id === currentUserId) return false
    if (isSuperAdmin) return true
    if (currentUserRole === "ADMIN" && user.role !== "SUPER_ADMIN") return true
    return false
  }

  function canDeactivateUser(user: User): boolean {
    if (user.id === currentUserId) return false
    if (isSuperAdmin) return true
    if (currentUserRole === "ADMIN" && user.role !== "SUPER_ADMIN") return true
    return false
  }

  function canDeleteUser(user: User): boolean {
    if (user.id === currentUserId) return false
    return isSuperAdmin
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This removes their login and hides them from all user lists. Their data and history are preserved.`)) {
      return
    }

    setDeletingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Failed to delete user")
      }
    } catch {
      alert("Failed to delete user")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((user) => {
                  const isUpdating = updatingId === user.id
                  const isEditingRole = editingRoleUserId === user.id
                  const isCurrentUser = user.id === currentUserId

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              user.isActive
                                ? "bg-primary-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium ${
                                user.isActive
                                  ? "text-primary-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-medium truncate ${
                                  user.isActive ? "text-gray-900" : "text-gray-400"
                                }`}
                              >
                                {user.name}
                              </p>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditingRole ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                              {roleOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRoleChange(user.id)
                              }}
                              disabled={isUpdating}
                              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingRoleUserId(null)
                              }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] || DEFAULT_ROLE_COLOR}`}
                          >
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                            <UserCheck className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                            <UserX className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.lastLoginAt ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {formatDateTime(user.lastLoginAt)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isCurrentUser && (canEditUser(user) || canDeactivateUser(user) || canDeleteUser(user)) && (
                          <div className="flex items-center justify-end gap-1">
                            {isUpdating || deletingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                              <>
                                {canEditUser(user) && !isEditingRole && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startEditRole(user)
                                    }}
                                    className="text-xs font-medium px-3 py-1.5 rounded-md text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1"
                                    title="Edit role"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    Role
                                  </button>
                                )}
                                {canDeactivateUser(user) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleActive(user.id)
                                    }}
                                    className={`text-xs font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1 ${
                                      user.isActive
                                        ? "text-red-600 hover:bg-red-50"
                                        : "text-green-600 hover:bg-green-50"
                                    }`}
                                    title={user.isActive ? "Deactivate" : "Activate"}
                                  >
                                    {user.isActive ? (
                                      <>
                                        <UserX className="h-3 w-3" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-3 w-3" />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                )}
                                {canDeleteUser(user) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(user)
                                    }}
                                    className="text-xs font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1 text-red-600 hover:bg-red-50"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
