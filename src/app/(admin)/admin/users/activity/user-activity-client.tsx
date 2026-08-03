"use client"

import { useState, useMemo } from "react"
import { Search, Activity, Clock } from "lucide-react"
import { Pagination } from "@/components/admin/pagination"

interface AuditLogEntry {
  id: string
  action: string
  resource: string
  createdAt: string
  user: { name: string; email: string } | null
}

interface UserRef {
  id: string
  name: string
  email: string
}

const ITEMS_PER_PAGE = 20

export default function UserActivityClient({
  initialLogs,
  users,
}: {
  initialLogs: AuditLogEntry[]
  users: UserRef[]
}) {
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = initialLogs

    if (selectedUser) {
      result = result.filter((log) => log.user?.email === selectedUser)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (log) =>
          log.action.toLowerCase().includes(q) ||
          log.resource.toLowerCase().includes(q) ||
          log.user?.name.toLowerCase().includes(q) ||
          log.user?.email.toLowerCase().includes(q)
      )
    }

    return result
  }, [initialLogs, search, selectedUser])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatAction(action: string) {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Activity</h1>
        <p className="text-gray-500 text-sm mt-1">
          {filtered.length} log entry{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, resource, or user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No activity found</p>
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
                    Action
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Resource
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.user.name}
                          </p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {log.resource}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {formatDateTime(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
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
