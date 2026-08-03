export interface ContentTypeConfig {
  label: string
  description: string
  fields: FormField[]
}

export interface FormField {
  name: string
  label: string
  type: "text" | "textarea" | "select" | "number" | "toggle"
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  defaultValue?: string | number | boolean
}

export const contentTypeConfigs: Record<string, ContentTypeConfig> = {
  blog: {
    label: "Blog Post",
    description: "Create engaging blog content for your dental practice website",
    fields: [
      { name: "topic", label: "Topic / Title", type: "text", required: true, placeholder: "e.g., Benefits of regular dental checkups" },
      { name: "targetAudience", label: "Target Audience", type: "select", options: [{ label: "Patients", value: "patients" }, { label: "Dentists", value: "dentists" }, { label: "Both", value: "both" }], defaultValue: "patients" },
      { name: "tone", label: "Tone of Voice", type: "select", options: [{ label: "Professional", value: "professional" }, { label: "Friendly", value: "friendly" }, { label: "Educational", value: "educational" }, { label: "Authoritative", value: "authoritative" }, { label: "Empathetic", value: "empathetic" }], defaultValue: "professional" },
      { name: "wordCount", label: "Target Word Count", type: "number", defaultValue: 800 },
      { name: "keyTopics", label: "Key Topics", type: "textarea", placeholder: "Comma-separated key points" },
      { name: "includeFaq", label: "Include FAQ section", type: "toggle", defaultValue: true },
      { name: "includeCta", label: "Include call-to-action", type: "toggle", defaultValue: true },
      { name: "seoKeywords", label: "SEO Keywords", type: "text", placeholder: "Primary SEO keywords" },
    ],
  },
  service: {
    label: "Service Description",
    description: "Describe your dental services with compelling detail",
    fields: [
      { name: "serviceName", label: "Service Name", type: "text", required: true, placeholder: "e.g. Teeth Whitening" },
      { name: "uniqueSellingPoints", label: "Unique Selling Points", type: "textarea", placeholder: "What makes this service special" },
      { name: "targetAudience", label: "Target Audience", type: "select", options: [{ label: "Patients", value: "patients" }, { label: "Dentists", value: "dentists" }, { label: "Both", value: "both" }], defaultValue: "patients" },
      { name: "tone", label: "Tone of Voice", type: "select", options: [{ label: "Professional", value: "professional" }, { label: "Friendly", value: "friendly" }, { label: "Educational", value: "educational" }, { label: "Authoritative", value: "authoritative" }, { label: "Empathetic", value: "empathetic" }], defaultValue: "professional" },
      { name: "wordCount", label: "Target Word Count", type: "number", defaultValue: 500 },
      { name: "includePriceInfo", label: "Include price information", type: "toggle" },
      { name: "includeDuration", label: "Include procedure duration", type: "toggle" },
      { name: "includeAftercare", label: "Include aftercare instructions", type: "toggle", defaultValue: true },
      { name: "faqTopics", label: "FAQ Topics", type: "textarea", placeholder: "Common questions to address" },
    ],
  },
  education: {
    label: "Education Article",
    description: "Create informative educational content for patients or professionals",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g., How dental implants work" },
      { name: "educationLevel", label: "Education Level", type: "select", options: [{ label: "Basic", value: "basic" }, { label: "Intermediate", value: "intermediate" }, { label: "Advanced", value: "advanced" }, { label: "Professional", value: "professional" }], defaultValue: "intermediate" },
      { name: "targetAudience", label: "Target Audience", type: "select", options: [{ label: "Patients", value: "patients" }, { label: "Dentists", value: "dentists" }, { label: "Both", value: "both" }], defaultValue: "patients" },
      { name: "tone", label: "Tone of Voice", type: "select", options: [{ label: "Educational", value: "educational" }, { label: "Professional", value: "professional" }, { label: "Friendly", value: "friendly" }, { label: "Scientific", value: "scientific" }], defaultValue: "educational" },
      { name: "wordCount", label: "Target Word Count", type: "number", defaultValue: 1000 },
      { name: "includeDiagrams", label: "Include diagrams", type: "toggle" },
      { name: "includeReferences", label: "Include references", type: "toggle" },
      { name: "includeGlossary", label: "Include glossary", type: "toggle" },
      { name: "keyTerms", label: "Key Terminology", type: "textarea", placeholder: "Key terminology to include" },
    ],
  },
  faq: {
    label: "FAQ Generation",
    description: "Generate frequently asked questions with answers",
    fields: [
      { name: "question", label: "Question", type: "text", required: true, placeholder: "e.g., How often should I visit the dentist?" },
      { name: "answerLength", label: "Answer Length", type: "select", options: [{ label: "Short (2-3 sentences)", value: "short" }, { label: "Medium (paragraph)", value: "medium" }, { label: "Detailed (multiple paragraphs)", value: "detailed" }], defaultValue: "medium" },
      { name: "tone", label: "Tone of Voice", type: "select", options: [{ label: "Friendly", value: "friendly" }, { label: "Professional", value: "professional" }, { label: "Empathetic", value: "empathetic" }], defaultValue: "friendly" },
      { name: "relatedQuestions", label: "Related Questions", type: "textarea", placeholder: "Related questions to address" },
      { name: "includeSources", label: "Include sources", type: "toggle" },
    ],
  },
  seo: {
    label: "SEO Meta Tags",
    description: "Optimize your content with search engine meta tags",
    fields: [
      { name: "pageTitle", label: "Page Title", type: "text", required: true, placeholder: "Target page title or topic" },
      { name: "focusKeyword", label: "Focus Keyword", type: "text", required: true, placeholder: "Primary SEO keyword" },
      { name: "secondaryKeywords", label: "Secondary Keywords", type: "textarea", placeholder: "Secondary keywords (one per line)" },
      { name: "targetAudience", label: "Target Audience", type: "select", options: [{ label: "Patients", value: "patients" }, { label: "Dentists", value: "dentists" }, { label: "Both", value: "both" }], defaultValue: "patients" },
      { name: "competitorUrls", label: "Competitor URLs", type: "textarea", placeholder: "Competitor URLs to analyze" },
      { name: "wordCount", label: "Meta Description Length", type: "number", defaultValue: 160 },
    ],
  },
  rewrite: {
    label: "Content Rewrite",
    description: "Rewrite existing content with new goals or tone",
    fields: [
      { name: "originalContent", label: "Original Content", type: "textarea", required: true, placeholder: "Paste the content to rewrite" },
      { name: "rewriteGoal", label: "Rewrite Goal", type: "select", options: [{ label: "Make more concise", value: "more-concise" }, { label: "Make more detailed", value: "more-detailed" }, { label: "Improve readability", value: "improve-readability" }, { label: "Update tone", value: "update-tone" }, { label: "Optimize for SEO", value: "optimize-for-seo" }], defaultValue: "improve-readability" },
      { name: "tone", label: "Tone of Voice", type: "select", options: [{ label: "Professional", value: "professional" }, { label: "Friendly", value: "friendly" }, { label: "Educational", value: "educational" }, { label: "Authoritative", value: "authoritative" }, { label: "Empathetic", value: "empathetic" }], defaultValue: "professional" },
      { name: "preserveKeywords", label: "Preserve Keywords", type: "textarea", placeholder: "Keywords/phrases that must be preserved" },
      { name: "wordCount", label: "Target Word Count", type: "number", placeholder: "Leave empty for similar length" },
    ],
  },
  image: {
    label: "Image Prompt",
    description: "Generate detailed prompts for AI image creation",
    fields: [
      { name: "subject", label: "Subject", type: "text", required: true, placeholder: "Main subject of the image" },
      { name: "style", label: "Style", type: "select", options: [{ label: "Photorealistic", value: "photorealistic" }, { label: "Illustration", value: "illustration" }, { label: "3D Render", value: "3d-render" }, { label: "Watercolor", value: "watercolor" }, { label: "Minimalist", value: "minimalist" }, { label: "Medical Diagram", value: "medical-diagram" }], defaultValue: "photorealistic" },
      { name: "mood", label: "Mood", type: "select", options: [{ label: "Professional", value: "professional" }, { label: "Warm", value: "warm" }, { label: "Modern", value: "modern" }, { label: "Clinical", value: "clinical" }, { label: "Friendly", value: "friendly" }, { label: "Dramatic", value: "dramatic" }], defaultValue: "professional" },
      { name: "orientation", label: "Orientation", type: "select", options: [{ label: "Square", value: "square" }, { label: "Landscape", value: "landscape" }, { label: "Portrait", value: "portrait" }], defaultValue: "square" },
      { name: "includeText", label: "Include text in image", type: "toggle" },
      { name: "referenceStyle", label: "Reference Styles", type: "textarea", placeholder: "Reference styles or artists" },
      { name: "negativePrompt", label: "Negative Prompt", type: "textarea", placeholder: "What to avoid in the image" },
    ],
  },
}
