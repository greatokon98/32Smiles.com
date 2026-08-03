"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { useCart } from "@/features/cart/cart-context"

export function CartPageContent({
  initialUser = null,
}: {
  initialUser?: { name: string; email: string; phone: string; address: string } | null
}) {
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [form, setForm] = useState({
    name: initialUser?.name || "",
    email: initialUser?.email || "",
    phone: initialUser?.phone || "",
    address: initialUser?.address || "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [emailExistsError, setEmailExistsError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.address) return
    setSubmitting(true)
    setEmailExistsError(false)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          deliveryAddress: form.address,
          notes: form.notes,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        }),
      })
      if (res.status === 409) {
        const err = await res.json()
        if (err.code === "EMAIL_EXISTS") {
          setEmailExistsError(true)
          return
        }
      }
      if (!res.ok) throw new Error("Order failed")
      const data = await res.json()
      setOrderNumber(data.orderNumber)
      setOrderSuccess(true)
      clearCart()
    } catch {
      alert("Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
            <p className="text-gray-500 mb-2">Your order number is:</p>
            <p className="text-xl font-bold text-primary-600 mb-6">{orderNumber}</p>
            <p className="text-sm text-gray-500 mb-8">
              We&apos;ll contact you at <strong>{form.email}</strong> or <strong>{form.phone}</strong> to confirm your order.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        {items.length === 0 ? (
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
        ) : (
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
                          &#8358;{item.price.toLocaleString()}
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
                          &#8358;{(item.price * item.quantity).toLocaleString()}
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
                    <span className="font-medium">&#8358;{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-primary-600">&#8358;{subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!checkingOut ? (
                <button
                  onClick={() => setCheckingOut(true)}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Delivery Details</h3>
                  {initialUser && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 mb-4 text-sm flex items-center justify-between gap-3 flex-wrap">
                      <span>
                        Ordering as <strong>{initialUser.name}</strong> ({initialUser.email})
                      </span>
                      <a href="/dashboard/profile" className="font-semibold underline whitespace-nowrap">
                        Update profile
                      </a>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        disabled={!!initialUser}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none ${initialUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        disabled={!!initialUser}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none ${initialUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        disabled={!!initialUser}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none ${initialUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                      <textarea
                        required
                        rows={2}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                      />
                    </div>
                    {emailExistsError && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-800 text-sm font-medium mb-2">
                          This email is already registered. Please log in to continue.
                        </p>
                        <Link
                          href="/admin/login"
                          className="inline-flex items-center gap-1 text-amber-700 text-sm font-semibold hover:text-amber-800"
                        >
                          Go to Login <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order...</>
                      ) : (
                        <>Place Order</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckingOut(false)}
                      className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
                    >
                      Back to Cart
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
