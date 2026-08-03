import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { getSupabaseServerClient, SUPABASE_STORAGE_BUCKET } from "@/lib/supabase"
import type { FileType } from "@prisma/client"

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/webm",
]

export function getFileType(mimeType: string): "IMAGE" | "DOCUMENT" | "VIDEO" | "OTHER" {
  if (mimeType.startsWith("image/")) return "IMAGE"
  if (mimeType.startsWith("video/")) return "VIDEO"
  if (mimeType === "application/pdf") return "DOCUMENT"
  return "OTHER"
}

export async function saveUploadedFile(file: File, userId: string) {
  if (!file) {
    throw new Error("No file provided")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large (max 10MB)")
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File type not allowed")
  }

  const ext = path.extname(file.name)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(filename)

    return prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `${SUPABASE_STORAGE_BUCKET}/${filename}`,
        url: data.publicUrl,
        type: getFileType(file.type),
        width: undefined,
        height: undefined,
        uploadedById: userId,
      },
    })
  }

  const uploadDir = process.env.UPLOAD_DIR || "public/uploads"
  const filePath = path.join(uploadDir, filename)

  await mkdir(uploadDir, { recursive: true })
  await writeFile(filePath, buffer)

  return prisma.file.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      url: `/uploads/${filename}`,
      type: getFileType(file.type),
      width: undefined,
      height: undefined,
      uploadedById: userId,
    },
  })
}

export async function listUploadedFiles(opts: {
  type?: FileType
  page: number
  limit: number
  userId?: string
}) {
  const where: { type?: FileType; uploadedById?: string } = {}
  if (opts.type) where.type = opts.type
  if (opts.userId) where.uploadedById = opts.userId

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.file.count({ where }),
  ])

  return {
    data: files,
    total,
    page: opts.page,
    limit: opts.limit,
    totalPages: Math.ceil(total / opts.limit),
  }
}
