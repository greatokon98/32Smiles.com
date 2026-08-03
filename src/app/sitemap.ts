import type { MetadataRoute } from "next"
import { ContentType, ContentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { siteConfig } from "@/config/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/education/patient`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/education/professional`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/appointment`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ]

  // Dynamic pages from database
  let servicePages: MetadataRoute.Sitemap = []
  let blogPages: MetadataRoute.Sitemap = []
  let productPages: MetadataRoute.Sitemap = []
  let teamPages: MetadataRoute.Sitemap = []

  try {
    const [services, blogPosts, products, teamMembers] = await Promise.all([
      prisma.content.findMany({
        where: {
          type: ContentType.SERVICE,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.content.findMany({
        where: {
          type: ContentType.BLOG_POST,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.content.findMany({
        where: {
          type: ContentType.PRODUCT,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.content.findMany({
        where: {
          type: ContentType.TEAM_MEMBER,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
      }),
    ])

    servicePages = services.map((s) => ({
      url: `${baseUrl}/services/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))

    blogPages = blogPosts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    productPages = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    teamPages = teamMembers.map((m) => ({
      url: `${baseUrl}/team/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))
  } catch {
    // Database unavailable during build — return static pages only
  }

  return [
    ...staticPages,
    ...servicePages,
    ...blogPages,
    ...productPages,
    ...teamPages,
  ]
}
