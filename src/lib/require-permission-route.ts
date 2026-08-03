import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/permissions"
import type { Resource, Action } from "@/lib/permissions"

export async function guardPermission(resource: Resource, action: Action) {
  try {
    const { session } = await requirePermission(resource, action)
    return { session }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 401) {
      return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
    }
    if (status === 403) {
      return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
    }
    return { response: NextResponse.json({ error: "Internal server error" }, { status: 500 }) }
  }
}
