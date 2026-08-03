import type { Metadata } from "next"
import prisma from "@/lib/prisma"
import ContactForm from "./contact-form"
import { siteConfig } from "@/config/site"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Contact Us | 32Smiles Dental",
  description: "Get in touch with 32Smiles Dental Clinic. Book an appointment or ask us a question. Located in Victoria Island, Lagos, Nigeria.",
}

export default async function ContactPage() {
  const settings = await prisma.setting.findMany()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_contact', '/images/bg/bg8.jpg')})` }} />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Contact Us
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Have a question or ready to schedule your appointment? We&apos;re here to help.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600 text-sm">{siteConfig.contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <a href={`tel:${siteConfig.contact.phone}`} className="text-primary-600 text-sm hover:underline">
                      {siteConfig.contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a href={`mailto:${siteConfig.contact.email}`} className="text-primary-600 text-sm hover:underline">
                      {siteConfig.contact.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Working Hours
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">{siteConfig.business.hours.monday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">{siteConfig.business.hours.saturday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium">{siteConfig.business.hours.sunday}</span>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7427!2d3.4369!3d6.4343!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjYnMDMuNCJOIDPCsDI2JzEyLjgiRQ!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="32Smiles Dental Clinic Location"
                className="w-full h-64"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
