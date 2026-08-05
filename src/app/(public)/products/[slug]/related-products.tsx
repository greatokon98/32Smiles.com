"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { Prisma } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"

type RelatedProduct = Prisma.ProductGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
      }
    }
    productCategory: true
  }
}>

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function RelatedProducts({
  currentSlug,
  categoryId,
}: {
  currentSlug: string
  categoryId: string
}) {
  const [products, setProducts] = useState<RelatedProduct[]>([])

  useEffect(() => {
    fetch(
      `/api/products/related?exclude=${currentSlug}&categoryId=${categoryId}&limit=4`,
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
  }, [currentSlug, categoryId])

  if (products.length === 0) return null

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            You May Also Like
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore related products that pair well with your selection.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {products.map((product) => {
            const imageUrl = product.content.featuredImage?.url
            const price = Number(product.price)
            const salePrice = product.salePrice
              ? Number(product.salePrice)
              : null

            return (
              <motion.div key={product.id} variants={item}>
                <Link
                  href={`/products/${product.content.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
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
                        <ShoppingBag className="h-10 w-10 text-primary-200 text-primary-700" />
                      </div>
                    )}

                    {product.isOnSale && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Sale
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    {product.productCategory && (
                      <span className="text-xs text-primary-600 font-medium uppercase tracking-wider">
                        {product.productCategory.name}
                      </span>
                    )}

                    <h3 className="text-base font-bold text-gray-900 mt-1 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {product.content.title}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      {salePrice != null ? (
                        <>
                          <span className="text-lg font-bold text-primary-600">
                            {formatCurrency(salePrice, product.currency)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(price, product.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(price, product.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
