import { ContentType, ContentStatus, Prisma } from "@prisma/client"
import { contentRepository, ContentWithRelations, PaginatedResult } from "@/repositories/content.repository"
import {
  CreateContentInput,
  UpdateContentInput,
  ContentQueryInput,
  CreateContentSchema,
  UpdateContentSchema,
  ContentQuerySchema,
} from "@/domains/content/validation"
import { slugify } from "@/lib/utils"

// ─── Content Service ─────────────────────────────────────

export const contentService = {
  async list(query: ContentQueryInput): Promise<PaginatedResult<ContentWithRelations>> {
    const validated = ContentQuerySchema.parse(query)
    return contentRepository.findMany(validated)
  },

  async getById(id: string): Promise<ContentWithRelations | null> {
    const content = await contentRepository.findById(id)
    // The editor should show pending (unpublished) edits on top of the live
    // version. Public pages use getByTypeAndSlug and are unaffected.
    if (!content || !content.hasDraft || !content.draftData) return content

    const draft = content.draftData as Record<string, unknown>
    const merged: Record<string, unknown> = {
      ...(content as unknown as Record<string, unknown>),
      ...draft,
    }
    if (draft.seo && typeof draft.seo === "object") {
      merged.seoMetadata = {
        ...((content.seoMetadata as object | null) ?? {}),
        ...(draft.seo as object),
      }
    }
    return merged as ContentWithRelations
  },

  async getByTypeAndSlug(type: ContentType, slug: string): Promise<ContentWithRelations | null> {
    return contentRepository.findByTypeAndSlug(type, slug)
  },

  async create(input: CreateContentInput & { teamMember?: Record<string, unknown>; galleryItem?: Record<string, unknown>; testimonial?: Record<string, unknown>; faq?: Record<string, unknown>; blogPost?: Record<string, unknown>; product?: Record<string, unknown>; educationArticle?: Record<string, unknown> }, authorId: string) {
    const data = CreateContentSchema.parse(input)

    // Auto-generate slug if not provided
    const slug = data.slug || slugify(data.title)

    // Check slug uniqueness within content type
    const existing = await contentRepository.findByTypeAndSlug(data.type as ContentType, slug)
    if (existing) {
      throw new Error(`A ${data.type.toLowerCase()} with slug "${slug}" already exists`)
    }

    const createData: Record<string, unknown> = {
      type: data.type as ContentType,
      slug,
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      status: data.status as ContentStatus,
      featured: data.featured,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : data.status === "PUBLISHED" ? new Date() : undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      author: { connect: { id: authorId } },
      ...(data.featuredImageId && { featuredImage: { connect: { id: data.featuredImageId } } }),
    }

    // Handle type-specific nested data
    if (data.type === "TEAM_MEMBER" && input.teamMember) {
      const tm = input.teamMember
      createData.teamMember = {
        create: {
          specialty: tm.specialty as string,
          credentials: tm.credentials as string | undefined,
          bio: tm.bio as string | undefined,
          socialLinks: tm.socialLinks as Record<string, string> | undefined,
          ...(tm.photoFileId ? { photoFile: { connect: { id: tm.photoFileId as string } } } : {}),
        },
      }
    }

    if (data.type === "GALLERY_ITEM" && input.galleryItem) {
      const gi = input.galleryItem
      createData.galleryItem = {
        create: {
          category: (gi.category as string) || "",
          caption: gi.caption as string | undefined,
          altText: gi.altText as string | undefined,
          sortOrder: (gi.sortOrder as number) || 0,
          ...(gi.imageFileId ? { imageFile: { connect: { id: gi.imageFileId as string } } } : {}),
          ...(gi.fullImageFileId ? { fullImageFile: { connect: { id: gi.fullImageFileId as string } } } : {}),
        },
      }
    }

    if (data.type === "TESTIMONIAL" && input.testimonial) {
      const t = input.testimonial
      createData.testimonial = {
        create: {
          clientName: t.clientName as string,
          clientTitle: t.clientTitle as string | undefined,
          rating: t.rating as number | undefined,
          isFeatured: (t.isFeatured as boolean) || false,
          sortOrder: (t.sortOrder as number) || 0,
          ...(t.photoFileId ? { photoFile: { connect: { id: t.photoFileId as string } } } : {}),
        },
      }
    }

    if (data.type === "FAQ" && input.faq) {
      const f = input.faq
      createData.faq = {
        create: {
          question: f.question as string,
          answer: f.answer as string,
          category: f.category as string | undefined,
          isStandalone: (f.isStandalone as boolean) || false,
          sortOrder: (f.sortOrder as number) || 0,
        },
      }
    }

    if (data.type === "BLOG_POST" && input.blogPost) {
      const b = input.blogPost
      createData.blogPost = {
        create: {
          readingTime: b.readingTime as number | undefined,
          allowComments: b.allowComments !== undefined ? (b.allowComments as boolean) : true,
          isFeatured: (b.isFeatured as boolean) || false,
        },
      }
    }

    if (data.type === "PRODUCT" && input.product) {
      const p = input.product
      createData.product = {
        create: {
          price: p.price as number,
          salePrice: p.salePrice as number | undefined,
          currency: (p.currency as string) || "NGN",
          sku: p.sku as string | undefined,
          brand: p.brand as string | undefined,
          rating: p.rating as number | undefined,
          inStock: p.inStock !== undefined ? (p.inStock as boolean) : true,
          isHot: (p.isHot as boolean) || false,
          isOnSale: (p.isOnSale as boolean) || false,
          sortOrder: (p.sortOrder as number) || 0,
          productCategory: { connect: { id: p.productCategoryId as string } },
        },
      }
    }

    if ((data.type === "EDUCATION_PATIENT" || data.type === "EDUCATION_PROFESSIONAL") && input.educationArticle) {
      const e = input.educationArticle
      createData.educationArticle = {
        create: {
          educationType: data.type === "EDUCATION_PATIENT" ? "patient" : "professional",
          readingTime: e.readingTime as number | undefined,
          isFeatured: (e.isFeatured as boolean) || false,
          sortOrder: (e.sortOrder as number) || 0,
        },
      }
    }

    const content = await contentRepository.create(createData as Parameters<typeof contentRepository.create>[0])

    // Handle tags
    if (data.tags && data.tags.length > 0) {
      await this.syncTags(content.id, data.tags)
    }

    return content
  },

  async update(
    id: string,
    input: Partial<CreateContentInput> & { teamMember?: Record<string, unknown>; galleryItem?: Record<string, unknown>; testimonial?: Record<string, unknown>; faq?: Record<string, unknown>; blogPost?: Record<string, unknown>; product?: Record<string, unknown>; educationArticle?: Record<string, unknown> },
    authorId: string,
    forceLive = false
  ) {
    const existing = await contentRepository.findById(id)
    if (!existing) throw new Error("Content not found")

    // Draft mode: the live version is PUBLISHED and the edit does not change the
    // status, so the change is kept off-site (in draftData) until explicitly
    // published. Public pages keep serving the live, PUBLISHED version.
    const isPublished = existing.status === "PUBLISHED"
    const incomingStatus = input.status
    const staysPublished = incomingStatus === undefined || incomingStatus === "PUBLISHED"

    if (!forceLive && isPublished && staysPublished) {
      const draftData = { ...input, savedAt: new Date().toISOString() }
      return contentRepository.update(id, {
        hasDraft: true,
        draftData: draftData as unknown as Prisma.InputJsonValue,
      })
    }

    // Create version before updating
    await contentRepository.createVersion(id, authorId, "Auto-save before update")

    const updateData: Record<string, unknown> = {}
    if (input.title) updateData.title = input.title
    if (input.slug) updateData.slug = input.slug
    if (input.excerpt !== undefined) updateData.excerpt = input.excerpt
    if (input.body !== undefined) updateData.body = input.body
    if (input.status) {
      updateData.status = input.status
      if (input.status === "PUBLISHED" && !input.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (input.featured !== undefined) updateData.featured = input.featured
    if (input.publishedAt) updateData.publishedAt = new Date(input.publishedAt)
    if (input.scheduledAt) updateData.scheduledAt = new Date(input.scheduledAt)
    if (input.featuredImageId !== undefined) updateData.featuredImageId = input.featuredImageId

    // Handle type-specific nested data for updates (upsert to support old records with null nested data)
    if (input.teamMember) {
      const tm = input.teamMember
      const teamUpdate: Record<string, unknown> = {}
      if (tm.specialty !== undefined) teamUpdate.specialty = tm.specialty
      if (tm.credentials !== undefined) teamUpdate.credentials = tm.credentials
      if (tm.bio !== undefined) teamUpdate.bio = tm.bio
      if (tm.socialLinks !== undefined) teamUpdate.socialLinks = tm.socialLinks
      if (tm.photoFileId !== undefined) {
        teamUpdate.photoFile = tm.photoFileId
          ? { connect: { id: tm.photoFileId as string } }
          : { disconnect: true }
      }
      if (Object.keys(teamUpdate).length > 0) {
        updateData.teamMember = {
          upsert: {
            create: {
              specialty: (tm.specialty as string) || "",
              ...(tm.credentials ? { credentials: tm.credentials as string } : {}),
              ...(tm.bio ? { bio: tm.bio as string } : {}),
              ...(tm.socialLinks ? { socialLinks: tm.socialLinks } : {}),
              ...(tm.photoFileId ? { photoFile: { connect: { id: tm.photoFileId as string } } } : {}),
            },
            update: teamUpdate,
          },
        }
      }
    }

    if (input.galleryItem) {
      const gi = input.galleryItem
      const galleryUpdate: Record<string, unknown> = {}
      if (gi.category !== undefined) galleryUpdate.category = gi.category
      if (gi.caption !== undefined) galleryUpdate.caption = gi.caption
      if (gi.altText !== undefined) galleryUpdate.altText = gi.altText
      if (gi.sortOrder !== undefined) galleryUpdate.sortOrder = gi.sortOrder
      if (gi.imageFileId !== undefined) {
        galleryUpdate.imageFile = gi.imageFileId
          ? { connect: { id: gi.imageFileId as string } }
          : { disconnect: true }
      }
      if (gi.fullImageFileId !== undefined) {
        galleryUpdate.fullImageFile = gi.fullImageFileId
          ? { connect: { id: gi.fullImageFileId as string } }
          : { disconnect: true }
      }
      if (Object.keys(galleryUpdate).length > 0) {
        updateData.galleryItem = {
          upsert: {
            create: {
              category: (gi.category as string) || "",
              ...(gi.caption ? { caption: gi.caption as string } : {}),
              ...(gi.altText ? { altText: gi.altText as string } : {}),
              sortOrder: (gi.sortOrder as number) || 0,
              ...(gi.imageFileId ? { imageFile: { connect: { id: gi.imageFileId as string } } } : {}),
              ...(gi.fullImageFileId ? { fullImageFile: { connect: { id: gi.fullImageFileId as string } } } : {}),
            },
            update: galleryUpdate,
          },
        }
      }
    }

    if (input.testimonial) {
      const t = input.testimonial
      const testUpdate: Record<string, unknown> = {}
      if (t.clientName !== undefined) testUpdate.clientName = t.clientName
      if (t.clientTitle !== undefined) testUpdate.clientTitle = t.clientTitle
      if (t.rating !== undefined) testUpdate.rating = t.rating
      if (t.isFeatured !== undefined) testUpdate.isFeatured = t.isFeatured
      if (t.sortOrder !== undefined) testUpdate.sortOrder = t.sortOrder
      if (t.photoFileId !== undefined) {
        testUpdate.photoFile = t.photoFileId
          ? { connect: { id: t.photoFileId as string } }
          : { disconnect: true }
      }
      if (Object.keys(testUpdate).length > 0) {
        updateData.testimonial = {
          upsert: {
            create: {
              clientName: (t.clientName as string) || "",
              ...(t.clientTitle ? { clientTitle: t.clientTitle as string } : {}),
              ...(t.rating !== undefined ? { rating: t.rating as number } : {}),
              isFeatured: (t.isFeatured as boolean) || false,
              sortOrder: (t.sortOrder as number) || 0,
              ...(t.photoFileId ? { photoFile: { connect: { id: t.photoFileId as string } } } : {}),
            },
            update: testUpdate,
          },
        }
      }
    }

    if (input.faq) {
      const f = input.faq
      const faqUpdate: Record<string, unknown> = {}
      if (f.question !== undefined) faqUpdate.question = f.question
      if (f.answer !== undefined) faqUpdate.answer = f.answer
      if (f.category !== undefined) faqUpdate.category = f.category
      if (f.isStandalone !== undefined) faqUpdate.isStandalone = f.isStandalone
      if (f.sortOrder !== undefined) faqUpdate.sortOrder = f.sortOrder
      if (Object.keys(faqUpdate).length > 0) {
        updateData.faq = {
          upsert: {
            create: {
              question: (f.question as string) || "",
              answer: (f.answer as string) || "",
              ...(f.category ? { category: f.category as string } : {}),
              isStandalone: (f.isStandalone as boolean) || false,
              sortOrder: (f.sortOrder as number) || 0,
            },
            update: faqUpdate,
          },
        }
      }
    }

    if (input.blogPost) {
      const b = input.blogPost
      const blogUpdate: Record<string, unknown> = {}
      if (b.readingTime !== undefined) blogUpdate.readingTime = b.readingTime
      if (b.allowComments !== undefined) blogUpdate.allowComments = b.allowComments
      if (b.isFeatured !== undefined) blogUpdate.isFeatured = b.isFeatured
      if (Object.keys(blogUpdate).length > 0) {
        updateData.blogPost = {
          upsert: {
            create: {
              readingTime: (b.readingTime as number) || 1,
              allowComments: b.allowComments !== undefined ? (b.allowComments as boolean) : true,
              isFeatured: (b.isFeatured as boolean) || false,
            },
            update: blogUpdate,
          },
        }
      }
    }

    if (input.product) {
      const p = input.product
      const productUpdate: Record<string, unknown> = {}
      if (p.price !== undefined) productUpdate.price = p.price
      if (p.salePrice !== undefined) productUpdate.salePrice = p.salePrice
      if (p.currency !== undefined) productUpdate.currency = p.currency
      if (p.sku !== undefined) productUpdate.sku = p.sku
      if (p.brand !== undefined) productUpdate.brand = p.brand
      if (p.rating !== undefined) productUpdate.rating = p.rating
      if (p.inStock !== undefined) productUpdate.inStock = p.inStock
      if (p.isHot !== undefined) productUpdate.isHot = p.isHot
      if (p.isOnSale !== undefined) productUpdate.isOnSale = p.isOnSale
      if (p.sortOrder !== undefined) productUpdate.sortOrder = p.sortOrder
      if (p.productCategoryId !== undefined) {
        productUpdate.productCategory = { connect: { id: p.productCategoryId as string } }
      }
      if (Object.keys(productUpdate).length > 0) {
        updateData.product = {
          upsert: {
            create: {
              price: (p.price as number) || 0,
              ...(p.salePrice !== undefined ? { salePrice: p.salePrice as number } : {}),
              currency: (p.currency as string) || "NGN",
              ...(p.sku ? { sku: p.sku as string } : {}),
              ...(p.brand ? { brand: p.brand as string } : {}),
              ...(p.rating !== undefined ? { rating: p.rating as number } : {}),
              inStock: p.inStock !== undefined ? (p.inStock as boolean) : true,
              isHot: (p.isHot as boolean) || false,
              isOnSale: (p.isOnSale as boolean) || false,
              sortOrder: (p.sortOrder as number) || 0,
              ...(p.productCategoryId ? { productCategory: { connect: { id: p.productCategoryId as string } } } : {}),
            },
            update: productUpdate,
          },
        }
      }
    }

    if (input.educationArticle) {
      const e = input.educationArticle
      const eduUpdate: Record<string, unknown> = {}
      if (e.readingTime !== undefined) eduUpdate.readingTime = e.readingTime
      if (e.isFeatured !== undefined) eduUpdate.isFeatured = e.isFeatured
      if (e.sortOrder !== undefined) eduUpdate.sortOrder = e.sortOrder
      if (e.educationType !== undefined) eduUpdate.educationType = e.educationType
      if (Object.keys(eduUpdate).length > 0) {
        updateData.educationArticle = {
          upsert: {
            create: {
              educationType: (e.educationType as string) || "patient",
              readingTime: (e.readingTime as number) || 1,
              isFeatured: (e.isFeatured as boolean) || false,
              sortOrder: (e.sortOrder as number) || 0,
            },
            update: eduUpdate,
          },
        }
      }
    }

    const content = await contentRepository.update(id, updateData as Parameters<typeof contentRepository.update>[1])

    // Handle tags
    if (input.tags) {
      await this.syncTags(content.id, input.tags)
    }

    return content
  },

  async delete(id: string) {
    return contentRepository.delete(id)
  },

  async publish(id: string, authorId: string) {
    const existing = await contentRepository.findById(id)
    if (!existing) throw new Error("Content not found")

    const draft = existing.draftData as unknown as (Partial<CreateContentInput> & Record<string, unknown>) | null

    if (existing.hasDraft && draft) {
      // Apply the stored draft to the live version, then clear the draft.
      await this.update(
        id,
        { ...draft, status: "PUBLISHED" as ContentStatus },
        authorId,
        true
      )

      await contentRepository.update(id, {
        status: "PUBLISHED",
        publishedAt: new Date(),
        hasDraft: false,
        draftData: Prisma.JsonNull,
      })

      if (draft.seo && typeof draft.seo === "object") {
        await this.applySEOLive(id, draft.seo as Record<string, string>)
      }

      return contentRepository.findById(id)
    }

    // Plain publish (no draft) — clear any stale draft state.
    return contentRepository.publish(id)
  },

  async discardDraft(id: string) {
    return contentRepository.update(id, {
      hasDraft: false,
      draftData: Prisma.JsonNull,
    })
  },

  async archive(id: string) {
    return contentRepository.archive(id)
  },

  async count(type?: ContentType) {
    return contentRepository.count(type)
  },

  async countByStatus() {
    return contentRepository.countByStatus()
  },

  // ─── Tags ───────────────────────────────────────────────

  async syncTags(contentId: string, tagNames: string[]) {
    // Remove existing tags
    await (await import("@/lib/prisma")).default.contentTag.deleteMany({
      where: { contentId },
    })

    // Add new tags
    for (const name of tagNames) {
      const tag = await (await import("@/lib/prisma")).default.tag.upsert({
        where: { name },
        update: {},
        create: {
          name,
          slug: slugify(name),
        },
      })

      await (await import("@/lib/prisma")).default.contentTag.create({
        data: { contentId, tagId: tag.id },
      })
    }
  },

  // ─── Versions ───────────────────────────────────────────

  async getVersions(contentId: string) {
    return contentRepository.getVersions(contentId)
  },

  async revertToVersion(contentId: string, version: number, authorId: string) {
    return contentRepository.revertToVersion(contentId, version, authorId)
  },

  // ─── Slug Generation ────────────────────────────────────

  async generateSlug(title: string, type: ContentType): Promise<string> {
    const baseSlug = slugify(title)
    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await contentRepository.findByTypeAndSlug(type, slug)
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  },

  // ─── SEO Helpers ────────────────────────────────────────

  async updateSEO(contentId: string, seoData: {
    metaTitle?: string
    metaDescription?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    focusKeyword?: string
    canonicalUrl?: string
  }) {
    const prisma = (await import("@/lib/prisma")).default
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { status: true, draftData: true },
    })
    if (!content) throw new Error("Content not found")

    // Published content: keep SEO edits off-site (in the draft) until publish.
    if (content.status === "PUBLISHED") {
      const currentDraft = (content.draftData as Record<string, unknown> | null) ?? {}
      return prisma.content.update({
        where: { id: contentId },
        data: {
          hasDraft: true,
          draftData: { ...currentDraft, seo: seoData } as unknown as Prisma.InputJsonValue,
        },
      })
    }

    return this.applySEOLive(contentId, seoData)
  },

  async applySEOLive(contentId: string, seoData: {
    metaTitle?: string
    metaDescription?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    focusKeyword?: string
    canonicalUrl?: string
  }) {
    const prisma = (await import("@/lib/prisma")).default
    return prisma.sEOMetadata.upsert({
      where: { contentId },
      update: seoData,
      create: {
        contentId,
        ...seoData,
      },
    })
  },

  async getSEO(contentId: string) {
    const prisma = (await import("@/lib/prisma")).default
    return prisma.sEOMetadata.findUnique({
      where: { contentId },
    })
  },
}
