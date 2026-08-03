"use client"

import Image from "next/image"
import { AnimatedSection } from "./about-animations"
import { siteConfig } from "@/config/site"

type Props = {
  aboutStoryImage?: string
}

export function AboutStory({ aboutStoryImage }: Props) {
  return (
    <section className="py-16 lg:py-24 bg-white bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                {siteConfig.name} was founded with a simple yet powerful
                vision: to provide world-class dental care that is accessible,
                comfortable, and effective. Located at{" "}
                {siteConfig.contact.address}, our clinic has become a trusted
                name in oral healthcare across Lagos.
              </p>
              <p>
                Over the years, we have built a reputation for excellence by
                combining state-of-the-art dental technology with a
                patient-first philosophy. Every member of our team is committed
                to ensuring your experience is as pleasant as the results are
                outstanding.
              </p>
              <p>
                From routine check-ups to advanced cosmetic procedures, we offer
                a comprehensive range of services designed to meet the unique
                needs of every patient who walks through our doors.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={aboutStoryImage || "/images/about/dc1.png"}
                alt={`${siteConfig.name} clinic`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-primary-600 text-white p-6 rounded-xl shadow-lg hidden lg:block">
              <p className="text-3xl font-bold">10+</p>
              <p className="text-primary-100 text-sm">Years of Excellence</p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
