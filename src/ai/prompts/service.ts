import prisma from "@/lib/prisma"
import type { AIProviderName } from "../types"

// ─── Prompt Template Service ─────────────────────────────

export interface PromptTemplateInput {
  name: string
  slug: string
  category: string
  description?: string
  systemPrompt: string
  userPromptTemplate: string
  variables: string[]
  defaultModel: string
  defaultProvider: AIProviderName
  defaultTemperature: number
  defaultMaxTokens: number
}

export interface RenderedPrompt {
  systemPrompt: string
  userPrompt: string
}

export const promptService = {
  // Get all templates
  async list(category?: string) {
    return prisma.promptTemplate.findMany({
      where: category ? { category } : {},
      orderBy: { name: "asc" },
    })
  },

  // Get template by ID
  async getById(id: string) {
    return prisma.promptTemplate.findUnique({ where: { id } })
  },

  // Get template by slug (uses name as slug)
  async getBySlug(slug: string) {
    return prisma.promptTemplate.findUnique({ where: { name: slug } })
  },

  // Create template
  async create(data: {
    name: string
    category: string
    description?: string
    template: string
    systemPrompt?: string
    variables?: string[]
    defaultParams?: Record<string, string | number | boolean>
  }) {
    return prisma.promptTemplate.create({ data: data as any })
  },

  // Update template
  async update(id: string, data: Partial<{
    name: string
    category: string
    description: string
    template: string
    systemPrompt: string
    variables: string[]
    defaultParams: Record<string, string | number | boolean>
  }>) {
    return prisma.promptTemplate.update({ where: { id }, data: data as any })
  },

  // Delete template
  async delete(id: string) {
    return prisma.promptTemplate.delete({ where: { id } })
  },

  // Render a template with variables
  async render(
    templateId: string,
    variables: Record<string, string>
  ): Promise<RenderedPrompt> {
    const template = await prisma.promptTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) throw new Error("Template not found")

    // Get brand voice
    const brandVoice = await this.getActiveBrandVoice()

    // Build system prompt with brand voice
    let systemPrompt = template.systemPrompt || ""
    if (brandVoice) {
      const voicePrompt = this.buildBrandVoicePrompt(brandVoice)
      systemPrompt = `${voicePrompt}\n\n${systemPrompt}`
    }

    // Render user prompt with variables
    let userPrompt = template.template
    for (const [key, value] of Object.entries(variables)) {
      userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, "g"), value)
    }

    return { systemPrompt, userPrompt }
  },

  // Get active brand voice
  async getActiveBrandVoice() {
    return prisma.brandVoice.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    })
  },

  // Build brand voice prompt from voice fields
  buildBrandVoicePrompt(voice: {
    tone: string
    personality: string
    vocabulary?: string | null
    avoidWords?: string | null
    writingStyle?: string | null
    targetAudience?: string | null
    systemPrompt?: string | null
  }) {
    let prompt = `Brand Voice Guidelines:\n`
    prompt += `- Tone: ${voice.tone}\n`
    prompt += `- Personality: ${voice.personality}\n`
    if (voice.writingStyle) prompt += `- Writing Style: ${voice.writingStyle}\n`
    if (voice.targetAudience) prompt += `- Target Audience: ${voice.targetAudience}\n`
    if (voice.vocabulary) prompt += `- Vocabulary: ${voice.vocabulary}\n`
    if (voice.avoidWords) prompt += `- Words to Avoid: ${voice.avoidWords}\n`
    if (voice.systemPrompt) prompt += `\nAdditional Instructions:\n${voice.systemPrompt}\n`
    return prompt
  },

  // Update brand voice
  async updateBrandVoice(data: {
    name?: string
    tone: string
    personality: string
    vocabulary?: string
    avoidWords?: string
    writingStyle?: string
    targetAudience?: string
    systemPrompt?: string
  }) {
    // Deactivate all existing
    await prisma.brandVoice.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Create new active voice
    return prisma.brandVoice.create({
      data: {
        name: data.name || `Brand Voice - ${new Date().toISOString()}`,
        tone: data.tone,
        personality: data.personality,
        vocabulary: data.vocabulary,
        avoidWords: data.avoidWords,
        writingStyle: data.writingStyle,
        targetAudience: data.targetAudience,
        systemPrompt: data.systemPrompt,
        isActive: true,
      },
    })
  },

  // Seed default templates
  async seedDefaults() {
    const defaults: PromptTemplateInput[] = [
      {
        name: "Blog Post Writer",
        slug: "blog-post-writer",
        category: "CONTENT",
        description: "Generate a comprehensive blog post",
        systemPrompt:
          "You are an expert content writer for a premium dental clinic. Write engaging, SEO-optimized content that educates and informs patients while maintaining a professional, caring tone.",
        userPromptTemplate:
          "Write a blog post about {{topic}}.\n\nTarget audience: {{audience}}\n\nKey points to cover:\n{{keyPoints}}\n\nWord count: {{wordCount}} words",
        variables: ["topic", "audience", "keyPoints", "wordCount"],
        defaultModel: "gpt-4o-mini",
        defaultProvider: "openai",
        defaultTemperature: 0.7,
        defaultMaxTokens: 2048,
      },
      {
        name: "Service Description",
        slug: "service-description",
        category: "CONTENT",
        description: "Generate a service description page",
        systemPrompt:
          "You are a healthcare marketing specialist. Write compelling service descriptions that build trust and encourage patients to book appointments.",
        userPromptTemplate:
          "Write a service description for: {{serviceName}}\n\nDetails:\n{{serviceDetails}}\n\nBenefits to highlight:\n{{benefits}}",
        variables: ["serviceName", "serviceDetails", "benefits"],
        defaultModel: "gpt-4o-mini",
        defaultProvider: "openai",
        defaultTemperature: 0.6,
        defaultMaxTokens: 1024,
      },
      {
        name: "SEO Meta Writer",
        slug: "seo-meta-writer",
        category: "SEO",
        description: "Generate SEO meta titles and descriptions",
        systemPrompt:
          "You are an SEO expert. Generate compelling meta titles (under 60 chars) and descriptions (under 160 chars) that improve click-through rates from search results.",
        userPromptTemplate:
          "Generate SEO meta data for a page about: {{pageTitle}}\n\nContent summary: {{contentSummary}}\n\nTarget keyword: {{keyword}}",
        variables: ["pageTitle", "contentSummary", "keyword"],
        defaultModel: "gpt-4o-mini",
        defaultProvider: "openai",
        defaultTemperature: 0.3,
        defaultMaxTokens: 256,
      },
      {
        name: "FAQ Generator",
        slug: "faq-generator",
        category: "CONTENT",
        description: "Generate FAQs for a topic",
        systemPrompt:
          "You are a dental health educator. Generate clear, accurate FAQs that patients commonly ask about dental topics.",
        userPromptTemplate:
          "Generate 5-8 FAQs about: {{topic}}\n\nContext: {{context}}\n\nInclude both common patient questions and more detailed technical questions.",
        variables: ["topic", "context"],
        defaultModel: "gpt-4o-mini",
        defaultProvider: "openai",
        defaultTemperature: 0.5,
        defaultMaxTokens: 1024,
      },
      {
        name: "Content Rewriter",
        slug: "content-rewriter",
        category: "EDITING",
        description: "Rewrite content for clarity and tone",
        systemPrompt:
          "You are a professional editor. Rewrite the provided content to improve clarity, flow, and readability while maintaining the original meaning and key information.",
        userPromptTemplate:
          "Rewrite the following content:\n\n{{content}}\n\nInstructions: {{instructions}}",
        variables: ["content", "instructions"],
        defaultModel: "gpt-4o-mini",
        defaultProvider: "openai",
        defaultTemperature: 0.5,
        defaultMaxTokens: 2048,
      },
      {
        name: "Image Prompt Generator",
        slug: "image-prompt-generator",
        category: "IMAGE",
        description: "Generate AI image prompts from descriptions",
        systemPrompt:
          "You are an expert at writing prompts for AI image generators. Create detailed, specific prompts that will produce high-quality, professional images.",
        userPromptTemplate:
          "Generate an AI image prompt for:\n\nDescription: {{description}}\n\nStyle: {{style}}\n\nMood: {{mood}}\n\nThe image should be suitable for a dental clinic website.",
        variables: ["description", "style", "mood"],
        defaultModel: "gpt-4o-mini",
        defaultProvider: "openai",
        defaultTemperature: 0.8,
        defaultMaxTokens: 512,
      },
    ]

    for (const template of defaults) {
      const existing = await prisma.promptTemplate.findUnique({
        where: { name: template.name },
      })
      if (!existing) {
        await prisma.promptTemplate.create({ data: {
          name: template.name,
          category: template.category,
          description: template.description,
          template: template.userPromptTemplate,
          systemPrompt: template.systemPrompt,
          variables: template.variables,
          defaultParams: {
            model: template.defaultModel,
            provider: template.defaultProvider,
            temperature: template.defaultTemperature,
            maxTokens: template.defaultMaxTokens,
          },
        }})
      }
    }
  },
}
