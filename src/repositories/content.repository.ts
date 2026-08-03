import prisma from "@/lib/prisma"
import {
  ContentType,
  ContentStatus,
  Prisma,
} from "@prisma/client"
import { ContentQueryInput } from "@/domains/content/validation"

// ─── Types ───────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ContentWithRelations = Prisma.ContentGetPayload<{
  include: {
    author: { select: { id: true; name: true; email: true } }
    featuredImage: true
    blogPost: true
    service: true
    product: { include: { productCategory: true } }
    educationArticle: { include: { faqs: true } }
    galleryItem: { include: { imageFile: true, fullImageFile: true } }
    teamMember: { include: { photoFile: true } }
    faq: true
    testimonial: { include: { photoFile: true } }
    seoMetadata: true
    tags: { include: { tag: true } }
    categories: { include: { category: true } }
  }
}>

// ─── Content Repository ──────────────────────────────────

export const contentRepository = {
  async findMany(query: ContentQueryInput): Promise<PaginatedResult<ContentWithRelations>> {
    const { type, status, authorId, featured, search, tags, page, limit, sortBy, sortOrder } = query

    const where: Prisma.ContentWhereInput = {
      deletedAt: null,
      ...(type && { type }),
      ...(status && { status }),
      ...(authorId && { authorId }),
      ...(featured !== undefined && { featured }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          featuredImage: true,
          blogPost: true,
          service: true,
          product: { include: { productCategory: true } },
          educationArticle: { include: { faqs: true } },
          galleryItem: { include: { imageFile: true, fullImageFile: true } },
          teamMember: { include: { photoFile: true } },
          faq: true,
          testimonial: { include: { photoFile: true } },
          seoMetadata: true,
          tags: { include: { tag: true } },
          categories: { include: { category: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.content.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async findById(id: string): Promise<ContentWithRelations | null> {
    return prisma.content.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        featuredImage: true,
        blogPost: true,
        service: true,
        product: { include: { productCategory: true } },
        educationArticle: { include: { faqs: true } },
        galleryItem: { include: { imageFile: true, fullImageFile: true } },
        teamMember: { include: { photoFile: true } },
        faq: true,
        testimonial: { include: { photoFile: true } },
        seoMetadata: true,
        tags: { include: { tag: true } },
        categories: { include: { category: true } },
      },
    })
  },

  async findByTypeAndSlug(type: ContentType, slug: string): Promise<ContentWithRelations | null> {
    return prisma.content.findUnique({
      where: { type_slug: { type, slug } },
      include: {
        author: { select: { id: true, name: true, email: true } },
        featuredImage: true,
        blogPost: true,
        service: true,
        product: { include: { productCategory: true } },
        educationArticle: { include: { faqs: true } },
        galleryItem: { include: { imageFile: true, fullImageFile: true } },
        teamMember: { include: { photoFile: true } },
        faq: true,
        testimonial: { include: { photoFile: true } },
        seoMetadata: true,
        tags: { include: { tag: true } },
        categories: { include: { category: true } },
      },
    })
  },

  async create(data: Prisma.ContentCreateInput) {
    return prisma.content.create({
      data,
      include: {
        author: { select: { id: true, name: true, email: true } },
        featuredImage: true,
        blogPost: true,
        service: true,
        product: true,
        educationArticle: true,
        teamMember: { include: { photoFile: true } },
        faq: true,
        testimonial: { include: { photoFile: true } },
        galleryItem: { include: { imageFile: true, fullImageFile: true } },
        seoMetadata: true,
        tags: { include: { tag: true } },
        categories: { include: { category: true } },
      },
    })
  },

  async update(id: string, data: Prisma.ContentUpdateInput) {
    return prisma.content.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true, email: true } },
        featuredImage: true,
        blogPost: true,
        service: true,
        product: true,
        educationArticle: true,
        teamMember: { include: { photoFile: true } },
        faq: true,
        testimonial: { include: { photoFile: true } },
        galleryItem: { include: { imageFile: true, fullImageFile: true } },
        seoMetadata: true,
        tags: { include: { tag: true } },
        categories: { include: { category: true } },
      },
    })
  },

  async delete(id: string) {
    // Soft delete
    return prisma.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },

  async hardDelete(id: string) {
    return prisma.content.delete({ where: { id } })
  },

  async incrementViewCount(id: string) {
    return prisma.content.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
  },

  async count(type?: ContentType) {
    return prisma.content.count({
      where: {
        deletedAt: null,
        ...(type && { type }),
      },
    })
  },

  async countByStatus() {
    const results = await prisma.content.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    })
    return Object.fromEntries(results.map((r) => [r.status, r._count]))
  },

  async publish(id: string) {
    return prisma.content.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    })
  },

  async archive(id: string) {
    return prisma.content.update({
      where: { id },
      data: { status: "ARCHIVED" },
    })
  },

  // ─── Version History ────────────────────────────────────

  async createVersion(contentId: string, authorId: string, changeLog?: string) {
    const content = await prisma.content.findUnique({ where: { id: contentId } })
    if (!content) throw new Error("Content not found")

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const lastVersion = await tx.contentVersion.findFirst({
            where: { contentId },
            orderBy: { version: "desc" },
          })
          const nextVersion = (lastVersion?.version ?? 0) + 1
          return tx.contentVersion.create({
            data: {
              contentId,
              version: nextVersion,
              title: content.title,
              body: content.body,
              authorId,
              changeLog,
            },
          })
        })
      } catch (error) {
        if (attempt === 2 || !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error
      }
    }
  },

  async getVersions(contentId: string) {
    return prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { version: "desc" },
    })
  },

  async revertToVersion(contentId: string, version: number, authorId: string) {
    const versionRecord = await prisma.contentVersion.findUnique({
      where: { contentId_version: { contentId, version } },
    })
    if (!versionRecord) throw new Error("Version not found")

    // Create a version of the current state first
    await this.createVersion(contentId, authorId, `Auto-save before revert to v${version}`)

    // Revert
    return prisma.content.update({
      where: { id: contentId },
      data: {
        title: versionRecord.title,
        body: versionRecord.body,
      },
    })
  },
}
