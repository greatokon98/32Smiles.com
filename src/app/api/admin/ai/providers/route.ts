import { NextRequest, NextResponse } from "next/server"
import { getAIRegistry } from "@/ai/providers/registry"
import { guardPermission } from "@/lib/require-permission-route"

// GET /api/admin/ai/providers - List provider status
export async function GET(request: NextRequest) {
  const { response } = await guardPermission("ai-settings", "read")
  if (response) return response

  try {
    const registry = await getAIRegistry()
    const status = await registry.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("[API] Providers status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/ai/providers - Update provider config
export async function PUT(request: NextRequest) {
  const { response } = await guardPermission("ai-settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const registry = await getAIRegistry()

    if (body.name) {
      registry.updateConfig(body.name, body)
    }

    const status = await registry.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("[API] Provider update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
