import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { notifyOrderStatusChange } from "@/lib/notifications"
import { guardPermission } from "@/lib/require-permission-route"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("orders", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      select: { id: true, orderNumber: true, customerEmail: true, customerName: true },
    })

    notifyOrderStatusChange(order, status).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Order update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
