"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ShoppingBag,
  Star,
  CheckCircle2,
  XCircle,
  Info,
  Tag,
  Package,
} from "lucide-react"
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

function extractJsonArray(
  source: Record<string, unknown>,
  key: string,
): string[] {
  const raw = source[key]
  if (!raw || !Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

function extractJsonObject(
  source: Record<string, unknown>,
  key: string,
): Record<string, string> {
  const raw = source[key]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw).filter(
      ([, v]) => typeof v === "string",
    ),
  )
}

export function ProductDetail({ product }: { product: ProductItem }) {
  const [activeTab, setActiveTab] = useState<"details" | "specs" | "usage">(
    "details",
  )

  const imageUrl = product.content.featuredImage?.url
  const price = Number(product.price)
  const salePrice = product.salePrice ? Number(product.salePrice) : null

  const raw = product as unknown as Record<string, unknown>
  const features = extractJsonArray(raw, "features")
  const specifications = extractJsonObject(raw, "specifications")
  const ingredients = typeof raw.ingredients === "string" ? raw.ingredients : null
  const usageInstructions =
    typeof raw.usageInstructions === "string" ? raw.usageInstructions : null

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.content.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ShoppingBag className="h-24 w-24 text-primary-200" />
                </div>
              )}

              {product.isOnSale && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                  Sale
                </span>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {product.productCategory && (
              <span className="text-sm text-primary-600 font-semibold uppercase tracking-wider mb-2">
                {product.productCategory.name}
              </span>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {product.content.title}
            </h1>

            {product.content.excerpt && (
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {product.content.excerpt}
              </p>
            )}

            {/* Rating */}
            {product.rating != null && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(Number(product.rating))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {Number(product.rating).toFixed(1)} ({product.reviewCount}{" "}
                  reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {salePrice != null ? (
                <>
                  <span className="text-3xl font-bold text-primary-600">
                    {formatCurrency(salePrice, product.currency)}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(price, product.currency)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary-600">
                  {formatCurrency(price, product.currency)}
                </span>
              )}
              <span className="text-sm text-gray-400 ml-1">
                {product.currency}
              </span>
            </div>

            {/* Add to Cart */}
            {product.inStock && (
              <div className="mb-6">
                <AddToCartButton
                  productId={product.id}
                  title={product.content.title}
                  price={price}
                  imageUrl={imageUrl || undefined}
                  currency={product.currency}
                />
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-3 mb-6">
              {product.brand && (
                <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                  <Tag className="h-3.5 w-3.5" />
                  {product.brand}
                </span>
              )}
              {product.sku && (
                <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                  <Package className="h-3.5 w-3.5" />
                  SKU: {product.sku}
                </span>
              )}
              <span
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full ${
                  product.inStock
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {product.inStock ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    In Stock
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Out of Stock
                  </>
                )}
              </span>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 mt-2">
              <div className="flex gap-1 mt-6 mb-6 border-b border-gray-200">
                {(
                  [
                    { key: "details", label: "Details" },
                    { key: "specs", label: "Specifications" },
                    { key: "usage", label: "Usage" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab.key
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "details" && (
                <div className="space-y-4">
                  {product.content.body && (
                    <div
                      className="text-gray-600 leading-relaxed text-sm
                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3
                        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-3
                        [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-5 [&_h4]:mb-2
                        [&_p]:mb-3 [&_p]:leading-relaxed
                        [&_ul]:space-y-2 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc
                        [&_ol]:space-y-2 [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal
                        [&_li]:text-gray-600
                        [&_a]:text-primary-600 [&_a]:underline
                        [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-5
                        [&_strong]:text-gray-800
                        [&_img]:rounded-xl [&_img]:my-5 [&_img]:max-w-full [&_img]:h-auto
                        [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-5 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-5
                        [&_code]:text-xs
                        [&_table]:w-full [&_table]:my-5 [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table
                        [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:p-3 [&_th]:border-b-2 [&_th]:border-gray-200
                        [&_td]:p-3 [&_td]:border-b [&_td]:border-gray-100
                        [&_hr]:my-8 [&_hr]:border-gray-200"
                      dangerouslySetInnerHTML={{ __html: product.content.body }}
                    />
                  )}

                  {features.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Features
                      </h3>
                      <ul className="space-y-2">
                        {features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-gray-600 text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ingredients && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Ingredients
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {ingredients}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "specs" && (
                <div>
                  {Object.keys(specifications).length > 0 ? (
                    <dl className="space-y-3">
                      {Object.entries(specifications).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <dt className="text-sm font-medium text-gray-500">
                            {key}
                          </dt>
                          <dd className="text-sm text-gray-900 font-medium">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Info className="h-4 w-4" />
                      No specifications available.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "usage" && (
                <div className="space-y-4">
                  {usageInstructions ? (
                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {usageInstructions}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Info className="h-4 w-4" />
                      No usage instructions available. Consult our team for
                      guidance.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
