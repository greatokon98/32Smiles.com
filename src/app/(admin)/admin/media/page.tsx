"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pagination } from "@/components/admin/pagination"
import {
  Upload,
  Image,
  FileText,
  Video,
  Files,
  X,
  Copy,
  Check,
  Loader2,
  Calendar,
  HardDrive,
} from "lucide-react"

interface FileItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  url: string
  type: "IMAGE" | "DOCUMENT" | "VIDEO" | "OTHER"
  width: number | null
  height: number | null
  uploadedById: string
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse {
  data: FileItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterType = "" | "IMAGE" | "DOCUMENT" | "VIDEO"

const ITEMS_PER_PAGE = 24

const filterTabs: { label: string; value: FilterType; icon: typeof Files }[] = [
  { label: "All", value: "", icon: Files },
  { label: "Images", value: "IMAGE", icon: Image },
  { label: "Documents", value: "DOCUMENT", icon: FileText },
  { label: "Videos", value: "VIDEO", icon: Video },
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getFileIcon(type: string) {
  if (type === "IMAGE") return Image
  if (type === "VIDEO") return Video
  return FileText
}

function getThumbnailUrl(file: FileItem): string | null {
  if (file.type === "IMAGE" && file.mimeType.startsWith("image/")) {
    return file.url
  }
  return null
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<FilterType>("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      })
      if (filter) params.set("type", filter)

      const res = await fetch(`/api/admin/upload?${params}`)
      if (res.ok) {
        const data: PaginatedResponse = await res.json()
        setFiles(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  useEffect(() => {
    setPage(1)
  }, [filter])

  function handleFilterChange(newFilter: FilterType) {
    setFilter(newFilter)
    setSelectedFile(null)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        setPage(1)
        setFilter("")
        await fetchFiles()
      } else {
        const err = await res.json()
        alert(err.error || "Upload failed")
      }
    } catch {
      alert("Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleCopyUrl(file: FileItem) {
    const fullUrl = `${window.location.origin}${file.url}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = fullUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} file{total !== 1 ? "s" : ""}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.value
                ? "bg-primary-100 text-primary-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 text-gray-300 mx-auto animate-spin" />
              <p className="text-gray-500 mt-4">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Files className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-4">No files found</p>
              <p className="text-gray-400 text-sm mt-1">Upload files to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {files.map((file) => {
                const thumbnail = getThumbnailUrl(file)
                const isSelected = selectedFile?.id === file.id
                const Icon = getFileIcon(file.type)

                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(isSelected ? null : file)}
                    className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                      isSelected
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-transparent"
                    }`}
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm px-6 py-4 mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="w-80 shrink-0 bg-white rounded-xl shadow-sm p-5 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">File Details</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {getThumbnailUrl(selectedFile) ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.originalName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const Icon = getFileIcon(selectedFile.type)
                    return <Icon className="h-16 w-16 text-gray-300" />
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Name</p>
                <p className="text-sm text-gray-900 truncate mt-0.5">
                  {selectedFile.originalName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Type</p>
                <p className="text-sm text-gray-900 mt-0.5">{selectedFile.mimeType}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase font-medium flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    Size
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Uploaded
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {formatDate(selectedFile.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">URL</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate font-mono bg-gray-50 p-2 rounded">
                  {selectedFile.url}
                </p>
              </div>

              <button
                onClick={() => handleCopyUrl(selectedFile)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                {copiedUrl ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
