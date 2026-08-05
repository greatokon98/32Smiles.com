"use client"

import { useState } from "react"
import { ShoppingCart, Check } from "lucide-react"
import { useCart } from "./cart-context"

interface AddToCartButtonProps {
  productId: string
  title: string
  price: number
  imageUrl?: string
  currency?: string
}

export function AddToCartButton({ productId, title, price, imageUrl, currency = "NGN" }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleClick() {
    addItem({ productId, title, price, quantity: 1, imageUrl: imageUrl || "", currency })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        added
          ? "bg-green-500 text-white"
          : "bg-primary-600 text-white hover:bg-primary-700"
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </>
      )}
    </button>
  )
}
