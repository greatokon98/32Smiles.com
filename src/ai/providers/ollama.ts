import type {
  AICompletionRequest,
  AICompletionResponse,
} from "../types"
import { BaseAIProvider } from "./base"

export class OllamaProvider extends BaseAIProvider {
  name = "ollama" as const

  private models = [
    "llama3.1",
    "llama3.2",
    "mistral",
    "codellama",
    "phi3",
    "gemma2",
  ]

  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super({
      apiKey: "ollama",
      baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      defaultModel: config.defaultModel || "llama3.1",
    })
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now()
    const model = request.model || this.defaultModel

    const systemMessage = request.messages.find((m) => m.role === "system")
    const otherMessages = request.messages.filter((m) => m.role !== "system")

    const body: Record<string, unknown> = {
      model,
      messages: [
        ...(systemMessage ? [{ role: "system", content: systemMessage.content }] : []),
        ...otherMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? 2048,
        top_p: request.topP,
      },
      stream: false,
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error")
      throw new Error(`Ollama API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.message?.content || "",
      model: data.model,
      provider: "ollama",
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        estimatedCostUsd: 0, // Local models are free
      },
      finishReason: data.done ? "stop" : "length",
      latencyMs: Date.now() - startTime,
    }
  }

  async listLocalModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return []
      const data = await response.json()
      return data.models?.map((m: { name: string }) => m.name) || []
    } catch {
      return []
    }
  }

  getModels(): string[] {
    return this.models
  }

  override estimateCost(): number {
    return 0 // Local models are free
  }
}
