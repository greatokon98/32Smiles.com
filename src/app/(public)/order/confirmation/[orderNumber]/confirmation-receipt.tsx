"use client"

import Link from "next/link"
import { CheckCircle, Home, ShoppingBag } from "lucide-react"

type OrderItem = {
  id: string
  quantity: number
  price: string | number
  total: string | number
  product: {
    id: string
    content: { title: string }
  }
}

type Order = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  notes: string | null
  status: string
  subtotal: string | number
  total: string | number
  createdAt: string | Date
  items: OrderItem[]
}

export function ConfirmationReceipt({ order }: { order: Order }) {
  const total = Number(order.total)

  const statusLabel: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Banner */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-500 mb-6">
              We&apos;ve sent a confirmation to <strong>{order.customerEmail}</strong>
            </p>
            <div className="inline-block bg-primary-50 border border-primary-200 rounded-xl px-6 py-3 mb-6">
              <p className="text-sm text-primary-600 font-medium mb-1">Order Number</p>
              <p className="text-2xl font-bold text-primary-700">{order.orderNumber}</p>
            </div>
            <p className="text-xs text-gray-400">Status: <span className="font-medium text-gray-600">{statusLabel[order.status] || order.status}</span></p>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Items Ordered</h2>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.content.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} &times; &#8358;{Number(item.price).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">&#8358;{Number(item.total).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3 mt-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">&#8358;{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-base border-t pt-2">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-primary-600">&#8358;{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.deliveryAddress}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1">
              <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{order.customerName}</span></p>
              <p><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{order.customerPhone}</span></p>
              <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{order.customerEmail}</span></p>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
