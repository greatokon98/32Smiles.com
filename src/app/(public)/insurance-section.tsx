"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

type Props = {
  companies: string[]
}

export function InsuranceSection({ companies }: Props) {
  if (companies.length === 0) return null

  const displayCompanies = companies.slice(0, 8)

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
              Insurance & Payments
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
              We Accept Most Major Insurance Plans
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We work with a wide range of insurance providers to make quality dental care accessible and affordable for you and your family.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {displayCompanies.map((company, i) => (
              <span
                key={i}
                className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                {company.trim()}
              </span>
            ))}
          </div>

          {companies.length > 8 && (
            <div className="text-center">
              <Link
                href="/insurance"
                className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
              >
                View All Accepted Plans <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
