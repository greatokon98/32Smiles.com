import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import { ChevronRight, Clock, GraduationCap, ArrowRight, HelpCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

type EducationArticleItem = Prisma.ContentGetPayload<{
  include: {
    educationArticle: {
      include: {
        faqs: true
      }
    }
    author: true
    featuredImage: true
    seoMetadata: true
  }
}>

type RelatedArticleItem = Prisma.ContentGetPayload<{
  include: {
    educationArticle: true
    featuredImage: true
  }
}>

type Props = {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string): Promise<EducationArticleItem | null> {
  return prisma.content.findFirst({
    where: {
      slug,
      type: ContentType.EDUCATION_PROFESSIONAL,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      educationArticle: {
        include: {
          faqs: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      author: true,
      featuredImage: true,
      seoMetadata: true,
    },
  })
}

async function getRelatedArticles(currentContentId: string): Promise<RelatedArticleItem[]> {
  return prisma.content.findMany({
    where: {
      type: ContentType.EDUCATION_PROFESSIONAL,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      id: { not: currentContentId },
    },
    include: {
      educationArticle: true,
      featuredImage: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: "Article Not Found" }

  const seo = article.seoMetadata
  const title = seo?.metaTitle || `${article.title} | ${siteConfig.name} Professional Education`
  const description =
    seo?.metaDescription ||
    article.excerpt ||
    `Read about ${article.title} from ${siteConfig.name}.`

  return {
    title,
    description,
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : [],
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author?.name || siteConfig.name],
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

export default async function ProfessionalArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) notFound()

  const ea = article.educationArticle
  const author = article.author
  const imageUrl = article.featuredImage?.url
  const relatedArticles = await getRelatedArticles(article.id)

  // Increment view count (fire and forget)
  prisma.content.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  })

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        {imageUrl && (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={article.title}
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
            <Link href="/education/professional" className="hover:text-white transition-colors">
              Professional Education
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white line-clamp-1 min-w-0">{article.title}</span>
          </nav>

          <div className="max-w-3xl">
            {ea?.educationType && (
              <span className="inline-block bg-white/10 text-primary-100 text-sm font-medium px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
                {ea.educationType}
              </span>
            )}
            <h1 className="text-3xl lg:text-5xl font-bold mb-6">
              {article.title}
            </h1>

            <div className="flex items-center flex-wrap gap-4 text-sm text-primary-100">
              {author && (
                <span className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {author.name.charAt(0)}
                    </span>
                  </div>
                  {author.name}
                </span>
              )}
              {article.publishedAt && (
                <time dateTime={article.publishedAt.toISOString()}>
                  {formatDate(article.publishedAt)}
                </time>
              )}
              {ea?.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {ea.readingTime} min read
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
              {article.excerpt && (
                <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium border-l-4 border-primary-500 pl-6">
                  {article.excerpt}
                </p>
              )}

              {article.body && (
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
                    [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse
                    [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:p-3 [&_th]:border-b-2 [&_th]:border-gray-200
                    [&_td]:p-3 [&_td]:border-b [&_td]:border-gray-100
                    [&_hr]:my-10 [&_hr]:border-gray-200"
                  dangerouslySetInnerHTML={{ __html: article.body }}
                />
              )}

              {/* FAQs */}
              {ea?.faqs && ea.faqs.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-primary-600" />
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-6">
                    {ea.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-primary-50 rounded-xl p-6 border border-primary-100"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  About This Article
                </h3>
                {author && (
                  <div className="flex items-start gap-3 mb-4">
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

                {ea?.readingTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Clock className="h-4 w-4" />
                    {ea.readingTime} min read
                  </div>
                )}
                {article.publishedAt && (
                  <p className="text-sm text-gray-500 mb-4">
                    Published {formatDate(article.publishedAt)}
                  </p>
                )}

                <div className="space-y-3">
                  <Link
                    href="/contact"
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Contact Us
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/education/professional"
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

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Related Articles
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore more professional education resources.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => {
                const relatedImage = related.featuredImage?.url

                return (
                  <Link
                    key={related.id}
                    href={`/education/professional/${related.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      {relatedImage ? (
                        <Image
                          src={relatedImage}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <GraduationCap className="h-8 w-8 text-primary-200" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                          {related.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {related.publishedAt && (
                          <span>{formatDate(related.publishedAt)}</span>
                        )}
                        {related.educationArticle?.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {related.educationArticle.readingTime} min
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
