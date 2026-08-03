# 32Smiles — Architecture Decision Records

> **Date**: July 27, 2026
> **Version**: 1.0
> **Format**: Lightweight ADR (Architecture Decision Record)

---

## ADR-001: Monolith Over Microservices

**Status**: Accepted
**Date**: 2026-07-27

### Context
The 32Smiles platform includes a public website, admin CMS, and AI engine. We need to decide the deployment architecture.

### Decision
We will build a **Next.js monolith** that includes all three systems (public site, admin dashboard, AI engine) in a single deployment.

### Rationale
- Clinic-sized scope doesn't warrant microservice complexity
- Single deployment = simpler CI/CD, lower ops cost
- Next.js App Router handles both server and client rendering efficiently
- AI Engine is a library (not a separate service) — same database, lower latency
- Team size is 1 developer — microservices would be overkill

### Consequences
- All features deploy together (cannot deploy AI changes independently)
- Database schema changes affect the whole app
- Scaling is vertical (single server) rather than horizontal per-service
- Mitigated by: feature flags for independent feature activation

---

## ADR-002: Next.js App Router Over Pages Router

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need to choose between Next.js App Router (React Server Components) and Pages Router (traditional SSR).

### Decision
We will use **Next.js App Router** with React Server Components by default.

### Rationale
- Server Components reduce client-side JavaScript shipped
- Built-in loading states, error boundaries, layouts
- Better ISR and streaming support
- Layout nesting reduces code duplication
- Server Actions simplify form handling
- Industry direction — App Router is the future

### Consequences
- Some client-side libraries need `'use client'` directive
- Learning curve for Server Components mental model
- Data fetching patterns differ from Pages Router

---

## ADR-003: Prisma Over Drizzle ORM

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need a TypeScript ORM for PostgreSQL. Main contenders: Prisma, Drizzle.

### Decision
We will use **Prisma ORM**.

### Rationale
- Superior developer experience (auto-generated client, visual schema editor)
- Comprehensive migration system
- Type-safe queries with excellent IDE support
- `previewFeatures = ["postgresqlExtensions"]` supports pgvector
- Larger community, more resources, better documentation
- Prisma Studio for visual database browsing (useful for debugging)

### Consequences
- Slightly larger bundle than Drizzle
- Query performance can be less optimal for complex joins (mitigated by raw queries when needed)
- Prisma Client generation adds to build time
- Acceptable tradeoffs for this project's scale

---

## ADR-004: shadcn/ui Over Component Libraries

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need a UI component library. Options: shadcn/ui, Radix UI (raw), Headless UI, Mantine, Chakra UI.

### Decision
We will use **shadcn/ui** (built on Radix UI primitives + Tailwind CSS).

### Rationale
- Components are copied into the project — full ownership and control
- No version drift or dependency on external library updates
- Tailwind-native styling — no CSS-in-JS overhead
- Built on Radix UI primitives — excellent accessibility
- Highly customizable — modify components as needed
- Growing ecosystem, excellent documentation

### Consequences
- Initial setup requires `npx shadcn-ui@latest add` for each component
- No automatic updates — we manage component versions
- Must keep Radix UI dependencies updated manually
- Acceptable for a project that needs deep customization

---

## ADR-005: AI Engine as Embedded Library

**Status**: Accepted
**Date**: 2026-07-27

### Context
The AI Engine could be a separate microservice or embedded in the Next.js app.

### Decision
The AI Engine will be an **embedded library** within the Next.js monolith (`src/lib/ai/`).

### Rationale
- Shares the same database — no cross-service communication needed
- Lower latency — no network hop between app and AI service
- Simpler deployment — single process
- Provider API calls happen server-side (API keys never exposed)
- Can be extracted to a separate service later if needed

### Consequences
- AI operations share resources with web server
- Long-running generations could impact web request handling
- Mitigated by: timeout limits, streaming responses, and potential worker threads
- Cost tracking and rate limiting are simpler (same process)

---

## ADR-006: pgvector Over External Vector Database

**Status**: Accepted
**Date**: 2026-07-27

### Context
For RAG (Retrieval-Augmented Generation), we need vector storage. Options: pgvector, Pinecone, Weaviate, Qdrant.

### Decision
We will use **pgvector** (PostgreSQL extension).

### Rationale
- Single database for all data — no additional service to manage
- Sufficient performance for 100K documents (our expected maximum)
- HNSW indexing provides good search performance
- No additional cost (vs. Pinecone's $70+/month)
- PostgreSQL is already in our stack
- `Unsupported("vector(1536)")` type support in Prisma

### Consequences
- Vector search may be slower than purpose-built vector DBs at very large scales
- Not optimized for billion-scale vector search
- Acceptable — 32Smiles will never have more than a few thousand documents
- Can migrate to dedicated vector DB later if needed

---

## ADR-007: Zustand Over Redux Toolkit

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need client-side state management. Options: Redux Toolkit, Zustand, Jotai, Recoil, React Context.

### Decision
We will use **Zustand**.

### Rationale
- Minimal boilerplate (no actions, reducers, dispatchers)
- Simple mental model — just a store with state and methods
- No providers needed — direct imports
- Built-in persist middleware for localStorage
- Excellent TypeScript support
- Small bundle size (~2KB)

### Consequences
- Less structured than Redux (no enforced patterns)
- No DevTools by default (but available as middleware)
- Good for our scale — doesn't need Redux's formality

---

## ADR-008: Auth.js Over Managed Auth Services

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need authentication. Options: Auth.js (NextAuth), Clerk, Supabase Auth, Firebase Auth.

### Decision
We will use **Auth.js (NextAuth.js)** with Credentials provider.

### Rationale
- Self-hosted — no vendor lock-in
- No per-user pricing (Clerk charges $0.02/user/month)
- Full control over user data and auth flow
- JWT session strategy — no database lookups for session validation
- Works with any database via Prisma adapter
- Supports multiple providers if SSO is needed later

### Consequences
- We manage password hashing, reset flows, etc.
- No built-in email verification (must implement ourselves)
- Acceptable for admin-only auth (not public-facing registration)

---

## ADR-009: Resend Over SendGrid

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need transactional email delivery. Options: Resend, SendGrid, Mailgun, AWS SES.

### Decision
We will use **Resend**.

### Rationale
- Modern, clean API — excellent DX
- React Email integration for template building
- Generous free tier (100 emails/day, 3K/month)
- No complex verification/setup process
- Good deliverability

### Consequences
- Smaller ecosystem than SendGrid
- Fewer integrations with third-party tools
- Acceptable — we only need transactional email, not marketing

---

## ADR-010: Feature-First Directory Structure

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need to organize source code. Options: feature-first, layer-first, domain-driven.

### Decision
We will use **feature-first** directory structure with layered internals.

```
src/features/
├── blog/
│   ├── components/    # UI components
│   ├── page.tsx       # Route
│   └── actions.ts     # Server actions
```

### Rationale
- Features are self-contained and discoverable
- Easy to find all code related to a feature
- New developers can understand the codebase quickly
- Each feature can have its own components, hooks, and utils
- Layers exist within features (not as top-level directories)

### Consequences
- Shared components need to be in a shared directory
- Some duplication possible between features
- Mitigated by: shared `components/ui/` and `components/shared/`

---

## ADR-011: Framer Motion for Animations

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need client-side animations. Options: Framer Motion, React Spring, CSS animations only, GSAP.

### Decision
We will use **Framer Motion** for complex animations, CSS for simple transitions.

### Rationale
- Declarative API that integrates naturally with React
- Built-in scroll-triggered animations (`whileInView`)
- Layout animations for smooth component transitions
- Gesture support for mobile (drag, tap)
- Large community, well-maintained

### Consequences
- Adds ~30KB to bundle (tree-shakeable)
- Must use `'use client'` for components using Framer Motion
- Simple animations (hover, focus) should use CSS to avoid loading Framer Motion unnecessarily

---

## ADR-012: Server Components by Default

**Status**: Accepted
**Date**: 2026-07-27

### Context
React Server Components (RSC) are the default in App Router. We need to decide when to use client components.

### Decision
**Server Components by default.** Only use `'use client'` when the component needs:
- Event handlers (onClick, onChange)
- Browser APIs (window, document, localStorage)
- State (useState, useReducer)
- Effects (useEffect)
- Custom hooks that use any of the above

### Rationale
- Server Components ship zero JavaScript to the client
- Better performance — less JS = faster page loads
- Direct database access in components (no API layer needed)
- Better SEO — content is server-rendered

### Consequences
- Must think carefully about component boundaries
- Some patterns don't work with RSC (e.g., context providers)
- Mitigated by: clear component naming conventions

---

## ADR-013: No Redux-like Global State

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need to manage state across components. Should we use a global state solution?

### Decision
**Minimize global state.** Use:
1. URL state (search params, routing) for page-level state
2. Server Components for data fetching
3. Zustand only for truly global UI state (sidebar, modals, AI studio)
4. React Context for theme/auth only

### Rationale
- Most state is URL-addressable (filters, pagination, tabs)
- Server Components eliminate need for client-side data fetching state
- Fewer global stores = less complexity
- TanStack Query handles server state caching

### Consequences
- Some duplication of state management patterns
- Need to be disciplined about when to use Zustand vs. local state
- Good tradeoff for reduced complexity

---

## ADR-014: Zod for Validation Everywhere

**Status**: Accepted
**Date**: 2026-07-27

### Context
We need input validation on client and server. Options: Zod, Yup, Joi, Valibot.

### Decision
We will use **Zod** for all validation.

### Rationale
- TypeScript-first — infers types directly from schemas
- Works natively with React Hook Form (`zodResolver`)
- Prisma integration via `prisma-zod-generator` (optional)
- Excellent error messages
- Small bundle size
- Single validation library = consistent patterns

### Consequences
- Schema definitions are the single source of truth
- Must define schemas before components (good practice anyway)
- Type inference eliminates manual interface definitions

---

## ADR-015: ISR Over Pure SSR/SSG

**Status**: Accepted
**Date**: 2026-07-27

### Context
Content pages (blog, products, education) need a rendering strategy. Options: SSR, SSG, ISR.

### Decision
We will use **ISR (Incremental Static Regeneration)** with 60-second revalidation + on-demand revalidation.

### Rationale
- Content doesn't change every request — ISR caches effectively
- Better performance than SSR (cached HTML served from CDN)
- On-demand revalidation triggers when content is published/updated
- Reduces database load significantly
- Good for SEO — pages are pre-rendered

### Consequences
- Content updates may take up to 60 seconds to appear (without on-demand revalidation)
- Must implement revalidation webhooks for immediate updates
- Acceptable — admin content changes trigger immediate revalidation
