import { Metadata } from "next"
import { ContentType, ContentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { TeamGrid } from "./team-grid"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Our Team",
  description: `Meet the experienced dental professionals at ${siteConfig.name}. Our team of qualified dentists and specialists is dedicated to your oral health.`,
  openGraph: {
    title: `Our Team | ${siteConfig.name}`,
    description: `Meet the experienced dental professionals at ${siteConfig.name}. Our team of qualified dentists and specialists is dedicated to your oral health.`,
  },
}

interface SerializedTeamMember {
  id: string
  contentId: string
  title: string
  slug: string
  excerpt: string | null
  specialty: string
  credentials: string | null
  photoUrl: string | null
  isFeatured: boolean
}

export default async function TeamPage() {
  const settings = await prisma.setting.findMany()
  const fallbackMembers: SerializedTeamMember[] = (() => {
    const defaultItems = JSON.stringify([
      { id: "f1", contentId: "fc1", title: "Dr. Sarah Johnson", slug: "sarah-johnson", excerpt: "Expert in cosmetic and restorative dentistry with over 15 years of experience.", specialty: "Cosmetic Dentist", credentials: "DDS, AACD", photoUrl: "/images/team/1.jpg", isFeatured: true },
      { id: "f2", contentId: "fc2", title: "Dr. Michael Chen", slug: "michael-chen", excerpt: "Specializing in implant dentistry and oral surgery.", specialty: "Implant Specialist", credentials: "DMD, MS", photoUrl: "/images/team/2.jpg", isFeatured: true },
      { id: "f3", contentId: "fc3", title: "Dr. Emily Rodriguez", slug: "emily-rodriguez", excerpt: "Passionate about pediatric dentistry and making kids smile.", specialty: "Pediatric Dentist", credentials: "DDS, MPH", photoUrl: "/images/team/3.jpg", isFeatured: false },
      { id: "f4", contentId: "fc4", title: "Dr. James Okafor", slug: "james-okafor", excerpt: "Leading our orthodontic department with advanced techniques.", specialty: "Orthodontist", credentials: "BDS, MOrth", photoUrl: "/images/team/4.jpg", isFeatured: false },
    ])
    try { return JSON.parse(getSetting(settings, "team_fallback_photos", defaultItems)) } catch { return JSON.parse(defaultItems) }
  })()
  const members = await prisma.teamMember.findMany({
    where: {
      content: {
        type: ContentType.TEAM_MEMBER,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    include: {
      content: {
        include: {
          featuredImage: true,
        },
      },
      photoFile: true,
    },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
  })

  const serialized: SerializedTeamMember[] = members.length > 0
    ? members.map((m) => ({
        id: m.id,
        contentId: m.contentId,
        title: m.content.title,
        slug: m.content.slug,
        excerpt: m.content.excerpt,
        specialty: m.specialty,
        credentials: m.credentials,
        photoUrl: m.photoFile?.url || m.content.featuredImage?.url || null,
        isFeatured: m.isFeatured,
      }))
    : fallbackMembers

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_team', '/images/bg/bg9.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Our Team
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Our Team
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Meet the dedicated professionals behind every healthy smile at{" "}
              {siteConfig.name}. Qualified, experienced, and passionate about
              your oral health.
            </p>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <TeamGrid members={serialized} />
        </div>
      </section>
    </>
  )
}
