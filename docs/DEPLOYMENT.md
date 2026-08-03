# 32Smiles — Deployment & Infrastructure Guide

> **Date**: July 27, 2026
> **Version**: 1.0
> **Target Platform**: Vercel (primary) + PostgreSQL (Supabase or Neon)

---

## 1. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PRODUCTION ENVIRONMENT                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐                      │
│  │   Vercel      │     │  Supabase    │                      │
│  │   (Next.js)   │────▶│  (PostgreSQL)│                      │
│  │              │     │  + pgvector  │                      │
│  └──────┬───────┘     └──────────────┘                      │
│         │                                                     │
│         ├────────────▶ Resend (Email)                        │
│         │                                                     │
│         ├────────────▶ OpenAI API                            │
│         ├────────────▶ Anthropic API                         │
│         ├────────────▶ Groq API                              │
│         ├────────────▶ Gemini API                            │
│         │                                                     │
│         └────────────▶ Vercel Blob (File Storage)            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variables

### 2.1 Required Variables

```env
# ─────────────────────────────────────
# Database
# ─────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# ─────────────────────────────────────
# Authentication
# ─────────────────────────────────────
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="https://32smiles.com"

# ─────────────────────────────────────
# Application
# ─────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://32smiles.com"
NEXT_PUBLIC_APP_NAME="32Smiles Dental Clinic"
NODE_ENV="production"

# ─────────────────────────────────────
# AI Providers (configured via admin UI after first setup)
# ─────────────────────────────────────
OPENAI_API_KEY=""           # Set via admin settings
ANTHROPIC_API_KEY=""        # Set via admin settings
GEMINI_API_KEY=""           # Set via admin settings
GROQ_API_KEY=""             # Set via admin settings
OLLAMA_BASE_URL="http://localhost:11434"  # For local fallback

# ─────────────────────────────────────
# Email
# ─────────────────────────────────────
RESEND_API_KEY=""           # Set via admin settings
EMAIL_FROM="noreply@32smiles.com"

# ─────────────────────────────────────
# File Storage
# ─────────────────────────────────────
BLOB_READ_WRITE_TOKEN=""    # Vercel Blob token (production)
UPLOAD_DIR="public/uploads" # Local dev uploads

# ─────────────────────────────────────
# Maps
# ─────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# ─────────────────────────────────────
# Analytics
# ─────────────────────────────────────
NEXT_PUBLIC_GA_ID=""        # Google Analytics (optional)
```

### 2.2 Environment Files

```
.env.example       # Template with all variables (no values)
.env.local         # Local development (gitignored)
.env.development   # Development defaults
.env.production    # Production defaults
```

---

## 3. Vercel Deployment

### 3.1 Initial Setup

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add NEXT_PUBLIC_APP_URL
# ... (repeat for all variables)

# 5. First deployment
vercel --prod
```

### 3.2 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "regions": ["cpt1"],
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 3.3 Vercel Settings

| Setting | Value |
|---|---|
| Framework | Next.js |
| Node.js Version | 20.x |
| Build Command | `prisma generate && next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Root Directory | `/` |
| Regions | cpt1 (Cape Town — closest to Lagos) |

### 3.4 Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add `32smiles.com`
3. Add `www.32smiles.com`
4. Configure DNS:
   - Type: `A` | Name: `@` | Value: `76.76.21.21`
   - Type: `CNAME` | Name: `www` | Value: `cname.vercel-dns.com`
5. SSL certificate auto-provisioned by Vercel

---

## 4. Database Setup

### 4.1 Supabase (Recommended)

1. Create project at supabase.com
2. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy connection string to `DATABASE_URL`
4. Use `DIRECT_URL` for migrations (bypasses connection pooler)

### 4.2 Neon (Alternative)

1. Create project at neon.tech
2. Enable pgvector:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy connection string

### 4.3 Database Initialization

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

---

## 5. Monitoring & Observability

### 5.1 Error Tracking — Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```env
# .env.local
SENTRY_DSN=""
SENTRY_ORG="your-org"
SENTRY_PROJECT="32smiles"
NEXT_PUBLIC_SENTRY_DSN=""
```

### 5.2 Analytics

- **Vercel Analytics** — Built-in Web Vitals
- **Google Analytics** — Optional, via `NEXT_PUBLIC_GA_ID`
- **Custom Analytics** — PageView table in database

### 5.3 Logging

```
Application logs → console.log (captured by Vercel)
AI generation logs → AIGenerationLog table
Audit logs → AuditLog table
Error logs → Sentry
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions (Optional)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test
```

### 6.2 Deployment Flow

```
Push to main
    │
    ▼
GitHub → Vercel (automatic)
    │
    ▼
Build: prisma generate → next build
    │
    ▼
Deploy to Vercel Edge Network
    │
    ▼
Post-deploy: prisma migrate deploy
```

---

## 7. Performance Checklist

| Item | Target | How |
|---|---|---|
| Lighthouse Performance | 95+ | ISR, image optimization, code splitting |
| Lighthouse Accessibility | 100 | Semantic HTML, ARIA, keyboard nav |
| Lighthouse Best Practices | 100 | CSP headers, no console errors |
| Lighthouse SEO | 100 | Meta tags, structured data, sitemap |
| First Contentful Paint | < 1.2s | SSR + streaming |
| Largest Contentful Paint | < 2.5s | Image optimization, preload |
| Total Blocking Time | < 200ms | Code splitting, lazy loading |
| Cumulative Layout Shift | < 0.1 | Aspect ratios, font loading |
| Time to First Byte | < 200ms | CDN caching, edge functions |

### 7.1 Image Optimization

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '32smiles.com' },
    ],
  },
};
```

All `<img>` tags use Next.js `<Image>` component:
```tsx
import Image from 'next/image';

<Image
  src="/images/team/1.jpg"
  alt="Dr. Linda Feldman - Root Canals Dentist"
  width={400}
  height={400}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### 7.2 Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

---

## 8. Security Checklist

| Item | Status | Notes |
|---|---|---|
| HTTPS enforced | ✅ | Vercel auto-provisions SSL |
| CSP headers | ✅ | See ARCHITECTURE.md |
| CSRF protection | ✅ | SameSite cookies + CSRF tokens |
| SQL injection | ✅ | Prisma parameterized queries |
| XSS prevention | ✅ | React escaping + CSP |
| Rate limiting | ✅ | AI API rate limiter |
| Input validation | ✅ | Zod on all API endpoints |
| Auth protection | ✅ | Auth.js on admin routes |
| API keys encrypted | ✅ | Stored encrypted in DB |
| No secrets in client | ✅ | All secrets server-side only |
| Dependency audit | ⬜ | Run `npm audit` regularly |

---

## 9. Backup Strategy

### 9.1 Database Backups

| Provider | Backup Type | Retention |
|---|---|---|
| Supabase | Daily automatic | 7 days (free), 30 days (pro) |
| Neon | Point-in-time recovery | 7 days (free), 30 days (pro) |

### 9.2 Manual Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20260727.sql
```

### 9.3 File Backups

- All images stored in `public/images/` — committed to git
- User uploads stored in Vercel Blob (auto-redundant)
- Local uploads in `public/uploads/` — should be backed up separately in production

---

## 10. Scaling Considerations

### 10.1 Current Architecture Limits

| Component | Limit | Mitigation |
|---|---|---|
| Vercel Serverless Functions | 10s (Hobby), 60s (Pro) | ISR reduces function calls |
| Vercel Bandwidth | 100GB (Hobby), 1TB (Pro) | CDN caching |
| PostgreSQL Connections | 60 (Supabase free) | Connection pooling (PgBouncer) |
| Vercel Blob Storage | 1GB (Hobby), 50GB (Pro) | External storage for large files |

### 10.2 When to Upgrade

| Trigger | Action |
|---|---|
| > 100GB bandwidth/month | Upgrade Vercel to Pro |
| > 60 concurrent DB connections | Enable PgBouncer or upgrade Supabase |
| > 1GB file uploads | Switch to S3 or Cloudflare R2 |
| > 10K concurrent users | Add edge caching, consider edge functions |
| AI API costs > $100/month | Optimize prompts, use cheaper providers |

---

## 11. Development Setup

### 11.1 Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm or pnpm

### 11.2 Local Development

```bash
# Clone repository
git clone <repo-url>
cd 32Smile.com

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start PostgreSQL (Docker)
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smiles_dev \
  pgvector/pgvector:pg16

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

### 11.3 Available Scripts

```json
{
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:watch": "vitest --watch",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset",
  "db:backup": "pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql",
  "ai:health": "tsx scripts/ai-health-check.ts",
  "ai:reindex": "tsx scripts/ai-reindex-kb.ts"
}
```

---

## 12. Troubleshooting

### 12.1 Common Issues

| Issue | Solution |
|---|---|
| `prisma generate` fails | Run `npm install` first, ensure Node.js 20+ |
| Database connection refused | Check PostgreSQL is running, verify DATABASE_URL |
| pgvector not found | Run `CREATE EXTENSION IF NOT EXISTS vector;` |
| Build fails on Vercel | Check build logs, ensure prisma generate runs first |
| AI provider errors | Check API key in admin settings, verify billing |
| Images not loading | Check file paths, ensure images are in public/ |
| Auth redirect loop | Verify AUTH_URL matches your domain exactly |
| ISR not updating | Trigger revalidation via admin publish action |

### 12.2 Debug Commands

```bash
# Check Prisma schema validity
npx prisma validate

# View database in browser
npx prisma studio

# Check AI provider health
npx tsx scripts/ai-health-check.ts

# Test email delivery
npx tsx scripts/test-email.ts

# Check Vercel deployment
vercel logs
vercel inspect
```
