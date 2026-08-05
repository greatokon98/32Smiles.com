"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react"
import { useCart } from "./cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

export function CartIcon() {
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-bold text-gray-900">Cart ({itemCount})</h2>
                  <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <ShoppingCart className="h-16 w-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 mb-1">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Add some products to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {items.map((item) => (
                        <div key={item.productId} className="flex gap-4 bg-gray-50 rounded-xl p-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-sm font-bold text-primary-600 mt-1">
                              {formatCurrency(item.price, item.currency)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="ml-auto p-1.5 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t p-4 space-y-4">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-bold text-gray-900">{formatCurrency(subtotal, items[0]?.currency || "NGN")}</span>
                      </div>
                      <Link
                        href="/cart"
                        onClick={() => setOpen(false)}
                        className="block w-full bg-primary-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                      >
                        View Cart & Checkout
                      </Link>
                      <button
                        onClick={clearCart}
                        className="w-full text-sm text-gray-400 hover:text-red-500 text-center"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
