import { getAIRegistry } from "./providers/registry"
import { promptService } from "./prompts/service"
import { rateLimiter, costTracker, contentSafety } from "./operations"
import type {
  AIProviderName,
  AIGenerationOptions,
  AICompletionResponse,
} from "./types"

// ─── AI Generation Service ───────────────────────────────

export interface GenerateContentInput {
  templateId?: string
  templateSlug?: string
  variables?: Record<string, string>
  prompt?: string
  systemPrompt?: string
  options?: AIGenerationOptions
  contentId?: string
  userId?: string
}

export interface GenerateContentResult {
  content: string
  response: AICompletionResponse
  safetyCheck: { safe: boolean; flags: string[]; confidence: number }
  templateUsed?: string
}

export const aiService = {
  // Generate content using a template or raw prompt
  async generate(input: GenerateContentInput): Promise<GenerateContentResult> {
    const registry = await getAIRegistry()
    const options = input.options || {}

    // Build messages from template or raw prompt
    let systemPrompt = options.systemPrompt || "You are a helpful AI assistant."
    let userPrompt = ""

    if (input.templateId || input.templateSlug) {
      // Use template
      const template = input.templateSlug
        ? await promptService.getBySlug(input.templateSlug)
        : input.templateId
          ? await promptService.getById(input.templateId)
          : null

      if (!template) throw new Error("Template not found")

      // Render template with brand voice
      const rendered = await promptService.render(template.id, input.variables || {})
      systemPrompt = rendered.systemPrompt
      userPrompt = rendered.userPrompt
    } else if (input.prompt) {
      userPrompt = input.prompt
    } else {
      throw new Error("Either templateId/templateSlug or prompt is required")
    }

    // Add knowledge base context if provided
    if (options.knowledgeBaseContext) {
      userPrompt = `Context from knowledge base:\n${options.knowledgeBaseContext}\n\n---\n\n${userPrompt}`
    }

    // Rate limit check
    const providerName = options.provider || "openai"
    const provider = registry.get(providerName)
    const config = registry.getConfig(providerName)

    if (config) {
      const rateCheck = await rateLimiter.check(providerName, input.userId || "anonymous", {
        rpm: config.rateLimitRpm,
        tpd: config.rateLimitTpd,
      })

      if (!rateCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateCheck.retryAfterMs}ms`)
      }
    }

    // Content safety check on input
    const inputSafety = contentSafety.check(userPrompt)

    // Make completion request
    const response = await registry.complete(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: options.model,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
      },
      providerName
    )

    // Content safety check on output
    const outputSafety = contentSafety.check(response.content)

    // Track cost
    await costTracker.track({
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      estimatedCostUsd: response.usage.estimatedCostUsd,
      userId: input.userId,
      contentId: input.contentId,
      operationType: input.templateId ? "template_generation" : "raw_generation",
    })

    return {
      content: response.content,
      response,
      safetyCheck: {
        safe: inputSafety.safe && outputSafety.safe,
        flags: [...inputSafety.flags, ...outputSafety.flags],
        confidence: Math.min(inputSafety.confidence, outputSafety.confidence),
      },
      templateUsed: input.templateId || input.templateSlug,
    }
  },

  // Generate SEO metadata for content
  async generateSEO(params: {
    title: string
    content: string
    keyword?: string
    userId?: string
  }) {
    const result = await this.generate({
      templateSlug: "seo-meta-writer",
      variables: {
        pageTitle: params.title,
        contentSummary: params.content.slice(0, 500),
        keyword: params.keyword || params.title,
      },
      options: {
        temperature: 0.3,
        maxTokens: 256,
      },
      userId: params.userId,
    })

    // Parse the response into structured SEO data
    const lines = result.content.split("\n").filter(Boolean)
    const metaTitle = lines.find((l) => l.toLowerCase().includes("title:"))?.split(":").slice(1).join(":").trim() || params.title.slice(0, 60)
    const metaDescription = lines.find((l) => l.toLowerCase().includes("description:"))?.split(":").slice(1).join(":").trim() || ""

    return { metaTitle, metaDescription, raw: result.content }
  },

  // Rewrite content for clarity/tone
  async rewrite(params: {
    content: string
    instructions: string
    userId?: string
  }) {
    return this.generate({
      templateSlug: "content-rewriter",
      variables: {
        content: params.content,
        instructions: params.instructions,
      },
      options: { temperature: 0.5 },
      userId: params.userId,
    })
  },

  // Generate image prompt
  async generateImagePrompt(params: {
    description: string
    style?: string
    mood?: string
    userId?: string
  }) {
    return this.generate({
      templateSlug: "image-prompt-generator",
      variables: {
        description: params.description,
        style: params.style || "professional photography",
        mood: params.mood || "warm, welcoming",
      },
      options: { temperature: 0.8, maxTokens: 512 },
      userId: params.userId,
    })
  },

  // Get usage stats
  async getStats(provider?: AIProviderName) {
    const [dailySpend, summary] = await Promise.all([
      costTracker.getDailySpend(provider),
      costTracker.getUsageSummary(provider),
    ])

    const registry = await getAIRegistry()
    const status = await registry.getStatus()

    return {
      dailySpend,
      summary,
      providers: status,
    }
  },
}
