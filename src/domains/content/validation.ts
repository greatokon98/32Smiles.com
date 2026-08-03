import { z } from "zod"

// ─── Content Types ───────────────────────────────────────

export const ContentTypeSchema = z.enum([
  "BLOG_POST",
  "SERVICE",
  "PRODUCT",
  "EDUCATION_PATIENT",
  "EDUCATION_PROFESSIONAL",
  "GALLERY_ITEM",
  "TEAM_MEMBER",
  "FAQ",
  "TESTIMONIAL",
  "FAQ_PATIENT_EDUCATION",
  "FAQ_STANDALONE",
])

export const ContentStatusSchema = z.enum([
  "DRAFT",
  "AI_GENERATED",
  "AI_ASSISTED",
  "UNDER_REVIEW",
  "REVISIONS_REQUESTED",
  "REJECTED",
  "APPROVED",
  "SEO_REVIEW",
  "SEO_APPROVED",
  "PUBLISHED",
  "ARCHIVED",
])

// ─── Content CRUD ────────────────────────────────────────

export const CreateContentSchema = z.object({
  type: ContentTypeSchema,
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(500).optional(),
  body: z.string().optional(),
  status: ContentStatusSchema.default("DRAFT"),
  featured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  featuredImageId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
})

export const UpdateContentSchema = CreateContentSchema.partial().extend({
  id: z.string(),
})

export const ContentQuerySchema = z.object({
  type: ContentTypeSchema.optional(),
  status: ContentStatusSchema.optional(),
  authorId: z.string().optional(),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "publishedAt", "title", "viewCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// ─── Blog Post ───────────────────────────────────────────

export const CreateBlogPostSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().optional(),
  readingTime: z.number().int().min(1).optional(),
  allowComments: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  seo: z
    .object({
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
      focusKeyword: z.string().optional(),
    })
    .optional(),
})

// ─── Service ─────────────────────────────────────────────

export const CreateServiceSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  duration: z.string().optional(),
  price: z.number().min(0).optional(),
  priceNote: z.string().optional(),
  seo: z
    .object({
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
      focusKeyword: z.string().optional(),
    })
    .optional(),
})

// ─── Product ─────────────────────────────────────────────

export const CreateProductSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().optional(),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  currency: z.string().default("NGN"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  inStock: z.boolean().default(true),
  isHot: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  productUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  productCategoryId: z.string(),
  seo: z
    .object({
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
      focusKeyword: z.string().optional(),
    })
    .optional(),
})

// ─── Team Member ─────────────────────────────────────────

export const CreateTeamMemberSchema = z.object({
  title: z.string().min(1).max(300), // name
  slug: z.string().min(1).max(200),
  excerpt: z.string().optional(), // specialty
  body: z.string().optional(), // bio
  specialty: z.string().min(1),
  credentials: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  photoFileId: z.string().optional(),
})

// ─── Testimonial ─────────────────────────────────────────

export const CreateTestimonialSchema = z.object({
  title: z.string().min(1).max(300), // client name
  slug: z.string().min(1).max(200),
  body: z.string().optional(), // quote
  clientName: z.string().min(1),
  clientTitle: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  photoFileId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
})

// ─── FAQ ─────────────────────────────────────────────────

export const CreateFAQSchema = z.object({
  title: z.string().min(1).max(300), // question
  slug: z.string().min(1).max(200),
  body: z.string().optional(), // answer
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isStandalone: z.boolean().default(false),
})

// ─── Education Article ───────────────────────────────────

export const CreateEducationArticleSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().optional(),
  educationType: z.enum(["patient", "professional"]),
  readingTime: z.number().int().min(1).optional(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        sortOrder: z.number().int().min(0).default(0),
      })
    )
    .optional(),
})

// ─── Gallery Item ────────────────────────────────────────

export const CreateGalleryItemSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  imageFileId: z.string().min(1),
  fullImageFileId: z.string().optional(),
  category: z.enum(["branding", "design", "photography"]),
  sortOrder: z.number().int().min(0).default(0),
  caption: z.string().optional(),
  altText: z.string().optional(),
})

// ─── Types ───────────────────────────────────────────────

export type CreateContentInput = z.infer<typeof CreateContentSchema>
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>
export type ContentQueryInput = z.infer<typeof ContentQuerySchema>
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberSchema>
export type CreateTestimonialInput = z.infer<typeof CreateTestimonialSchema>
export type CreateFAQInput = z.infer<typeof CreateFAQSchema>
export type CreateEducationArticleInput = z.infer<typeof CreateEducationArticleSchema>
export type CreateGalleryItemInput = z.infer<typeof CreateGalleryItemSchema>
