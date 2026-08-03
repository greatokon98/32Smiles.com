import type {
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
} from "../types"
import { BaseAIProvider } from "./base"

export class OpenAIProvider extends BaseAIProvider {
  name = "openai" as const

  private models = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
    "o1",
    "o1-mini",
  ]

  private embeddingModels = ["text-embedding-3-small", "text-embedding-3-large"]

  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: config.baseUrl || "https://api.openai.com/v1",
      defaultModel: config.defaultModel || "gpt-4o-mini",
    })
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.buildHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
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
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message.content,
      model: data.model,
      provider: "openai",
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

  async embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    const model = request.model || "text-embedding-3-small"
    const input = Array.isArray(request.input) ? request.input : [request.input]

    const response = await this.fetchWithRetry(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ model, input }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI embedding error: ${response.status}`)
    }

    const data = await response.json()

    return {
      embeddings: data.data.map((d: { embedding: number[] }) => d.embedding),
      model: data.model,
      provider: "openai",
      usage: {
        totalTokens: data.usage.total_tokens,
      },
    }
  }

  getModels(): string[] {
    return this.models
  }
}
