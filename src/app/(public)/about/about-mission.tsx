"use client"

import { AnimatedSection } from "./about-animations"
import { siteConfig } from "@/config/site"

export function AboutMission() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedSection>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Mission
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {siteConfig.mission}. We strive to create a welcoming
                environment where every patient feels valued, informed, and
                confident in the care they receive. Our goal is to build lasting
                relationships based on trust, transparency, and exceptional
                results.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To be the leading dental clinic in Nigeria, setting the standard
                for innovative oral healthcare. We envision a future where every
                individual has access to quality dental services that enhance not
                just their oral health, but their overall quality of life and
                self-confidence.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
