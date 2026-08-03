import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/permissions"
import { saveUploadedFile, listUploadedFiles } from "@/lib/upload"
import type { FileType } from "@prisma/client"

// POST /api/admin/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    const { session } = await requirePermission("media", "create")
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const dbFile = await saveUploadedFile(file, session.user.id)
    return NextResponse.json(dbFile, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    if (message === "No file provided" || message === "File too large (max 10MB)" || message === "File type not allowed") {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("[API] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// GET /api/admin/upload - List uploaded files
export async function GET(request: NextRequest) {
  try {
    await requirePermission("media", "read")
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || undefined
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20

    const validFileTypes: FileType[] = ["IMAGE", "DOCUMENT", "VIDEO", "OTHER"]
    const fileType = type && validFileTypes.includes(type as FileType) ? (type as FileType) : undefined

    return NextResponse.json(await listUploadedFiles({ type: fileType, page, limit }))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("[API] File list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
