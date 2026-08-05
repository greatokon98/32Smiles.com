import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Phone,
} from "lucide-react"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus, Prisma } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { ServiceJsonLd } from "@/features/seo/JsonLd"
import { RelatedServices } from "./related-services"

export const revalidate = 300

export async function generateStaticParams() {
  const services = await prisma.content.findMany({
    where: {
      type: ContentType.SERVICE,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    select: { slug: true },
  })
  return services.map((s) => ({ slug: s.slug }))
}

type ServiceItem = Prisma.ContentGetPayload<{
  include: {
    service: true
    featuredImage: true
    seoMetadata: true
  }
}>

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await getService(slug)
  if (!service) return { title: "Service Not Found" }

  const seo = service.seoMetadata
  const title = seo?.metaTitle || `${service.title} | ${siteConfig.name}`
  const description =
    seo?.metaDescription ||
    service.excerpt ||
    `Learn more about ${service.title} at ${siteConfig.name}. ${siteConfig.mission}`

  return {
    title,
    description,
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : [],
      type: "website",
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

async function getService(slug: string): Promise<ServiceItem | null> {
  return prisma.content.findUnique({
    where: { type_slug: { type: ContentType.SERVICE, slug } },
    include: {
      service: true,
      featuredImage: true,
      seoMetadata: true,
    },
  })
}

function extractJsonArray(
  source: Record<string, unknown>,
  key: string,
): string[] {
  const raw = source[key]
  if (!raw || !Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = await getService(slug)

  if (!service || !service.service) notFound()

  const srv = service.service
  const imageUrl = service.featuredImage?.url

  // JSON fields may exist on the service record if the schema is extended later;
  // safely extract them without breaking if absent.
  const srvRaw = srv as unknown as Record<string, unknown>
  const benefits = extractJsonArray(srvRaw, "benefits")
  const features = extractJsonArray(srvRaw, "features")
  const contraindications = extractJsonArray(srvRaw, "contraindications")
  const preparationSteps = extractJsonArray(srvRaw, "preparationSteps")
  const recoverySteps = extractJsonArray(srvRaw, "recoverySteps")

  // Increment view count (fire and forget, skip during build-time prerender)
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    prisma.content.update({
      where: { id: service.id },
      data: { viewCount: { increment: 1 } },
    })
  }

  const serviceUrl = `${siteConfig.url}/services/${slug}`

  return (
    <>
      <ServiceJsonLd
        name={service.title}
        description={service.excerpt || service.body?.slice(0, 200) || ""}
        url={serviceUrl}
        breadcrumbs={[
          { name: "Home", url: siteConfig.url },
          { name: "Services", url: `${siteConfig.url}/services` },
          { name: service.title, url: serviceUrl },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        {imageUrl && (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={service.title}
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
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white line-clamp-1">{service.title}</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-5xl font-bold mb-6">
              {service.title}
            </h1>
            {service.excerpt && (
              <p className="text-lg lg:text-xl text-primary-100 leading-relaxed mb-8">
                {service.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {srv.duration && (
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4" />
                  Duration: {srv.duration}
                </span>
              )}
              {srv.price != null && (
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <DollarSign className="h-4 w-4" />
                  Starting from {formatCurrency(Number(srv.price))}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/appointment"
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center gap-2"
              >
                Book Appointment
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Call to Inquire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {service.body && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    About This Service
                  </h2>
                  <div
                    className="text-gray-600 leading-relaxed
                      [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4
                      [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-4
                      [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-6 [&_h4]:mb-3
                      [&_p]:mb-4 [&_p]:leading-relaxed
                      [&_ul]:space-y-2 [&_ul]:my-4 [&_ul]:pl-5 [&_ul]:list-disc
                      [&_ol]:space-y-2 [&_ol]:my-4 [&_ol]:pl-5 [&_ol]:list-decimal
                      [&_li]:text-gray-600
                      [&_a]:text-primary-600 [&_a]:underline [&_a]:hover:text-primary-700
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-6
                      [&_strong]:text-gray-800
                      [&_img]:rounded-xl [&_img]:my-6 [&_img]:max-w-full [&_img]:h-auto
                      [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-6 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-6
                      [&_code]:text-sm
                      [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table
                      [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:p-3 [&_th]:border-b-2 [&_th]:border-gray-200
                      [&_td]:p-3 [&_td]:border-b [&_td]:border-gray-100
                      [&_hr]:my-10 [&_hr]:border-gray-200"
                    dangerouslySetInnerHTML={{ __html: service.body }}
                  />
                </div>
              )}

              {benefits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Benefits
                  </h2>
                  <ul className="space-y-3">
                    {benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {features.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    What&apos;s Included
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-primary-50 p-4 rounded-xl"
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preparationSteps.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    How to Prepare
                  </h2>
                  <ol className="space-y-4">
                    {preparationSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-gray-600 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {recoverySteps.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Recovery &amp; Aftercare
                  </h2>
                  <ol className="space-y-4">
                    {recoverySteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold text-sm shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-gray-600 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {contraindications.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Important Considerations
                  </h2>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <ul className="space-y-3">
                      {contraindications.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Service Details
                </h3>
                <div className="space-y-4">
                  {srv.duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">
                        {srv.duration}
                      </span>
                    </div>
                  )}
                  {srv.price != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Starting Price</span>
                      <span className="font-bold text-primary-600 text-lg">
                        {formatCurrency(Number(srv.price))}
                      </span>
                    </div>
                  )}
                  {srv.priceNote && (
                    <p className="text-xs text-gray-500 border-t pt-4">
                      {srv.priceNote}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/appointment"
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Book Appointment
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                    className="w-full border-2 border-primary-600 text-primary-600 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    {siteConfig.contact.phone}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Services */}
      <RelatedServices currentSlug={slug} />
    </>
  )
}
