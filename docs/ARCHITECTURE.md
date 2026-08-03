# 32Smiles — System Architecture

> **Date**: July 27, 2026
> **Version**: 1.0
> **Scope**: Full system architecture — Platform + AI Engine + AI Content Studio

---

## 1. Executive Summary

32Smiles is an enterprise healthcare platform for a dental clinic, built as a Next.js monolith with an integrated AI Content Intelligence engine. The platform serves three audiences:

1. **Patients** — public website with content, appointment booking, product catalog
2. **Administrators** — CMS dashboard managing all content, users, and AI workflows
3. **Content Editors** — AI Content Studio for content creation, review, and publication

The system is architecturally split into two coordinated systems:

- **32Smiles Platform** — the Next.js application (public site + admin dashboard)
- **AI Engine** — a provider-agnostic AI orchestration layer embedded in the platform

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CDN / Edge                            │
│                    (Vercel Edge Network)                     │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                   Next.js Application                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Presentation Layer                      │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │ │
│  │  │  Public   │  │    Admin     │  │    AI Studio      │ │ │
│  │  │   Site    │  │  Dashboard   │  │      (CMS)        │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   API Layer (Route Handlers)             │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │ │
│  │  │  Public   │  │  Protected   │  │   AI Generation   │ │ │
│  │  │   API     │  │    API       │  │      API          │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Application Layer                       │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │ │
│  │  │ Content   │  │   AI Engine  │  │  Notification     │ │ │
│  │  │  Mgmt     │  │  (Provider   │  │    Service        │ │ │
│  │  │  Service  │  │  Agnostic)   │  │                   │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Domain Layer                          │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │ │
│  │  │  Content  │  │   User &     │  │   Appointment     │ │ │
│  │  │  Domain   │  │   Auth       │  │    Domain         │ │ │
│  │  │          │  │   Domain     │  │                   │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Repository Layer                       │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │           Prisma ORM (Type-Safe Queries)          │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Database Layer                         │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │              PostgreSQL (via Prisma)               │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  PostgreSQL  │  │    Redis     │  │   External Services  │
│  Database    │  │   (Cache)    │  │  ┌────────────────┐  │
│              │  │              │  │  │  AI Providers  │  │
└──────────────┘  └──────────────┘  │  │  OpenAI       │  │
                                    │  │  Anthropic    │  │
                                    │  │  Gemini       │  │
                                    │  │  Groq         │  │
                                    │  │  Ollama       │  │
                                    │  │  Azure        │  │
                                    │  │  OpenRouter   │  │
                                    │  └────────────────┘  │
                                    │  ┌────────────────┐  │
                                    │  │  Email (Resend)│  │
                                    │  │  Storage (S3)  │  │
                                    │  │  CDN (Vercel)  │  │
                                    │  └────────────────┘  │
                                    └──────────────────────┘
```

---

## 3. Architecture Layers

### 3.1 Presentation Layer

**Route Handlers (Next.js App Router):**

| Route | Type | Auth | Description |
|---|---|---|---|
| `/` | Page | Public | Homepage |
| `/about` | Page | Public | About page |
| `/services` | Page | Public | Services directory |
| `/services/[slug]` | Page | Public | Individual service |
| `/patients/education` | Page | Public | Patient education hub |
| `/patients/education/[slug]` | Page | Public | Individual article |
| `/professionals/education` | Page | Public | Professional education hub |
| `/professionals/education/[slug]` | Page | Public | Individual article |
| `/products` | Page | Public | Product catalog |
| `/products/[category]` | Page | Public | Category listing |
| `/products/[category]/[slug]` | Page | Public | Individual product |
| `/blog` | Page | Public | Blog listing |
| `/blog/[slug]` | Page | Public | Individual post |
| `/gallery` | Page | Public | Gallery grid |
| `/faq` | Page | Public | FAQ accordion |
| `/team` | Page | Public | Team directory |
| `/team/[slug]` | Page | Public | Individual profile |
| `/contact` | Page | Public | Contact page |
| `/search` | Page | Public | Global search |
| `/admin` | Layout | Admin | Admin dashboard shell |
| `/admin/content` | Page | Admin | Content management |
| `/admin/content/[type]` | Page | Admin | Type-specific management |
| `/admin/content/[type]/[id]` | Page | Admin | Edit specific item |
| `/admin/content/new/[type]` | Page | Admin | Create new item |
| `/admin/ai-studio` | Page | Editor | AI Content Studio |
| `/admin/ai-studio/[draftId]` | Page | Editor | Edit draft in studio |
| `/admin/users` | Page | Admin | User management |
| `/admin/appointments` | Page | Admin | Appointment management |
| `/admin/analytics` | Page | Admin | Analytics dashboard |
| `/admin/settings` | Page | Admin | System settings |
| `/admin/seo` | Page | Admin | SEO management |
| `/admin/ai/knowledge-base` | Page | Admin | Knowledge base management |
| `/admin/ai/prompts` | Page | Admin | Prompt template management |
| `/admin/ai/providers` | Page | Admin | AI provider configuration |
| `/admin/ai/review` | Page | Editor | AI content review queue |
| `/admin/logs` | Page | Admin | Audit logs |

**API Routes:**

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/appointments` | POST | Public | Submit appointment request |
| `/api/contact` | POST | Public | Submit contact form |
| `/api/newsletter/subscribe` | POST | Public | Newsletter subscription |
| `/api/blog` | GET | Public | List blog posts |
| `/api/blog/[slug]` | GET | Public | Get single post |
| `/api/products` | GET | Public | List products |
| `/api/search` | GET | Public | Global search |
| `/api/content/[type]` | GET | Public | List content by type |
| `/api/content/[type]/[slug]` | GET | Public | Get content by slug |
| `/api/admin/content/[type]` | CRUD | Admin | Content CRUD |
| `/api/admin/users` | CRUD | Admin | User CRUD |
| `/api/admin/appointments` | CRUD | Admin | Appointment CRUD |
| `/api/admin/analytics` | GET | Admin | Analytics data |
| `/api/admin/seo` | CRUD | Admin | SEO metadata CRUD |
| `/api/admin/upload` | POST | Admin | File upload |
| `/api/admin/settings` | GET/PUT | Admin | System settings |
| `/api/admin/audit-logs` | GET | Admin | Audit log query |
| `/api/ai/generate` | POST | Editor | Content generation |
| `/api/ai/generate/image-prompt` | POST | Editor | Image prompt generation |
| `/api/ai/review/[draftId]` | POST | Editor | Submit for review |
| `/api/ai/approve/[draftId]` | POST | Admin | Approve draft |
| `/api/ai/publish/[draftId]` | POST | Admin | Publish draft |
| `/api/ai/providers/test` | POST | Admin | Test AI provider connection |
| `/api/ai/knowledge-base` | CRUD | Admin | Knowledge base CRUD |
| `/api/ai/prompts` | CRUD | Admin | Prompt template CRUD |

### 3.2 Application Layer

Services orchestrate business logic, calling domain logic and external services:

```
src/services/
├── appointment.service.ts     # Appointment creation, scheduling
├── contact.service.ts         # Contact form processing
├── content.service.ts         # Generic content CRUD with type dispatch
├── blog.service.ts            # Blog-specific logic (slugs, dates, featured)
├── product.service.ts         # Product catalog, categories, pricing
├── gallery.service.ts         # Gallery management, image processing
├── team.service.ts            # Team member management
├── faq.service.ts             # FAQ management, grouping
├── search.service.ts          # Full-text + semantic search orchestration
├── seo.service.ts             # SEO metadata generation and management
├── notification.service.ts    # Email + in-app notifications
├── analytics.service.ts       # Usage analytics, dashboards
├── upload.service.ts          # File upload, image optimization
├── user.service.ts            # User management, RBAC
├── auth.service.ts            # Authentication, session management
├── audit.service.ts           # Audit logging
└── settings.service.ts        # System settings management
```

### 3.3 Domain Layer

Pure business logic, no framework dependencies:

```
src/domains/
├── content/
│   ├── content.entity.ts          # Content base entity
│   ├── content-types.ts           # ContentType enum and type definitions
│   ├── content.workflow.ts        # Status transitions (Draft → Published)
│   ├── content.validation.ts      # Zod schemas per content type
│   └── content.events.ts          # Domain events (Created, Updated, Published)
├── appointment/
│   ├── appointment.entity.ts
│   ├── appointment.workflow.ts    # Status: Pending → Confirmed → Completed
│   └── appointment.validation.ts
├── user/
│   ├── user.entity.ts
│   ├── user.rbac.ts               # Role hierarchy, permissions
│   └── user.validation.ts
├── ai/
│   ├── draft.entity.ts            # AI draft with full lifecycle
│   ├── draft.workflow.ts          # Status transitions
│   ├── generation-request.ts      # AI generation request
│   ├── generation-response.ts     # AI generation response
│   ├── prompt-template.ts         # Prompt template entity
│   ├── knowledge-base.ts         # Knowledge base entry entity
│   ├── provider-config.ts        # Provider configuration entity
│   └── brand-voice.ts            # Brand voice configuration
└── shared/
    ├── base.entity.ts             # id, createdAt, updatedAt, deletedAt
    ├── slug.ts                    # Slug generation logic
    ├── pagination.ts              # Pagination helpers
    ├── search.ts                  # Search query building
    └── validation.ts              # Shared validation helpers
```

### 3.4 Repository Layer

Data access via Prisma, organized by domain:

```
src/repositories/
├── prisma/
│   ├── prisma.client.ts           # Singleton Prisma client
│   └── prisma.extensions.ts       # Custom Prisma extensions
├── content.repository.ts
├── blog.repository.ts
├── product.repository.ts
├── gallery.repository.ts
├── team.repository.ts
├── faq.repository.ts
├── appointment.repository.ts
├── user.repository.ts
├── ai/
│   ├── draft.repository.ts
│   ├── prompt-template.repository.ts
│   ├── knowledge-base.repository.ts
│   └── provider-config.repository.ts
├── seo.repository.ts
├── audit.repository.ts
├── settings.repository.ts
└── notification.repository.ts
```

---

## 4. Feature-First Module Structure

Each major feature is organized as a self-contained module:

```
src/
├── features/
│   ├── homepage/
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesCarousel.tsx
│   │   │   ├── FeaturedProducts.tsx
│   │   │   ├── TestimonialsSlider.tsx
│   │   │   ├── BlogPreview.tsx
│   │   │   └── CTASection.tsx
│   │   ├── page.tsx
│   │   └── actions.ts            # Server actions
│   ├── blog/
│   │   ├── components/
│   │   │   ├── BlogCard.tsx
│   │   │   ├── BlogGrid.tsx
│   │   │   ├── BlogSidebar.tsx
│   │   │   ├── BlogPost.tsx
│   │   │   └── BlogFilters.tsx
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   └── actions.ts
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── ProductQuickView.tsx
│   │   │   └── ProductBreadcrumb.tsx
│   │   ├── page.tsx
│   │   ├── [category]/page.tsx
│   │   ├── [category]/[slug]/page.tsx
│   │   └── actions.ts
│   ├── gallery/
│   │   ├── components/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── GalleryFilter.tsx
│   │   │   ├── GalleryLightbox.tsx
│   │   │   └── GalleryItem.tsx
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── services/
│   │   ├── components/
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── ServiceDetail.tsx
│   │   │   ├── ServicesDirectory.tsx
│   │   │   └── RelatedServices.tsx
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   └── actions.ts
│   ├── team/
│   │   ├── components/
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamGrid.tsx
│   │   │   └── TeamProfile.tsx
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   └── actions.ts
│   ├── appointment/
│   │   ├── components/
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── AppointmentModal.tsx
│   │   │   ├── TimeSlotPicker.tsx
│   │   │   └── AppointmentSuccess.tsx
│   │   └── actions.ts
│   ├── contact/
│   │   ├── components/
│   │   │   ├── ContactForm.tsx
│   │   │   ├── ContactInfo.tsx
│   │   │   └── ContactMap.tsx
│   │   └── actions.ts
│   ├── faq/
│   │   ├── components/
│   │   │   ├── FAQAccordion.tsx
│   │   │   ├── FAQCategory.tsx
│   │   │   └── FAQSearch.tsx
│   │   └── page.tsx
│   ├── education/
│   │   ├── components/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleContent.tsx
│   │   │   ├── EducationNav.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   └── RelatedArticles.tsx
│   │   ├── patients/[slug]/page.tsx
│   │   └── professionals/[slug]/page.tsx
│   ├── search/
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── SearchFilters.tsx
│   │   └── page.tsx
│   ├── admin/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── ContentTable.tsx
│   │   │   ├── ContentEditor.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── content/
│   │   ├── appointments/
│   │   ├── users/
│   │   ├── analytics/
│   │   ├── seo/
│   │   ├── settings/
│   │   └── logs/
│   └── ai-studio/
│       ├── components/
│       │   ├── StudioLayout.tsx
│       │   ├── DraftEditor.tsx
│       │   ├── AIAssistantPanel.tsx
│       │   ├── BrandVoiceSelector.tsx
│       │   ├── ProviderSelector.tsx
│       │   ├── PromptTemplateSelector.tsx
│       │   ├── GenerationPreview.tsx
│       │   ├── ReviewWorkflow.tsx
│       │   ├── SEOPanel.tsx
│       │   ├── ImagePromptPanel.tsx
│       │   ├── KnowledgeBaseSearch.tsx
│       │   ├── DiffView.tsx
│       │   └── PublishButton.tsx
│       ├── page.tsx
│       └── [draftId]/page.tsx
```

---

## 5. AI Engine Architecture

### 5.1 Provider Abstraction Layer

The AI Engine is provider-agnostic through a unified interface. Every provider implements the same contract:

```
src/lib/ai/
├── providers/
│   ├── base.ts                    # AIProvider interface + types
│   ├── openai.ts                  # OpenAI (GPT-4o, GPT-4o-mini, GPT-4-turbo)
│   ├── anthropic.ts               # Anthropic (Claude Sonnet 4, Haiku)
│   ├── gemini.ts                  # Google Gemini (2.5 Pro, 2.5 Flash)
│   ├── groq.ts                    # Groq (Llama 3.3, Mixtral)
│   ├── ollama.ts                  # Ollama (local models)
│   ├── azure.ts                   # Azure OpenAI
│   ├── openrouter.ts              # OpenRouter (meta-provider)
│   └── registry.ts                # Provider registry + factory
├── orchestrator.ts                # Orchestrates calls across providers
├── prompt/
│   ├── template-engine.ts         # Variable interpolation + chaining
│   ├── template-store.ts          # DB-backed prompt templates
│   ├── versioning.ts              # Prompt version management
│   └── brand-voice.ts            # Brand voice injection
├── knowledge/
│   ├── rag-pipeline.ts            # RAG retrieval + context injection
│   ├── embeddings.ts              # Embedding generation (vector)
│   ├── vector-store.ts            # pgvector for embeddings
│   ├── chunking.ts                # Document chunking strategies
│   └── relevance.ts              # Relevance scoring
├── types.ts                       # Shared AI types
├── config.ts                      # AI configuration
└── index.ts                       # Public API
```

### 5.2 Provider Interface

```typescript
interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  // Core methods
  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
  generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<GenerateStructuredResponse<T>>;

  // Optional capabilities (check capabilities before calling)
  generateImagePrompt?(request: ImagePromptRequest): Promise<ImagePromptResponse>;
  streamText?(request: StreamTextRequest): Promise<AsyncIterable<StreamChunk>>;

  // Health
  healthCheck(): Promise<HealthStatus>;
  estimateCost(request: GenerateTextRequest): Promise<CostEstimate>;
}
```

### 5.3 AI Workflow Pipeline

```
User Request
    │
    ▼
┌──────────────────┐
│  1. Parse Request │  Extract: content type, topic, target audience,
│                   │  word count, brand voice, provider preference
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. Load Context  │  Retrieve brand voice config from DB,
│                   │  load prompt template, fetch relevant KB docs
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. RAG Retrieval │  Vector search knowledge base for relevant
│                   │  approved content, inject as context
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. Build Prompt  │  Template interpolation → brand voice prefix →
│                   │  context injection → user instructions
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. Route to      │  Select provider (primary, fallback, or user
│     Provider      │  specified), apply rate limits + retries
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  6. Generate      │  Call provider, handle streaming/chunking,
│     Response      │  validate output schema, cost tracking
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  7. Post-Process  │  Content safety checks, format cleanup,
│                   │  citation validation, readability scoring
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  8. Store Draft   │  Save to database with status: AI_GENERATED,
│                   │  link to generation request, prompt used
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  9. Queue for     │  Notify editors, add to review queue,
│     Review        │  track in audit log
└──────────────────┘
```

### 5.4 Provider Routing Strategy

```
┌─────────────────────────────────────────────────┐
│              Provider Selection Logic             │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Check if user/editor specified a provider    │
│     → Use that provider (if available + healthy) │
│                                                  │
│  2. Check task-specific provider preference      │
│     → e.g., "long-form" → Anthropic,            │
│       "fast-draft" → Groq,                       │
│       "creative" → OpenAI                        │
│                                                  │
│  3. Use global primary provider from config      │
│     → Default: provider set in admin settings    │
│                                                  │
│  4. If primary fails, fallback chain:            │
│     → Try secondary provider                     │
│     → If all cloud fails, try Ollama (local)     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 5.5 Provider Cost Table (Approximate, 2026)

| Provider | Model | Input $/1M | Output $/1M | Speed | Quality |
|---|---|---|---|---|---|
| Groq | Llama 3.3 70B | $0.59 | $0.79 | ★★★★★ | ★★★☆☆ |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | ★★★★★ | ★★★☆☆ |
| Anthropic | Haiku 3.5 | $0.80 | $4.00 | ★★★★☆ | ★★★★☆ |
| OpenAI | GPT-4o | $2.50 | $10.00 | ★★★★☆ | ★★★★★ |
| Anthropic | Sonnet 4 | $3.00 | $15.00 | ★★★★☆ | ★★★★★ |
| Gemini | 2.5 Pro | $1.25 | $10.00 | ★★★☆☆ | ★★★★★ |
| Gemini | 2.5 Flash | $0.15 | $0.60 | ★★★★★ | ★★★★☆ |
| Anthropic | Opus 4 | $15.00 | $75.00 | ★★★☆☆ | ★★★★★ |
| OpenAI | GPT-4-turbo | $10.00 | $30.00 | ★★★☆☆ | ★★★★★ |
| Azure | GPT-4o | $2.50 | $10.00 | ★★★★☆ | ★★★★★ |
| OpenRouter | Various | Varies | Varies | Varies | Varies |
| Ollama | Local | $0.00 | $0.00 | ★★☆☆☆ | ★★★☆☆ |

### 5.6 Knowledge Base & RAG Pipeline

```
Approved Content (Published)
    │
    ▼
┌────────────────────┐
│ Document Ingestion  │  When content is published or updated
│                     │  trigger ingestion into knowledge base
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Chunking Strategy   │  Split by heading (H2/H3) with overlap,
│                     │  preserve semantic units
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Embedding Generation│  Use OpenAI text-embedding-3-small or
│                     │  dedicated embedding provider
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Vector Storage      │  pgvector extension in PostgreSQL
│                     │  with HNSW index for fast similarity
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Metadata Storage    │  Source URL, content type, publish date,
│                     │  author, tags — for filtered retrieval
└────────────────────┘


Query Time:
    │
    ▼
┌────────────────────┐
│ User Query          │
│ + Filters           │  (content type, date range, tags)
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Embed Query         │  Generate embedding for user query
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Vector Similarity   │  pgvector cosine similarity search
│ + Metadata Filter   │  with HNSW index
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Relevance Scoring   │  Combine similarity score with metadata
│                     │  relevance (freshness, authority, type)
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Context Assembly    │  Top-K results, formatted as context
│                     │  blocks with source citations
└────────────────────┘
```

---

## 6. Data Flow Patterns

### 6.1 Content Creation Flow

```
Editor creates draft
    │
    ▼
Draft saved (status: DRAFT)
    │
    ├── Editor writes manually → Save → Submit for review
    │
    └── Editor uses AI Studio:
        │
        ▼
    Select template + topic + params
        │
        ▼
    AI generates content (status: AI_GENERATED)
        │
        ▼
    Editor reviews in split-pane view
        │
        ├── Regenerate (try again or different provider)
        ├── Edit manually (modify AI output)
        ├── Add image prompt
        └── Submit for review (status: AI_ASSISTED)
            │
            ▼
        Review queue → Reviewer examines
            │
            ├── Request changes → Back to editor (status: REVISIONS_REQUESTED)
            ├── Reject → Status: REJECTED
            └── Approve (status: APPROVED)
                │
                ▼
            SEO review (status: SEO_REVIEW)
                │
                ├── SEO issues found → Back to editor
                └── SEO approved (status: SEO_APPROVED)
                    │
                    ▼
                Final approval (status: PUBLISHED)
                    │
                    ├── Triggers: RAG ingestion
                    ├── Triggers: Sitemap regeneration
                    ├── Triggers: Analytics snapshot
                    └── Triggers: Notification to subscribers
```

### 6.2 Appointment Booking Flow

```
Patient fills form
    │
    ▼
Zod validation (client + server)
    │
    ▼
Create appointment (status: PENDING)
    │
    ▼
Send confirmation email (Resend)
    │
    ▼
Admin sees in dashboard
    │
    ├── Confirm → Send confirmation email
    ├── Reschedule → New time + email
    ├── Cancel → Send cancellation email
    └── Complete → Mark done
```

### 6.3 Search Flow

```
User types query
    │
    ▼
Debounce (300ms)
    │
    ▼
POST /api/search
    │
    ├── Full-text search (PostgreSQL tsvector)
    │   └── Search across: blog, products, education, services, team, FAQ
    │
    ├── Semantic search (pgvector)
    │   └── Vector similarity on knowledge base embeddings
    │
    └── Fuzzy search (Fuse.js client-side for navigation)
    │
    ▼
Merge + deduplicate results
    │
    ▼
Rank by: relevance score + content type priority + recency
    │
    ▼
Return paginated results with snippets
```

---

## 7. Authentication & Authorization

### 7.1 Auth.js (NextAuth.js) Configuration

```typescript
// Providers:
// - CredentialsProvider (email + password)
// - GitHubProvider (optional, for admin SSO)

// Session strategy: JWT (stateless)
// Callbacks:
// - jwt: attach user role + permissions
// - session: expose user id, role, permissions to client
```

### 7.2 Role Hierarchy

```
SUPER_ADMIN
    │
    ▼
ADMIN
    │
    ├── Can manage users, settings, AI providers
    ├── Can approve/publish content
    ├── Can manage appointments
    └── Can view analytics
    │
    ▼
EDITOR
    │
    ├── Can create/edit content
    ├── Can use AI Studio
    ├── Can submit for review
    ├── Can approve content (not publish)
    └── Cannot manage users or settings
    │
    ▼
VIEWER
    │
    └── Read-only access to admin dashboard
```

### 7.3 Permission Matrix

| Resource | SUPER_ADMIN | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| Users | CRUD | CRU | - | - |
| Settings | CRUD | R | - | - |
| AI Providers | CRUD | RU | R | - |
| AI Prompts | CRUD | CRUD | CRUD | R |
| AI Knowledge Base | CRUD | CRUD | CRUD | R |
| Content | CRUD | CRUD | CRUD | R |
| Content (publish) | Yes | Yes | No | No |
| Appointments | CRUD | CRUD | R | R |
| Analytics | Full | Full | Limited | Limited |
| Audit Logs | Full | Full | - | - |
| Contact Submissions | CRUD | CRUD | R | R |
| SEO Metadata | CRUD | CRUD | R | - |

---

## 8. External Service Integrations

### 8.1 Email — Resend

| Email | Trigger | Template |
|---|---|---|
| Appointment confirmation | Appointment created | `appointment-confirm` |
| Appointment reminder | 24h before appointment | `appointment-reminder` |
| Appointment update | Status change | `appointment-update` |
| Contact form acknowledgment | Contact submitted | `contact-ack` |
| Contact form notification | Contact submitted | `contact-admin` |
| Newsletter welcome | Subscriber added | `newsletter-welcome` |
| Newsletter digest | Weekly | `newsletter-digest` |
| Password reset | Requested | `password-reset` |
| Welcome (new user) | User created | `welcome-user` |
| AI content ready | Draft submitted for review | `ai-review-ready` |
| AI content approved | Draft approved | `ai-content-approved` |

### 8.2 File Storage

- **Development**: Local `public/uploads/` directory
- **Production**: Vercel Blob Storage or AWS S3
- **Optimization**: Next.js `Image` component with `next/image` for responsive images
- **Upload constraints**: Max 10MB per file, allowed types: jpg, png, webp, gif

### 8.3 Maps

- **Provider**: Google Maps JavaScript API (existing iframe, will migrate to `@react-google-maps/api`)
- **Purpose**: Clinic location display on contact page

---

## 9. Performance Architecture

### 9.1 Caching Strategy

| Layer | Technology | TTL | Invalidation |
|---|---|---|---|
| HTTP Cache | CDN (Vercel) | 60s-1h | Tag-based revalidation |
| Page Cache | Next.js ISR | 60s | On-demand revalidation |
| API Cache | Next.js fetch cache | 30s | Time + manual |
| Query Cache | TanStack Query (client) | 30s-5min | Mutations + refetch |
| Session Cache | Redis | 24h | On logout |
| Static Assets | CDN | 1yr | Fingerprinted filenames |

### 9.2 Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| Lighthouse Performance | 95+ | ISR, Image optimization, Code splitting |
| Lighthouse Accessibility | 100 | Semantic HTML, ARIA, Keyboard nav |
| Lighthouse Best Practices | 100 | Security headers, no console errors |
| Lighthouse SEO | 100 | Meta tags, structured data, sitemap |
| First Contentful Paint | < 1.2s | SSR + Streaming |
| Largest Contentful Paint | < 2.5s | Image optimization, preload |
| Total Blocking Time | < 200ms | Code splitting, lazy loading |
| Cumulative Layout Shift | < 0.1 | Aspect ratios, font loading |

### 9.3 Code Splitting Strategy

```
Vendor bundle (React, Next.js, etc.) → cached aggressively
UI library (shadcn components) → per-page chunks
Feature modules → dynamic imports (lazy loaded)
Admin dashboard → separate bundle (only loaded for /admin/*)
AI Studio → separate bundle (only loaded for /admin/ai-studio/*)
Heavy libs (Framer Motion, Recharts) → dynamic imports
```

---

## 10. Security Architecture

### 10.1 Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.resend.com; frame-ancestors 'none';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 10.2 Input Validation

- All API inputs validated with Zod schemas
- All form inputs validated client + server (double validation)
- SQL injection prevented by Prisma parameterized queries
- XSS prevented by React's default escaping + CSP headers
- CSRF protected by SameSite cookies + CSRF tokens for forms

### 10.3 AI Safety

- All AI outputs go through content safety check before storage
- AI never auto-publishes — always requires human approval
- AI generation cost tracking per user + per provider
- Rate limiting: 10 generations per user per hour (configurable)
- Provider API keys stored encrypted in database, never in environment after initial config
- Ollama fallback ensures offline capability without external API exposure

---

## 11. Directory Structure

```
32Smile.com/
├── docs/                           # Architecture documentation
│   ├── PROJECT_AUDIT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── COMPONENTS.md
│   ├── AI-ENGINE.md
│   ├── AI-STUDIO.md
│   ├── ROADMAP.md
│   ├── MIGRATION.md
│   ├── DECISIONS.md
│   └── DEPLOYMENT.md
├── public/                         # Static assets
│   ├── images/                     # Migrated images
│   ├── uploads/                    # User uploads (dev)
│   └── fonts/                      # Custom fonts (if needed)
├── prisma/                         # Database schema + migrations
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/                            # Source code
│   ├── app/                        # Next.js App Router routes
│   │   ├── (public)/               # Public routes group
│   │   │   ├── layout.tsx          # Public layout (header, footer)
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── about/page.tsx
│   │   │   ├── services/
│   │   │   ├── blog/
│   │   │   ├── products/
│   │   │   ├── gallery/page.tsx
│   │   │   ├── team/
│   │   │   ├── faq/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── education/
│   │   ├── (admin)/                # Admin routes group
│   │   │   ├── layout.tsx          # Admin layout (sidebar, auth check)
│   │   │   └── admin/
│   │   │       ├── page.tsx        # Dashboard
│   │   │       ├── content/
│   │   │       ├── ai-studio/
│   │   │       ├── users/
│   │   │       ├── appointments/
│   │   │       ├── analytics/
│   │   │       ├── seo/
│   │   │       ├── settings/
│   │   │       └── logs/
│   │   ├── api/                    # API routes
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css
│   ├── features/                   # Feature modules
│   ├── components/                 # Shared UI components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/                 # Layout components
│   │   ├── forms/                  # Form components
│   │   └── shared/                 # Domain-agnostic shared
│   ├── domains/                    # Domain logic (pure)
│   ├── repositories/               # Data access
│   ├── services/                   # Application services
│   ├── lib/                        # Utilities
│   │   ├── ai/                     # AI Engine
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth.ts                 # Auth.js configuration
│   │   ├── email.ts                # Resend client
│   │   ├── storage.ts              # File storage client
│   │   ├── search.ts               # Search utilities
│   │   ├── seo.ts                  # SEO utilities
│   │   ├── validators.ts           # Shared Zod schemas
│   │   └── utils.ts                # General utilities
│   ├── hooks/                      # React hooks
│   ├── stores/                     # Zustand stores
│   ├── types/                      # TypeScript types
│   └── config/                     # Configuration
│       ├── site.ts                 # Site metadata
│       ├── navigation.ts           # Navigation structure
│       ├── services.ts             # Service definitions
│       └── products.ts             # Product categories
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
└── README.md
```

---

## 12. Key Design Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Next.js monolith (not microservices) | Clinic-sized scope; single deployment; simpler ops |
| 2 | Feature-first, not layer-first | Discoverability; features are self-contained |
| 3 | Domain layer is framework-free | Testable, portable, AI-assistant-friendly |
| 4 | Prisma over Drizzle | Better DX, visual schema editor, migrations |
| 5 | AI Engine as library, not service | Simpler deployment, same DB, lower latency |
| 6 | pgvector over Pinecone | Single database, lower cost, sufficient for 100K docs |
| 7 | Zustand over Redux | Less boilerplate, simpler mental model |
| 8 | shadcn/ui over component library | Ownership, customization, no version drift |
| 9 | Auth.js over Clerk/Supabase | Self-hosted, no vendor lock-in |
| 10 | Resend over SendGrid | Simpler API, better DX, modern |
| 11 | Framer Motion for animations | Declarative, performant, React-native |
| 12 | Fuse.js for client search | Lightweight, no server needed, good UX |
| 13 | ISR over pure SSR | Better performance, lower DB load |
| 14 | Server Components by default | Less JS shipped, better performance |
| 15 | Zod everywhere | Single validation library, type inference |
