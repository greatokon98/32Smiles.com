import type { Metadata } from "next"
import { CalendarDays, Shield, Clock, Phone } from "lucide-react"
import BookingForm from "./booking-form"
import { siteConfig } from "@/config/site"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Book an Appointment | 32Smiles Dental Clinic",
  description: `Schedule your dental appointment at ${siteConfig.name}. Book a checkup, teeth whitening, root canal, dental implants, or any of our professional dental services online.`,
  openGraph: {
    title: `Book an Appointment | ${siteConfig.name}`,
    description: `Schedule your dental appointment at ${siteConfig.name}. Choose your preferred date, time, and service.`,
    url: `${siteConfig.url}/appointment`,
  },
}

const FEATURES = [
  {
    icon: Shield,
    title: "Instant Confirmation",
    description: "Receive a confirmation within 24 hours of booking.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Choose from available 30-minute slots, Monday to Friday.",
  },
  {
    icon: CalendarDays,
    title: "Book Up to 3 Months",
    description: "Plan ahead and secure your preferred appointment date.",
  },
]

export default async function AppointmentPage() {
  const settings = await prisma.setting.findMany()
  const session = await auth()

  let initialUser: { name: string; email: string; phone: string } | null = null
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true, phone: true },
    })
    if (user?.name && user?.email) {
      initialUser = {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_appointment', '/images/bg/bg12.jpg')})` }} />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Appointments
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book an Appointment</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Take the first step towards a healthier smile. Choose your preferred
            service, date, and time below.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <BookingForm initialUser={initialUser} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Cards */}
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h2>
              <p className="text-sm text-gray-500 mb-4">
                Prefer to book by phone? Contact us directly and we&apos;ll schedule your visit.
              </p>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
              >
                <Phone className="h-4 w-4" />
                {siteConfig.contact.phone}
              </a>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Clinic Hours</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium text-gray-900">{siteConfig.business.hours.monday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium text-red-500">{siteConfig.business.hours.saturday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-gray-900">{siteConfig.business.hours.sunday}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
