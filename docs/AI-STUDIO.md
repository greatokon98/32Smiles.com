# 32Smiles — AI Content Studio Specification

> **Date**: July 27, 2026
> **Version**: 1.0
> **Scope**: AI Content Studio UI/UX — the human-AI collaboration environment

---

## 1. Overview

The AI Content Studio is the heart of the human-AI collaboration workflow. It provides a split-pane interface where editors work alongside an AI assistant to create, refine, and prepare content for publication. The AI never publishes directly — every piece of content passes through a structured review workflow with human oversight at every stage.

### 1.1 Core Principles

1. **Human in the Loop** — AI assists, humans decide. No auto-publishing.
2. **Transparency** — Editors see what AI generated, what prompts were used, which provider responded
3. **Iteration** — Easy regeneration, comparison, and refinement
4. **Accountability** — Full audit trail of who did what, when
5. **Quality** — Safety checks, SEO validation, brand voice compliance before publishing

---

## 2. Studio Layout

### 2.1 Three-Panel Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│  AI Content Studio                                        [?] [⚙]  │
├───────────┬───────────────────────────────────┬─────────────────────┤
│           │                                   │                     │
│  DRAFTS   │         EDITOR AREA               │   AI ASSISTANT      │
│  LIST     │                                   │   PANEL             │
│           │  ┌─────────────────────────────┐  │                     │
│  [New]    │  │ Title                        │  │  ┌──────────────┐  │
│           │  ├─────────────────────────────┤  │  │ Prompt       │  │
│  ● Draft  │  │                             │  │  │ Template     │  │
│  ○ Review │  │                             │  │  ├──────────────┤  │
│  ✓ Pub    │  │  Rich Text Editor           │  │  │ Topic        │  │
│           │  │  (Tiptap / Lexical)         │  │  ├──────────────┤  │
│  ─────── │  │                             │  │  │ Parameters   │  │
│  Today    │  │                             │  │  │ • Audience   │  │
│  Draft 1  │  │                             │  │  │ • Tone       │  │
│  Draft 2  │  │                             │  │  │ • Word count │  │
│           │  │                             │  │  │ • Keywords   │  │
│  Yesterday│  │                             │  │  ├──────────────┤  │
│  Draft 3  │  │                             │  │  │ Provider     │  │
│           │  │                             │  │  │ [Groq ▾]     │  │
│  ─────── │  ├─────────────────────────────┤  │  ├──────────────┤  │
│  Last Week│  │ Word count: 847             │  │  │ Brand Voice  │  │
│  Draft 4  │  │ Reading time: 4 min         │  │  │ [Pro & Warm] │  │
│           │  │ Status: Draft               │  │  ├──────────────┤  │
│           │  ├─────────────────────────────┤  │  │ KB Context   │  │
│           │  │ [Save] [Preview] [Publish]  │  │  │ [✓ Use KB]   │  │
│           │  └─────────────────────────────┘  │  ├──────────────┤  │
│           │                                   │  │              │  │
│           │                                   │  │ [✨ Generate]│  │
│           │                                   │  │              │  │
│           │                                   │  ├──────────────┤  │
│           │                                   │  │ Token Usage  │  │
│           │                                   │  │ Cost: $0.02  │  │
│           │                                   │  │ This session │  │
│           │                                   │  └──────────────┘  │
│           │                                   │                     │
├───────────┴───────────────────────────────────┴─────────────────────┤
│  [Drafts]  [SEO]  [Image]  [Review]  [Knowledge Base]              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Left Panel — Drafts List

**Features:**
- Filter by status (Draft, AI Generated, Under Review, Published)
- Search by title
- Sort by date, status, word count
- Quick actions (edit, duplicate, delete)
- Color-coded status badges
- Auto-save indicator per draft
- "New Draft" button at top

**Draft Item:**
```
┌──────────────────────────────┐
│ ● Understanding Root Canal   │
│   AI Generated • 847 words  │
│   2 hours ago               │
│   Provider: Groq • $0.01    │
│   [Edit] [Duplicate] [Del]  │
└──────────────────────────────┘
```

### 2.3 Center Panel — Editor Area

**Features:**
- Rich text editor (Tiptap or Lexical)
- Markdown support with live preview
- Inline formatting toolbar
- Image upload with drag-and-drop
- Link insertion
- Table support
- Code block support
- Auto-save (debounced, 2-second delay)
- Version history access
- Word count + reading time (live)
- Status indicator

### 2.4 Right Panel — AI Assistant

**Features:**
- Prompt template selector (dropdown)
- Topic input (text area)
- Parameters panel (audience, tone, word count, keywords)
- Provider selector with cost estimate
- Brand voice selector
- Knowledge base toggle
- Generate button with loading state
- Generated content preview
- Regenerate button
- Use generated content button (inserts into editor)
- Cost tracker (tokens used, cost this session)

---

## 3. Content Creation Workflows

### 3.1 Create New Blog Post (AI-Assisted)

```
Step 1: Click "New Draft" → Select "Blog Post"
Step 2: Enter title (optional — AI can suggest)
Step 3: In AI Assistant panel:
   a. Select prompt template: "Blog Post"
   b. Enter topic: "Benefits of regular dental checkups"
   c. Set parameters:
      - Audience: Patients
      - Tone: Friendly
      - Word count: 800
      - Include FAQ: Yes
   d. Select provider: Groq (fast, cheap)
   e. Toggle "Use KB Context": ON
   f. Click "✨ Generate"
Step 4: AI generates content (3-10 seconds)
Step 5: Review generated content in AI panel
Step 6: Click "Use This Content" → Content inserted into editor
Step 7: Edit/modify as needed in editor
Step 8: Add featured image (upload or generate image prompt)
Step 9: Fill SEO panel (meta title, description, focus keyword)
Step 10: Click "Submit for Review"
Step 11: Status changes to "Under Review"
```

### 3.2 Create New Service Page

```
Step 1: Click "New Draft" → Select "Service"
Step 2: Enter service name: "Dental Veneers"
Step 3: Select prompt template: "Service Description"
Step 4: Set parameters:
   - Service type: Cosmetic
   - Key benefits: Natural appearance, stain-resistant, minimally invasive
   - Target: Patients considering cosmetic dentistry
Step 5: Generate → Review → Edit → Submit for review
```

### 3.3 Create SEO Metadata

```
Step 1: Open existing content (blog post, service, etc.)
Step 2: Click "SEO" tab at bottom of editor
Step 3: Click "Generate SEO" button
Step 4: AI generates:
   - Meta title (under 60 chars)
   - Meta description (under 160 chars)
   - 5 suggested focus keywords
   - Open Graph title and description
Step 5: Review and edit as needed
Step 6: Preview in Google SERP simulator
Step 7: Save
```

### 3.4 Generate Image Prompts

```
Step 1: In editor, click "Featured Image" area
Step 2: Click "Generate Image Prompt" tab
Step 3: Enter description: "A friendly dentist explaining a procedure to a patient"
Step 4: Select style: "Professional photography"
Step 5: Select provider: OpenAI (DALL-E compatible)
Step 6: Click "Generate Prompt"
Step 7: Review generated prompt
Step 8: Copy to clipboard for use in DALL-E/Midjourney
Step 9: Upload generated image as featured image
```

### 3.5 Refine Existing Content

```
Step 1: Open existing draft or published content
Step 2: Select text in editor
Step 3: Right-click → "Improve with AI"
Step 4: Choose improvement type:
   - Rewrite for clarity
   - Make more professional
   - Add more detail
   - Simplify language
   - Fix grammar
   - Shorten
Step 5: AI suggests revision
Step 6: Accept, reject, or modify
```

---

## 4. Review Workflow UI

### 4.1 Status Timeline

Visual timeline showing the content's progress through the workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│  Content Workflow Status                                        │
│                                                                 │
│  ● ──── ● ──── ● ──── ◐ ──── ○ ──── ○ ──── ○               │
│  Draft  AI Gen  Review  SEO    Approved  Published  Archived   │
│                   ↑                                        │
│              YOU ARE HERE                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Review Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  Review Queue                                    [Filter ▾]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Understanding Root Canal Treatment                      │   │
│  │ Status: Under Review • Submitted 2 hours ago            │   │
│  │ Author: Dr. Sarah • AI Provider: Groq                   │   │
│  │                                                         │   │
│  │ [View Content] [View Diff] [View AI Log]               │   │
│  │                                                         │   │
│  │ [✓ Approve]  [✎ Request Changes]  [✗ Reject]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Teeth Whitening: What to Expect                         │   │
│  │ Status: SEO Review • Approved 1 day ago                 │   │
│  │ Author: Dr. Mike • AI Provider: OpenAI                  │   │
│  │                                                         │   │
│  │ [View Content] [View SEO] [View AI Log]                │   │
│  │                                                         │   │
│  │ [✓ SEO Approve]  [✎ SEO Issues]  [✗ Reject]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Diff View

Side-by-side comparison for reviewing AI-generated changes:

```
┌──────────────────────────┬──────────────────────────┐
│  ORIGINAL (v1)           │  AI PROPOSED (v2)        │
├──────────────────────────┼──────────────────────────┤
│  Root canal treatment    │  Root canal treatment    │
│  is a procedure to       │  is a carefully performed│
│  remove infected pulp.   │  procedure designed to   │
│                          │  remove infected pulp    │
│                          │  while preserving your   │
│                          │  natural tooth.          │
├──────────────────────────┼──────────────────────────┤
│  [Accept] [Reject] [Edit]│                          │
└──────────────────────────┴──────────────────────────┘
```

---

## 5. AI Generation Panel

### 5.1 Prompt Template Selector

```
┌──────────────────────────────────────┐
│ Prompt Template                      │
│ [Blog Post                    ▾]     │
│                                      │
│ Available Templates:                 │
│ ─────────────────                    │
│ 📝 Blog Post                        │
│ 📋 Service Description              │
│ 📦 Product Description              │
│ 📚 Education Article                │
│ 🔍 SEO Meta Tags                    │
│ ❓ FAQ Generation                   │
│ 📱 Social Media Post                │
│ 🖼️ Image Prompt                     │
│ 📧 Email Template                   │
│ ✏️ Content Rewrite                   │
│ 📝 Content Summary                  │
│ 🔎 Content Review                   │
│                                      │
│ [+ Create New Template]              │
└──────────────────────────────────────┘
```

### 5.2 Parameters Panel

```
┌──────────────────────────────────────┐
│ Parameters                           │
│                                      │
│ Target Audience                      │
│ [Patients              ▾]            │
│                                      │
│ Tone of Voice                        │
│ [Professional & Warm  ▾]            │
│                                      │
│ Target Word Count                    │
│ [800         ]                       │
│                                      │
│ Key Topics (comma-separated)         │
│ [benefits, prevention, cost    ]     │
│                                      │
│ ☑ Include FAQ section                │
│ ☑ Include call-to-action             │
│ ☐ Include statistics                 │
│ ☐ Include patient testimonials       │
│                                      │
│ Writing Style                        │
│ [Balanced        ▾]                  │
│  • Concise (fewer words, direct)    │
│  • Balanced (moderate detail)       │
│  • Comprehensive (thorough)         │
└──────────────────────────────────────┘
```

### 5.3 Provider Selector

```
┌──────────────────────────────────────┐
│ AI Provider                          │
│                                      │
│ ● Groq (Llama 3.3)         $0.01   │
│   ⚡ Fastest • 💰 Cheapest          │
│                                      │
│ ○ OpenAI (GPT-4o-mini)     $0.02   │
│   ⚡ Fast • 💰 Budget               │
│                                      │
│ ○ OpenAI (GPT-4o)          $0.08   │
│   ⭐ Best quality • 💰 Premium      │
│                                      │
│ ○ Anthropic (Sonnet 4)     $0.10   │
│   ⭐ Best quality • 💰 Premium      │
│                                      │
│ ○ Gemini (2.5 Flash)       $0.02   │
│   ⚡ Fast • 💰 Budget               │
│                                      │
│ [Test Provider Connection]           │
│                                      │
│ Estimated cost for this generation:  │
│ ~$0.01 - $0.03 (depending on model) │
└──────────────────────────────────────┘
```

### 5.4 Knowledge Base Toggle

```
┌──────────────────────────────────────┐
│ Knowledge Base Context               │
│                                      │
│ ☑ Use knowledge base for context     │
│                                      │
│ When enabled, the AI will search     │
│ approved content for relevant        │
│ context to ground its response.      │
│                                      │
│ Found 3 relevant articles:           │
│ • "Dental Hygiene Guide" (92%)       │
│ • "Preventive Care Tips" (87%)       │
│ • "Patient FAQ: Cleanings" (81%)     │
│                                      │
│ [View Context] [Search KB]           │
└──────────────────────────────────────┘
```

---

## 6. Content Lifecycle States

### 6.1 State Definitions

| State | Color | Description | Who Can Set |
|---|---|---|---|
| `DRAFT` | Gray | Initial state, being written | Editor |
| `AI_GENERATED` | Amber | Content generated by AI, not yet reviewed | System |
| `AI_ASSISTED` | Blue | Editor has modified AI output, ready for review | Editor |
| `UNDER_REVIEW` | Blue (pulse) | Submitted for human review | Editor |
| `REVISIONS_REQUESTED` | Orange | Reviewer requested changes | Reviewer |
| `REJECTED` | Red | Content rejected | Reviewer |
| `APPROVED` | Green | Content approved by reviewer | Admin/Editor |
| `SEO_REVIEW` | Purple | Awaiting SEO review | Admin |
| `SEO_APPROVED` | Green (bright) | SEO approved | Admin |
| `PUBLISHED` | Teal | Live on website | Admin |
| `ARCHIVED` | Gray (dark) | Removed from site but preserved | Admin |

### 6.2 State Transitions

```
DRAFT ──────────────────────→ AI_GENERATED
  │                                 │
  │ (manual save)                   │ (AI generates)
  │                                 │
  ▼                                 ▼
AI_ASSISTED ←──────────────── AI_GENERATED
  │                            (editor modifies)
  │
  │ (submit for review)
  ▼
UNDER_REVIEW
  │
  ├──→ REVISIONS_REQUESTED ──→ AI_ASSISTED (back to editor)
  │
  ├──→ REJECTED (terminal for this version)
  │
  └──→ APPROVED
         │
         │ (SEO review)
         ▼
       SEO_REVIEW
         │
         ├──→ REVISIONS_REQUESTED (SEO issues)
         │
         └──→ SEO_APPROVED
                │
                │ (publish)
                ▼
              PUBLISHED
                │
                └──→ ARCHIVED
```

---

## 7. AI Generation History

### 7.1 Generation Log Panel

Accessible from any draft, shows the full history of AI interactions:

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Generation History for "Root Canal Guide"                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  #3 — Today, 2:30 PM                                           │
│  Provider: Groq (llama-3.3-70b-versatile)                      │
│  Template: blog-post                                            │
│  Tokens: 1,247 in / 843 out                                    │
│  Cost: $0.001                                                   │
│  Latency: 3.2s                                                  │
│  Status: ✅ Success                                             │
│  [View Prompt] [View Response] [Use This Version]              │
│                                                                 │
│  #2 — Today, 2:25 PM                                           │
│  Provider: OpenAI (gpt-4o-mini)                                │
│  Template: blog-post                                            │
│  Tokens: 1,189 in / 792 out                                    │
│  Cost: $0.002                                                   │
│  Latency: 5.1s                                                  │
│  Status: ✅ Success                                             │
│  [View Prompt] [View Response] [Use This Version]              │
│                                                                 │
│  #1 — Today, 2:20 PM                                           │
│  Provider: OpenAI (gpt-4o)                                     │
│  Template: blog-post                                            │
│  Tokens: 1,156 in / 801 out                                    │
│  Cost: $0.011                                                   │
│  Latency: 8.7s                                                  │
│  Status: ✅ Success                                             │
│  [View Prompt] [View Response] [Use This Version]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Prompt/Response Viewer

```
┌─────────────────────────────────────────────────────────────────┐
│  Generation #3 — Prompt & Response                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SYSTEM PROMPT:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ You are writing for 32Smiles Dental Clinic...           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  USER PROMPT:                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Write a blog post about root canal treatment...         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  RESPONSE:                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ # Understanding Root Canal Treatment: What You Need...  │   │
│  │                                                         │   │
│  │ If your dentist has recommended a root canal, you're    │   │
│  │ not alone. Millions of teeth are treated and saved...   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  METADATA:                                                      │
│  Provider: Groq • Model: llama-3.3-70b-versatile               │
│  Tokens: 1,247 input / 843 output                              │
│  Cost: $0.001 • Latency: 3.2s                                  │
│  Safety: ✅ Passed (score: 0.95)                                │
│                                                                 │
│  [Copy Response] [Use in Editor] [Regenerate] [Compare v2]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. SEO Panel

### 8.1 SEO Editor

```
┌─────────────────────────────────────────────────────────────────┐
│  SEO Settings                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Meta Title                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Understanding Root Canal Treatment | 32Smiles    [52/60]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Meta Description                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Learn about root canal treatment at 32Smiles Dental     │   │
│  │ Clinic in Lagos. We explain the procedure, benefits,    │   │
│  │ and what to expect.                     [142/160]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Focus Keyword                                                  │
│  [root canal treatment]                                         │
│                                                                 │
│  OG Image                                                       │
│  [Upload Image] or [Generate with AI]                           │
│                                                                 │
│  Google SERP Preview:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Understanding Root Canal Treatment | 32Smiles          │   │
│  │ www.32smiles.com/blog/root-canal-treatment              │   │
│  │ Learn about root canal treatment at 32Smiles Dental     │   │
│  │ Clinic in Lagos. We explain the procedure, benefits...  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SEO Score: 85/100  ████████████████████░░                     │
│  ✓ Title length OK                                              │
│  ✓ Description length OK                                        │
│  ✓ Focus keyword in title                                       │
│  ✗ Focus keyword in first paragraph                             │
│  ✓ URL slug is SEO-friendly                                     │
│  ☐ Structured data (auto-generated on publish)                  │
│                                                                 │
│  [Generate SEO with AI] [Save]                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Image Prompt Generation

### 9.1 Image Prompt Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  Generate Image Prompt                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Describe the image you need:                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ A friendly female dentist explaining a dental procedure │   │
│  │ to a patient in a modern, bright dental office.         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Style:                                                         │
│  [Professional Photography ▾]                                   │
│                                                                 │
│  Aspect Ratio:                                                  │
│  [16:9 (Landscape) ▾]                                           │
│                                                                 │
│  Provider:                                                      │
│  [OpenAI (DALL-E) ▾]                                            │
│                                                                 │
│  [✨ Generate Image Prompt]                                      │
│                                                                 │
│  Generated Prompt:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Professional photograph of a female dentist in white    │   │
│  │ coat, sitting across from a patient in a modern dental  │   │
│  │ office. The dentist is pointing at a dental model while │   │
│  │ explaining. Bright natural lighting, clean white and    │   │
│  │ teal color scheme. Warm, reassuring atmosphere. Shot on │   │
│  │ Canon EOS R5, 35mm lens, shallow depth of field.        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Copy to Clipboard] [Save as Prompt] [Regenerate]             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Knowledge Base Panel

### 10.1 KB Search & Insert

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base Search                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search knowledge base...                      [Search]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Filter by: [All Types ▾] [All Dates ▾]                        │
│                                                                 │
│  Results (3 found):                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dental Hygiene & Prevention                   [92%]     │   │
│  │ Type: Education • Published: Jan 2024                   │   │
│  │ "Regular dental checkups are essential for..."          │   │
│  │ [Insert as Context] [View Full] [Copy]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Preventive Care Tips for Families              [87%]    │   │
│  │ Type: Blog • Published: Mar 2024                       │   │
│  │ "Good oral hygiene starts at home with..."             │   │
│  │ [Insert as Context] [View Full] [Copy]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Patient FAQ: Dental Cleanings                  [81%]    │   │
│  │ Type: FAQ • Published: Feb 2024                        │   │
│  │ "How often should I get a dental cleaning?"            │   │
│  │ [Insert as Context] [View Full] [Copy]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Mobile Responsive

### 11.1 Mobile Studio Layout

On mobile/tablet, the three-panel layout collapses to a tabbed interface:

```
┌─────────────────────────────┐
│ AI Studio          [≡]     │
├─────────────────────────────┤
│ [Editor] [AI] [SEO] [Review]│
├─────────────────────────────┤
│                             │
│  (Active tab content)       │
│                             │
│                             │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

- **Editor tab**: Full-screen rich text editor
- **AI tab**: AI Assistant controls (full width)
- **SEO tab**: SEO settings
- **Review tab**: Review workflow status

Bottom sheet for quick actions (Save, Preview, Submit for Review).

---

## 12. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl + S` | Save draft |
| `⌘/Ctrl + Enter` | Submit for review |
| `⌘/Ctrl + Shift + G` | Generate with AI |
| `⌘/Ctrl + Shift + R` | Regenerate |
| `⌘/Ctrl + K` | Command palette |
| `⌘/Ctrl + P` | Preview content |
| `⌘/Ctrl + Shift + P` | Publish (admin only) |
| `⌘/Ctrl + Z` | Undo |
| `⌘/Ctrl + Shift + Z` | Redo |
| `⌘/Ctrl + B` | Bold |
| `⌘/Ctrl + I` | Italic |
| `⌘/Ctrl + U` | Underline |
| `⌘/Ctrl + H` | Insert heading |
| `⌘/Ctrl + Shift + C` | Copy AI prompt |
| `⌘/Ctrl + /` | Show keyboard shortcuts |

---

## 13. State Management

### 13.1 Zustand Store

```typescript
// src/stores/ai-studio.store.ts

interface AIStudioState {
  // Current draft
  currentDraft: AIDraft | null;
  draftContent: string;
  isDirty: boolean;

  // AI generation
  isGenerating: boolean;
  selectedProvider: string;
  selectedTemplate: string;
  selectedBrandVoice: string;
  generationParams: GenerationParams;
  lastGeneratedContent: string;
  generationHistory: GenerationLog[];
  sessionCost: number;

  // Knowledge base
  useKnowledgeBase: boolean;
  kbSearchResults: SearchResult[];
  selectedKBContext: string[];

  // UI state
  activeTab: 'editor' | 'ai' | 'seo' | 'review' | 'kb';
  showPreview: boolean;
  showDiff: boolean;
  showHistory: boolean;

  // Actions
  setCurrentDraft: (draft: AIDraft) => void;
  updateDraftContent: (content: string) => void;
  saveDraft: () => Promise<void>;
  generateContent: () => Promise<void>;
  regenerateContent: () => Promise<void>;
  submitForReview: () => Promise<void>;
  approveDraft: () => Promise<void>;
  rejectDraft: (reason: string) => Promise<void>;
  publishDraft: () => Promise<void>;
}
```

---

## 14. Auto-Save Behavior

| Event | Behavior |
|---|---|
| Typing stops (2s) | Auto-save to draft |
| Tab switch | Auto-save + update |
| Generate with AI | Auto-save before generation |
| Insert AI content | Auto-save after insertion |
| Close tab/browser | Auto-save + confirm |
| Network error | Queue save for retry, show indicator |
| Conflict (another edit) | Show conflict resolution dialog |
