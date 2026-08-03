// ─── AI Provider Types ────────────────────────────────────

export type AIProviderName = "openai" | "anthropic" | "gemini" | "groq" | "ollama" | "azure" | "openrouter"

export type AIMessageRole = "system" | "user" | "assistant"

export interface AIMessage {
  role: AIMessageRole
  content: string
}

export interface AICompletionRequest {
  messages: AIMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  stream?: boolean
}

export interface AICompletionResponse {
  content: string
  model: string
  provider: AIProviderName
  usage: AIUsage
  finishReason: string
  latencyMs: number
}

export interface AIUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

// ─── Embedding Types ─────────────────────────────────────

export interface AIEmbeddingRequest {
  input: string | string[]
  model?: string
}

export interface AIEmbeddingResponse {
  embeddings: number[][]
  model: string
  provider: AIProviderName
  usage: {
    totalTokens: number
  }
}

// ─── Provider Interface ──────────────────────────────────

export interface AIProvider {
  name: AIProviderName
  isAvailable(): Promise<boolean>
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
  embed?(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>
  getModels(): string[]
  getDefaultModel(): string
  estimateCost(promptTokens: number, completionTokens: number, model: string): number
}

// ─── Provider Config ─────────────────────────────────────

export interface AIProviderConfig {
  name: AIProviderName
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  defaultModel: string
  maxTokens: number
  temperature: number
  rateLimitRpm: number
  rateLimitTpd: number
}

// ─── Generation Options ──────────────────────────────────

export interface AIGenerationOptions {
  provider?: AIProviderName
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  brandVoice?: string
  knowledgeBaseContext?: string
}

// ─── Streaming Types ─────────────────────────────────────

export interface AIStreamChunk {
  content: string
  done: boolean
  usage?: AIUsage
}

export type AIStreamCallback = (chunk: AIStreamChunk) => void
