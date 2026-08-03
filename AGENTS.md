# AGENTS.md

## Build command

```bash
npm run build
```

## Fixes applied

### Gallery categories
- Changed hardcoded `["Checkup", "Whitening"]` to derive categories from fallback items dynamically: `gallery/page.tsx:57-59`

### Gallery fallback JSON
- Replaced empty `"[]"` fallback with `JSON.stringify([...9 default items...])` so gallery shows content without seeding: `gallery/page.tsx:25-38`
- Added explicit type annotation for `fallbackGalleryItems`

### Team fallback JSON
- Replaced empty `"[]"` fallback with `JSON.stringify([...4 default members...])`: `team/page.tsx:36-49`

### Products fallback JSON
- Replaced empty `"{}"` fallback with `JSON.stringify({...6 slug→image defaults...})`: `products/page.tsx:25-35`

### Homepage fallback JSONs
- `service_fallback_images`, `blog_fallback_images`, `before_after_fallback_images` now use `JSON.stringify(defaults)` fallback instead of `"{}"`/`"[]"`: `page.tsx:81-97`

### ContentEditor tags
- `tags` state now initializes from `initialData?.tags` instead of always `[]`: `ContentEditor.tsx:36`

### Settings form improvements
- Imported `toast` from `sonner`: `settings-form.tsx:4`
- Replaced `alert()` calls with `toast.error()`: `settings-form.tsx:199,213`
- Tab switch resets `saved` state: `settings-form.tsx:236`
- Added JSON textarea editors for 6 fallback settings keys: `settings-form.tsx:322-338`
- Wired fallback JSON settings into save handler: `settings-form.tsx:195-198`

### Fixes applied (continued)

### Publish bug — form state discarded
- `handlePublish()` no longer hits `/publish` endpoint with no body; instead calls `handleSave("PUBLISHED")` which sends full payload: `ContentEditor.tsx:124-127`

### Auto-save deps
- Added `featuredImageId`, `excerpt` to auto-save `useEffect` so image-only changes trigger save: `ContentEditor.tsx:65`

### Zod schema — null rejection
- Changed `featuredImageId: z.string().optional()` → `z.string().optional().nullable()` so creating content without image doesn't 500: `validation.ts:45`

### Homepage blog carousel — per-post images
- Added `featuredImage: true` to blog Prisma query: `page.tsx:41`
- Added `featuredImage` field to `BlogPost` type: `blog-carousel.tsx:13`
- Image renders from `post.featuredImage?.url` with fallback to `blogImages`: `blog-carousel.tsx:76`

### Homepage testimonials — per-testimonial photos
- Added `photoFile: true` + `featuredImage: true` to testimonial query: `page.tsx:35`
- Carried `photoUrl` through mapping: `page.tsx:130-132`
- Added `photoUrl` to `Testimonial` type: `testimonials-carousel.tsx:11`
- Avatar renders from `testimonial.photoUrl` with fallback to `avatarImages`: `testimonials-carousel.tsx:71`
- Teal palette set in `globals.css:7-16` (`--primary-50` through `--primary-900`)
- Tailwind config references these custom properties

### ContentVersion race condition
- Changed `createVersion()` to use `$transaction` with 3-retry loop instead of raw read-then-write: `content.repository.ts:228-249`

### Dental Journey step numbers
- Changed `text-primary-50` → `text-primary-200`, then to `text-primary-900 opacity-4 tabular-nums text-6xl sm:text-9xl` with scale animation and responsive sizing: `dental-journey.tsx:80-82`

### Responsive fixes — all 10

| # | File | Fix |
|---|------|-----|
| 1 | `dental-journey.tsx` | Number opacity/position responsive — `text-6xl sm:text-9xl`, `-top-6 sm:-top-8`, `-left-4 sm:-left-6` |
| 2 | `blog-carousel.tsx` | `itemsPerView` now responsive via `useState`+`useEffect` (1 mobile, 2 tablet, 3 desktop) |
| 3 | `testimonials-carousel.tsx` | Same responsive `itemsPerView` + clamp `current` on resize |
| 4 | `settings-form.tsx` | Tab nav `overflow-x-auto` + responsive padding `px-3 sm:px-6 py-3 sm:py-4` + `whitespace-nowrap` |
| 5 | `file-picker.tsx` | Media grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |
| 6 | `ContentEditor.tsx` | Top bar `flex-wrap`, textarea `rows={12}` |
| 7 | `NotificationBell.tsx` | Dropdown `w-[calc(100vw-32px)] sm:w-96` |
| 8 | `gallery-grid.tsx` | Removed `space-y-4` from CSS columns |
| 9 | `ContentList.tsx` | Cell padding `px-3 sm:px-6`, Author+Views `hidden md:table-cell` |
| 10 | `dashboard/page.tsx` | Stats grid `md:grid-cols-3` instead of `md:grid-cols-2` |
