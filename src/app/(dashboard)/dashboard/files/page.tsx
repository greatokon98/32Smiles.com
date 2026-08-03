"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, Image, FileText, Video, Files, Loader2 } from "lucide-react"
import { compressImageFile } from "@/lib/client-image"

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  if (type === "IMAGE") return Image
  if (type === "VIDEO") return Video
  return FileText
}

export default function MyFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/files")
      if (res.ok) {
        const data = await res.json()
        setFiles(data.data || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", await compressImageFile(file))

      const res = await fetch("/api/user/files", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
          <p className="text-gray-500 text-sm mt-1">
            {files.length} file{files.length !== 1 ? "s" : ""}
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="h-8 w-8 text-gray-300 mx-auto animate-spin" />
          <p className="text-gray-500 mt-4">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Files className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-500 text-sm">
            Upload medical records, prescriptions, or documents you&apos;d like to share with your clinic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => {
            const Icon = getFileIcon(file.type)
            const isImage = file.type === "IMAGE" && file.mimeType.startsWith("image/")
            return (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
