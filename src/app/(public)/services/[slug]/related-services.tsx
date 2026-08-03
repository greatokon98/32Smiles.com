"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Clock, DollarSign } from "lucide-react"
import { Prisma } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"

type RelatedService = Prisma.ContentGetPayload<{
  include: {
    service: true
    featuredImage: true
  }
}>

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function RelatedServices({ currentSlug }: { currentSlug: string }) {
  const [services, setServices] = useState<RelatedService[]>([])

  useEffect(() => {
    fetch(`/api/services/related?exclude=${currentSlug}&limit=3`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setServices(data))
      .catch(() => setServices([]))
  }, [currentSlug])

  if (services.length === 0) return null

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Related Services
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore other services that may interest you.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {services.map((service) => {
            const srv = service.service
            const imageUrl = service.featuredImage?.url

            return (
              <motion.div key={service.id} variants={item}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                >
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-4xl font-bold text-primary-200 text-primary-700">
                          {service.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {service.title}
                    </h3>
                    {service.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {service.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      {srv?.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {srv.duration}
                        </span>
                      )}
                      {srv?.price != null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(Number(srv.price))}
                        </span>
                      )}
                    </div>
                    <span className="text-primary-600 text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
