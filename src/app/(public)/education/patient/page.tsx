import { Metadata } from "next"
import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { serializeContent } from "@/lib/utils"
import { PatientArticlesGrid } from "./articles-grid"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const revalidate = 300

export const metadata: Metadata = {
  title: "Patient Education",
  description: `Learn about dental health, oral hygiene, and treatment options with our patient education resources from ${siteConfig.name}.`,
  openGraph: {
    title: `Patient Education | ${siteConfig.name}`,
    description: `Learn about dental health, oral hygiene, and treatment options with our patient education resources from ${siteConfig.name}.`,
  },
}

type EducationArticleItem = Prisma.ContentGetPayload<{
  include: {
    educationArticle: true
    featuredImage: true
    author: true
  }
}>

export default async function PatientEducationPage() {
  const settings = await prisma.setting.findMany()
  const articles = await prisma.content.findMany({
    where: {
      type: ContentType.EDUCATION_PATIENT,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      educationArticle: true,
      featuredImage: true,
      author: true,
    },
    orderBy: [
      { educationArticle: { isFeatured: "desc" } },
      { educationArticle: { sortOrder: "asc" } },
      { publishedAt: "desc" },
    ],
  })

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_education_patient', '/images/bg/bg10.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              Patient Education Hub
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Your Guide to Better Dental Health
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Empowering you with knowledge about oral health, dental procedures,
              and preventive care. Understanding your treatment leads to better
              outcomes and a healthier smile.
            </p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-6">
                Patient education articles coming soon. We&apos;re preparing
                comprehensive resources for you.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Explore Our Services
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <PatientArticlesGrid articles={serializeContent(articles) as any} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Have Questions About Your Dental Health?
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Our team is ready to help you understand your treatment options and
            answer any questions you may have.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/appointment"
              className="bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
            >
              Book Consultation
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
