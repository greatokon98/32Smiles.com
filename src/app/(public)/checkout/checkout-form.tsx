"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/features/cart/cart-context"

export function CheckoutForm({
  initialUser = null,
}: {
  initialUser?: { name: string; email: string; phone: string; address: string } | null
}) {
  const router = useRouter()
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart()
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailExistsError, setEmailExistsError] = useState(false)
  const [form, setForm] = useState({
    name: initialUser?.name || "",
    email: initialUser?.email || "",
    phone: initialUser?.phone || "",
    address: initialUser?.address || "",
    notes: "",
  })

  useEffect(() => {
    setLoaded(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.address) {
      toast.error("Please fill in all required fields")
      return
    }
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
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409 && err.code === "EMAIL_EXISTS") {
          setEmailExistsError(true)
          return
        }
        throw new Error(err.error || "Order failed")
      }
      const data = await res.json()
      if (data.accountCreated) {
        toast.success("Account created! Check your email for login instructions.")
      }
      toast.success("Order placed successfully!")
      router.push(`/order/confirmation/${data.orderNumber}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loaded && items.length === 0) {
    return (
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-sm p-12">
            <ShoppingCart className="h-20 w-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add items to your cart before checking out</p>
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
    <section className="py-16 lg:py-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Items Summary */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items ({itemCount})</h2>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4 py-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-sm font-bold text-primary-600 mt-1">
                          &#8358;{item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 text-xs"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 text-xs"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Details</h2>
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
                      placeholder="John Doe"
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
                      placeholder="john@example.com"
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
                      placeholder="+234 800 000 0000"
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
                      placeholder="Street, city, state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                      placeholder="Any special instructions"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
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

                  {emailExistsError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-800 text-sm font-medium mb-2">
                        This email is already registered. Please log in to continue.
                      </p>
                      <Link
                        href="/admin/login?callbackUrl=/checkout"
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
                      <>Place Order &#8358;{subtotal.toLocaleString()}</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
