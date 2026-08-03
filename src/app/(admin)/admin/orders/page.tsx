import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { OrdersList } from "./orders-list"

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: { product: { include: { content: { select: { title: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const serializedOrders = JSON.parse(JSON.stringify(orders))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer orders</p>
        </div>
      </div>
      <OrdersList orders={serializedOrders} />
    </div>
  )
}
