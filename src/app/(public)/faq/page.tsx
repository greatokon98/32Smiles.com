import type { Metadata } from "next"
import prisma from "@/lib/prisma"
import { serializeContent } from "@/lib/utils"
import { FAQJsonLd } from "@/features/seo/JsonLd"
import FAQList from "./faq-list"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | 32Smiles Dental",
  description: "Find answers to common questions about dental treatments, procedures, pricing, and more at 32Smiles Dental Clinic in Victoria Island, Lagos.",
}

export default async function FAQPage() {
  const settings = await prisma.setting.findMany()
  const faqs = await prisma.fAQ.findMany({
    where: {
      content: { status: "PUBLISHED", deletedAt: null },
    },
    include: { content: true },
    orderBy: { sortOrder: "asc" },
  })

  // Group by category
  const grouped = faqs.reduce((acc, faq) => {
    const cat = faq.category || "General"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(faq)
    return acc
  }, {} as Record<string, typeof faqs>)

  const faqData = faqs.map((f) => ({
    question: f.question,
    answer: f.answer,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <FAQJsonLd faqs={faqData} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_faq', '/images/bg/bg7.jpg')})` }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            FAQ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-primary-100 text-lg">
            Find answers to common questions about our dental services
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <FAQList groupedFaqs={serializeContent(grouped) as any} />

        {/* CTA */}
        <div className="mt-16 text-center bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t find what you&apos;re looking for? Our team is happy to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
