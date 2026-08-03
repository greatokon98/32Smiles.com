import { Metadata } from "next"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { serializeContent } from "@/lib/utils"
import { BlogList } from "./blog-list"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog",
  description: `Stay informed with the latest dental health tips, clinic news, and expert advice from ${siteConfig.name}.`,
  openGraph: {
    title: `Blog | ${siteConfig.name}`,
    description: `Stay informed with the latest dental health tips, clinic news, and expert advice from ${siteConfig.name}.`,
  },
}

const POSTS_PER_PAGE = 10

type BlogPostItem = Prisma.BlogPostGetPayload<{
  include: {
    content: {
      include: {
        author: true
        featuredImage: true
      }
    }
  }
}>

type Props = {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>
}

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam, q, category } = await searchParams
  const currentPage = Math.max(1, Number(pageParam) || 1)
  const searchQuery = q?.trim() || undefined
  const categorySlug = category?.trim() || undefined

  const where: Prisma.BlogPostWhereInput = {
    content: {
      type: ContentType.BLOG_POST,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { excerpt: { contains: searchQuery, mode: "insensitive" } },
        ],
      }),
      ...(categorySlug && {
        categories: {
          some: {
            category: { slug: categorySlug },
          },
        },
      }),
    },
  }

  const settings = await prisma.setting.findMany()
  const [posts, total, allCategories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        content: {
          include: {
            author: true,
            featuredImage: true,
          },
        },
      },
      orderBy: [
        { content: { featured: "desc" } },
        { content: { publishedAt: "desc" } },
      ],
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.blogPost.count({ where }),
    prisma.category.findMany({
      where: { type: ContentType.BLOG_POST },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / POSTS_PER_PAGE)

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_blog', '/images/bg/bg4.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Blog
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Our Blog
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Expert dental advice, oral health tips, and the latest news from{" "}
              {siteConfig.name}. Empowering you to make informed decisions about
              your smile.
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <BlogList
            posts={serializeContent(posts) as any}
            currentPage={currentPage}
            totalPages={totalPages}
            totalPosts={total}
            searchQuery={searchQuery}
            categories={allCategories}
            activeCategory={categorySlug}
          />
        </div>
      </section>
    </>
  )
}
