# 32Smiles — Existing Project Audit

> **Date**: July 27, 2026
> **Auditor**: Principal Software Architect
> **Purpose**: Complete inventory of the existing 32Smile.com project to serve as the business specification for the enterprise rebuild.

---

## 1. Business Entity

| Field | Value |
|---|---|
| **Name** | 32Smiles Dental Clinic |
| **Also Known As** | 32Smile.com, 32Smiles |
| **Domain** | 32smile.com / 32smiles.com |
| **Address** | 3B Fabac Close, off Ligali Ayorinde Street, Victoria Island, Lagos, Nigeria |
| **Phone** | +(234) 810 368 7424 |
| **Email** | admin@32smiles.com |
| **Website** | www.32smiles.com |
| **Mission** | "To promote a genuine and confident smile through excellent oral health care" |
| **Tagline** | "Welcome to 32Smiles", "Dental Care Solution", "Dental Check Up" |

---

## 2. Technology Stack (Existing)

| Layer | Technology | Version |
|---|---|---|
| HTML | HTML5 | - |
| CSS Framework | Bootstrap 3 | 3.x |
| CSS | Custom (style-main.css ~9,800 lines) | - |
| JavaScript | jQuery 2.2.4 | 2.2.4 |
| UI Library | jQuery UI | - |
| Slider | Revolution Slider 5 (ThemePunch) | 5.x |
| Carousel | Owl Carousel | - |
| Lightbox | Nivo Lightbox, prettyPhoto, Magnific Popup | - |
| Gallery Filter | Isotope | - |
| Animations | WOW.js, Animate.css | - |
| Text Animation | Typed.js | - |
| Menu | Menuzord Mega Menu | - |
| Map | Google Maps JavaScript API | - |
| Alerts | SweetAlert2 (CDN) | 11.x |
| Icons | Font Awesome 4, Elegant Icons, IcoMoon, Ionicons, Stroke Gap, Pixeden, Flaticon (dental + medical) | - |
| RTL | Bootstrap RTL + custom RTL stylesheets | - |
| Other | Modernizr, Retina.js, FitVids, Parallax, TwentyTwenty (before/after) | - |

### Libraries Included But Unused on Visible Pages
- fullpage-slider
- pagepiling-slider
- multiscroll-slider
- Chart.js
- Classy Countdown
- jQuery Knob
- Vertical Timeline

---

## 3. File Inventory

### 3.1 HTML Pages (20 files)

| # | File | Title | Category | Lines |
|---|---|---|---|---|
| 1 | `index.html` | 32Smile \| Dental Clinic, Dentist & Dental Care | Homepage | 990 |
| 2 | `about.html` | About us | Company | 573 |
| 3 | `contact.html` | Contact us | Company | 397 |
| 4 | `blog.html` | Blog | Content | 399 |
| 5 | `faq.html` | Faq | Education | 320 |
| 6 | `shop-category.html` | Products | Products | 448 |
| 7 | `toothpaste.html` | Toothpaste | Products | 395 |
| 8 | `Brushes.html` | Brushes | Products | 381 |
| 9 | `electrical.html` | Electrical Accessories | Products | 380 |
| 10 | `kid.html` | Special Product for Kids | Products | 381 |
| 11 | `dental-hygiene.html` | Dental Hygiene & Prevention | Patient Education | 329 |
| 12 | `root-canal-treatment.html` | Root Canal Treatment | Patient Education | 328 |
| 13 | `general-dentistry.html` | General Dentistry | Patient Education | 376 |
| 14 | `dental-implant.html` | Dental Implants | Patient Education | 316 |
| 15 | `dental-bridges.html` | Dental Bridges | Patient Education | 323 |
| 16 | `sitemap.html` | Site Map | Utility | 318 |
| 17 | `botox-in-dentistry.html` | Botox In Dentistry | Blog Article | - |
| 18 | `why-you-have-bad-breath-how-to-treat-it.html` | Bad Breath | Blog Article | - |
| 19 | `how-often-replace-toothbrush.html` | Replace Toothbrush | Blog Article | - |
| 20 | `straight-teeth-its-not-just-about-a-pretty-smile-the-medical-benefits-of-braces.html` | Straight Teeth / Braces | Blog Article | - |

### 3.2 AJAX Fragments (2 files)

| File | Purpose |
|---|---|
| `ajax-load/form-appointment.html` | Appointment booking form (loaded via Magnific Popup) |
| `ajax-load/donation-form.html` | PayPal donation form (one-time and recurring) |

### 3.3 CSS Files (25+ files)

**Core:**
- `css/bootstrap.min.css` — Bootstrap 3
- `css/bootstrap-rtl.min.css` — RTL Bootstrap
- `css/style-main.css` — Main theme (~9,821 lines)
- `css/style-main-rtl.css` — RTL main styles
- `css/style-main-rtl-extra.css` — Extra RTL overrides
- `css/responsive.css` — Media queries
- `css/preloader.css` — Loading spinner
- `css/custom-bootstrap-margin-padding.css` — Utility classes
- `css/utility-classes.css` — Additional utilities
- `css/css-plugin-collections.css` — Plugin styles
- `css/animate.css` — CSS animations
- `css/jquery-ui.min.css` — jQuery UI

**Color Skins (5):**
- `css/colors/theme-skin-color-set1.css` (used by about, blog, shop, sitemap)
- `css/colors/theme-skin-color-set2.css`
- `css/colors/theme-skin-color-set3.css`
- `css/colors/theme-skin-color-set4.css` (used by homepage, contact, education pages — TEAL)
- `css/colors/theme-skin-color-set5.css`

**Menu:**
- `css/menuzord-megamenu.css`
- `css/menuzord-megamenu-rtl.css`
- `css/menuzord-skins/menuzord-boxed.css`
- `css/menuzord-skins/menuzord-bottom-trace.css`

**Icon Fonts (8+):**
- `css/font-awesome.min.css` (Font Awesome 4)
- `css/font-awesome-animation.min.css`
- `css/elegant-icons.css`
- `css/icomoon.css`
- `css/ionicons.css`
- `css/stroke-gap-icons.css`
- `css/pe-icon-7-stroke.css`
- `css/flaticon-set-dental.css` (custom dental icons)
- `css/flaticon-set-medical.css` (custom medical icons)

**Slider/Lightbox CSS:**
- `css/slick-slider/`
- `css/nivolightbox-themes/`
- `css/prettyPhoto/` (6 theme variants)
- `css/lightbox/`
- `css/bxslider/images/`

### 3.4 JavaScript Files (20+ files)

**Core:**
- `js/jquery-2.2.4.min.js`
- `js/jquery-ui.min.js`
- `js/bootstrap.min.js`
- `js/jquery-plugin-collection.js` (~718 lines, bundles 30+ plugins)
- `js/custom.js` (~1,200+ lines, THEMEMASCOT namespace)
- `js/chart.js`
- `js/calendar-events-data.js`
- `js/google-map-init-multilocation.js` (placeholder Madison, NJ data)

**Revolution Slider:**
- `js/revolution-slider/js/jquery.themepunch.tools.min.js`
- `js/revolution-slider/js/jquery.themepunch.revolution.min.js`
- `js/revolution-slider/css/settings.css`, `layers.css`, `navigation.css`
- `js/revolution-slider/assets/` (grid tiles, loader, backgrounds)
- `js/revolution-slider/fonts/revicons/`

**Other Libraries (included, mostly unused):**
- `js/classycountdown/`
- `js/fullpage-slider/`
- `js/pagepiling-slider/`
- `js/multiscroll-slider/`
- `js/vertical-timeline/`

### 3.5 Font Files

| Font | Files |
|---|---|
| Font Awesome 4 | `fonts/fontawesome-webfont3e6e.{woff2,woff,ttf,eot,svg}` |
| Elegant Icons | `fonts/ElegantIcons.{eot,svg,ttf,woff}` |
| Pixeden Icon-7-Stroke | `fonts/Pe-icon-7-strokebb1d.{eot,svg,ttf,woff}` |
| Bootstrap Glyphicons | `fonts/glyphicons-halflings-regular.{eot,svg,ttf,woff,woff2}` |
| Stroke Gap Icons | `fonts/Stroke-Gap-Icons.eot` |
| IcoMoon | `fonts/icomoon.html` |
| Ionicons | `fonts/ionicons790f*.html` |
| Flaticon Dental | `fonts/flaticons/flaticon-set-dental.{ttf,eot,svg,woff}` |
| Flaticon Medical | `fonts/flaticons/flaticon-set-medical.{ttf,eot,svg,woff}` |
| YTP Regular | `css/font/YTP-Regular.{eot,svg,ttf,woff}` |
| FlexSlider | `css/fonts/` |

### 3.6 Image Assets

| Directory | Count | Purpose |
|---|---|---|
| `images/logo.png` | 1 | Primary logo |
| `images/32smiles.png` | 1 | Footer logo variant |
| `images/close.png` | 1 | Close button icon |
| `images/title-icon.png` | 1 | Section title icon |
| `images/title-icon-white.png` | 1 | White title icon |
| `images/shadow-overlay.png` | 1 | Shadow overlay |
| `images/payment-card-logo-sm.png` | 1 | Payment cards |
| `images/bg/` | 18 | Background images (bg1-bg18.jpg) |
| `images/about/` | 1 | Dental care illustration (dc1.png) |
| `images/team/` | 5 | Team member photos (1-5.jpg) |
| `images/services/` | 7 | Service images |
| `images/blog/` | 8 | Blog thumbnails (1-4, 16-19.jpg) |
| `images/gallery/` | 9 | Gallery thumbnails (1-9.jpg) |
| `images/gallery/full/` | 9 | Full-size gallery images |
| `images/before-after/` | 6 | Before/after comparison images |
| `images/testimonials/` | 7 | Testimonial avatars (1-3.png, 1.jpg, etc.) |
| `images/photos/` | 1 | Miscellaneous (1.jpg) |
| `images/pattern/` | 2 | Background patterns (p4.png, p10.png) |
| `images/Products/Toothepaste/` | 11 | Toothpaste product images |
| `images/Products/Brushes/` | 8 | Toothbrush product images |
| `images/Products/Kids_products/` | 4 | Kids product images |
| `images/Products/General_Product/` | 9 | General dental product images |

**Total images: ~95 files**

---

## 4. Content Inventory

### 4.1 Services (6)

| Service | Description |
|---|---|
| Root Canal | Procedures to treat and preserve teeth with badly infected pulp |
| Teeth Whitening | Popular cosmetic dentistry treatment for enhancing smiles |
| Wisdom Teeth | Removal of problematic teeth due to decay, trauma, or disease |
| Crowns Bridges | Restoration of gum and jawbone infections from periodontal disease |
| Cosmetic Dentistry | Improvement of dental aesthetics |
| Dental Implants | Surgical grade root devices supporting permanent tooth prosthetics |

### 4.2 Dentists (4)

| Name | Specialty | Photo |
|---|---|---|
| Dr. Linda Feldman | Root Canals Dentist | images/team/1.jpg |
| Dr. Jessica Brown | Implant Surgeon | images/team/2.jpg |
| Dr. Nicholas Bank | Cosmetic Dental Surgeon | images/team/3.jpg |
| Dr. Brian Adam | Restorative Dentist | images/team/4.jpg |

### 4.3 Testimonials (4)

| Name | Quote | Image |
|---|---|---|
| Eric Dimgba | "The support was great, the staff was very helpful and the products were top notch..." | images/testimonials/1.png |
| Sanni Vivian | "Their services are great, unique, smart and fast, hard to find anywhere in the country..." | images/testimonials/2.png |
| Mary James | "They have great facilities and quality equipments, best of it kind anywhere in the country." | images/testimonials/3.png |
| Lucy Brown | "I am over the moon with my smile and no longer feel self-conscious about my missing tooth..." | images/testimonials/1.jpg |

### 4.4 Blog Articles (4)

| Title | Date | Author |
|---|---|---|
| Why You Have Bad Breath & How to Treat It | Feb 28, 2022 | Admin |
| Straight Teeth – It's Not Just About A Pretty Smile: The Medical Benefits of Braces | June 10, 2022 | Admin |
| Botox In Dentistry – The Next Big Thing? | Mar 12, 2022 | Admin |
| How Often Should I Replace My Toothbrush? | Feb 25, 2022 | Admin |

### 4.5 Patient Education Articles (5)

| Title | Has FAQ | FAQ Count |
|---|---|---|
| Dental Hygiene & Prevention | Yes | 4 |
| Root Canal Treatment | Yes | 4 |
| General Dentistry | No (has related treatments) | 0 |
| Dental Implants | Yes | 4 |
| Dental Bridges | Yes | 4 |

### 4.6 Products (~22 items)

**Shop Category Page (9 items):**
- CR Complete Whitening plus Scope paste (Sale! $520→$480)
- CR Cavity Protection paste ($364→$344)
- CR Kids Sparkle Cavity Protection paste (Hot! $245)
- OB iO Gentle Care ER BrushHead Refill ($490→$475)
- OB Complete SatinFloss Mint 5.5yd (Sale! $175)
- CR 3DWhite Whitestrips with Light ($265)
- CR 3DWhite Glamorous White Rinse 946ml (Sale! $350→$45)
- Hot Gun ($365)
- Cordless Oscillating Tools ($490)

**Toothpaste Page (5 items):**
- CR Complete Whitening plus Scope paste
- CR Cavity Protection paste
- CR Kids Sparkle Cavity Protection paste
- Densify Oral B Toothpaste ($490→$475)
- Crest health Gum Sensitivity ($365)

**Brushes Page (4 items):**
- ORAL-B PRO-EXPERT EXTRA CLEAN TOOTHBRUSH ($490→$475)
- ORAL-B PRO-EXPERT ANTI-PLAQUE TOOTHBRUSH (Sale! $175)
- ORAL-B PRO-EXPERT ALL-IN-ONE TOOTHBRUSH ($265)
- ORAL-B COMPLETE CLEAN TOOTHBRUSH (Sale! $350→$45)

**Kids Page (4 items):**
- ORAL-B SENSI ULTRA-THIN ELECTRIC TOOTHBRUSH HEADS ($490→$475)
- ORAL-B JUNIOR 2years TOOTHPASTE (Sale! $175)
- ORAL-B JUNIOR BRUSH ($265)
- ORAL-B COMPLETE CLEAN TOOTHPASTE (Sale! $350→$45)

**Electrical Page (4 items):**
- ORAL-B SENSI ULTRA-THIN ELECTRIC TOOTHBRUSH HEADS ($490→$475)
- iOS ELECTRONIC TOOTHBRUSH (Sale! $175)
- ORAL-B HIGH SENSE TOOTHBRUSH FOR KIDS ($265)
- ORAL-B iO ELECTRIC ULTIMATE CLEAN REFILL HEAD (Sale! $350→$45)

### 4.7 Gallery (9 images)

Categories (via Isotope filter):
- All
- Checkup (branding)
- Whitening (design)
- Whitening (photography) — duplicate label, likely should differ

### 4.8 FAQs (25 total)

**Standalone FAQ Page (5):**
1. What kind of toothbrush is recommended? How should I care for it?
2. How can I prevent gum disease?
3. What causes bad breath and what can I do about it?
4. I'd like a whiter smile. What should I do?
5. Is teeth whitening safe?

**Per Education Article (4 each × 4 articles with FAQs = 16):**
- Dental Hygiene: 4 FAQs (brushing, gum disease, gum disease detection, toothbrush type)
- Root Canal: 4 FAQs (why needed, infection spread, pain, appearance after)
- Dental Implants: 4 FAQs (what are they, safety/duration, pain, treatment duration)
- Dental Bridges: 4 FAQs (why replace, materials, other methods, care)

---

## 5. Forms & Interactivity

### 5.1 Appointment Booking Modal

**Trigger**: "Request an appointment" button (homepage, about page)
**Fields**:
- Full Name (text, required)
- Phone Number (text, required)
- Email (email, required)
- Date (date, required)
- Message (textarea, required)

**Backend**: None — SweetAlert2 success popup only
**Issues**: No actual submission, duplicate `id` attributes, no validation

### 5.2 Contact Form

**Trigger**: Contact page
**Fields**:
- Name (text, required)
- Email (email, required)
- Subject (text, required)
- Phone (text, required)
- Message (textarea, required)
- Bot check (hidden, empty)

**Backend**: None — SweetAlert2 success popup only
**Issues**: Client-side empty check only, no server submission

### 5.3 Product "Add to Cart" Buttons

**Trigger**: All product pages
**Backend**: None — SweetAlert2 "product successfully added to cart" popup
**Issues**: No cart state, no actual functionality

---

## 6. Navigation Structure

```
Home
About Us
Professional Education (dropdown)
  ├── Courses (#)
  ├── FAQ's (faq.html)
  ├── Faculty Resources (#)
  ├── Student Resources (#)
  └── Case Studies (#)
Patient Education (dropdown)
  ├── Dental Hygiene (dental-hygiene.html)
  ├── Root Canal Treatment (root-canal-treatment.html)
  ├── General Dentistry (general-dentistry.html)
  ├── Dental Implant (dental-implant.html)
  └── Dental Bridges (dental-bridges.html)
Products (dropdown)
  ├── Tooth Pastes (toothpaste.html)
  ├── Brushes (Brushes.html)
  ├── Special Product for Kids (kid.html)
  └── Electrical Accessories (electrical.html)
Blog (blog.html)
Contact Us (contact.html)
```

**Placeholder Links (#)**: Courses, Faculty Resources, Student Resources, Case Studies

---

## 7. Business Information (Extracted)

### 7.1 Opening Hours (INCONSISTENT across pages)

**Header Bar** (all pages):
- Mon - Tues: 6:00 am - 10:00 pm
- Sunday: Closed

**Body Widget** (homepage, about):
- Monday: 8:00am - 12:00pm
- Tues - Thur: 8:00am - 4:30pm
- Friday: 8:00am - 3:00pm
- Sunday: 8:00am - 4:30pm
- Checkup: 8:00am - 4:30pm

**Footer** (all pages):
- Mon - Tues: 6:00 am - 10:00 pm
- Wednes - Thurs: 8:00 am - 6:00 pm
- Fri: 3:00 pm - 8:00 pm
- Sun: Closed

**Decision Required**: Which set of hours is correct? These are contradictory.

### 7.2 Contact Information

- Address: 3B Fabac Close, off Ligali Ayorinde Street, Victoria Island, Lagos
- Phone: +(234) 810 368 7424
- Email: admin@32smiles.com
- Website: www.32smiles.com
- Google Maps: Embedded iframe (Victoria Island, Lagos coordinates)

### 7.3 Emergency Contact

- "Please feel free to contact us for emergency case"
- Phone displayed prominently: (+234) 810 368 7424
- Placeholder phone on general-dentistry CTA: (+01) 234 567 890 (TEMPLATE LEFTOVER)

### 7.4 Brand Features (from homepage)

- Qualified Doctors
- 24×7 Emergency Services
- General Medical
- State-of-the-art technology
- Flexible appointments
- Outdoor Checkup
- Easy and Affordable Billing
- Feel like Home Services

---

## 8. Issues & Template Remnants

### 8.1 Broken/Placeholder Data
- Google Maps JS: Placeholder coordinates for Madison, NJ (not Lagos)
- Donation form: References ThemeMascot's PayPal account
- General dentistry CTA: Placeholder phone (+01) 234 567 890
- Sitemap meta author: "ThemeMascot" (not 32Smiles)
- Empty meta descriptions on most pages

### 8.2 Non-Functional Features
- Appointment form: No backend submission
- Contact form: No backend submission
- Add to Cart: No cart logic
- Donation form: PayPal integration points to template author
- Professional Education links: Courses, Faculty Resources, Student Resources, Case Studies all link to `#`

### 8.3 Code Quality Issues
- Duplicate HTML `id` attributes in appointment modal
- `<vr>` tag (non-HTML element) used in CTA section
- Inline styles throughout
- Inline JavaScript at bottom of each page
- No form validation beyond `required` attribute
- Opening hours inconsistent across header/body/footer
- Commented-out code blocks throughout
- IE8 conditional comments (unnecessary for modern browsers)
- Mixed color skins (set1 on some pages, set4 on others)

### 8.4 Unused Libraries
- fullpage-slider, pagepiling-slider, multiscroll-slider
- Chart.js (included, not visibly used)
- Classy Countdown
- jQuery Knob
- Vertical Timeline

### 8.5 SEO Issues
- Empty meta descriptions
- No OpenGraph tags
- No Twitter Card tags
- No structured data
- No canonical URLs
- No sitemap.xml
- No robots.txt
- No breadcrumb schema
- No organization schema
- No article schema
- No FAQ schema

---

## 9. Reusable Assets for Migration

### 9.1 Content (Migrate Verbatim)
- All service descriptions
- All patient education article content
- All blog article content
- All FAQ questions and answers
- All product names, descriptions, prices, ratings
- All testimonial quotes and names
- All dentist names and specialties
- Brand mission statement
- Brand features list

### 9.2 Images (Migrate)
- Logo files (logo.png, 32smiles.png)
- All product images (~32 files)
- Team photos (5 files)
- Blog thumbnails (8 files)
- Gallery images (9 + 9 full-size)
- Before/after images (6 files)
- Testimonial avatars (7 files)
- Background images (18 files)
- About illustration (dc1.png)
- Service images (7 files)

### 9.3 Business Logic (Rebuild)
- Appointment booking (with actual backend)
- Contact form (with actual backend)
- Product catalog (display-only, e-commerce-ready schema)
- Gallery with filtering
- Testimonials carousel
- Blog with dates and authors

---

## 10. Scope Summary

### Must Migrate (Content)
- 6 services
- 4 dentists
- 4 testimonials
- ~22 products across 4 categories
- 5 patient education articles (with ~16 FAQs)
- 4 blog articles
- 5 standalone FAQs
- 9 gallery images
- All brand copy, contact info, opening hours

### Must Rebuild (Features)
- All 20+ pages as Next.js routes
- Appointment booking with database persistence
- Contact form with database persistence
- Product catalog (CMS-managed)
- Blog (CMS-managed with AI assist)
- Gallery (CMS-managed)
- Testimonials (CMS-managed with moderation)
- FAQ system (CMS-managed, reusable)
- Patient Education (CMS-managed)
- Professional Education (placeholder, CMS-ready)
- Full admin dashboard
- AI Content Studio
- AI Engine
- Authentication & RBAC
- SEO system (metadata, OG, structured data, sitemap)
- Search (global, semantic)
- Notifications
- Analytics

### Intentionally Deprecated
- Donation form (template remnant, not 32Smiles functionality)
- Revolution Slider (replace with modern hero)
- Multiple lightbox libraries (use single modern solution)
- IE8 conditional comments
- Unused JS libraries (fullpage, pagepiling, multiscroll, etc.)
- RTL stylesheets (not currently used, can add later if needed)
