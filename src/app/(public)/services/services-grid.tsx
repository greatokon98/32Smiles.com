"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Clock, DollarSign } from "lucide-react"
import { Prisma, ContentType } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"

type ServiceItem = Prisma.ContentGetPayload<{
  include: {
    service: true
    featuredImage: true
  }
}>

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function ServicesGrid({ services }: { services: ServiceItem[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
    >
      {services.map((service) => {
        const srv = service.service
        const imageUrl = service.featuredImage?.url

        return (
          <motion.div key={service.id} variants={item} className="w-full max-w-[400px]">
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-5xl font-bold text-primary-200 text-primary-700">
                      {service.title.charAt(0)}
                    </span>
                  </div>
                )}
                {srv?.isFeatured && (
                  <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {service.title}
                </h2>

                {service.excerpt && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
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
  )
}
