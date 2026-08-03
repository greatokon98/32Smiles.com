"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Pagination } from "@/components/admin/pagination"
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  BLOG_POST: "Blog Posts",
  SERVICE: "Services",
  PRODUCT: "Products",
  EDUCATION_PATIENT: "Patient Education",
  EDUCATION_PROFESSIONAL: "Professional Education",
  GALLERY_ITEM: "Gallery",
  TEAM_MEMBER: "Team Members",
  FAQ: "FAQs",
  TESTIMONIAL: "Testimonials",
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  AI_GENERATED: "bg-amber-100 text-amber-700",
  AI_ASSISTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700 animate-pulse",
  REVISIONS_REQUESTED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  APPROVED: "bg-green-100 text-green-700",
  SEO_REVIEW: "bg-purple-100 text-purple-700",
  SEO_APPROVED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-teal-100 text-teal-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
}

interface ContentItem {
  id: string
  title: string
  slug: string
  status: string
  featured: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  author: { name: string; email: string }
}

interface PaginatedResult {
  data: ContentItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ContentListPage() {
  const router = useRouter()
  const params = useParams()
  const type = params.type as string

  const [data, setData] = useState<PaginatedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [actionMenu, setActionMenu] = useState<string | null>(null)

  const typeName = TYPE_LABELS[type] || type

  useEffect(() => {
    fetchContent()
  }, [type, search, statusFilter, page])

  async function fetchContent() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      })
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/admin/content/${type}?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch content:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`/api/admin/content/${type}/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Deleted successfully")
        fetchContent()
      } else {
        toast.error("Failed to delete")
      }
    } catch (error) {
      toast.error("Failed to delete")
    }
    setActionMenu(null)
  }

  async function handlePublish(id: string) {
    try {
      const res = await fetch(`/api/admin/content/${type}/${id}/publish`, { method: "POST" })
      if (res.ok) {
        toast.success("Content published!")
        fetchContent()
      } else {
        toast.error("Failed to publish")
      }
    } catch (error) {
      toast.error("Failed to publish")
    }
    setActionMenu(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{typeName}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.total || 0} items total
          </p>
        </div>
        <Link
          href={`/admin/content/${type}/new`}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add {typeName.replace(/s$/, "")}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No {typeName.toLowerCase()} found</p>
            <Link
              href={`/admin/content/${type}/new`}
              className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create your first {typeName.replace(/s$/, "").toLowerCase()}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Author</th>
                  <th className="text-left px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Views</th>
                  <th className="text-left px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">/{item.slug}</p>
                        </div>
                        {item.featured && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Featured</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[item.status] || "bg-gray-100"}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{item.author.name}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{item.viewCount}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenu(actionMenu === item.id ? null : item.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {actionMenu === item.id && (
                          <div className="absolute right-0 top-8 z-10 bg-white border rounded-lg shadow-lg py-1 w-40">
                            <Link
                              href={`/admin/content/${type}/${item.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </Link>
                            {item.status !== "PUBLISHED" && (
                              <button
                                onClick={() => handlePublish(item.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                              >
                                <CheckCircle className="h-3 w-3" /> Publish
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="border-t px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total}
            </p>
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
