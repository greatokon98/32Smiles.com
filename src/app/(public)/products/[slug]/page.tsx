import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronRight,
  Phone,
  ShoppingBag,
  Package,
  Tag,
} from "lucide-react"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus } from "@prisma/client"
import { formatCurrency, serializeContent } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { ProductDetail } from "./product-detail"
import { RelatedProducts } from "./related-products"
import { getProductFallbackImages } from "@/lib/product-images"

export const revalidate = 300

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: {
      content: {
        type: ContentType.PRODUCT,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    select: { content: { select: { slug: true } } },
  })
  return products.map((p) => ({ slug: p.content.slug }))
}

type Props = {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: {
      content: {
        slug,
        type: ContentType.PRODUCT,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    include: {
      content: {
        include: {
          featuredImage: true,
          seoMetadata: true,
        },
      },
      productCategory: true,
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Product Not Found" }

  const productImages = await getProductFallbackImages()
  const imageUrl = product.content.featuredImage?.url || productImages[slug]

  const seo = product.content.seoMetadata
  const title =
    seo?.metaTitle ||
    `${product.content.title} | ${siteConfig.name}`
  const description =
    seo?.metaDescription ||
    product.content.excerpt ||
    `Shop ${product.content.title} at ${siteConfig.name}. ${siteConfig.mission}`

  return {
    title,
    description,
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: seo?.ogImage
        ? [{ url: seo.ogImage }]
        : imageUrl
          ? [{ url: imageUrl }]
          : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || title,
      description: seo?.twitterDescription || description,
      images: seo?.twitterImage
        ? [seo.twitterImage]
        : imageUrl
          ? [imageUrl]
          : [],
    },
    ...(seo?.canonicalUrl && {
      alternates: { canonical: seo.canonicalUrl },
    }),
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const productImages = await getProductFallbackImages()

  const enrichedProduct = {
    ...product,
    content: {
      ...product.content,
      featuredImage: product.content.featuredImage || {
        url: productImages[slug],
      },
    },
  }

  // Increment view count (fire and forget, skip during build-time prerender)
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    prisma.content.update({
      where: { id: product.contentId },
      data: { viewCount: { increment: 1 } },
    })
  }

  return (
    <>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center gap-1 text-sm text-primary-200">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/products"
              className="hover:text-white transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{product.content.title}</span>
          </nav>
        </div>
      </section>

      <ProductDetail product={serializeContent(enrichedProduct) as any} />

      <RelatedProducts
        currentSlug={slug}
        categoryId={product.productCategoryId}
      />

      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Have Questions About This Product?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Our dental team is happy to help you determine if this product is
            right for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              <Phone className="h-5 w-5" />
              {siteConfig.contact.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
