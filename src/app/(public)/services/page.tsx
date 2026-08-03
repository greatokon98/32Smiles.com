import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus } from "@prisma/client"
import { serializeContent } from "@/lib/utils"
import { ServicesGrid } from "./services-grid"
import { DentalJourney } from "../dental-journey"
import { siteConfig } from "@/config/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Our Services",
  description: `Explore the full range of dental services at ${siteConfig.name}. From preventive care to cosmetic treatments, we help you achieve a healthy, confident smile.`,
  openGraph: {
    title: `Our Services | ${siteConfig.name}`,
    description: `Explore the full range of dental services at ${siteConfig.name}. From preventive care to cosmetic treatments, we help you achieve a healthy, confident smile.`,
  },
}

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export default async function ServicesPage() {
  const settings = await prisma.setting.findMany()
  const services = await prisma.content.findMany({
    where: {
      type: ContentType.SERVICE,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      service: true,
      featuredImage: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_services', '/images/bg/bg5.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Our Services
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Our Dental Services
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Comprehensive dental care tailored to every member of your family.
              From routine checkups to advanced cosmetic procedures, our experienced
              team delivers exceptional results with a gentle touch.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          {services.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                Services coming soon. Contact us to learn more about what we offer.
              </p>
              <Link
                href="/appointment"
                className="mt-6 inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Book Appointment
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <ServicesGrid services={serializeContent(services) as any} />
          )}
        </div>
      </section>

      <DentalJourney />

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Our dental team will evaluate your oral health and recommend the
            best treatment plan for you. Schedule a consultation today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/appointment"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
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
