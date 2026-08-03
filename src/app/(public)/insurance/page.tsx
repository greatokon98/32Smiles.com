import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, CreditCard, Building, Shield } from "lucide-react"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Insurance & Payment Options",
  description: `Learn about the insurance plans we accept and payment options available at ${siteConfig.name}.`,
  openGraph: {
    title: `Insurance & Payment Options | ${siteConfig.name}`,
    description: `Learn about the insurance plans we accept and payment options available at ${siteConfig.name}.`,
  },
}

export default async function InsurancePage() {
  const settings = await prisma.setting.findMany()
  const setting = await prisma.setting.findUnique({
    where: { key: "insurance_companies" },
  })

  const companies = setting?.value
    ? setting.value.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const paymentOptions = [
    { icon: CreditCard, title: "Credit & Debit Cards", desc: "Visa, Mastercard, and other major cards accepted." },
    { icon: Building, title: "Bank Transfer", desc: "Direct bank transfers for your convenience." },
    { icon: Shield, title: "Payment Plans", desc: "Flexible payment plans to fit your budget." },
  ]

  return (
    <>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_insurance', '/images/bg/bg3.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Insurance & Payments
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Insurance & Payment Options
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Quality dental care should be accessible and affordable. We work with
              most major insurance providers and offer flexible payment solutions.
            </p>
          </div>
        </div>
      </section>

      {companies.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Accepted Insurance Plans
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We accept a wide variety of insurance plans. Contact our office to verify your specific coverage.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {companies.map((company, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Payment Options
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer multiple payment methods to make your dental care convenient.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {paymentOptions.map((option, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <option.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 text-sm">{option.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Have Questions About Coverage?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Our team is happy to help you understand your benefits and maximize your coverage.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/appointment"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center gap-2"
            >
              Book Appointment <ArrowRight className="h-5 w-5" />
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
