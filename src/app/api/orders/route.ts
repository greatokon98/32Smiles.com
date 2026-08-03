import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"
import { sendOrderConfirmation } from "@/lib/email"

function generateOrderNumber(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${y}${m}${d}-${rand}`
}

function generateTempPassword(): string {
  return Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "1!"
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const my = searchParams.get("my")

  if (my === "true") {
    const orders = await prisma.order.findMany({
      where: { customerEmail: session.user.email },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                content: { select: { title: true } },
              },
            },
          },
        },
      },
    })

    const serialized = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
      })),
    }))

    return NextResponse.json(serialized)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerPhone, deliveryAddress, notes, items } = body

    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const session = await auth()
    const sessionEmail = session?.user?.email?.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    })

    if (existingUser && sessionEmail !== customerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in to continue.", code: "EMAIL_EXISTS" },
        { status: 409 }
      )
    }

    const productIds = items.map((i: { productId: string }) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, content: { select: { title: true } } },
    })

    const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]))

    let subtotal = 0
    const orderItems = items.map((item: { productId: string; quantity: number; price?: number }) => {
      const unitPrice = item.price || priceMap.get(item.productId) || 0
      const total = unitPrice * item.quantity
      subtotal += total
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: new Prisma.Decimal(unitPrice),
        total: new Prisma.Decimal(total),
      }
    })

    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        notes: notes || "",
        status: "PENDING",
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        items: { create: orderItems },
      },
      include: { items: true },
    })

    let accountCreated = false
    let tempPassword: string | undefined
    if (!existingUser) {
      tempPassword = generateTempPassword()
      const passwordHash = await bcrypt.hash(tempPassword, 12)
      await prisma.user.create({
        data: {
          email: customerEmail,
          name: customerName,
          passwordHash,
          isActive: true,
          role: "VIEWER",
        },
      })
      accountCreated = true
    }

    try {
      await sendOrderConfirmation({
        customerName,
        customerEmail,
        orderNumber,
        items: order.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)
          return {
            title: product?.content?.title ?? "Product",
            quantity: item.quantity,
            price: Number(item.price),
          }
        }),
        total: Number(order.total),
        deliveryAddress,
        ...(accountCreated ? { tempPassword: tempPassword as string } : {}),
      })
    } catch (emailError) {
      console.error("[API] Failed to send order confirmation email:", emailError)
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      accountCreated,
    })
  } catch (error) {
    console.error("[API] Order creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
