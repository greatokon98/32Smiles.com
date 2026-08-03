"use client"

import { useState, useRef } from "react"
import { Upload, Image, X, Loader2, FolderOpen } from "lucide-react"
import { compressImageFile } from "@/lib/client-image"

interface FilePickerProps {
  onSelect: (file: { id: string; url: string; filename: string }) => void
  currentValue?: string
  label?: string
  accept?: string
}

interface UploadedFile {
  id: string
  url: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string
}

export function FilePicker({
  onSelect,
  currentValue,
  label = "Choose File",
  accept = "image/*",
}: FilePickerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", await compressImageFile(file))
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      onSelect({ id: data.id, url: data.url, filename: data.filename })
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function openBrowser() {
    setShowBrowser(true)
    setIsLoadingFiles(true)
    try {
      const res = await fetch("/api/admin/upload?type=IMAGE&limit=50")
      const data = await res.json()
      setExistingFiles(data.data || [])
    } catch {
      setExistingFiles([])
    } finally {
      setIsLoadingFiles(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {currentValue && (
        <div className="relative inline-block">
          <img
            src={currentValue}
            alt="Current"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onSelect({ id: "", url: "", filename: "" })}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Upload New"}
        </button>
        <button
          type="button"
          onClick={openBrowser}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FolderOpen className="h-4 w-4" />
          Browse Library
        </button>
      </div>

      {showBrowser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Media Library</h3>
              <button onClick={() => setShowBrowser(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingFiles ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Loading files...</p>
                </div>
              ) : existingFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No files uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {existingFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => {
                        onSelect({ id: file.id, url: file.url, filename: file.filename })
                        setShowBrowser(false)
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors group"
                    >
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
