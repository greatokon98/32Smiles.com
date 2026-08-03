"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react"

interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  product: {
    content: {
      title: string
    }
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  total: number
  createdAt: string
  items: OrderItem[]
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders?my=true")
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Browse our products and place your first order.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id
          const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    ${Number(order.total).toFixed(2)}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                      statusStyles[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && order.items && order.items.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium">Qty</th>
                        <th className="pb-2 font-medium text-right">Price</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5">
                            {item.product?.content?.title || "Product"}
                          </td>
                          <td className="py-1.5">{item.quantity}</td>
                          <td className="py-1.5 text-right">
                            ${Number(item.price).toFixed(2)}
                          </td>
                          <td className="py-1.5 text-right font-medium">
                            ${Number(item.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="pt-2 text-right text-gray-500">
                          Subtotal
                        </td>
                        <td className="pt-2 text-right font-medium">
                          ${Number(order.subtotal).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="pt-1 text-right text-gray-900 font-semibold">
                          Total
                        </td>
                        <td className="pt-1 text-right font-bold text-gray-900">
                          ${Number(order.total).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
