import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveUploadedFile, listUploadedFiles } from "@/lib/upload"

// GET /api/user/files - List the current user's uploaded files
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 24

    return NextResponse.json(
      await listUploadedFiles({ page, limit, userId: session.user.id })
    )
  } catch (error) {
    console.error("[API] User files list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/files - Upload a file as the current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    console.error("[API] User upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
