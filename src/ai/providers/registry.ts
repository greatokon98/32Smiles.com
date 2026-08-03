import type {
  AIProvider,
  AIProviderName,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
} from "../types"
import { OpenAIProvider } from "./openai"
import { AnthropicProvider } from "./anthropic"
import { GeminiProvider } from "./gemini"
import { GroqProvider } from "./groq"
import { OllamaProvider } from "./ollama"
import prisma from "@/lib/prisma"

async function getApiKey(providerName: string): Promise<string | undefined> {
  const envVar = `${providerName.toUpperCase()}_API_KEY`
  if (process.env[envVar]) return process.env[envVar]
  try {
    const config = await prisma.aIProviderConfig.findFirst({
      where: { provider: providerName as never },
      select: { apiKeyEnc: true },
    })
    if (config?.apiKeyEnc) {
      const { decrypt } = await import("@/lib/crypto")
      return decrypt(config.apiKeyEnc)
    }
  } catch {}
  return undefined
}

// ─── Provider Registry ───────────────────────────────────

export class AIProviderRegistry {
  private providers: Map<AIProviderName, AIProvider> = new Map()
  private configs: Map<AIProviderName, AIProviderConfig> = new Map()

  constructor() {
    this.registerDefaults()
  }

  private dbLoaded = false

  async loadDatabaseKeys() {
    if (this.dbLoaded) return
    this.dbLoaded = true
    try {
      const rows = await prisma.aIProviderConfig.findMany({
        where: { apiKeyEnc: { not: null } },
        select: { provider: true, apiKeyEnc: true, baseUrl: true },
      })
      for (const row of rows) {
        const name = row.provider.toLowerCase() as AIProviderName
        const existing = this.configs.get(name)
        if (!existing) continue
        const envVar = `${name.toUpperCase()}_API_KEY`
        if (process.env[envVar]) continue
        let apiKey: string | undefined
        try {
          const { decrypt } = await import("@/lib/crypto")
          if (row.apiKeyEnc) apiKey = decrypt(row.apiKeyEnc)
        } catch {}
        if (apiKey) {
          this.configs.set(name, {
            ...existing,
            apiKey,
            enabled: true,
            baseUrl: row.baseUrl || existing.baseUrl,
          })
          this.providers.delete(name)
        }
      }
    } catch {}
  }

  private registerDefaults() {
    const defaultConfigs: AIProviderConfig[] = [
      {
        name: "openai",
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        defaultModel: "gpt-4o-mini",
        maxTokens: 4096,
        temperature: 0.7,
        rateLimitRpm: 500,
        rateLimitTpd: 100000,
      },
      {
        name: "anthropic",
        enabled: !!process.env.ANTHROPIC_API_KEY,
        apiKey: process.env.ANTHROPIC_API_KEY,
        defaultModel: "claude-3-5-haiku-20241022",
        maxTokens: 4096,
        temperature: 0.7,
        rateLimitRpm: 100,
        rateLimitTpd: 10000,
      },
      {
        name: "gemini",
        enabled: !!process.env.GEMINI_API_KEY,
        apiKey: process.env.GEMINI_API_KEY,
        defaultModel: "gemini-1.5-flash",
        maxTokens: 4096,
        temperature: 0.7,
        rateLimitRpm: 60,
        rateLimitTpd: 1500,
      },
      {
        name: "groq",
        enabled: !!process.env.GROQ_API_KEY,
        apiKey: process.env.GROQ_API_KEY,
        defaultModel: "llama-3.3-70b-versatile",
        maxTokens: 4096,
        temperature: 0.7,
        rateLimitRpm: 30,
        rateLimitTpd: 14400,
      },
      {
        name: "ollama",
        enabled: process.env.OLLAMA_ENABLED === "true",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        defaultModel: "llama3.1",
        maxTokens: 4096,
        temperature: 0.7,
        rateLimitRpm: 0,
        rateLimitTpd: 0,
      },
    ]

    for (const config of defaultConfigs) {
      this.configs.set(config.name, config)
    }
  }

  private instantiateProvider(name: AIProviderName): AIProvider {
    const config = this.configs.get(name)
    if (!config) throw new Error(`No config for provider ${name}`)

    switch (name) {
      case "openai":
        return new OpenAIProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        })
      case "anthropic":
        return new AnthropicProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        })
      case "gemini":
        return new GeminiProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        })
      case "groq":
        return new GroqProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        })
      case "ollama":
        return new OllamaProvider({
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        })
      default:
        throw new Error(`Unknown provider: ${name}`)
    }
  }

  private getOrCreateProvider(name: AIProviderName): AIProvider {
    let provider = this.providers.get(name)
    if (!provider) {
      provider = this.instantiateProvider(name)
      this.providers.set(name, provider)
    }
    return provider
  }

  register(provider: AIProvider) {
    this.providers.set(provider.name, provider)
  }

  get(name: AIProviderName): AIProvider {
    return this.getOrCreateProvider(name)
  }

  getConfig(name: AIProviderName): AIProviderConfig | undefined {
    return this.configs.get(name)
  }

  updateConfig(name: AIProviderName, updates: Partial<AIProviderConfig>) {
    const config = this.configs.get(name)
    if (config) {
      this.configs.set(name, { ...config, ...updates })
      // Remove cached provider so it gets re-instantiated with new config
      this.providers.delete(name)
    }
  }

  getEnabledProviders(): AIProvider[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .map(([name]) => this.getOrCreateProvider(name))
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const enabled = this.getEnabledProviders()
    const available: AIProvider[] = []

    for (const provider of enabled) {
      try {
        if (await provider.isAvailable()) {
          available.push(provider)
        }
      } catch {
        // Provider unavailable
      }
    }

    return available
  }

  async complete(
    request: AICompletionRequest,
    providerName?: AIProviderName
  ): Promise<AICompletionResponse> {
    if (providerName) {
      const provider = this.getOrCreateProvider(providerName)
      if (!(await provider.isAvailable())) {
        throw new Error(`Provider ${providerName} is not available`)
      }
      return provider.complete(request)
    }

    // Auto-select cheapest available provider
    const available = await this.getAvailableProviders()
    if (available.length === 0) throw new Error("No AI providers available")

    const sorted = available.sort((a, b) => {
      const aCost = a.estimateCost(100, 100, a.getDefaultModel())
      const bCost = b.estimateCost(100, 100, b.getDefaultModel())
      return aCost - bCost
    })

    return sorted[0].complete(request)
  }

  async getStatus(): Promise<Array<{
    name: AIProviderName
    enabled: boolean
    available: boolean
    defaultModel: string
  }>> {
    const results: Array<{
      name: AIProviderName
      enabled: boolean
      available: boolean
      defaultModel: string
    }> = []

    for (const [name, config] of this.configs) {
      let available = false
      if (config.enabled) {
        try {
          const provider = this.getOrCreateProvider(name)
          available = await provider.isAvailable()
        } catch {
          available = false
        }
      }
      results.push({ name, enabled: config.enabled, available, defaultModel: config.defaultModel })
    }

    return results
  }
}

// ─── Singleton ───────────────────────────────────────────

let registry: AIProviderRegistry | null = null

export async function getAIRegistry(): Promise<AIProviderRegistry> {
  if (!registry) {
    registry = new AIProviderRegistry()
    await registry.loadDatabaseKeys()
  }
  return registry
}
