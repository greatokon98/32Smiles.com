import type {
  AICompletionRequest,
  AICompletionResponse,
} from "../types"
import { BaseAIProvider } from "./base"

export class GeminiProvider extends BaseAIProvider {
  name = "gemini" as const

  private models = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ]

  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super({
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      baseUrl: config.baseUrl || "https://generativelanguage.googleapis.com/v1beta",
      defaultModel: config.defaultModel || "gemini-1.5-flash",
    })
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now()
    const model = request.model || this.defaultModel

    const systemMessage = request.messages.find((m) => m.role === "system")
    const otherMessages = request.messages.filter((m) => m.role !== "system")

    const contents = otherMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
        topP: request.topP,
      },
    }

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] }
    }

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${response.status} - ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const promptTokenCount = data.usageMetadata?.promptTokenCount || 0
    const completionTokenCount = data.usageMetadata?.candidatesTokenCount || 0

    return {
      content,
      model,
      provider: "gemini",
      usage: {
        promptTokens: promptTokenCount,
        completionTokens: completionTokenCount,
        totalTokens: promptTokenCount + completionTokenCount,
        estimatedCostUsd: this.estimateCost(promptTokenCount, completionTokenCount, model),
      },
      finishReason: data.candidates?.[0]?.finishReason || "STOP",
      latencyMs: Date.now() - startTime,
    }
  }

  getModels(): string[] {
    return this.models
  }

  override estimateCost(promptTokens: number, completionTokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      "gemini-1.5-pro": { input: 1.25 / 1_000_000, output: 5 / 1_000_000 },
      "gemini-1.5-flash": { input: 0.075 / 1_000_000, output: 0.3 / 1_000_000 },
      "gemini-2.0-flash": { input: 0.1 / 1_000_000, output: 0.4 / 1_000_000 },
    }
    const rates = pricing[model] || { input: 0.1 / 1_000_000, output: 0.4 / 1_000_000 }
    return promptTokens * rates.input + completionTokens * rates.output
  }
}
