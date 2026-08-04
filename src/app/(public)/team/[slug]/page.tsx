import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Prisma, ContentType, ContentStatus } from "@prisma/client"
import { ChevronRight, Phone, Award, BookOpen, Briefcase } from "lucide-react"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"
import { formatDate, serializeContent } from "@/lib/utils"
import { TeamProfile } from "./team-profile"

export const dynamic = "force-dynamic"

type TeamMemberItem = Prisma.TeamMemberGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
        seoMetadata: true
      }
    }
    photoFile: true
  }
}>

type RelatedMember = Prisma.TeamMemberGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
      }
    }
    photoFile: true
  }
}>

type Props = {
  params: Promise<{ slug: string }>
}

async function getTeamMember(slug: string): Promise<TeamMemberItem | null> {
  return prisma.teamMember.findFirst({
    where: {
      content: {
        slug,
        type: ContentType.TEAM_MEMBER,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    include: {
      content: {
        include: {
          featuredImage: true,
          seoMetadata: true,
        },
      },
      photoFile: true,
    },
  })
}

async function getRelatedMembers(
  currentContentId: string,
): Promise<RelatedMember[]> {
  return prisma.teamMember.findMany({
    where: {
      content: {
        type: ContentType.TEAM_MEMBER,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        id: { not: currentContentId },
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
    orderBy: { sortOrder: "asc" },
    take: 4,
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const member = await getTeamMember(slug)
  if (!member) return { title: "Team Member Not Found" }

  const content = member.content
  const seo = content.seoMetadata
  const title =
    seo?.metaTitle || `${content.title} | ${siteConfig.name} Team`
  const description =
    seo?.metaDescription ||
    content.excerpt ||
    `Meet ${content.title}, ${member.specialty} at ${siteConfig.name}.`

  const photoUrl = member.photoFile?.url || content.featuredImage?.url

  return {
    title,
    description,
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: seo?.ogImage
        ? [{ url: seo.ogImage }]
        : photoUrl
          ? [{ url: photoUrl }]
          : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || title,
      description: seo?.twitterDescription || description,
      images: seo?.twitterImage
        ? [seo.twitterImage]
        : photoUrl
          ? [photoUrl]
          : [],
    },
    ...(seo?.canonicalUrl && { alternates: { canonical: seo.canonicalUrl } }),
  }
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params
  const member = await getTeamMember(slug)

  if (!member) notFound()

  const content = member.content
  const photoUrl = member.photoFile?.url || content.featuredImage?.url
  const relatedMembers = await getRelatedMembers(content.id)

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        {photoUrl && (
          <div className="absolute inset-0">
            <Image
              src={photoUrl}
              alt={content.title}
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
        )}
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <nav className="flex items-center gap-1 text-sm text-primary-200 mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/team" className="hover:text-white transition-colors">
              Our Team
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white line-clamp-1">{content.title}</span>
          </nav>

          <TeamProfile member={serializeContent(member) as any} photoUrl={photoUrl} />
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {(content.excerpt || member.bio) && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    About {content.title}
                  </h2>
                  {content.excerpt && (
                    <p className="text-lg text-gray-600 leading-relaxed mb-4 font-medium border-l-4 border-primary-300 pl-6 italic">
                      {content.excerpt}
                    </p>
                  )}
                  {member.bio && (
                    <div className="text-gray-600 leading-relaxed space-y-4">
                      {member.bio.split("\n").map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {content.body && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Detailed Profile
                  </h2>
                  <div
                    className="text-gray-600 leading-relaxed
                      [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4
                      [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-4
                      [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-6 [&_h4]:mb-3
                      [&_p]:mb-4 [&_p]:leading-relaxed
                      [&_ul]:space-y-2 [&_ul]:my-4 [&_ul]:pl-5 [&_ul]:list-disc
                      [&_ol]:space-y-2 [&_ol]:my-4 [&_ol]:pl-5 [&_ol]:list-decimal
                      [&_li]:text-gray-600
                      [&_a]:text-primary-600 [&_a]:underline [&_a]:hover:text-primary-700
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-6
                      [&_strong]:text-gray-800
                      [&_img]:rounded-xl [&_img]:my-6 [&_img]:max-w-full [&_img]:h-auto
                      [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-6 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-6
                      [&_code]:text-sm
                      [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table
                      [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:p-3 [&_th]:border-b-2 [&_th]:border-gray-200
                      [&_td]:p-3 [&_td]:border-b [&_td]:border-gray-100
                      [&_hr]:my-10 [&_hr]:border-gray-200"
                    dangerouslySetInnerHTML={{ __html: content.body }}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-5">
                  Quick Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                        Specialty
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {member.specialty}
                      </p>
                    </div>
                  </div>
                  {member.credentials && (
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                          Credentials
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {member.credentials}
                        </p>
                      </div>
                    </div>
                  )}
                  {content.publishedAt && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                          Member Since
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(content.publishedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/appointment"
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Book Appointment
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                    className="w-full border-2 border-primary-600 text-primary-600 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    {siteConfig.contact.phone}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Other Team Members */}
      {relatedMembers.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Meet the Rest of the Team
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Get to know the other talented professionals at {siteConfig.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedMembers.map((related) => {
                const relatedPhoto =
                  related.photoFile?.url ||
                  related.content.featuredImage?.url

                return (
                  <Link
                    key={related.id}
                    href={`/team/${related.content.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-center"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      {relatedPhoto ? (
                        <Image
                          src={relatedPhoto}
                          alt={related.content.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-5xl font-bold text-primary-200">
                            {related.content.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {related.content.title}
                      </h3>
                      <p className="text-primary-600 text-sm font-medium">
                        {related.specialty}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
