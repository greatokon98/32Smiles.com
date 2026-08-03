import type {
  AICompletionRequest,
  AICompletionResponse,
} from "../types"
import { BaseAIProvider } from "./base"

export class AnthropicProvider extends BaseAIProvider {
  name = "anthropic" as const

  private models = [
    "claude-sonnet-4-20250514",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ]

  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseUrl: config.baseUrl || "https://api.anthropic.com/v1",
      defaultModel: config.defaultModel || "claude-3-5-haiku-20241022",
    })
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now()
    const model = request.model || this.defaultModel

    // Separate system message from other messages
    const systemMessage = request.messages.find((m) => m.role === "system")
    const otherMessages = request.messages.filter((m) => m.role !== "system")

    const body: Record<string, unknown> = {
      model,
      messages: otherMessages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Anthropic API error: ${response.status} - ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ""

    return {
      content,
      model: data.model,
      provider: "anthropic",
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        estimatedCostUsd: this.estimateCost(data.usage.input_tokens, data.usage.output_tokens, data.model),
      },
      finishReason: data.stop_reason,
      latencyMs: Date.now() - startTime,
    }
  }

  getModels(): string[] {
    return this.models
  }

  override estimateCost(promptTokens: number, completionTokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      "claude-sonnet-4-20250514": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      "claude-3-5-haiku-20241022": { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
      "claude-3-opus-20240229": { input: 15 / 1_000_000, output: 75 / 1_000_000 },
    }
    const rates = pricing[model] || { input: 3 / 1_000_000, output: 15 / 1_000_000 }
    return promptTokens * rates.input + completionTokens * rates.output
  }
}
