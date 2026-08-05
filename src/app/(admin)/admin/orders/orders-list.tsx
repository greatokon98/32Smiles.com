"use client"

import { useState, useEffect } from "react"
import { Eye, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotificationHighlight } from "@/features/notifications/notification-utils"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
  product: { content: { title: string } }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  notes: string | null
  status: string
  subtotal: number
  total: number
  createdAt: string
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export function OrdersList({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { highlightedId, isHighlighted } = useNotificationHighlight(orders.length)

  useEffect(() => {
    if (highlightedId) setExpandedId(highlightedId)
  }, [highlightedId])

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No orders found</div>
      ) : (
        <div className="divide-y">
          {filtered.map((order) => (
            <div
              key={order.id}
              id={`hl-${order.id}`}
              className={cn(
                "transition-colors",
                isHighlighted(order.id) && "bg-primary-50 ring-1 ring-primary-300"
              )}
            >
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.customerName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">&#8358;{Number(order.total).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full shrink-0",
                      STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {order.status}
                  </span>
                  {expandedId === order.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </div>
              </button>

              {expandedId === order.id && (
                <div className="bg-gray-50 px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Customer Details
                      </h4>
                      <p className="text-sm">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerEmail}</p>
                      <p className="text-sm text-gray-600">{order.customerPhone}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Delivery
                      </h4>
                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                      {order.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">Notes: {order.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.product.content.title}</td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">&#8358;{Number(item.price).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">&#8358;{Number(item.total).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-gray-50">
                          <td colSpan={3} className="px-3 py-2 text-right">Total:</td>
                          <td className="px-3 py-2 text-right">&#8358;{Number(order.total).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Update Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => updateStatus(order.id, status)}
                            disabled={updatingId === order.id || order.status === status}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                              order.status === status
                                ? "bg-primary-600 text-white border-primary-600"
                                : "border-gray-300 text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              status
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
