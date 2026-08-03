import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import { Phone } from "lucide-react"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { serializeContent } from "@/lib/utils"
import { TeamPreview } from "./team-preview"
import { AboutStory } from "./about-story"
import { AboutMission } from "./about-mission"
import { AboutFeatures } from "./about-features"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${siteConfig.name} - our mission, values, and the dedicated team providing premium dental care in Victoria Island, Lagos.`,
  openGraph: {
    title: `About Us | ${siteConfig.name}`,
    description: `Learn about ${siteConfig.name} - our mission, values, and the dedicated team providing premium dental care in Victoria Island, Lagos.`,
  },
}

type TeamMemberItem = Prisma.TeamMemberGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
      }
    }
    photoFile: true
  }
}>

async function getFeaturedTeamMembers(): Promise<TeamMemberItem[]> {
  return prisma.teamMember.findMany({
    where: {
      content: {
        type: ContentType.TEAM_MEMBER,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      isFeatured: true,
    },
    include: {
      content: {
        include: {
          featuredImage: true,
        },
      },
      photoFile: true,
    },
    orderBy: { sortOrder: "asc" },
    take: 4,
  })
}

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export default async function AboutPage() {
  const settings = await prisma.setting.findMany()
  const teamMembers = await getFeaturedTeamMembers()

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_about', '/images/bg/bg1.jpg')})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 to-transparent" />
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              About Us
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              About <span className="text-primary-200">32Smiles</span>
            </h1>
            <p className="text-xl lg:text-2xl text-primary-100 leading-relaxed">
              Premium dental care in the heart of Victoria Island, Lagos.
              Combining cutting-edge technology with compassionate care to give
              you the smile you deserve.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <AboutStory aboutStoryImage={getSetting(settings, "about_story_image", "/images/about/dc1.png")} />

      {/* Mission & Vision */}
      <AboutMission />

      {/* Why Choose Us */}
      <AboutFeatures />

      {/* Team Preview */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our experienced professionals are dedicated to providing you with
              the highest standard of dental care.
            </p>
          </div>
          <TeamPreview members={serializeContent(teamMembers) as any} />
          <div className="text-center mt-12">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              View Full Team
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Experience the {siteConfig.name} Difference?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Schedule your appointment today and take the first step towards a
            healthier, more confident smile.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/appointment"
              className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Book Appointment
            </Link>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              <Phone className="h-5 w-5" />
              {siteConfig.contact.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
