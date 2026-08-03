# 32Smiles — Component Inventory & Design System

> **Date**: July 27, 2026
> **Version**: 1.0
> **UI Library**: shadcn/ui (Radix UI primitives)
> **Styling**: Tailwind CSS
> **Animation**: Framer Motion
> **Icons**: Lucide React

---

## 1. Design Tokens

### 1.1 Color Palette

```css
/* Brand Colors — Teal Primary (matching existing site) */
--color-primary-50:  #f0fdfa;
--color-primary-100: #ccfbf1;
--color-primary-200: #99f6e4;
--color-primary-300: #5eead4;
--color-primary-400: #2dd4bf;
--color-primary-500: #14b8a6;  /* Main brand teal */
--color-primary-600: #0d9488;
--color-primary-700: #0f766e;
--color-primary-800: #115e59;
--color-primary-900: #134e4a;

/* Neutrals */
--color-neutral-50:  #fafafa;
--color-neutral-100: #f5f5f5;
--color-neutral-200: #e5e5e5;
--color-neutral-300: #d4d4d4;
--color-neutral-400: #a3a3a3;
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #262626;
--color-neutral-900: #171717;

/* Semantic Colors */
--color-success: #22c55e;
--color-warning: #eab308;
--color-error:   #ef4444;
--color-info:    #3b82f6;

/* AI Studio Colors */
--color-ai-draft:       #f59e0b;  /* Amber — draft state */
--color-ai-generating:  #8b5cf6;  /* Violet — generating */
--color-ai-review:      #3b82f6;  /* Blue — under review */
--color-ai-approved:    #22c55e;  /* Green — approved */
--color-ai-published:   #14b8a6;  /* Teal — published */
--color-ai-rejected:    #ef4444;  /* Red — rejected */
```

### 1.2 Typography

```css
/* Headings — Inter (clean, modern, healthcare-appropriate) */
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Body — Inter */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace — JetBrains Mono (for code in AI studio) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
--text-6xl:  3.75rem;   /* 60px */
```

### 1.3 Spacing & Layout

```css
/* Container */
--container-sm:  640px;
--container-md:  768px;
--container-lg:  1024px;
--container-xl:  1280px;
--container-2xl: 1440px;

/* Section spacing */
--section-padding: 5rem; /* 80px vertical */

/* Border radius */
--radius-sm:   0.375rem;  /* 6px */
--radius-md:   0.5rem;    /* 8px */
--radius-lg:   0.75rem;   /* 12px */
--radius-xl:   1rem;      /* 16px */
--radius-full: 9999px;

/* Shadows */
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## 2. shadcn/ui Components (Pre-installed)

All base components from shadcn/ui:

| Component | Usage |
|---|---|
| `Accordion` | FAQ sections, settings panels |
| `Alert` | Notifications, warnings, AI status |
| `Alert Dialog` | Confirmations, destructive actions |
| `Avatar` | User avatars, team photos, testimonials |
| `Badge` | Status indicators, tags, categories |
| `Button` | All interactive elements |
| `Calendar` | Date picker in appointment form |
| `Card` | Product cards, service cards, stats |
| `Checkbox` | Form inputs, bulk actions |
| `Command` | Search command palette (⌘K) |
| `Dialog` | Modals, quick views, forms |
| `Drawer` | Mobile navigation, side panels |
| `Dropdown Menu` | User menu, action menus, filters |
| `Form` | All form implementations |
| `Input` | Text inputs, search bars |
| `Label` | Form labels |
| `Navigation Menu` | Desktop nav, mega menu |
| `Popover` | Tooltips, date pickers, filters |
| `Progress` | AI generation progress, upload progress |
| `Scroll Area` | Scrollable panels, AI chat history |
| `Select` | Dropdowns, filters, provider selection |
| `Separator` | Visual dividers |
| `Sheet` | Side panels, mobile menus |
| `Skeleton` | Loading states |
| `Slider` | Range inputs |
| `Switch` | Toggle settings |
| `Table` | Data tables in admin |
| `Tabs` | Content type tabs, settings tabs |
| `Textarea` | Long text inputs, AI prompt editing |
| `Toast` | Success/error notifications |
| `Toggle` | Formatting toolbar |
| `Toggle Group` | Multi-select filters |
| `Tooltip` | Hover hints |

---

## 3. Shared UI Components

### 3.1 Layout Components

```
src/components/layout/
├── SiteHeader.tsx          # Main site header (sticky, responsive)
├── SiteFooter.tsx          # Main site footer
├── AdminSidebar.tsx        # Admin dashboard sidebar
├── AdminHeader.tsx         # Admin dashboard header
├── MobileNav.tsx           # Mobile navigation drawer
├── Breadcrumbs.tsx         # Breadcrumb navigation
├── PageHeader.tsx          # Reusable page header (title + subtitle)
├── SectionContainer.tsx    # Content section with max-width
├── Container.tsx           # Responsive container
└── Footer.tsx              # Site-wide footer
```

### 3.2 Form Components

```
src/components/forms/
├── AppointmentForm.tsx     # Appointment booking (name, phone, email, date, message)
├── ContactForm.tsx         # Contact form (name, email, phone, subject, message)
├── NewsletterForm.tsx      # Email subscription
├── SearchBar.tsx           # Global search input with autocomplete
├── FormField.tsx           # Reusable form field wrapper
├── SubmitButton.tsx        # Loading state submit button
└── PhoneInput.tsx          # Phone number input with country code
```

### 3.3 Content Components

```
src/components/shared/
├── ContentCard.tsx         # Generic content card (used for blog, education, etc.)
├── ContentGrid.tsx         # Grid layout for content cards
├── ContentFilters.tsx      # Filter bar (by category, tag, date)
├── Pagination.tsx          # Page navigation
├── EmptyState.tsx          # No results state
├── ErrorState.tsx          # Error display state
├── LoadingState.tsx        # Loading skeleton state
├── RichTextRenderer.tsx    # HTML/markdown content renderer
├── ImageWithFallback.tsx   # Image with error fallback
├── MarkdownEditor.tsx      # Markdown/WYSIWYG editor
├── SEOPreview.tsx          # Google search preview
└── DiffViewer.tsx          # Side-by-side diff for AI content review
```

### 3.4 AI-Specific Components

```
src/components/ai/
├── AIStatusBadge.tsx       # Shows AI generation status with color
├── AIButton.tsx            # "Generate with AI" button with loading states
├── ProviderSelector.tsx    # Dropdown to select AI provider
├── BrandVoiceSelector.tsx  # Dropdown to select brand voice
├── TokenCounter.tsx        # Shows token usage and cost estimate
├── GenerationProgress.tsx  # Progress indicator during generation
├── AIResponsePanel.tsx     # Displays AI-generated content
├── ReviewPanel.tsx         # Review workflow UI
├── CostTracker.tsx         # Shows AI usage costs
├── PromptEditor.tsx        # Edit prompt templates
├── PromptPreview.tsx       # Preview rendered prompt with variables
├── KnowledgeBaseSearch.tsx # Search KB for context
├── ModelInfo.tsx           # Shows model info and capabilities
└── FallbackIndicator.tsx   # Shows when fallback provider is used
```

---

## 4. Page-Level Components

### 4.1 Homepage

```
src/features/homepage/components/
├── HeroSection.tsx
│   ├── HeroSlider (Framer Motion animated)
│   ├── HeroContent (title, subtitle, CTA)
│   └── HeroBackground (image/video with overlay)
├── ServicesCarousel.tsx
│   ├── ServiceCard (icon, title, description, link)
│   └── Carousel (Framer Motion drag)
├── AboutPreview.tsx
│   ├── Stats counter (animated numbers)
│   └── Mission statement
├── FeaturedProducts.tsx
│   ├── ProductCard (image, name, price, badge)
│   └── CTA to shop
├── TestimonialsSlider.tsx
│   ├── TestimonialCard (avatar, quote, name, rating)
│   └── Auto-playing slider
├── BlogPreview.tsx
│   ├── BlogCard (thumbnail, title, date, excerpt)
│   └── CTA to blog
├── GalleryPreview.tsx
│   ├── GalleryGrid (Isotope-like masonry)
│   └── CTA to full gallery
└── CTASection.tsx
    ├── Appointment CTA with phone number
    └── Emergency contact
```

### 4.2 Blog

```
src/features/blog/components/
├── BlogListPage.tsx
│   ├── BlogFilters (date, tag, category)
│   ├── BlogGrid (responsive grid)
│   ├── BlogCard (featured image, title, excerpt, date, author, reading time)
│   ├── BlogSidebar (categories, tags, recent posts)
│   └── Pagination
├── BlogPostPage.tsx
│   ├── ArticleHeader (title, date, author, reading time, tags)
│   ├── ArticleContent (rich text with images)
│   ├── TableOfContents (auto-generated from headings)
│   ├── RelatedPosts
│   └── ShareButtons
└── BlogSearch.tsx (inline search within blog)
```

### 4.3 Products

```
src/features/products/components/
├── ProductCatalogPage.tsx
│   ├── CategoryTabs (all categories)
│   ├── ProductGrid (responsive grid)
│   ├── ProductCard (image, name, price, sale badge, rating, add to cart)
│   ├── ProductQuickView (modal with details)
│   ├── SortDropdown (price, name, rating, newest)
│   ├── PriceFilter (range slider)
│   └── BrandFilter (checkbox group)
├── ProductDetailPage.tsx
│   ├── ProductImage (zoom on hover)
│   ├── ProductInfo (name, price, rating, description)
│   ├── ProductBreadcrumb
│   ├── RelatedProducts
│   └── ProductTabs (description, reviews, specifications)
└── CartDrawer.tsx (slide-in cart panel)
```

### 4.4 Gallery

```
src/features/gallery/components/
├── GalleryPage.tsx
│   ├── GalleryFilters (all, branding, design, photography)
│   ├── GalleryGrid (masonry layout)
│   ├── GalleryItem (thumbnail with hover overlay)
│   └── GalleryLightbox (full-screen view with navigation)
└── GalleryMasonry.tsx (responsive masonry grid)
```

### 4.5 Services

```
src/features/services/components/
├── ServicesPage.tsx
│   ├── ServicesGrid (card layout)
│   ├── ServiceCard (icon, title, brief description)
│   └── CTA section
├── ServiceDetailPage.tsx
│   ├── ServiceHeader (title, icon, description)
│   ├── ServiceContent (full description)
│   ├── RelatedServices
│   └── CTA (book appointment)
└── ServicesDirectory.tsx (alphabetical list with search)
```

### 4.6 Team

```
src/features/team/components/
├── TeamPage.tsx
│   ├── TeamGrid (card layout)
│   ├── TeamCard (photo, name, specialty, brief bio)
│   └── TeamFilter (by specialty)
└── TeamProfilePage.tsx
    ├── ProfileHeader (photo, name, credentials, specialty)
    ├── Bio (full biography)
    ├── Specialties list
    └── Contact CTA
```

### 4.7 Education

```
src/features/education/components/
├── EducationHubPage.tsx
│   ├── EducationNav (patient vs. professional tabs)
│   ├── ArticleGrid (card layout)
│   ├── ArticleCard (title, reading time, excerpt)
│   └── FeaturedArticle
├── ArticlePage.tsx
│   ├── ArticleHeader (title, reading time, navigation)
│   ├── ArticleContent (rich text)
│   ├── FAQSection (accordion)
│   ├── RelatedArticles
│   └── CTA (contact for questions)
└── EducationSidebar.tsx (category navigation)
```

### 4.8 FAQ

```
src/features/faq/components/
├── FAQPage.tsx
│   ├── FAQSearch (search within FAQs)
│   ├── FAQCategoryGroup (grouped by category)
│   ├── FAQAccordion (question/answer expand)
│   └── FAQStats (total questions, categories)
└── FAQItem.tsx (single expandable item)
```

### 4.9 Contact

```
src/features/contact/components/
├── ContactPage.tsx
│   ├── ContactForm (name, email, phone, subject, message)
│   ├── ContactInfo (address, phone, email, hours)
│   ├── ContactMap (Google Maps embed)
│   └── SocialLinks
└── ContactInfoCard.tsx (individual contact detail)
```

### 4.10 Search

```
src/features/search/components/
├── SearchPage.tsx
│   ├── SearchBar (large, prominent)
│   ├── SearchFilters (content type, date range)
│   ├── SearchResults (list with snippets)
│   ├── SearchSuggestions (autocomplete)
│   └── RecentSearches
└── SearchResultItem.tsx (title, snippet, type badge, date)
```

---

## 5. Admin Dashboard Components

### 5.1 Dashboard Layout

```
src/features/admin/components/
├── DashboardLayout.tsx
│   ├── AdminSidebar (navigation, collapsible)
│   ├── AdminHeader (user menu, notifications, search)
│   ├── Breadcrumbs
│   └── MainContent area
├── Sidebar.tsx
│   ├── SidebarItem (icon + label + badge)
│   ├── SidebarGroup (collapsible sections)
│   └── SidebarFooter (user info, settings)
└── AdminHeader.tsx
    ├── SearchCommand (⌘K command palette)
    ├── NotificationBell (with unread count)
    └── UserMenu (avatar, name, role, logout)
```

### 5.2 Content Management

```
src/features/admin/content/
├── ContentListPage.tsx
│   ├── ContentTypeTabs (blog, services, products, etc.)
│   ├── ContentTable (sortable, filterable data table)
│   ├── ContentRow (title, status badge, author, date, actions)
│   ├── BulkActions (publish, archive, delete)
│   └── CreateNewButton
├── ContentEditorPage.tsx
│   ├── TitleInput
│   ├── SlugInput (auto-generated from title)
│   ├── RichTextEditor (body content)
│   ├── ExcerptInput
│   ├── FeaturedImageUpload
│   ├── SEOPanel (meta title, description, OG image)
│   ├── TagSelector
│   ├── CategorySelector
│   ├── StatusSelect
│   ├── ScheduleDatePicker
│   ├── AIGenerateButton (opens AI Studio)
│   └── SaveActions (save draft, submit for review, publish)
└── ContentPreviewPage.tsx
    ├── DesktopPreview
    ├── MobilePreview
    └── SEOPreview (Google SERP preview)
```

### 5.3 AI Content Studio

```
src/features/ai-studio/components/
├── StudioLayout.tsx
│   ├── DraftList (left panel — list of drafts)
│   ├── EditorArea (center — content editor)
│   └── AIAssistantPanel (right — AI controls)
├── DraftEditor.tsx
│   ├── TitleInput
│   ├── RichTextEditor (with markdown support)
│   ├── WordCount / ReadingTime
│   ├── AutoSave (debounced)
│   └── VersionHistory (accessible from toolbar)
├── AIAssistantPanel.tsx
│   ├── PromptTemplateSelector (dropdown)
│   ├── TopicInput (what to write about)
│   ├── ParametersPanel
│   │   ├── TargetAudience (select)
│   │   ├── ToneOfVoice (select)
│   │   ├── WordCount (number input)
│   │   └── Temperature (slider)
│   ├── ProviderSelector (with cost estimate)
│   ├── BrandVoiceSelector
│   ├── KnowledgeBaseToggle (use KB context)
│   ├── GenerateButton
│   ├── GenerationProgress (with streaming preview)
│   ├── RegenerateButton
│   └── CostTracker (tokens used, cost this session)
├── ReviewWorkflow.tsx
│   ├── StatusTimeline (visual workflow progress)
│   ├── ReviewComments (threaded discussion)
│   ├── ApproveButton
│   ├── RejectButton
│   ├── RequestChangesButton
│   └── PublishButton (admin only)
├── SEOPanel.tsx
│   ├── MetaTitleInput (with character count)
│   ├── MetaDescriptionInput (with character count)
│   ├── OGImageUpload
│   ├── FocusKeywordInput
│   ├── SEOScore (calculated)
│   └── GooglePreview (SERP preview)
├── ImagePromptPanel.tsx
│   ├── ImageDescriptionInput
│   ├── ImageStyleSelect
│   ├── GenerateImagePromptButton
│   ├── GeneratedPromptDisplay
│   └── UsePromptButton (applies to featured image)
├── DiffView.tsx
│   ├── OriginalContent (left pane)
│   ├── NewContent (right pane)
│   ├── ChangeHighlighting (inline diff)
│   └── AcceptRejectPerChange
└── KnowledgeBaseSearch.tsx
    ├── SearchInput
    ├── ResultsList (with relevance scores)
    ├── InsertContextButton
    └── KBEntryPreview
```

### 5.4 Appointments Management

```
src/features/admin/appointments/
├── AppointmentsPage.tsx
│   ├── CalendarView (monthly/weekly/daily toggle)
│   ├── AppointmentList (upcoming, pending, completed)
│   ├── StatusFilter (all, pending, confirmed, completed, cancelled)
│   └── DateRangePicker
├── AppointmentDetail.tsx
│   ├── PatientInfo (name, email, phone)
│   ├── AppointmentInfo (date, time, service, notes)
│   ├── StatusActions (confirm, complete, cancel)
│   └── InternalNotes
└── AppointmentStats.tsx
    ├── TodayCount
    ├── PendingCount
    └── WeeklyTrend
```

### 5.5 User Management

```
src/features/admin/users/
├── UserListPage.tsx
│   ├── UserTable (sortable, searchable)
│   ├── UserRow (avatar, name, email, role, last login, status)
│   ├── InviteUserButton
│   └── BulkActions
├── UserEditorPage.tsx
│   ├── UserForm (name, email, role)
│   ├── RoleSelector (with permissions preview)
│   ├── StatusToggle (active/inactive)
│   └── ResetPasswordButton
└── UserStats.tsx
    ├── TotalUsers
    ├── ActiveUsers
    └── RoleDistribution
```

### 5.6 Analytics

```
src/features/admin/analytics/
├── AnalyticsPage.tsx
│   ├── StatsCards (total views, unique visitors, avg session)
│   ├── PageViewsChart (line chart, Recharts)
│   ├── TopPages (table with views)
│   ├── TrafficSources (pie chart)
│   ├── DeviceBreakdown (bar chart)
│   ├── SearchTerms (table with queries)
│   └── DateRangeSelector
├── StatsCard.tsx (icon, value, change percentage)
├── PageViewsChart.tsx (Recharts LineChart)
├── TopPagesTable.tsx (sortable table)
├── TrafficChart.tsx (Recharts PieChart)
└── DeviceChart.tsx (Recharts BarChart)
```

### 5.7 Settings

```
src/features/admin/settings/
├── SettingsPage.tsx
│   ├── SettingsTabs (general, SEO, AI, email, etc.)
│   └── SettingsForm (dynamic form based on settings)
├── GeneralSettings.tsx
│   ├── SiteName
│   ├── SiteDescription
│   ├── ContactInfo
│   ├── BusinessHours
│   └── LogoUpload
├── SEOSettings.tsx
│   ├── DefaultMetaTitle
│   ├── DefaultMetaDescription
│   ├── GoogleAnalyticsId
│   ├── SitemapAutoGenerate
│   └── RobotsTxt
├── AISettings.tsx
│   ├── ProviderConfigs (list of providers)
│   ├── ProviderEditor (API key, model, priority, budget)
│   ├── DefaultProvider
│   ├── GlobalRateLimits
│   └── CostBudgets
├── EmailSettings.tsx
│   ├── ResendApiKey
│   ├── FromEmail
│   ├── ReplyToEmail
│   └── EmailTemplates
└── BrandVoiceSettings.tsx
    ├── BrandVoiceList
    ├── BrandVoiceEditor
    │   ├── Name
    │   ├── Description
    │   ├── Tone
    │   ├── Personality
    │   ├── Vocabulary
    │   ├── AvoidWords
    │   ├── WritingStyle
    │   ├── TargetAudience
    │   └── SystemPrompt
    └── SetDefaultButton
```

### 5.8 Audit Logs

```
src/features/admin/logs/
├── AuditLogsPage.tsx
│   ├── AuditLogTable (sortable, filterable)
│   ├── AuditLogRow (timestamp, user, action, resource, details)
│   ├── ActionFilter (all, create, update, delete, publish, login)
│   ├── ResourceFilter (all content types, users, settings)
│   ├── UserFilter
│   └── DateRangeFilter
└── AuditLogDetail.tsx
    ├── ChangeDiff (old values vs. new values)
    └── Metadata (IP, user agent)
```

---

## 6. Animation Patterns

### 6.1 Page Transitions

```typescript
// Framer Motion page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};
```

### 6.2 Scroll Animations

```typescript
// Fade in from bottom on scroll (used for sections)
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" },
};

// Staggered children (used for grids)
const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
};
```

### 6.3 Component Animations

```typescript
// Card hover
const cardHover = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

// Button press
const buttonPress = {
  scale: 0.98,
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

// Modal entrance
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

// Toast slide in
const toastVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};
```

### 6.4 Micro-Interactions

```typescript
// Number counter animation (for stats)
// Uses framer-motion useSpring + useTransform

// Loading spinner pulse
const pulse = {
  animate: { scale: [1, 1.05, 1], opacity: [1, 0.7, 1] },
  transition: { duration: 1.5, repeat: Infinity },
};

// Skeleton shimmer
const shimmer = {
  animate: { backgroundPosition: ["200% 0", "-200% 0"] },
  transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
};
```

---

## 7. Responsive Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px    /* Mobile landscape */
md: 768px    /* Tablet */
lg: 1024px   /* Desktop */
xl: 1280px   /* Large desktop */
2xl: 1536px  /* Extra large */
```

### 7.1 Responsive Patterns

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navigation | Hamburger + drawer | Hamburger + drawer | Full horizontal nav |
| Homepage hero | Full-width text, stacked | Side-by-side | Full slider with text overlay |
| Product grid | 1 column | 2 columns | 3-4 columns |
| Blog grid | 1 column | 2 columns | 3 columns + sidebar |
| Gallery | 2 columns | 3 columns | 4 columns masonry |
| Admin sidebar | Hidden (toggle) | Collapsible | Always visible |
| AI Studio | Stacked panels | Two panels | Three panels |
| Footer | Stacked sections | 2 columns | 4 columns |
| Tables | Card view | Scrollable | Full table |
| Forms | Full-width inputs | 2 columns | 2-3 columns |

---

## 8. Accessibility Patterns

### 8.1 Keyboard Navigation

- All interactive elements must be focusable
- Tab order follows visual order
- Skip-to-content link at page top
- Escape closes modals/dropdowns
- Arrow keys navigate within menus/tabs
- Enter/Space activates buttons and links
- Focus visible ring (2px solid primary color)

### 8.2 ARIA Patterns

- All images have meaningful `alt` text
- Form inputs have associated `label` elements
- Error messages linked via `aria-describedby`
- Modals use `role="dialog"` + `aria-modal="true"`
- Live regions for dynamic content (`aria-live="polite"`)
- Loading states announced via `aria-busy`
- Status badges have `aria-label` with full status text
- Accordion uses `aria-expanded` + `aria-controls`

### 8.3 Color & Contrast

- All text meets WCAG AA contrast ratio (4.5:1 normal, 3:1 large)
- Status indicators use color + icon + text (not color alone)
- Focus indicators visible on all backgrounds
- Dark mode support via Tailwind `dark:` prefix

---

## 9. Loading & Empty States

### 9.1 Skeleton Patterns

| Component | Skeleton Shape |
|---|---|
| ContentCard | Rectangular image + 2-3 text lines |
| ProductCard | Square image + price + button |
| BlogPost | Wide image + title + meta |
| TeamCard | Circle avatar + text lines |
| DataTable | Multiple row lines |
| SearchResults | List item skeletons |
| StatsCard | Icon + number + label |

### 9.2 Empty State Patterns

| Context | Message | Action |
|---|---|---|
| No search results | "No results found for '{query}'" | Suggest alternative search |
| No blog posts | "No articles yet" | CTA to write first post |
| No products in category | "No products in this category" | Browse all categories |
| No appointments | "No appointments scheduled" | CTA to book appointment |
| No notifications | "You're all caught up!" | — |
| No audit logs | "No activity recorded yet" | — |

---

## 10. Component Naming Conventions

- **PascalCase** for component files and exports
- **Feature-prefixed** for feature-specific components (e.g., `BlogCard`, `ProductGrid`)
- **Shared components** have no prefix (e.g., `Button`, `Card`, `Input`)
- **Admin components** are in `admin/` feature directory
- **Page components** are always `page.tsx` in their route directory
- **Layout components** are always `layout.tsx` in their route directory
- **Server components** are default, `'use client'` only when needed
- **Actions** are in `actions.ts` files alongside their feature
