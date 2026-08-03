# 32Smiles — Content Migration Plan

> **Date**: July 27, 2026
> **Version**: 1.0
> **Source**: Existing HTML pages in 32Smile.com
> **Target**: Next.js + PostgreSQL via Prisma

---

## 1. Migration Overview

### 1.1 What Gets Migrated

| Content Type | Source | Target Entity | Count |
|---|---|---|---|
| Services | HTML sections on index.html | Service + Content | 6 |
| Team Members | HTML sections on index.html | TeamMember + Content | 4 |
| Testimonials | HTML sections on index.html | Testimonial + Content | 4 |
| Blog Posts | Individual HTML files | BlogPost + Content | 4 |
| Patient Education | Individual HTML files | EducationArticle + Content | 5 |
| Standalone FAQs | faq.html | FAQ + Content | 5 |
| Education FAQs | HTML within education pages | EducationFAQ | 16 |
| Products | HTML on product pages | Product + Content | ~22 |
| Product Categories | Product page structure | ProductCategory | 5 |
| Gallery Items | Gallery page images | GalleryItem + Content | 9 |
| Images | images/ directory | File records + copy to public/ | ~95 |
| Site Settings | Header/footer | Setting (key-value) | ~30 |

### 1.2 What Does NOT Get Migrated

| Item | Reason |
|---|---|
| HTML templates | Replaced by Next.js components |
| CSS files | Replaced by Tailwind |
| JavaScript files | Replaced by React |
| Revolution Slider | Replaced by Framer Motion hero |
| Donation form | Template remnant, not 32Smiles functionality |
| Placeholder data (Madison NJ maps, ThemeMascot PayPal) | Not real content |
| IE8 conditional comments | Not needed |
| RTL stylesheets | Not currently needed |

---

## 2. Image Migration

### 2.1 Copy Strategy

All images from the existing `images/` directory are copied to `public/images/` preserving the directory structure:

```bash
# From existing project
cp -r images/ ../32Smile-new/public/images/
```

### 2.2 Image Processing

| Category | Action | Notes |
|---|---|---|
| Logo (logo.png, 32smiles.png) | Copy as-is | Will be optimized by Next.js Image |
| Team photos (1-5.jpg) | Copy + generate WebP variants | Use next/image |
| Product images (~32 files) | Copy as-is | Lazy loaded |
| Blog thumbnails (1-4, 16-19.jpg) | Copy as-is | Used as featured images |
| Gallery images (9 + 9 full) | Copy as-is | Full-size for lightbox |
| Before/after images (6) | Copy as-is | Used in education articles |
| Testimonial avatars (7) | Copy as-is | Small files |
| Background images (18) | Copy + consider CSS sprites | Most are decorative |
| Service images (7) | Copy as-is | Used in service pages |

### 2.3 New Images Needed

| Image | Purpose | Source |
|---|---|---|
| OG Image (1200x630) | Social sharing | Generate or design |
| Favicon set | Browser tab | Generate from logo |
| Default avatar | User fallback | Generate |
| Placeholder | Content loading | Generate |
| Email header | Email templates | Design |

---

## 3. Content Extraction

### 3.1 Services

Extract from `index.html` (services section, lines ~250-400):

```html
<!-- Source structure -->
<div class="col-sm-6 col-md-4">
  <div class="service-wrap">
    <div class="thumb">
      <img src="images/services/1.jpg">
      <a class="popup-img" href="images/services/1.jpg"><i class="icon_expand"></i></a>
    </div>
    <div class="content">
      <h4 class="service-title">Root Canal</h4>
      <p>Procedures to treat and preserve teeth...</p>
    </div>
  </div>
</div>
```

**Extract**: title, description, image → Create `Service` + `Content` records

**Target content for 6 services:**

| # | Title | Description |
|---|---|---|
| 1 | Root Canal | Procedures to treat and preserve teeth with badly infected pulp through endodontic treatment |
| 2 | Teeth Whitening | A popular cosmetic dentistry treatment for enhancing and brightening your smile |
| 3 | Wisdom Teeth | Removal of problematic wisdom teeth due to decay, trauma, or disease |
| 4 | Crowns Bridges | Restoration of gum and jawbone infections from periodontal disease |
| 5 | Cosmetic Dentistry | Improvement of dental aesthetics in color, position, shape, size, and alignment |
| 6 | Dental Implants | Surgical grade root devices supporting permanent tooth prosthetics |

### 3.2 Team Members

Extract from `index.html` (team section):

```html
<!-- Source structure -->
<div class="team-member">
  <div class="thumb">
    <img src="images/team/1.jpg">
    <div class="social">social links...</div>
  </div>
  <div class="content-text">
    <h4 class="text-uppercase">Dr. Linda Feldman</h4>
    <p class="text-primary">Root Canals Dentist</p>
  </div>
</div>
```

**Extract**: name, specialty, photo → Create `TeamMember` + `Content` records

### 3.3 Testimonials

Extract from `index.html` (testimonials section):

```html
<!-- Source structure -->
<div class="item">
  <div class="testimonial-detail">
    <img src="images/testimonials/1.png">
    <p>"The support was great, the staff was very helpful..."</p>
    <h5 class="client-name">Eric Dimgba</h5>
  </div>
</div>
```

**Extract**: name, quote, photo → Create `Testimonial` + `Content` records

### 3.4 Blog Posts

Each blog article is a separate HTML file. Extract:

| File | Title | Date | Content |
|---|---|---|---|
| `botox-in-dentistry.html` | Botox In Dentistry – The Next Big Thing? | 2022-03-12 | Full article body |
| `why-you-have-bad-breath-how-to-treat-it.html` | Why You Have Bad Breath & How to Treat It | 2022-02-28 | Full article body |
| `how-often-replace-toothbrush.html` | How Often Should I Replace My Toothbrush? | 2022-02-25 | Full article body |
| `straight-teeth-its-not-just-about-a-pretty-smile-the-medical-benefits-of-braces.html` | Straight Teeth – The Medical Benefits of Braces | 2022-06-10 | Full article body |

**Process**:
1. Parse HTML file
2. Extract `<article>` or main content div
3. Strip template navigation, header, footer
4. Clean HTML (remove inline styles, template classes)
5. Store body as HTML in `Content.body`
6. Create `BlogPost` record with reading time
7. Create `SEOMetadata` record from existing meta tags (if any)

### 3.5 Patient Education

Each education article is a separate HTML file:

| File | Title | FAQs |
|---|---|---|
| `dental-hygiene.html` | Dental Hygiene & Prevention | 4 |
| `root-canal-treatment.html` | Root Canal Treatment | 4 |
| `general-dentistry.html` | General Dentistry | 0 (has related treatments) |
| `dental-implant.html` | Dental Implants | 4 |
| `dental-bridges.html` | Dental Bridges | 4 |

**Process**:
1. Parse HTML file
2. Extract main content body
3. Extract FAQ questions and answers (accordion sections)
4. Create `EducationArticle` + `Content` records
5. Create `EducationFAQ` records for each Q&A pair
6. Set `educationType: "patient"`

### 3.6 Products

Extract from product HTML pages:

**Toothpaste page** (5 products), **Brushes page** (4 products), **Kids page** (4 products), **Electrical page** (4 products), **Shop category page** (9 products with overlap).

**Process**:
1. Parse each product page
2. Extract: name, price, sale price, rating, image, badge (Hot!/Sale!)
3. Create `ProductCategory` records first
4. Create `Product` + `Content` records
5. Link to appropriate `ProductCategory`

### 3.7 FAQs

**Standalone FAQs** (from faq.html):

| Question | Answer |
|---|---|
| What kind of toothbrush is recommended? How should I care for it? | [Extracted answer] |
| How can I prevent gum disease? | [Extracted answer] |
| What causes bad breath and what can I do about it? | [Extracted answer] |
| I'd like a whiter smile. What should I do? | [Extracted answer] |
| Is teeth whitening safe? | [Extracted answer] |

**Process**:
1. Parse faq.html
2. Extract question-answer pairs from accordion
3. Create `FAQ` + `Content` records
4. Set `isStandalone: true`, `category: "general"`

---

## 4. Settings Migration

### 4.1 Business Information

```typescript
const settings = [
  { key: 'site.name', value: '32Smiles Dental Clinic', group: 'general' },
  { key: 'site.tagline', value: 'Dental Care Solution', group: 'general' },
  { key: 'site.description', value: 'To promote a genuine and confident smile through excellent oral health care', group: 'general' },
  { key: 'contact.phone', value: '+(234) 810 368 7424', group: 'contact' },
  { key: 'contact.email', value: 'admin@32smiles.com', group: 'contact' },
  { key: 'contact.address', value: '3B Fabac Close, off Ligali Ayorinde Street, Victoria Island, Lagos, Nigeria', group: 'contact' },
  { key: 'contact.website', value: 'www.32smiles.com', group: 'contact' },
  { key: 'business.hours.monday', value: '8:00am - 4:30pm', group: 'business' },
  { key: 'business.hours.tuesday', value: '8:00am - 4:30pm', group: 'business' },
  { key: 'business.hours.wednesday', value: '8:00am - 4:30pm', group: 'business' },
  { key: 'business.hours.thursday', value: '8:00am - 4:30pm', group: 'business' },
  { key: 'business.hours.friday', value: '8:00am - 3:00pm', group: 'business' },
  { key: 'business.hours.saturday', value: 'Closed', group: 'business' },
  { key: 'business.hours.sunday', value: '8:00am - 4:30pm', group: 'business' },
  { key: 'seo.defaultTitle', value: '32Smiles Dental Clinic | Dental Care in Lagos', group: 'seo' },
  { key: 'seo.defaultDescription', value: 'Premium dental care in Victoria Island, Lagos. Services include teeth whitening, root canal, dental implants, and cosmetic dentistry.', group: 'seo' },
];
```

---

## 5. Migration Scripts

### 5.1 Script Structure

```
scripts/
├── migrate-images.ts        # Copy and register images
├── migrate-services.ts      # Extract and create services
├── migrate-team.ts          # Extract and create team members
├── migrate-testimonials.ts  # Extract and create testimonials
├── migrate-blog.ts          # Extract and create blog posts
├── migrate-education.ts     # Extract and create education articles + FAQs
├── migrate-products.ts      # Extract and create products + categories
├── migrate-faqs.ts          # Extract and create standalone FAQs
├── migrate-settings.ts      # Create system settings
├── migrate-gallery.ts       # Extract and create gallery items
└── run-all.ts               # Execute all migrations in order
```

### 5.2 Migration Order

1. Settings (referenced by everything)
2. Product Categories (referenced by products)
3. Images (referenced by all content)
4. Services
5. Team Members
6. Testimonials
7. Blog Posts
8. Patient Education Articles + FAQs
9. Standalone FAQs
10. Products
11. Gallery Items

### 5.3 Verification Checklist

After each migration step:

- [ ] Records created in database
- [ ] Slugs are unique per content type
- [ ] Images are accessible via /images/...
- [ ] Content body is valid HTML
- [ ] No template remnants in migrated content
- [ ] SEO metadata is populated
- [ ] Status is set to PUBLISHED for migrated content
- [ ] Published dates preserved from original

### 5.4 Rollback Strategy

Each migration script is idempotent (can be re-run safely):
- Uses `upsert` based on slug for content
- Checks for existing records before inserting
- Logs all operations for audit

---

## 6. Data Cleaning

### 6.1 HTML Cleanup Rules

1. Remove all `class` attributes from content body (template classes)
2. Remove inline `style` attributes
3. Remove `<script>` tags
4. Remove `<iframe>` tags (except YouTube embeds)
5. Convert `<div>` wrappers to semantic elements where appropriate
6. Preserve `<h2>`, `<h3>`, `<h4>` heading structure
7. Preserve `<ul>`, `<ol>`, `<li>` lists
8. Preserve `<strong>`, `<em>` emphasis
9. Preserve `<a>` links (update internal URLs to new paths)
10. Preserve `<img>` tags (update src to new paths)
11. Remove empty `<p>` tags
12. Normalize whitespace

### 6.2 URL Rewriting

| Old URL | New URL |
|---|---|
| `dental-hygiene.html` | `/patients/education/dental-hygiene` |
| `root-canal-treatment.html` | `/patients/education/root-canal-treatment` |
| `general-dentistry.html` | `/patients/education/general-dentistry` |
| `dental-implant.html` | `/patients/education/dental-implant` |
| `dental-bridges.html` | `/patients/education/dental-bridges` |
| `blog.html` | `/blog` |
| `botox-in-dentistry.html` | `/blog/botox-in-dentistry` |
| `why-you-have-bad-breath-how-to-treat-it.html` | `/blog/bad-breath-treatment` |
| `how-often-replace-toothbrush.html` | `/blog/replace-toothbrush` |
| `straight-teeth-*.html` | `/blog/benefits-of-braces` |
| `faq.html` | `/faq` |
| `shop-category.html` | `/products` |
| `toothpaste.html` | `/products/toothpaste` |
| `Brushes.html` | `/products/brushes` |
| `kid.html` | `/products/kids` |
| `electrical.html` | `/products/electrical` |
| `contact.html` | `/contact` |
| `about.html` | `/about` |
| `sitemap.html` | (removed, use /sitemap.xml) |
