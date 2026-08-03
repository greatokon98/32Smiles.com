# Fallback JSON Settings Guide

## Overview

When a page has **no published content in the database**, it falls back to JSON data stored in the `Setting` table. These JSON blobs provide placeholder content so the public site never shows up blank — even before you've added anything through the admin panel.

The decision algorithm on every page is:

```
if DB has published items with images:
    → render from database
else:
    → JSON.parse(setting_value)
       if setting missing or parse fails:
           → use hardcoded default baked into the page
```

You can edit all 6 JSON fallback settings from the admin panel:

**Admin → Settings → Images tab → scroll to "Fallback JSON Data"**

---

## Setting Keys

### 1. `gallery_fallback_images`

**Shape:** Array of objects

```json
[
  {
    "id": "1",
    "title": "Clinic Interior",
    "category": "clinic",
    "imageUrl": "/images/gallery/1.jpg",
    "fullImageUrl": "/images/gallery/full/1.jpg"
  }
]
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier (used as React key) |
| `title` | string | yes | Image caption/title |
| `category` | string | no | Filter category — `"clinic"`, `"transformations"`, `"team"`, etc. |
| `imageUrl` | string | yes | Thumbnail image path |
| `fullImageUrl` | string | yes | Full-size image path for lightbox |

**Used on:** `/gallery` page.
**Controls:** Gallery grid thumbnails, category filter tabs, lightbox images.

---

### 2. `team_fallback_photos`

**Shape:** Array of objects

```json
[
  {
    "id": "f1",
    "contentId": "fc1",
    "title": "Dr. Sarah Johnson",
    "slug": "sarah-johnson",
    "excerpt": "Expert in cosmetic and restorative dentistry.",
    "specialty": "Cosmetic Dentist",
    "credentials": "DDS, AACD",
    "photoUrl": "/images/team/1.jpg",
    "isFeatured": true
  }
]
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier |
| `contentId` | string | yes | Pseudo-content ID |
| `title` | string | yes | Member name |
| `slug` | string | yes | URL slug |
| `excerpt` | string/null | no | Short bio |
| `specialty` | string | yes | Job title/specialty |
| `credentials` | string/null | no | Degrees, certifications |
| `photoUrl` | string/null | no | Profile photo path |
| `isFeatured` | boolean | yes | Whether to feature on homepage |

**Used on:** `/team` page, homepage "Meet Our Team" section.
**Controls:** Team member cards, profile photos, featured display.

---

### 3. `blog_fallback_images`

**Shape:** Array of URL strings

```json
[
  "/images/blog/1.jpg",
  "/images/blog/2.jpg",
  "/images/blog/3.jpg"
]
```

Each entry is simply an image path used as the thumbnail for fallback blog cards.

**Used on:** Homepage blog carousel (when no DB blog posts exist).
**Controls:** Blog card thumbnail images.

---

### 4. `before_after_fallback_images`

**Shape:** Array of URL strings

```json
[
  "/images/before-after/1.jpg",
  "/images/before-after/2.jpg",
  "/images/before-after/3.jpg"
]
```

Each entry is an image path used in the homepage "Before & After" gallery section.

**Used on:** Homepage before/after gallery section.
**Controls:** Before/after comparison images displayed in a row.

---

### 5. `service_fallback_images`

**Shape:** Object mapping service slugs to image URLs

```json
{
  "root-canal": "/images/services/1.jpg",
  "teeth-whitening": "/images/services/2.jpg",
  "dental-implants": "/images/services/3.jpg",
  "cosmetic-dentistry": "/images/services/b1.jpg",
  "wisdom-teeth": "/images/services/single-service.jpg",
  "general-dentistry": "/images/services/1.jpg"
}
```

Each key must match a service's `slug` exactly. Used as an **image fallback** when a DB service exists but has no `featuredImage` attached.

**Used on:** Homepage services section.
**Controls:** Service card images when the DB service lacks a featured image.

---

### 6. `product_fallback_images`

**Shape:** Object mapping product slugs to image URLs

```json
{
  "professional-toothpaste": "/images/services/1.jpg",
  "electric-toothbrush": "/images/services/2.jpg",
  "dental-floss": "/images/services/3.jpg",
  "mouthwash": "/images/services/b1.jpg",
  "teeth-whitening-kit": "/images/services/single-service.jpg",
  "oral-irrigator": "/images/services/1.jpg"
}
```

Each key must match a product's `slug` exactly. Used as an **image fallback** when a DB product exists but has no `featuredImage` attached.

**Used on:** `/products` page.
**Controls:** Product card images when the DB product lacks a featured image.

---

## Editing via Admin

1. Go to **Admin → Settings**
2. Click the **Images** tab
3. Scroll to the **"Fallback JSON Data"** section
4. Each setting has its own `<textarea>` with monospace font
5. Edit the JSON directly (must be valid JSON)
6. Click **Save Settings**
7. If your JSON is malformed, the page silently falls back to the hardcoded default baked into the code

---

## Common Pitfalls

| Mistake | Result |
|---|---|
| Trailing comma in JSON (`[1, 2,]`) | JSON parse fails → hardcoded default used |
| Wrong slug in `Record<>` settings | Image won't match that service/product |
| `string[]` shaped like an object | Parse fails → default used |
| Image path doesn't exist in `public/` | 404 broken image in browser |
| Duplicate `id` values | React key collision warning |

**Pro tip:** Use `JSON.stringify()` in your browser console to generate valid JSON from a JavaScript object, or validate your JSON at [jsonlint.com](https://jsonlint.com) before pasting into the admin textarea.

---

## How the Decision Algorithm Works

Every affected page follows the same three-layer cascade:

```
Layer 1: Database query
  └─ Has published items with images?
       ├─ YES → render DB items (featuredImage, photoFile, etc.)
       └─ NO  → go to Layer 2

Layer 2: Setting table (admin-editable JSON)
  └─ Setting key exists and JSON.parse succeeds?
       ├─ YES → render parsed JSON
       └─ NO  → go to Layer 3

Layer 3: Hardcoded default in source code
  └─ Render default JSON baked into the page component
       (guaranteed to parse correctly — always works)
```

**Example — Gallery:**
- `gallery/page.tsx` queries `prisma.galleryItem.findMany()`
- If `dbItems.some(item => item.imageFile?.url)` is true → use DB
- Otherwise → `JSON.parse(getSetting(settings, "gallery_fallback_images", defaultItems))`
- If setting is missing or parse fails → hardcoded `defaultItems` (the 9 default gallery items)

## Migration Path

Once you add real content through the admin panel and publish it, the JSON fallback is automatically ignored. You don't need to clear or delete the fallback settings — they serve as a graceful backup.
