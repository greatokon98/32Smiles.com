"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/features/cart/cart-context"
import { formatCurrency } from "@/lib/utils"

export function CartPageContent() {
  const router = useRouter()
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart()
  const prunedRef = useRef(false)

  useEffect(() => {
    if (prunedRef.current || items.length === 0) return
    prunedRef.current = true
    ;(async () => {
      try {
        const res = await fetch("/api/products/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: items.map((i) => i.productId) }),
        })
        if (!res.ok) return
        const { invalid } = await res.json()
        if (Array.isArray(invalid) && invalid.length > 0) {
          for (const id of invalid) removeItem(id)
          toast.info("Some items in your cart are no longer available and were removed.")
        }
      } catch {
        // ignore — stale items are still caught at checkout
      }
    })()
  }, [items, removeItem])

  if (items.length === 0) {
    return (
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-sm p-12">
            <ShoppingCart className="h-20 w-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Browse our products and add items to your cart</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" /> Browse Products
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Cart Items ({itemCount})</h2>
                <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600">
                  Clear All
                </button>
              </div>
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 py-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm font-bold text-primary-600 mt-1">
                        {formatCurrency(item.price, item.currency)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.price * item.quantity, item.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, items[0]?.currency || "NGN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-primary-600">{formatCurrency(subtotal, items[0]?.currency || "NGN")}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
