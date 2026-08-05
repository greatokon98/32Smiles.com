import { Metadata } from "next"
import Link from "next/link"
import { GraduationCap, ArrowRight } from "lucide-react"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { serializeContent } from "@/lib/utils"
import { ProfessionalArticlesGrid } from "./articles-grid"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const revalidate = 300

export const metadata: Metadata = {
  title: "Professional Education",
  description: `Clinical resources, research updates, and continuing education for dental professionals from ${siteConfig.name}.`,
  openGraph: {
    title: `Professional Education | ${siteConfig.name}`,
    description: `Clinical resources, research updates, and continuing education for dental professionals from ${siteConfig.name}.`,
  },
}

type EducationArticleItem = Prisma.ContentGetPayload<{
  include: {
    educationArticle: true
    featuredImage: true
    author: true
  }
}>

export default async function ProfessionalEducationPage() {
  const settings = await prisma.setting.findMany()
  const articles = await prisma.content.findMany({
    where: {
      type: ContentType.EDUCATION_PROFESSIONAL,
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
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_education_professional', '/images/bg/bg11.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              Professional Education Hub
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Continuing Education for Dental Professionals
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Stay current with clinical insights, evidence-based practices, and
              the latest developments in dentistry. Curated by the team at{" "}
              {siteConfig.name}.
            </p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-6">
                Professional education articles coming soon. We&apos;re
                preparing clinical resources for dental professionals.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Get in Touch
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <ProfessionalArticlesGrid articles={serializeContent(articles) as any} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Interested in Collaboration?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            We welcome opportunities to collaborate on clinical education,
            research, and professional development initiatives.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/team"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Meet Our Team
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
