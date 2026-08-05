import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import { ChevronRight, Clock, User, Share2, ArrowRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { formatDate } from "@/lib/utils"
import { BlogPostJsonLd } from "@/features/seo/JsonLd"
import { SocialShareButtons } from "./social-share-buttons"

export const revalidate = 300

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: {
      content: {
        type: ContentType.BLOG_POST,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    select: { content: { select: { slug: true } } },
  })
  return posts.map((p) => ({ slug: p.content.slug }))
}

type BlogPostItem = Prisma.BlogPostGetPayload<{
  include: {
    content: {
      include: {
        author: true
        featuredImage: true
        seoMetadata: true
      }
    }
  }
}>

type RelatedPostItem = Prisma.BlogPostGetPayload<{
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
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPostItem | null> {
  return prisma.blogPost.findFirst({
    where: {
      content: {
        slug,
        type: ContentType.BLOG_POST,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    include: {
      content: {
        include: {
          author: true,
          featuredImage: true,
          seoMetadata: true,
        },
      },
    },
  })
}

async function getRelatedPosts(currentContentId: string): Promise<RelatedPostItem[]> {
  return prisma.blogPost.findMany({
    where: {
      content: {
        type: ContentType.BLOG_POST,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        id: { not: currentContentId },
      },
    },
    include: {
      content: {
        include: {
          author: true,
          featuredImage: true,
        },
      },
    },
    orderBy: { content: { publishedAt: "desc" } },
    take: 3,
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post Not Found" }

  const content = post.content
  const seo = content.seoMetadata
  const title = seo?.metaTitle || `${content.title} | ${siteConfig.name} Blog`
  const description =
    seo?.metaDescription ||
    content.excerpt ||
    `Read ${content.title} on the ${siteConfig.name} blog.`

  return {
    title,
    description,
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : [],
      type: "article",
      publishedTime: content.publishedAt?.toISOString(),
      authors: [content.author?.name || siteConfig.name],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || title,
      description: seo?.twitterDescription || description,
      images: seo?.twitterImage ? [seo.twitterImage] : [],
    },
    ...(seo?.canonicalUrl && { alternates: { canonical: seo.canonicalUrl } }),
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const content = post.content
  const author = content.author
  const imageUrl = content.featuredImage?.url
  const postUrl = `${siteConfig.url}/blog/${content.slug}`
  const relatedPosts = await getRelatedPosts(content.id)

  // Increment view count (fire and forget, skip during build-time prerender)
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    prisma.content.update({
      where: { id: content.id },
      data: { viewCount: { increment: 1 } },
    })
  }

  return (
    <>
      <BlogPostJsonLd
        title={content.title}
        description={content.excerpt || content.body?.slice(0, 200) || ""}
        image={imageUrl || undefined}
        datePublished={content.publishedAt?.toISOString() || content.createdAt.toISOString()}
        dateModified={content.updatedAt.toISOString()}
        author={author?.name}
        slug={content.slug}
        breadcrumbs={[
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: `${siteConfig.url}/blog` },
          { name: content.title, url: postUrl },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        {imageUrl && (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={content.title}
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
        )}
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <nav className="flex items-center gap-1 text-sm text-primary-200 mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white line-clamp-1">{content.title}</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-5xl font-bold mb-6">
              {content.title}
            </h1>

            <div className="flex items-center flex-wrap gap-4 text-sm text-primary-100">
              {author && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {author.name}
                </span>
              )}
              {content.publishedAt && (
                <time dateTime={content.publishedAt.toISOString()}>
                  {formatDate(content.publishedAt)}
                </time>
              )}
              {post.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readingTime} min read
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <article className="lg:col-span-2">
              {content.excerpt && (
                <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium border-l-4 border-primary-600 pl-6">
                  {content.excerpt}
                </p>
              )}

              {content.body && (
                <div
                  className="text-gray-700 leading-relaxed
                    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-10 [&_h1]:mb-6
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4
                    [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-4
                    [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-6 [&_h4]:mb-3
                    [&_p]:mb-5 [&_p]:leading-relaxed
                    [&_ul]:space-y-2 [&_ul]:my-5 [&_ul]:pl-6 [&_ul]:list-disc
                    [&_ol]:space-y-2 [&_ol]:my-5 [&_ol]:pl-6 [&_ol]:list-decimal
                    [&_li]:text-gray-700
                    [&_a]:text-primary-600 [&_a]:underline [&_a]:hover:text-primary-700
                    [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-6
                    [&_strong]:text-gray-900 [&_strong]:font-semibold
                    [&_img]:rounded-xl [&_img]:my-8 [&_img]:w-full
                    [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-6 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-6
                    [&_code]:text-sm
                    [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse
                    [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:p-3 [&_th]:border-b-2 [&_th]:border-gray-200
                    [&_td]:p-3 [&_td]:border-b [&_td]:border-gray-100
                    [&_hr]:my-10 [&_hr]:border-gray-200"
                  dangerouslySetInnerHTML={{ __html: content.body }}
                />
              )}

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">
                    Share this article
                  </span>
                </div>
                <SocialShareButtons
                  url={postUrl}
                  title={content.title}
                />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  About the Author
                </h3>
                {author && (
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-primary-700 font-bold text-lg">
                        {author.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {author.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {siteConfig.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <Link
                    href="/appointment"
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Book Appointment
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/blog"
                    className="w-full border-2 border-primary-600 text-primary-600 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    More Articles
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Related Articles
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Continue reading with more articles you may find interesting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((related) => {
                const relatedContent = related.content
                const relatedImage = relatedContent.featuredImage?.url

                return (
                  <Link
                    key={related.id}
                    href={`/blog/${relatedContent.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      {relatedImage ? (
                        <Image
                          src={relatedImage}
                          alt={relatedContent.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-4xl font-bold text-primary-200">
                            {relatedContent.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {relatedContent.title}
                      </h3>
                      {relatedContent.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                          {relatedContent.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {relatedContent.publishedAt && (
                          <span>{formatDate(relatedContent.publishedAt)}</span>
                        )}
                        {related.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {related.readingTime} min
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
