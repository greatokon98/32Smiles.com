"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Star, Tag } from "lucide-react"
import { Prisma } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"
import { AddToCartButton } from "@/features/cart/add-to-cart"

type ProductItem = Prisma.ProductGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
      }
    }
    productCategory: true
  }
}>

type CategoryItem = Prisma.ProductCategoryGetPayload<{}>

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function ProductsGrid({
  products,
  categories,
}: {
  products: ProductItem[]
  categories: CategoryItem[]
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.productCategoryId === activeCategory)

  return (
    <>
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filtered.map((product) => {
            const imageUrl = product.content.featuredImage?.url
            const price = Number(product.price)
            const salePrice = product.salePrice ? Number(product.salePrice) : null

            return (
              <motion.div key={product.id} variants={item}>
                <div className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <Link
                    href={`/products/${product.content.slug}`}
                    className="block"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.content.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="h-12 w-12 text-primary-200 text-primary-700" />
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.isFeatured && (
                          <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                        {product.isOnSale && (
                          <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Sale
                          </span>
                        )}
                        {product.isHot && (
                          <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Hot
                          </span>
                        )}
                      </div>

                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {product.productCategory && (
                        <span className="text-xs text-primary-600 font-medium uppercase tracking-wider">
                          {product.productCategory.name}
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-gray-900 mt-1 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {product.content.title}
                      </h3>

                      {product.content.excerpt && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">
                          {product.content.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {salePrice != null ? (
                            <>
                              <span className="text-lg font-bold text-primary-600">
                                {formatCurrency(salePrice, product.currency)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                {formatCurrency(price, product.currency)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(price, product.currency)}
                            </span>
                          )}
                        </div>

                        {product.brand && (
                          <span className="text-xs text-gray-400">
                            {product.brand}
                          </span>
                        )}
                      </div>

                      {product.rating != null && (
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.round(Number(product.rating))
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-200 text-gray-600"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  {product.inStock && (
                    <div className="px-5 pb-5 mt-auto">
                      <AddToCartButton
                        productId={product.id}
                        title={product.content.title}
                        price={price}
                        imageUrl={imageUrl || undefined}
                        currency={product.currency}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 text-gray-300 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No products found in this category.
          </p>
        </div>
      )}
    </>
  )
}
