# Demo Plan — 32 Smiles Bangalore (32 Smiles Multispeciality Dental Clinics)

> Purpose: Build a live, sellable demo of the 32Smiles SaaS platform for
> 32 Smiles Multispeciality Dental Clinics, Bangalore (prospect site:
> https://32smilesdentalclinics.com/), using OUR UI and THEIR details.
>
> Non-negotiable constraints:
> 1. OUR UI — same platform/codebase, only seeded content changes.
> 2. Local-first — preview on localhost before anything is deployed.
> 3. Production untouched — main repo, prod `.env`, and local `smiles_dev` DB are never modified.
> 4. No overpromising — demo shows a single flagship branch (HSR Layout);
>    branches + WhatsApp are framed honestly (roadmap/onboarding), never faked.

---

## 1. Environment Inventory (verified)

| Tool | Status | Location / Version |
|---|---|---|
| Node.js | Installed | v24.18.0 |
| npm | Installed | bundled |
| PostgreSQL 16 (Postgres.app) | Installed & RUNNING | `/Applications/Postgres.app/Contents/Versions/latest/bin` (psql/createdb), port 5432, trust auth for `geo_official` |
| Existing local DBs | Present | `postgres`, `smiles_dev` (DO NOT TOUCH `smiles_dev`) |
| Prisma | Installed | 6.19.3 (no `migrations/` folder → use `prisma db push`) |
| tsx | Installed | for seed scripts |
| Docker / Supabase CLI / Vercel CLI / psql-on-PATH | NOT installed | Not needed for local phase; Vercel CLI installed only at deploy phase |

---

## 2. Target Prospect Profile (from their live site)

- **Name:** 32 Smiles Multispeciality Dental Clinics, Bangalore
- **Founder/Director:** Dr. Naveenn Indla; Director: Dr. S. Preethi Naidu
- **Founded:** 2005
- **Branches:** 9 (HSR Layout, BTM Layout, Sarjapura, Panathur, Kundalahalli/ITPL,
  Whitefield/Channasandra, Thubarahalli, Marathahalli, Kundalahalli Gate)
- **Hours:** Monday–Sunday, 10:00 AM – 9:00 PM
- **Phone:** +91-9482712345
- **Bookings today:** external widget (click4appointment.com) — fragmented per branch
- **Strengths to echo in demo:** 4.9★ Google rating (135 reviews), laser dentistry,
  Invisalign, implants, smile designing, dental tourism
- **Doctors named publicly (use for team demo):** Dr. Jayashree, Dr. Akansha, Dr. Ekta Suman

---

## 3. What the Demo MUST Show (mapped to proposal's 4 pillars)

1. Patient self-booking — public site, time-slot picker, instant confirmation, patient portal
2. One staff dashboard — appointments, patients, contacts, orders
3. AI content studio — generate a treatment guide/blog post in brand voice, review + approve
4. Inquiry capture — contact/lead inbox, nothing lost

Honest framing notes (scripted):
- "Other 8 branches?" → "Branches are an onboarding step; the system scales by repeating this setup per branch."
- "WhatsApp confirmations?" → "Email confirmations are live today; WhatsApp is on the roadmap."
- Dental tourism → "Patients book before their flight; portal works from any timezone."

---

## 4. Phase 0 — Local Setup (all on THIS machine)

### 4.1 Create the demo database
```
createdb smiles_demo_bangalore
```
- Host: localhost, port 5432, user `geo_official`, no password (trust auth).
- `smiles_dev` and `postgres` remain untouched.

### 4.2 Create demo branch + worktree (isolation)
```
git checkout -b demo/bangalore
git worktree add ../32Smiles-demo demo/bangalore
```
- Demo work lives in `/Users/geo_official/Documents/32Smiles-demo`.
- Main repo (`/Users/geo_official/Documents/OpenCode/32Smile.com`) stays on `main`, untouched.

### 4.3 Demo `.env.local` (created ONLY in the worktree; gitignored)
```
DATABASE_URL="postgresql://geo_official@localhost:5432/smiles_demo_bangalore?sslmode=disable"
DIRECT_URL="postgresql://geo_official@localhost:5432/smiles_demo_bangalore?sslmode=disable"
AUTH_SECRET="<openssl rand -base64 32>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="32 Smiles Multispeciality Dental Clinics"
NODE_ENV="development"
EMAIL_FROM="demo@32smilesdemo.local"
```
- SMTP/Resend keys left empty for local preview (booking still works; email step logs a warning).

### 4.4 Install + schema
```
cd ../32Smiles-demo
npm ci
npx prisma db push      # no migrations folder → schema sync
```

---

## 5. Phase 1 — Demo Seed Script

File: `scripts/demo-seed-bangalore.ts` (in worktree)

### 5.1 Settings (Settings table)
| Key | Value |
|---|---|
| site.name | 32 Smiles Multispeciality Dental Clinics |
| site.tagline | Best Dental Clinic in Bangalore |
| site.description | Multispeciality dental care across Bangalore — implants, Invisalign, laser dentistry, smile designing. |
| contact.phone | +91-9482712345 |
| contact.email | contact@32smilesdentalclinics.com (placeholder for demo) |
| contact.address | HSR Layout, Bangalore (flagship branch) |
| business.hours.* | 10:00 AM – 9:00 PM (all 7 days) |
| seo.defaultTitle | 32 Smiles Multispeciality Dental Clinics \| Best Dental Clinic in Bangalore |
| seo.defaultDescription | Trusted multi-branch dental care in Bangalore since 2005 — implants, Invisalign, laser dentistry, smile designing. |

### 5.2 Services (14 treatments — THEIR names, OUR original copy)
Invisalign / Clear Aligners, Root Canal Treatment, Dental Implants,
Orthodontics (Braces), Disimpaction, Child Dental Care, Gum Treatments,
Teeth Whitening, Tooth Filling, Scaling & Polishing, Dental Veneers,
Crowns & Bridges, Laser Dentistry, Smile Designing.
> Copyright note: treatment names are public/common; all descriptions written fresh — do NOT copy their page text.

### 5.3 Testimonials (their real public Google reviews — 4.9★)
Seed 5 reviews (Vaishnavi Srivastava, Dipti Lakade, Vijendran Jayaprakash,
Naveen PM, Arushi Bagga) with their public review text + names.

### 5.4 Team
Dr. Naveenn Indla (Founder & Director), Dr. S. Preethi Naidu (Director),
Dr. Jayashree, Dr. Akansha, Dr. Ekta Suman (from public reviews).

### 5.5 Content
- Blog: original posts — "Dental Implants vs Bridges", "What to Expect with
  Invisalign", "Is Laser Dentistry Right for You?", "Dental Tourism in India — A Guide".
- Page: Dental Tourism landing page (original copy).
- Gallery/Products: use platform defaults (no asset scraping).

### 5.6 Demo accounts
| Email | Password | Role |
|---|---|---|
| superadmin@demo.local | Superadmin123! | SUPER_ADMIN |
| admin@demo.local | Admin123! | ADMIN |
| editor@demo.local | Editor123! | EDITOR |
| receptionist@demo.local | Receptionist123! | RECEPTIONIST |
| patient@demo.local | Patient123! | VIEWER (patient) |

### 5.7 Pre-booked appointment
One PENDING/CONFIRMED appointment for patient@demo.local
(e.g., Dental Implants consult, next business day, 3:00 PM) so the dashboard
isn't empty during the demo.

---

## 6. Phase 2 — Local Run + Review Loop

```
cd ../32Smiles-demo
npm run dev            # localhost:3000
```
Review checklist:
- [ ] Public homepage shows "32 Smiles Multispeciality Dental Clinics"
- [ ] Hours show 10:00 AM – 9:00 PM daily, phone +91-9482712345
- [ ] 14 services render with images
- [ ] Booking flow works; patient@demo.local portal shows pre-booked appointment
- [ ] Admin login → dashboard shows appointment
- [ ] AI studio can generate + approve a blog post (provider key needed — see §8)
- Iterate on content/settings with the user until pitch-ready.

---

## 7. Phase 3 — Live Demo URL (ONLY after local sign-off)

Heads-up (confirmed): Vercel cannot reach local Postgres → public demo needs a
hosted DB. Steps:
1. User creates a free Supabase project → provide `DATABASE_URL` (pooler 6543),
   `DIRECT_URL` (5432), service key.
2. `npm i -g vercel && vercel login` (browser auth).
3. Deploy worktree branch as a NEW project: `32smiles-demo-bangalore`
   (separate from any production project).
4. Set live env on Vercel:
   - DATABASE_URL, DIRECT_URL (demo Supabase), AUTH_SECRET (new),
   - AUTH_URL + NEXT_PUBLIC_APP_URL = demo URL,
   - NEXT_PUBLIC_APP_NAME, EMAIL_FROM,
   - optional SMTP_* (reuse existing Gmail creds) so the client receives REAL confirmation emails during the demo.
5. `npx prisma db push` + run seed against demo Supabase.
6. Deploy; verify demo URL end-to-end (booking → confirmation email → portal → admin).

---

## 8. Optional But Recommended
- AI Studio demo requires one provider key (OpenAI/Anthropic/Gemini/Groq)
  in the demo instance's settings/env so the "generate a blog post live" moment works.
- If unavailable, demo AI Studio from a pre-seeded AIDraft and skip live generation.

---

## 9. Phase 4 — Demo Walkthrough Doc
File: `docs/DEMO-WALKTHROUGH.md` — 30-minute runbook:
- 0–2 min: hook (their 4.9★, the booking-widget friction)
- 2–10 min: patient side (book → confirm → portal)
- 10–18 min: staff dashboard (appointments, contacts, orders, audit trail)
- 18–25 min: AI content studio (generate → review → publish)
- 25–30 min: close (ROI line: one tourism patient covers a year; ask for next step)
- Objection-handling Q&A (branches, WhatsApp, pricing, data migration, training)

---

## 10. Files To Create/Edit

| File | Action |
|---|---|
| `scripts/demo-seed-bangalore.ts` | New — demo seed script |
| `docs/DEMO-WALKTHROUGH.md` | New — sales runbook |
| `docs/DEMO-PLAN.md` | New — this document |
| `../32Smiles-demo/.env.local` | New (worktree only) |
| `src/config/site.ts` | No change (settings override at runtime) |

---

## 11. Verification Checklist (must pass before each milestone)
- [ ] `npm run typecheck` — no errors
- [ ] `npm run build` — succeeds
- [ ] `prisma db push` — applies cleanly
- [ ] Seed script runs idempotently (safe to re-run)
- [ ] Booking smoke test (public → dashboard)
- [ ] Login for all 5 demo accounts
- [ ] Production repo `git status` clean / unchanged after local demo
- [ ] (Live phase) demo URL returns 200 + booking email delivered

---

## 12. Risks & Guardrails
- **Scope honesty:** single-branch demo; multi-branch + WhatsApp = roadmap lines scripted.
- **Copyright:** their page copy is NOT reused; only public treatment names + public Google reviews.
- **Isolation:** worktree + dedicated local DB + dedicated Vercel project + dedicated Supabase project.
- **Secrets:** demo keys never committed; `.env*` stays gitignored.
- **No unplanned scope:** building real branch/WhatsApp features is OUT of this plan
  (separate proposal if required).

---

## 13. What's Needed From The User
1. Approval to begin Phase 0 (exit plan mode).
2. (Phase 3 only) Free Supabase project URL + service key.
3. (Phase 3 only) Vercel browser login.
4. (Optional) One AI provider key for live AI-studio demo; optional SMTP creds for live demo emails.
