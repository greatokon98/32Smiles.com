# 32Smiles — Development Roadmap

> **Date**: July 27, 2026
> **Version**: 1.0
> **Estimated Duration**: 12-16 weeks (1 developer)

---

## Phase Overview

| Phase | Name | Duration | Dependencies |
|---|---|---|---|
| 1 | Foundation & Infrastructure | 2 weeks | None |
| 2 | Core Content System | 2 weeks | Phase 1 |
| 3 | Public Website Pages | 2 weeks | Phase 2 |
| 4 | Admin Dashboard | 2 weeks | Phase 2 |
| 5 | AI Engine Core | 2 weeks | Phase 1 |
| 6 | AI Content Studio | 2 weeks | Phase 5 |
| 7 | Search & Discovery | 1 week | Phase 3 |
| 8 | Email & Notifications | 1 week | Phase 4 |
| 9 | Analytics & SEO | 1 week | Phase 3, 4 |
| 10 | Polish & Launch | 1-2 weeks | All |

---

## Phase 1: Foundation & Infrastructure (Weeks 1-2)

**Goal**: Project scaffold, database, auth, base UI

### Tasks
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up Prisma with PostgreSQL
- [ ] Create database schema (see DATABASE.md)
- [ ] Run initial migration
- [ ] Set up Auth.js with Credentials provider
- [ ] Create user seeding (Super Admin)
- [ ] Build base layout (public + admin)
- [ ] Configure environment variables
- [ ] Set up linting (ESLint + Prettier)
- [ ] Create seed script with initial data
- [ ] Set up file upload infrastructure

### Deliverables
- Running Next.js app with login/logout
- Database with all tables created
- Admin user can log in
- Base layouts render correctly

---

## Phase 2: Core Content System (Weeks 3-4)

**Goal**: Content CRUD, type system, workflow

### Tasks
- [ ] Implement Content entity and repository
- [ ] Build content service layer
- [ ] Create content type definitions (BlogPost, Service, Product, etc.)
- [ ] Build content status workflow (Draft → Published)
- [ ] Implement version history
- [ ] Create content API routes
- [ ] Build admin content list page
- [ ] Build admin content editor page
- [ ] Implement rich text editor (Tiptap/Lexical)
- [ ] Build file upload system
- [ ] Create SEO metadata system
- [ ] Implement tags and categories

### Deliverables
- Admin can create, edit, delete all content types
- Content has status workflow
- Rich text editor works
- File upload works
- SEO metadata can be set per content item

---

## Phase 3: Public Website Pages (Weeks 5-6)

**Goal**: All public-facing pages live and styled

### Tasks
- [ ] Homepage (hero, services, products, testimonials, blog preview)
- [ ] About page (team, mission, features)
- [ ] Services directory + individual service pages
- [ ] Blog listing + individual blog posts
- [ ] Product catalog + category + individual products
- [ ] Gallery page with filtering
- [ ] Patient education hub + articles
- [ ] Professional education hub + articles
- [ ] FAQ page
- [ ] Team directory + individual profiles
- [ ] Contact page with form
- [ ] 404 page
- [ ] Responsive design for all breakpoints
- [ ] Framer Motion animations on all sections

### Deliverables
- All 20+ public pages are live and styled
- Mobile responsive
- Animations working
- Content pulled from database

---

## Phase 4: Admin Dashboard (Weeks 7-8)

**Goal**: Full admin CMS

### Tasks
- [ ] Admin dashboard layout (sidebar, header)
- [ ] Dashboard home with stats cards
- [ ] Content management (per-type CRUD)
- [ ] Appointment management (list, status, calendar view)
- [ ] Contact submissions (list, mark read, reply)
- [ ] User management (invite, edit, deactivate)
- [ ] Settings pages (general, SEO, email)
- [ ] Role-based access control enforcement
- [ ] Audit logging for all admin actions

### Deliverables
- Admin can manage all content types from dashboard
- Admin can manage appointments
- Admin can manage users
- All admin actions are logged

---

## Phase 5: AI Engine Core (Weeks 9-10)

**Goal**: Provider abstraction, prompt management, RAG

### Tasks
- [ ] Build AI provider abstraction layer
- [ ] Implement OpenAI provider
- [ ] Implement Groq provider
- [ ] Implement Anthropic provider
- [ ] Implement Gemini provider
- [ ] Implement Ollama provider (local fallback)
- [ ] Build provider registry + routing
- [ ] Create prompt template system
- [ ] Build prompt versioning
- [ ] Implement brand voice system
- [ ] Set up pgvector for embeddings
- [ ] Build RAG pipeline (ingestion + retrieval)
- [ ] Create content safety checker
- [ ] Implement rate limiting
- [ ] Implement cost tracking
- [ ] Build AI admin settings (provider config, prompts, KB)
- [ ] Create API endpoints for all AI operations

### Deliverables
- AI can generate content with any configured provider
- Prompt templates are DB-managed and versioned
- Brand voice is configurable
- Knowledge base ingests published content
- Cost tracking works
- Rate limiting works

---

## Phase 6: AI Content Studio (Weeks 11-12)

**Goal**: The human-AI collaboration interface

### Tasks
- [ ] Build StudioLayout (three-panel)
- [ ] Build DraftEditor with rich text
- [ ] Build AIAssistantPanel (template, params, provider, generate)
- [ ] Build generation progress UI
- [ ] Build diff view for comparing versions
- [ ] Build review workflow UI
- [ ] Build SEO panel with Google preview
- [ ] Build image prompt generation panel
- [ ] Build knowledge base search panel
- [ ] Build generation history panel
- [ ] Implement auto-save
- [ ] Implement keyboard shortcuts
- [ ] Build mobile responsive Studio
- [ ] Create API endpoints for studio operations

### Deliverables
- Editors can create content with AI assistance
- Full review workflow (Draft → Review → SEO → Publish)
- Image prompt generation works
- KB search and context insertion works
- Auto-save works

---

## Phase 7: Search & Discovery (Week 13)

**Goal**: Global search + semantic search

### Tasks
- [ ] Implement PostgreSQL full-text search
- [ ] Build semantic search with pgvector
- [ ] Create search API endpoint
- [ ] Build search UI (results page)
- [ ] Implement search suggestions/autocomplete
- [ ] Add search logging
- [ ] Build Fuse.js client-side search for navigation
- [ ] Create command palette (⌘K)

### Deliverables
- Global search works across all content types
- Search suggestions appear as user types
- Command palette available

---

## Phase 8: Email & Notifications (Week 13-14)

**Goal**: Email delivery + in-app notifications

### Tasks
- [ ] Set up Resend client
- [ ] Create email templates (MJML or React Email)
- [ ] Implement appointment confirmation email
- [ ] Implement appointment reminder email
- [ ] Implement contact form acknowledgment
- [ ] Implement contact form admin notification
- [ ] Implement newsletter subscription
- [ ] Build in-app notification system
- [ ] Build notification bell UI
- [ ] Implement password reset flow

### Deliverables
- Appointment emails send automatically
- Contact form sends acknowledgments
- In-app notifications work
- Password reset works

---

## Phase 9: Analytics & SEO (Week 14)

**Goal**: Analytics dashboard + SEO automation

### Tasks
- [ ] Implement page view tracking
- [ ] Build analytics dashboard (Recharts)
- [ ] Create search log analytics
- [ ] Auto-generate sitemap.xml
- [ ] Auto-generate robots.txt
- [ ] Implement structured data (JSON-LD)
- [ ] Build OG image generation (or upload)
- [ ] Create breadcrumb system with schema

### Deliverables
- Analytics dashboard shows real-time data
- Sitemap auto-generates
- Structured data on all pages
- SEO scores 100 on Lighthouse

---

## Phase 10: Polish & Launch (Weeks 15-16)

**Goal**: Testing, performance, deployment

### Tasks
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance optimization (Lighthouse 95+)
- [ ] Accessibility audit (WCAG AA)
- [ ] Security audit
- [ ] Error handling + error boundaries
- [ ] Loading states for all pages
- [ ] Empty states for all lists
- [ ] Final content migration from old site
- [ ] Configure production environment
- [ ] Set up Vercel deployment
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry or similar)
- [ ] Create deployment documentation
- [ ] User acceptance testing

### Deliverables
- Lighthouse scores 95+/100/100/100
- All content migrated
- Production deployment live
- Custom domain configured
- Monitoring active

---

## Post-Launch Enhancements (Future)

| Enhancement | Priority | Estimated Effort |
|---|---|---|
| Newsletter system (weekly digest) | High | 1 week |
| Appointment reminders (24h before) | High | 3 days |
| Multi-language support (EN/IG/HA) | Medium | 2 weeks |
| Live chat integration | Medium | 1 week |
| Patient portal (login, view appointments) | Medium | 2 weeks |
| E-commerce checkout (Paystack) | Low | 2 weeks |
| Mobile app (React Native) | Low | 4 weeks |
| AI chatbot for patient FAQs | Medium | 1 week |
| Social media auto-posting | Low | 1 week |
| Advanced analytics (cohort, funnel) | Low | 1 week |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| AI provider API changes | Medium | Abstract interface, multi-provider |
| Content migration complexity | High | Scripted migration, manual verification |
| Performance issues with large content | Medium | ISR, pagination, caching |
| Security vulnerabilities | High | Regular audits, CSP headers, input validation |
| Scope creep | High | Strict phase adherence, documented decisions |
| Vercel cold starts | Medium | ISR, edge functions, static generation |
