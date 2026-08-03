# 32Smiles — Database Schema

> **Date**: July 27, 2026
> **Version**: 1.0
> **ORM**: Prisma
> **Database**: PostgreSQL 16 with pgvector extension
> **Estimated Entities**: ~45

---

## 1. Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Core Entities                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User ──────── Role ──────── Permission                         │
│    │                                                               │
│    ├── Appointment                                                │
│    ├── Content ──── ContentVersion ──── AI Generation Request    │
│    │   ├── BlogPost                                              │
│    │   ├── Service                                               │
│    │   ├── Product                                               │
│    │   ├── EducationArticle                                      │
│    │   ├── GalleryItem                                           │
│    │   ├── TeamMember                                            │
│    │   ├── FAQ                                                   │
│    │   └── Testimonial                                           │
│    ├── ContactSubmission                                         │
│    ├── NewsletterSubscriber                                      │
│    ├── AI Draft ──── AI Review                                   │
│    ├── Notification                                              │
│    ├── AuditLog                                                  │
│    └── Settings (key-value)                                      │
│                                                                  │
│  Category ──────── Product                                      │
│                                                                  │
│  File (uploads, images)                                         │
│                                                                  │
│  AI PromptTemplate ──── PromptVersion                           │
│  AI KnowledgeBaseEntry ──── KnowledgeBaseEmbedding              │
│  AI ProviderConfig                                            │
│  AI BrandVoice                                               │
│  AI GenerationRequest ──── GenerationLog                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN
  ADMIN
  EDITOR
  VIEWER
}

enum ContentStatus {
  DRAFT
  AI_GENERATED
  AI_ASSISTED
  UNDER_REVIEW
  REVISIONS_REQUESTED
  REJECTED
  APPROVED
  SEO_REVIEW
  SEO_APPROVED
  PUBLISHED
  ARCHIVED
}

enum ContentType {
  BLOG_POST
  SERVICE
  PRODUCT
  EDUCATION_PATIENT
  EDUCATION_PROFESSIONAL
  GALLERY_ITEM
  TEAM_MEMBER
  FAQ
  TESTIMONIAL
  FAQ_PATIENT_EDUCATION
  FAQ_STANDALONE
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum NotificationType {
  APPOINTMENT_CONFIRMED
  APPOINTMENT_REMINDER
  APPOINTMENT_UPDATED
  APPOINTMENT_CANCELLED
  CONTACT_RECEIVED
  AI_CONTENT_READY
  AI_CONTENT_APPROVED
  AI_CONTENT_REJECTED
  CONTENT_PUBLISHED
  SYSTEM_ALERT
}

enum NotificationChannel {
  IN_APP
  EMAIL
}

enum AIProvider {
  OPENAI
  ANTHROPIC
  GEMINI
  GROQ
  OLLAMA
  AZURE
  OPENROUTER
}

enum AIProviderStatus {
  ACTIVE
  INACTIVE
  ERROR
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum ReviewStatus {
  PENDING
  APPROVED
  CHANGES_REQUESTED
  REJECTED
}

enum FileType {
  IMAGE
  DOCUMENT
  VIDEO
  AUDIO
  OTHER
}

enum ImagePromptStatus {
  PENDING
  GENERATED
  APPROVED
  REJECTED
}

// ─────────────────────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String?
  role          UserRole  @default(VIEWER)
  avatar        String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  appointments       Appointment[]
  appointmentsMade   Appointment[]       @relation("AppointmentCreator")
  contents           Content[]
  drafts             AIDraft[]
  notifications      Notification[]
  auditLogs          AuditLog[]
  contactSubmissions ContactSubmission[]
  newsletterSubs     NewsletterSubscriber[]
  uploads            File[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  permissions Permission[]
  createdAt   DateTime @default(now())

  @@map("roles")
}

model Permission {
  id        String @id @default(cuid())
  resource  String
  action    String // CREATE, READ, UPDATE, DELETE, PUBLISH
  roleId    String
  role      Role   @relation(fields: [roleId], references: [id])

  @@unique([resource, action, roleId])
  @@map("permissions")
}

// ─────────────────────────────────────────────────────────────
// CONTENT SYSTEM
// ─────────────────────────────────────────────────────────────

model Content {
  id          String        @id @default(cuid())
  type        ContentType
  slug        String
  title       String
  excerpt     String?       @db.Text
  body        String?       @db.Text
  status      ContentStatus @default(DRAFT)
  featured    Boolean       @default(false)
  authorId    String
  author      User          @relation(fields: [authorId], references: [id])
  publishedAt DateTime?
  scheduledAt DateTime?
  viewCount   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?

  // Relations
  versions         ContentVersion[]
  seoMetadata      SEOMetadata?
  aiGenerationLogs AIGenerationLog[]
  tags             ContentTag[]
  categories       ContentCategory[]
  featuredImage    File?             @relation("FeaturedImage")
  featuredImageId  String?

  // Type-specific relations
  blogPost         BlogPost?
  service          Service?
  product          Product?
  educationArticle EducationArticle?
  galleryItem      GalleryItem?
  teamMember       TeamMember?
  faq              FAQ?
  testimonial      Testimonial?

  @@unique([type, slug])
  @@index([type, status])
  @@index([status, publishedAt])
  @@index([authorId])
  @@index([createdAt])
  @@map("contents")
}

model ContentVersion {
  id        String   @id @default(cuid())
  contentId String
  content   Content  @relation(fields: [contentId], references: [id])
  version   Int
  title     String
  body      String?  @db.Text
  authorId  String
  changeLog String?
  createdAt DateTime @default(now())

  @@unique([contentId, version])
  @@index([contentId])
  @@map("content_versions")
}

// ─────────────────────────────────────────────────────────────
// TYPE-SPECIFIC MODELS
// ─────────────────────────────────────────────────────────────

model BlogPost {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  readingTime   Int?    // minutes
  allowComments Boolean @default(true)
  isFeatured    Boolean @default(false)
  publishedAt   DateTime?

  @@map("blog_posts")
}

model Service {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  icon          String?
  sortOrder     Int     @default(0)
  isFeatured    Boolean @default(false)
  duration      String? // e.g., "45 minutes"
  price         Decimal? @db.Decimal(10, 2)
  priceNote     String?  // e.g., "Starting from"

  @@map("services")
}

model Product {
  id            String   @id @default(cuid())
  contentId     String   @unique
  content       Content  @relation(fields: [contentId], references: [id])
  price         Decimal  @db.Decimal(10, 2)
  salePrice     Decimal? @db.Decimal(10, 2)
  currency      String   @default("NGN")
  sku           String?
  brand         String?
  rating        Decimal? @db.Decimal(3, 2) // 0.00 - 5.00
  reviewCount   Int      @default(0)
  inStock       Boolean  @default(true)
  isHot         Boolean  @default(false)
  isOnSale      Boolean  @default(false)
  isFeatured    Boolean  @default(false)
  productUrl    String?  // External link if applicable
  sortOrder     Int      @default(0)
  productCategoryId String
  productCategory   ProductCategory @relation(fields: [productCategoryId], references: [id])

  @@index([productCategoryId])
  @@index([isFeatured, inStock])
  @@map("products")
}

model EducationArticle {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  educationType String  // "patient" or "professional"
  readingTime   Int?    // minutes
  isFeatured    Boolean @default(false)
  sortOrder     Int     @default(0)

  @@index([educationType])
  @@map("education_articles")
}

model GalleryItem {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  imageFileId   String
  imageFile     File    @relation("GalleryImage", fields: [imageFileId], references: [id])
  fullImageFileId String?
  fullImageFile File?   @relation("GalleryFullImage", fields: [fullImageFileId], references: [id])
  category      String  // "branding", "design", "photography"
  sortOrder     Int     @default(0)
  caption       String?
  altText       String?

  @@index([category])
  @@map("gallery_items")
}

model TeamMember {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  specialty     String
  bio           String? @db.Text
  photoFileId   String?
  photoFile     File?   @relation("TeamPhoto", fields: [photoFileId], references: [id])
  credentials   String? // e.g., "DDS, FAGD"
  sortOrder     Int     @default(0)
  isFeatured    Boolean @default(false)
  socialLinks   Json?   // { linkedin, twitter, instagram }

  @@map("team_members")
}

model FAQ {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  question      String
  answer        String  @db.Text
  category      String? // "general", "hygiene", "treatment", etc.
  sortOrder     Int     @default(0)
  isStandalone  Boolean @default(false) // standalone vs. article-linked
  viewCount     Int     @default(0)

  @@index([category, sortOrder])
  @@map("faqs")
}

model Testimonial {
  id            String  @id @default(cuid())
  contentId     String  @unique
  content       Content @relation(fields: [contentId], references: [id])
  clientName    String
  clientTitle   String? // e.g., "Patient since 2020"
  rating        Int?    // 1-5
  photoFileId   String?
  photoFile     File?   @relation("TestimonialPhoto", fields: [photoFileId], references: [id])
  isFeatured    Boolean @default(false)
  sortOrder     Int     @default(0)

  @@map("testimonials")
}

model EducationFAQ {
  id                      String  @id @default(cuid())
  educationArticleId      String
  educationArticle        EducationArticle @relation(fields: [educationArticleId], references: [id])
  question                String
  answer                  String  @db.Text
  sortOrder               Int     @default(0)

  @@index([educationArticleId])
  @@map("education_faqs")
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CATEGORIES
// ─────────────────────────────────────────────────────────────

model ProductCategory {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  imageFileId String?
  imageFile   File?     @relation("CategoryImage", fields: [imageFileId], references: [id])
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([sortOrder])
  @@map("product_categories")
}

// ─────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────

model Appointment {
  id            String            @id @default(cuid())
  patientName   String
  patientEmail  String
  patientPhone  String
  date          DateTime          @db.Date
  time          String            // e.g., "10:00"
  endTime       String?           // e.g., "10:45"
  service       String?           // Requested service
  notes         String?           @db.Text
  status        AppointmentStatus @default(PENDING)
  createdByUserId String?
  createdBy     User?             @relation("AppointmentCreator", fields: [createdByUserId], references: [id])
  assignedToId  String?
  confirmedAt   DateTime?
  completedAt   DateTime?
  cancelledAt   DateTime?
  cancelReason  String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([date, status])
  @@index([patientEmail])
  @@index([status])
  @@map("appointments")
}

// ─────────────────────────────────────────────────────────────
// CONTACT & NEWSLETTER
// ─────────────────────────────────────────────────────────────

model ContactSubmission {
  id          String   @id @default(cuid())
  name        String
  email       String
  phone       String?
  subject     String
  message     String   @db.Text
  isRead      Boolean  @default(false)
  isReplied   Boolean  @default(false)
  repliedAt   DateTime?
  repliedById String?
  repliedBy   User?    @relation(fields: [repliedById], references: [id])
  notes       String?  @db.Text  // Internal admin notes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isRead, createdAt])
  @@index([email])
  @@map("contact_submissions")
}

model NewsletterSubscriber {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  isActive  Boolean   @default(true)
  source    String?   // "website", "blog", "admin"
  userId    String?
  user      User?     @relation(fields: [userId], references: [id])
  unsubscribedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([isActive])
  @@map("newsletter_subscribers")
}

// ─────────────────────────────────────────────────────────────
// FILE MANAGEMENT
// ─────────────────────────────────────────────────────────────

model File {
  id            String   @id @default(cuid())
  filename      String
  originalName  String
  mimeType      String
  size          Int      // bytes
  path          String   // storage path
  url           String   // public URL
  type          FileType
  width         Int?
  height        Int?
  altText       String?
  caption       String?
  uploadedById  String?
  uploadedBy    User?    @relation(fields: [uploadedById], references: [id])
  createdAt     DateTime @default(now())

  // Reverse relations
  featuredIn    Content[]          @relation("FeaturedImage")
  galleryItems  GalleryItem[]      @relation("GalleryImage")
  fullGalleryItems GalleryItem[]   @relation("GalleryFullImage")
  teamPhotos    TeamMember[]       @relation("TeamPhoto")
  testimonialPhotos Testimonial[]  @relation("TestimonialPhoto")
  categoryImages ProductCategory[] @relation("CategoryImage")

  @@index([type])
  @@index([uploadedById])
  @@map("files")
}

// ─────────────────────────────────────────────────────────────
// TAGS & CATEGORIES
// ─────────────────────────────────────────────────────────────

model Tag {
  id        String        @id @default(cuid())
  name      String        @unique
  slug      String        @unique
  contents  Content[]
  createdAt DateTime      @default(now())

  @@map("tags")
}

model ContentTag {
  contentId String
  tagId     String
  content   Content @relation(fields: [contentId], references: [id])
  tag       Tag     @relation(fields: [tagId], references: [id])

  @@id([contentId, tagId])
  @@map("content_tags")
}

model ContentCategory {
  contentId  String
  categoryId String
  content    Content  @relation(fields: [contentId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])

  @@id([contentId, categoryId])
  @@map("content_categories")
}

model Category {
  id        String            @id @default(cuid())
  name      String
  slug      String            @unique
  type      ContentType       // Which content type this category applies to
  contents  ContentCategory[]
  createdAt DateTime          @default(now())

  @@unique([slug, type])
  @@map("categories")
}

// ─────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────

model SEOMetadata {
  id              String  @id @default(cuid())
  contentId       String  @unique
  content         Content @relation(fields: [contentId], references: [id])
  metaTitle       String? // max 60 chars
  metaDescription String? // max 160 chars
  ogTitle         String?
  ogDescription   String?
  ogImage         String?
  ogImageId       String?
  twitterCard     String? // "summary", "summary_large_image"
  twitterTitle    String?
  twitterDescription String?
  twitterImage    String?
  canonicalUrl    String?
  schemaType      String? // "Article", "Product", "FAQ", etc.
  schemaData      Json?   // Structured data JSON-LD
  focusKeyword    String?
  noIndex         Boolean @default(false)
  noFollow        Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("seo_metadata")
}

// ─────────────────────────────────────────────────────────────
// AI ENGINE
// ─────────────────────────────────────────────────────────────

model AIDraft {
  id               String        @id @default(cuid())
  title            String
  body             String?       @db.Text
  contentType      ContentType
  status           ContentStatus @default(DRAFT)
  editorId         String
  editor           User          @relation(fields: [editorId], references: [id])
  contentId        String?       // Linked to published content if applicable
  sourceContentId  String?       // Content that inspired this draft
  wordCount        Int           @default(0)
  readingTime      Int?          // minutes
  featured         Boolean       @default(false)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  publishedAt      DateTime?

  // Relations
  generationLogs   AIGenerationLog[]
  reviews          AIReview[]
  imagePrompts     AIImagePrompt[]
  version          Int           @default(1)

  @@index([editorId, status])
  @@index([status, createdAt])
  @@index([contentType])
  @@map("ai_drafts")
}

model AIGenerationLog {
  id               String         @id @default(cuid())
  draftId          String
  draft            AIDraft        @relation(fields: [draftId], references: [id])
  provider         AIProvider
  model            String         // e.g., "gpt-4o", "claude-sonnet-4-20250514"
  promptTemplateId String?
  promptTemplate   PromptTemplate? @relation(fields: [promptTemplateId], references: [id])
  promptUsed       String         @db.Text  // The actual prompt sent (for debugging)
  systemPrompt     String?        @db.Text
  response         String         @db.Text  // AI response
  tokensInput      Int
  tokensOutput     Int
  costUsd          Decimal?       @db.Decimal(10, 6)
  latencyMs        Int
  temperature      Decimal?       @db.Decimal(3, 2)
  status           GenerationStatus @default(PENDING)
  errorMessage     String?
  createdAt        DateTime       @default(now())

  @@index([draftId])
  @@index([provider, createdAt])
  @@index([createdAt])
  @@map("ai_generation_logs")
}

model AIReview {
  id            String       @id @default(cuid())
  draftId       String
  draft         AIDraft      @relation(fields: [draftId], references: [id])
  reviewerId    String
  status        ReviewStatus @default(PENDING)
  comments      String?      @db.Text
  requestedChanges String?   @db.Text
  reviewedAt    DateTime?
  createdAt     DateTime     @default(now())

  @@index([draftId])
  @@index([status])
  @@map("ai_reviews")
}

model AIImagePrompt {
  id            String            @id @default(cuid())
  draftId       String
  draft         AIDraft           @relation(fields: [draftId], references: [id])
  prompt        String            @db.Text
  provider      AIProvider
  model         String?
  imageUrl      String?           // Generated image URL (if applicable)
  status        ImagePromptStatus @default(PENDING)
  isApproved    Boolean           @default(false)
  notes         String?           @db.Text
  createdAt     DateTime          @default(now())

  @@index([draftId])
  @@map("ai_image_prompts")
}

// ─────────────────────────────────────────────────────────────
// AI PROMPT TEMPLATES
// ─────────────────────────────────────────────────────────────

model PromptTemplate {
  id            String          @id @default(cuid())
  name          String          @unique
  description   String?
  category      String          // "content", "image", "seo", "review", "brand-voice"
  template      String          @db.Text  // Mustache-style template with {{variables}}
  systemPrompt  String?         @db.Text
  variables     Json?           // Array of variable definitions
  defaultParams Json?           // { temperature, maxTokens, topP, etc. }
  isActive      Boolean         @default(true)
  isSystem      Boolean         @default(false) // System templates can't be deleted
  version       Int             @default(1)
  createdBy     String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  // Relations
  versions      PromptVersion[]
  generationLogs AIGenerationLog[]

  @@index([category])
  @@index([isActive])
  @@map("prompt_templates")
}

model PromptVersion {
  id            String         @id @default(cuid())
  templateId    String
  template      PromptTemplate @relation(fields: [templateId], references: [id])
  version       Int
  content       String         @db.Text
  systemPrompt  String?        @db.Text
  changeNotes   String?
  createdBy     String?
  createdAt     DateTime       @default(now())

  @@unique([templateId, version])
  @@map("prompt_versions")
}

// ─────────────────────────────────────────────────────────────
// AI KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

model KnowledgeBaseEntry {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text
  sourceType    String   // "blog", "education", "service", "product", "manual"
  sourceId      String?  // ID of source content if applicable
  sourceUrl     String?  // URL to source
  author        String?
  tags          String[] // Array of tags for filtering
  isActive      Boolean  @default(true)
  lastIndexedAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  embeddings    KnowledgeBaseEmbedding[]

  @@index([sourceType, sourceId])
  @@index([isActive])
  @@map("knowledge_base_entries")
}

model KnowledgeBaseEmbedding {
  id        String             @id @default(cuid())
  entryId   String
  entry     KnowledgeBaseEntry @relation(fields: [entryId], references: [id])
  chunk     String             @db.Text  // The text chunk
  chunkIndex Int
  embedding Unsupported("vector(1536)")  // OpenAI text-embedding-3-small dimension
  metadata  Json?              // { heading, paragraph, etc. }

  @@index([entryId])
  @@map("knowledge_base_embeddings")
}

// ─────────────────────────────────────────────────────────────
// AI PROVIDER CONFIGURATION
// ─────────────────────────────────────────────────────────────

model AIProviderConfig {
  id            String           @id @default(cuid())
  provider      AIProvider       @unique
  displayName   String
  apiKeyEnc     String?          // Encrypted API key
  baseUrl       String?          // Custom base URL (for Ollama, Azure, etc.)
  defaultModel  String           // Default model for this provider
  status        AIProviderStatus @default(INACTIVE)
  priority      Int              @default(0)  // Lower = higher priority
  rateLimit     Int              @default(10) // Requests per minute
  monthlyBudget Decimal?         @db.Decimal(10, 2)
  monthlySpend  Decimal          @default(0) @db.Decimal(10, 2)
  lastUsedAt    DateTime?
  errorCount    Int              @default(0)
  lastError     String?
  config        Json?            // Provider-specific config
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@map("ai_provider_configs")
}

// ─────────────────────────────────────────────────────────────
// AI BRAND VOICE
// ─────────────────────────────────────────────────────────────

model BrandVoice {
  id            String   @id @default(cuid())
  name          String   @unique
  description   String?
  tone          String   // "professional", "warm", "clinical", "friendly"
  personality   String   // e.g., "caring, knowledgeable, approachable"
  vocabulary    String?  // Words/phrases to use
  avoidWords    String?  // Words/phrases to avoid
  writingStyle  String?  // Sentence length, paragraph style, etc.
  targetAudience String? // "patients", "professionals", "general"
  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)
  systemPrompt  String?  @db.Text  // Full system prompt for this voice
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("brand_voices")
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

model Notification {
  id        String              @id @default(cuid())
  userId    String
  user      User                @relation(fields: [userId], references: [id])
  type      NotificationType
  channel   NotificationChannel @default(IN_APP)
  title     String
  message   String              @db.Text
  data      Json?               // Related entity data
  isRead    Boolean             @default(false)
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime            @default(now())

  @@index([userId, isRead, createdAt])
  @@map("notifications")
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // "CREATE", "UPDATE", "DELETE", "PUBLISH", "LOGIN", etc.
  resource   String   // "content", "user", "appointment", "ai_draft", etc.
  resourceId String?
  oldValues  Json?
  newValues  Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([resource, resourceId])
  @@index([action, createdAt])
  @@map("audit_logs")
}

// ─────────────────────────────────────────────────────────────
// SETTINGS (Key-Value)
// ─────────────────────────────────────────────────────────────

model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  type      String   @default("string") // "string", "number", "boolean", "json"
  group     String   @default("general") // "general", "seo", "ai", "email", etc.
  label     String?
  helpText  String?
  isPublic  Boolean  @default(false) // Whether accessible on client side
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([group])
  @@map("settings")
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

model PageView {
  id         String   @id @default(cuid())
  path       String
  referrer   String?
  userAgent  String?
  ipHash     String?  // Hashed IP for uniqueness
  userId     String?  // If logged in
  sessionId  String
  duration   Int?     // ms on page
  createdAt  DateTime @default(now())

  @@index([path, createdAt])
  @@index([createdAt])
  @@index([sessionId])
  @@map("page_views")
}

model SearchLog {
  id         String   @id @default(cuid())
  query      String
  userId     String?
  results    Int      // Number of results
  clickedId  String?  // First clicked result
  createdAt  DateTime @default(now())

  @@index([query])
  @@index([createdAt])
  @@map("search_logs")
}
```

---

## 3. Entity Counts

| Category | Entities | Notes |
|---|---|---|
| Core | User, Role, Permission | Auth system |
| Content | Content, ContentVersion, BlogPost, Service, Product, EducationArticle, GalleryItem, TeamMember, FAQ, Testimonial, EducationFAQ | Unified content model |
| Categories | ProductCategory, Category, Tag, ContentTag, ContentCategory | Taxonomy |
| Appointments | Appointment | Scheduling |
| Contact | ContactSubmission, NewsletterSubscriber | Communication |
| Files | File | Upload management |
| SEO | SEOMetadata | Per-content SEO |
| AI | AIDraft, AIGenerationLog, AIReview, AIImagePrompt | Content generation |
| AI Prompts | PromptTemplate, PromptVersion | Prompt management |
| AI KB | KnowledgeBaseEntry, KnowledgeBaseEmbedding | RAG |
| AI Config | AIProviderConfig, BrandVoice | Provider + voice config |
| Notifications | Notification | User notifications |
| Audit | AuditLog | Activity tracking |
| Settings | Setting | Key-value config |
| Analytics | PageView, SearchLog | Usage analytics |
| **Total** | **47 models** | |

---

## 4. Key Design Decisions

### 4.1 Unified Content Table

All content types share a base `Content` table with type-specific extension tables (BlogPost, Service, etc.). This enables:
- Single query for all content listings
- Unified status workflow across all types
- Shared SEO metadata, tags, categories
- Single versioning system
- Easier AI integration (one draft system for all types)

### 4.2 Soft Deletion

All user-facing entities use `deletedAt` (nullable DateTime) instead of hard deletes. This preserves:
- Audit trail integrity
- SEO metadata
- AI generation history
- Referential integrity

### 4.3 Content Versioning

`ContentVersion` stores point-in-time snapshots. Each edit creates a new version, preserving full history. The `Content` table always holds the current version.

### 4.4 AI Draft Separation

AI-generated content lives in `AIDraft` until published, at which point it's copied to `Content`. This prevents AI content from polluting the live site and maintains the review workflow.

### 4.5 Knowledge Base Embeddings

`KnowledgeBaseEmbedding` stores pgvector embeddings for RAG retrieval. Each entry is chunked into multiple embeddings for granular retrieval. The `vector(1536)` type corresponds to OpenAI's `text-embedding-3-small` model.

### 4.6 Settings as Key-Value

`Setting` table stores all configurable options as key-value pairs with type hints. This enables runtime configuration without code changes, and admin UI for settings management.

---

## 5. Seed Data

The seed file will populate:

1. **Super Admin User** — admin@32smiles.com (password: generated on first run)
2. **Default Roles** — SUPER_ADMIN, ADMIN, EDITOR, VIEWER with permissions
3. **Product Categories** — Toothpaste, Brushes, Kids Products, Electrical Accessories, General Products
4. **Service Templates** — 6 services from the existing site
5. **Team Members** — 4 dentists from the existing site
6. **Testimonials** — 4 testimonials from the existing site
7. **Standalone FAQs** — 5 FAQs from the existing site
8. **Blog Posts** — 4 articles (body content migrated as HTML)
9. **Patient Education Articles** — 5 articles with linked FAQs
10. **Default Brand Voice** — "Professional & Warm" (dental clinic default)
11. **Prompt Templates** — 8+ default templates
12. **AI Provider Configs** — All 7 providers as INACTIVE
13. **Default Settings** — Site name, contact info, business hours, SEO defaults
14. **Gallery Items** — 9 items from existing site
15. **Products** — ~22 products across all categories

---

## 6. Migration Strategy

1. Initial schema → `prisma migrate dev`
2. Seed data → `prisma db seed`
3. Image files → Copy from existing `images/` to `public/images/`
4. Content body → Extract HTML from existing pages, store in `Content.body`
5. Product data → Extract from HTML tables, store in `Product` + `Content`
6. Blog content → Parse existing blog HTML, store in `BlogPost` + `Content`
7. Education content → Parse existing education HTML, store in `EducationArticle` + `Content`
8. FAQ content → Extract Q&A pairs, store in `FAQ` + `EducationFAQ`

**No content is lost.** All existing content is migrated to the new schema.
