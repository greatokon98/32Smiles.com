import type {
  AICompletionRequest,
  AICompletionResponse,
} from "../types"
import { BaseAIProvider } from "./base"

export class GroqProvider extends BaseAIProvider {
  name = "groq" as const

  private models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ]

  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super({
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      baseUrl: config.baseUrl || "https://api.groq.com/openai/v1",
      defaultModel: config.defaultModel || "llama-3.3-70b-versatile",
    })
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now()
    const model = request.model || this.defaultModel

    const body = {
      model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      top_p: request.topP,
      stop: request.stop,
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Groq API error: ${response.status} - ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message.content,
      model: data.model,
      provider: "groq",
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        estimatedCostUsd: this.estimateCost(data.usage.prompt_tokens, data.usage.completion_tokens, data.model),
      },
      finishReason: choice.finish_reason,
      latencyMs: Date.now() - startTime,
    }
  }

  getModels(): string[] {
    return this.models
  }

  override estimateCost(promptTokens: number, completionTokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      "llama-3.3-70b-versatile": { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 },
      "llama-3.1-8b-instant": { input: 0.05 / 1_000_000, output: 0.08 / 1_000_000 },
      "mixtral-8x7b-32768": { input: 0.24 / 1_000_000, output: 0.24 / 1_000_000 },
      "gemma2-9b-it": { input: 0.2 / 1_000_000, output: 0.2 / 1_000_000 },
    }
    const rates = pricing[model] || { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 }
    return promptTokens * rates.input + completionTokens * rates.output
  }
}
