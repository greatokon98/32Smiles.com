import { Metadata } from "next"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus } from "@prisma/client"
import { serializeContent } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { ProductsGrid } from "./products-grid"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Our Products",
  description: `Browse our selection of premium dental care products at ${siteConfig.name}. From oral hygiene essentials to professional-grade treatments, find everything for your smile.`,
  openGraph: {
    title: `Our Products | ${siteConfig.name}`,
    description: `Browse our selection of premium dental care products at ${siteConfig.name}. From oral hygiene essentials to professional-grade treatments, find everything for your smile.`,
  },
}

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export default async function ProductsPage() {
  const settings = await prisma.setting.findMany()
  const productImages: Record<string, string> = (() => {
    const defaultItems = JSON.stringify({
      "professional-toothpaste": "/images/services/1.jpg",
      "electric-toothbrush": "/images/services/2.jpg",
      "dental-floss": "/images/services/3.jpg",
      "mouthwash": "/images/services/b1.jpg",
      "teeth-whitening-kit": "/images/services/single-service.jpg",
      "oral-irrigator": "/images/services/1.jpg",
    })
    try { return JSON.parse(getSetting(settings, "product_fallback_images", defaultItems)) } catch { return JSON.parse(defaultItems) }
  })()
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        content: {
          type: ContentType.PRODUCT,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      include: {
        content: {
          include: {
            featuredImage: true,
          },
        },
        productCategory: true,
      },
      orderBy: [
        { isFeatured: "desc" },
        { sortOrder: "asc" },
        { content: { createdAt: "desc" } },
      ],
    }),
    prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  // Attach fallback image URLs to products missing featuredImage
  const enrichedProducts = products.map((p) => ({
    ...p,
    content: {
      ...p.content,
      featuredImage: p.content.featuredImage || {
        url: productImages[p.content.slug] || "/images/services/1.jpg",
      },
    },
  }))

  const fallbackProducts = categories.length > 0 ? [] : Array.from({ length: 6 }, (_, i) => ({
    id: `fallback-${i}`,
    contentId: `fallback-content-${i}`,
      content: {
        id: `fallback-content-${i}`,
        slug: Object.keys(productImages)[i],
        title: ["Professional Toothpaste", "Electric Toothbrush", "Dental Floss", "Mouthwash", "Teeth Whitening Kit", "Oral Irrigator"][i],
        excerpt: ["Advanced fluoride formula for cavity protection",
          "Sonic cleaning with smart timer and pressure sensor",
          "Ultra-thin PTFE floss for gentle cleaning",
          "Alcohol-free antibacterial mouthwash for fresh breath",
          "Professional-grade whitening system for at-home use",
          "Water flosser with multiple pressure settings"][i],
        body: null,
        featured: false,
        authorId: "",
        publishedAt: null,
        scheduledAt: null,
        viewCount: 0,
        featuredImage: { url: Object.values(productImages)[i] },
        featuredImageId: null,
        seoMetadata: null,
        type: ContentType.PRODUCT,
        status: ContentStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    price: 0,
    currency: "NGN",
    salePrice: null,
    sku: null,
    brand: i % 2 === 0 ? "32Smiles" : "DentaCare",
    rating: 4.5,
    reviewCount: (i * 8) + 5,
    inStock: true,
    isHot: i % 3 === 0,
    isOnSale: i % 2 === 0,
    isFeatured: i < 2,
    productUrl: null,
    sortOrder: i,
    productCategoryId: "fallback-cat",
    productCategory: { id: "fallback-cat", name: "Oral Care", slug: "oral-care", description: null, imageFileId: null, imageFile: null, sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  }))

  const displayProducts = enrichedProducts.length > 0 ? enrichedProducts : fallbackProducts

  return (
    <>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_products', '/images/bg/bg6.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Products
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Our Products
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Discover premium dental care products curated by our experts at{" "}
              {siteConfig.name}. Everything you need to maintain a healthy,
              confident smile.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          {displayProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                Products coming soon. Contact us to learn more about what we
                offer.
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ProductsGrid products={serializeContent(displayProducts) as any} categories={categories} />
          )}
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need a Product Recommendation?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Our dental professionals can help you choose the right products for
            your specific oral care needs.
          </p>
          <a
            href="/contact"
            className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-block"
          >
            Contact Us
          </a>
        </div>
      </section>
    </>
  )
}
