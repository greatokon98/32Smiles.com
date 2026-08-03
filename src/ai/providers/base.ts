import type {
  AIProvider,
  AIProviderName,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIUsage,
} from "../types"

export abstract class BaseAIProvider implements AIProvider {
  abstract name: AIProviderName
  protected apiKey: string
  protected baseUrl: string
  protected defaultModel: string

  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel: string }) {
    this.apiKey = config.apiKey || ""
    this.baseUrl = config.baseUrl || ""
    this.defaultModel = config.defaultModel
  }

  abstract isAvailable(): Promise<boolean>
  abstract complete(request: AICompletionRequest): Promise<AICompletionResponse>
  abstract getModels(): string[]

  getDefaultModel(): string {
    return this.defaultModel
  }

  async embed?(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    throw new Error(`${this.name} does not support embeddings`)
  }

  estimateCost(promptTokens: number, completionTokens: number, model: string): number {
    // Base implementation — override in providers with actual pricing
    const pricing: Record<string, { input: number; output: number }> = {
      "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
      "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
      "gpt-3.5-turbo": { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 },
      "claude-sonnet-4-20250514": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      "claude-3-5-haiku-20241022": { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
      "gemini-1.5-pro": { input: 1.25 / 1_000_000, output: 5 / 1_000_000 },
      "gemini-1.5-flash": { input: 0.075 / 1_000_000, output: 0.3 / 1_000_000 },
      "llama-3.3-70b-versatile": { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 },
      "mixtral-8x7b-32768": { input: 0.24 / 1_000_000, output: 0.24 / 1_000_000 },
    }

    const rates = pricing[model] || { input: 1 / 1_000_000, output: 2 / 1_000_000 }
    return promptTokens * rates.input + completionTokens * rates.output
  }

  protected buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    }
  }

  protected async fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After")
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000
          await new Promise((r) => setTimeout(r, waitMs))
          continue
        }
        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000))
      }
    }
    throw new Error("Max retries exceeded")
  }
}
