# 32Smiles — AI Engine Technical Specification

> **Date**: July 27, 2026
> **Version**: 1.0
> **Scope**: Provider-agnostic AI orchestration layer, RAG pipeline, prompt management, brand voice system

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AI Engine                                  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Orchestrator Layer                            │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │ │
│  │  │ Provider  │  │   Prompt     │  │    Knowledge Base         │ │ │
│  │  │ Registry  │  │   Engine     │  │    (RAG Pipeline)         │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────────────┘ │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │ │
│  │  │  Rate     │  │   Cost       │  │    Brand Voice            │ │ │
│  │  │  Limiter  │  │   Tracker    │  │    Manager                │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   Provider Layer                                │ │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ┌────────┐      │ │
│  │  │ OpenAI │ │Anthropic │ │ Gemini │ │ Groq │ │ Ollama │      │ │
│  │  └────────┘ └──────────┘ └────────┘ └──────┘ └────────┘      │ │
│  │  ┌────────┐ ┌──────────┐                                       │ │
│  │  │ Azure  │ │OpenRouter│                                       │ │
│  │  └────────┘ └──────────┘                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   Support Layer                                 │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │ │
│  │  │ Content   │  │   Safety     │  │    Audit & Logging        │ │ │
│  │  │ Validator │  │   Checker    │  │    (Generation History)   │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Provider Abstraction

### 2.1 Base Interface

Every provider implements this contract. The interface is deliberately minimal to accommodate providers with varying capabilities.

```typescript
// src/lib/ai/providers/base.ts

interface AIProviderCapabilities {
  textGeneration: boolean;
  structuredOutput: boolean;
  streaming: boolean;
  imagePrompt: boolean;
  vision: boolean;           // Can analyze images
  functionCalling: boolean;
  maxContextTokens: number;
  supportedModels: string[];
}

interface GenerateTextRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;      // 0.0 - 2.0
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;  // For logging/tracking
}

interface GenerateTextResponse {
  text: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  metadata?: Record<string, unknown>;
}

interface GenerateStructuredRequest<T> extends GenerateTextRequest {
  schema: z.ZodSchema<T>;     // Zod schema for validation
  schemaDescription?: string;  // Help the model understand the schema
}

interface GenerateStructuredResponse<T> extends GenerateTextResponse {
  data: T;
  parseSuccess: boolean;
}

interface StreamChunk {
  text: string;
  finishReason?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

interface HealthStatus {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  lastChecked: Date;
}

interface CostEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  model: string;
}
```

### 2.2 Provider Implementations

#### OpenAI Provider

```typescript
// src/lib/ai/providers/openai.ts

class OpenAIProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: true,
    streaming: true,
    imagePrompt: true,
    vision: true,
    functionCalling: true,
    maxContextTokens: 128000,
    supportedModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'o1-preview',
      'o1-mini',
      'text-embedding-3-small',
      'text-embedding-3-large',
    ],
  };

  // Maps model IDs to cost per million tokens
  private costTable: Record<string, { input: number; output: number }> = {
    'gpt-4o':        { input: 2.50,  output: 10.00 },
    'gpt-4o-mini':   { input: 0.15,  output: 0.60 },
    'gpt-4-turbo':   { input: 10.00, output: 30.00 },
    'gpt-4':         { input: 30.00, output: 60.00 },
    'o1-preview':    { input: 15.00, output: 60.00 },
    'o1-mini':       { input: 3.00,  output: 12.00 },
  };

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    // Implementation uses OpenAI SDK
    // - Validates model against supportedModels
    // - Applies temperature, maxTokens, etc.
    // - Handles rate limits (429) with exponential backoff
    // - Handles content_filter finish reason
    // - Calculates cost from costTable
    // - Logs generation to AuditLog
  }

  async generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<GenerateStructuredResponse<T>> {
    // Uses OpenAI's response_format: { type: "json_schema", schema: ... }
    // Converts Zod schema to JSON Schema
    // Validates response against original Zod schema
    // Returns parsed data with parseSuccess flag
  }

  async streamText(request: GenerateTextRequest): Promise<AsyncIterable<StreamChunk>> {
    // Uses OpenAI streaming API
    // Yields chunks as they arrive
    // Handles stream errors gracefully
  }

  async healthCheck(): Promise<HealthStatus> {
    // Sends minimal request to verify API key + connectivity
  }
}
```

#### Anthropic Provider

```typescript
// src/lib/ai/providers/anthropic.ts

class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: true,     // Via XML or JSON mode
    streaming: true,
    imagePrompt: true,
    vision: true,
    functionCalling: true,
    maxContextTokens: 200000,
    supportedModels: [
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022',
      'claude-opus-4-0-20250514',
      'claude-3-5-sonnet-20241022',
    ],
  };

  // Anthropic uses max_tokens instead of maxTokens
  // systemPrompt is a separate parameter, not in messages
  // Uses Messages API format
}
```

#### Gemini Provider

```typescript
// src/lib/ai/providers/gemini.ts

class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: true,
    streaming: true,
    imagePrompt: true,
    vision: true,
    functionCalling: true,
    maxContextTokens: 1000000,  // 1M tokens!
    supportedModels: [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ],
  };

  // Uses Google AI SDK
  // Supports large context windows
  // Good for processing large documents
}
```

#### Groq Provider

```typescript
// src/lib/ai/providers/groq.ts

class GroqProvider implements AIProvider {
  readonly id = 'groq';
  readonly name = 'Groq';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: true,
    streaming: true,
    imagePrompt: false,        // Groq doesn't support image generation prompts
    vision: false,
    functionCalling: true,
    maxContextTokens: 128000,
    supportedModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
  };

  // Groq is ultra-fast (specialized inference hardware)
  // Best for: quick drafts, iterations, prototyping
  // Lower quality than GPT-4o/Claude but much faster
  // Rate limited: 30 RPM for free tier
}
```

#### Ollama Provider

```typescript
// src/lib/ai/providers/ollama.ts

class OllamaProvider implements AIProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: false,   // Depends on model
    streaming: true,
    imagePrompt: false,
    vision: false,
    functionCalling: false,
    maxContextTokens: 32000,   // Depends on model
    supportedModels: [
      'llama3.3',
      'llama3.1',
      'mistral',
      'mixtral',
      'gemma2',
      'phi3',
      'codellama',
    ],
  };

  // Runs locally via Ollama API (default: http://localhost:11434)
  // Zero cost
  // No internet required
  // Fallback when all cloud providers fail
  // Model must be pulled separately: ollama pull llama3.3
}
```

#### Azure OpenAI Provider

```typescript
// src/lib/ai/providers/azure.ts

class AzureOpenAIProvider implements AIProvider {
  readonly id = 'azure';
  readonly name = 'Azure OpenAI';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: true,
    streaming: true,
    imagePrompt: true,
    vision: true,
    functionCalling: true,
    maxContextTokens: 128000,
    supportedModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
    ],
  };

  // Requires: endpoint, deployment name, API version
  // Same models as OpenAI but with Azure compliance
  // Better for enterprise/healthcare requirements
}
```

#### OpenRouter Provider

```typescript
// src/lib/ai/providers/openrouter.ts

class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    structuredOutput: true,     // Depends on routed model
    streaming: true,
    imagePrompt: true,          // Depends on routed model
    vision: true,               // Depends on routed model
    functionCalling: true,      // Depends on routed model
    maxContextTokens: 200000,   // Varies by model
    supportedModels: [
      // Meta-model that routes to many providers
      'openai/gpt-4o',
      'anthropic/claude-sonnet-4-20250514',
      'google/gemini-2.5-pro',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mixtral-8x7b-instruct',
    ],
  };

  // Meta-provider that routes to multiple providers
  // Useful for: accessing many models with one API key
  // Good for: experimentation, fallback
}
```

### 2.3 Provider Registry

```typescript
// src/lib/ai/providers/registry.ts

class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private healthStatuses: Map<string, HealthStatus> = new Map();

  constructor() {
    // Register all providers
    this.register(new OpenAIProvider());
    this.register(new AnthropicProvider());
    this.register(new GeminiProvider());
    this.register(new GroqProvider());
    this.register(new OllamaProvider());
    this.register(new AzureOpenAIProvider());
    this.register(new OpenRouterProvider());
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getHealthy(): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => {
      const status = this.healthStatuses.get(p.id);
      return status?.healthy !== false;
    });
  }

  getActive(): AIProvider[] {
    // Returns providers that are:
    // 1. Registered
    // 2. Marked as ACTIVE in database
    // 3. Have healthy status (or unknown)
    // Sorted by priority from database
  }

  async checkHealthAll(): Promise<Map<string, HealthStatus>> {
    const checks = Array.from(this.providers.values()).map(async (p) => {
      const status = await p.healthCheck();
      this.healthStatuses.set(p.id, status);
      return [p.id, status] as const;
    });
    const results = await Promise.allSettled(checks);
    return new Map(results.map(r => r.status === 'fulfilled' ? r.value : ['unknown', { healthy: false, error: 'Check failed' }]));
  }
}
```

### 2.4 Provider Routing

```typescript
// src/lib/ai/orchestrator.ts

interface RoutingOptions {
  preferredProvider?: string;      // User/editor preference
  taskType?: 'content' | 'image' | 'seo' | 'review';  // Task-specific routing
  requireStreaming?: boolean;
  maxCost?: number;                // Cost ceiling
  timeout?: number;                // Max wait time
}

class AIOrchestrator {
  constructor(
    private registry: ProviderRegistry,
    private config: AIConfig,
    private rateLimiter: RateLimiter,
    private costTracker: CostTracker,
  ) {}

  async generate(request: GenerateTextRequest, options: RoutingOptions): Promise<GenerateTextResponse> {
    // Step 1: Build routing chain
    const chain = this.buildRoutingChain(options);

    // Step 2: Try each provider in chain
    for (const providerId of chain) {
      const provider = this.registry.get(providerId);
      if (!provider) continue;

      // Check rate limit
      if (await this.rateLimiter.isLimited(providerId)) {
        console.log(`[AI] Rate limited: ${providerId}, trying next`);
        continue;
      }

      // Check budget
      const estimatedCost = await provider.estimateCost(request);
      if (estimatedCost.estimatedCostUsd > (options.maxCost ?? Infinity)) {
        console.log(`[AI] Cost too high: ${providerId} ($${estimatedCost.estimatedCostUsd}), trying next`);
        continue;
      }

      try {
        // Execute with timeout
        const response = await this.executeWithTimeout(
          provider.generateText(request),
          options.timeout ?? 60000,
        );

        // Track cost
        await this.costTracker.track({
          provider: providerId,
          model: response.model,
          tokens: response.usage,
          cost: response.costUsd,
          userId: request.metadata?.userId,
        });

        // Record rate limit
        await this.rateLimiter.record(providerId);

        // Log successful generation
        await this.logGeneration(request, response, providerId);

        return response;
      } catch (error) {
        console.error(`[AI] Provider ${providerId} failed:`, error);
        await this.logError(providerId, error);

        // Mark provider as unhealthy if repeated failures
        if (await this.consecutiveFailures(providerId) >= 3) {
          await this.markUnhealthy(providerId);
        }

        continue;
      }
    }

    throw new AIEngineError('All providers failed', { request, chain });
  }

  private buildRoutingChain(options: RoutingOptions): string[] {
    const chain: string[] = [];
    const activeProviders = this.registry.getActive();

    // 1. User-specified provider (highest priority)
    if (options.preferredProvider) {
      chain.push(options.preferredProvider);
    }

    // 2. Task-specific preference
    if (options.taskType) {
      const taskPreference = this.config.taskProviderMap[options.taskType];
      if (taskPreference && !chain.includes(taskPreference)) {
        chain.push(taskPreference);
      }
    }

    // 3. Default primary provider
    const primary = this.config.defaultProvider;
    if (primary && !chain.includes(primary)) {
      chain.push(primary);
    }

    // 4. All other active providers (by priority)
    for (const provider of activeProviders) {
      if (!chain.includes(provider.id)) {
        chain.push(provider.id);
      }
    }

    // 5. Ollama as last resort (always available locally)
    if (!chain.includes('ollama')) {
      chain.push('ollama');
    }

    return chain;
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new TimeoutError(`AI request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}
```

---

## 3. Prompt Management System

### 3.1 Template Engine

```typescript
// src/lib/ai/prompt/template-engine.ts

interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];           // For select type
  maxLength?: number;          // For string type
}

interface CompiledPrompt {
  systemPrompt: string;
  userPrompt: string;
  variables: Record<string, unknown>;
  estimatedTokens: number;
}

class PromptTemplateEngine {
  // Compiles a template with variables
  compile(template: string, variables: Record<string, unknown>): string {
    // Replace {{variable}} placeholders with values
    // Supports:
    //   {{variable}} — simple substitution
    //   {{#if variable}}...{{/if}} — conditional blocks
    //   {{#each variable}}...{{/each}} — iteration
    //   {{default variable "fallback"}} — default values
  }

  // Validates that all required variables are provided
  validate(template: string, variables: Record<string, unknown>): ValidationResult {
    const requiredVars = this.extractVariables(template);
    const missing = requiredVars.filter(v => v.required && !(v.name in variables));
    return {
      valid: missing.length === 0,
      missing: missing.map(v => v.name),
    };
  }

  // Extracts variable definitions from template
  extractVariables(template: string): PromptVariable[] {
    // Parses {{variable}} patterns
    // Parses @variable[type="select",options="a,b,c"] annotations
  }

  // Estimates token count for compiled prompt
  estimateTokens(compiled: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    // More accurate: use tiktoken for OpenAI, or model-specific tokenizer
  }
}
```

### 3.2 Template Versioning

```typescript
// src/lib/ai/prompt/versioning.ts

class PromptVersionManager {
  // Creates a new version of a template
  async createVersion(templateId: string, content: string, systemPrompt: string, changeNotes: string): Promise<PromptVersion> {
    // 1. Fetch current template
    // 2. Increment version number
    // 3. Save new version record
    // 4. Update template's current version pointer
    // 5. Log in audit
  }

  // Reverts to a previous version
  async revertToVersion(templateId: string, version: number): Promise<void> {
    // 1. Fetch the target version
    // 2. Create new version with content from target
    // 3. Mark as revert in change notes
  }

  // Gets version history for a template
  async getVersionHistory(templateId: string): Promise<PromptVersion[]> {
    // Returns all versions, newest first
  }

  // Compares two versions (diff)
  async compareVersions(templateId: string, v1: number, v2: number): Promise<VersionDiff> {
    // Returns line-by-line diff between versions
  }
}
```

### 3.3 Default Prompt Templates

The system ships with 8+ default templates:

| Template | Category | Description |
|---|---|---|
| `blog-post` | content | Generate a blog article |
| `service-description` | content | Generate service page content |
| `product-description` | content | Generate product descriptions |
| `education-article` | content | Generate patient/professional education |
| `seo-meta` | seo | Generate meta title + description |
| `faq-generation` | content | Generate FAQ Q&A pairs |
| `social-media` | content | Generate social media posts |
| `image-prompt` | image | Generate DALL-E/Midjourney prompts |
| `brand-voice` | brand | Base brand voice template |
| `content-review` | review | AI-powered content review |
| `content-rewrite` | content | Rewrite existing content |
| `content-summary` | content | Summarize long content |

#### Blog Post Template Example

```markdown
---
name: blog-post
category: content
description: Generate a dental clinic blog article
variables:
  - name: topic
    type: string
    description: The blog post topic
    required: true
  - name: audience
    type: select
    options: [patients, professionals, general]
    description: Target audience
    required: true
    defaultValue: patients
  - name: word_count
    type: number
    description: Target word count
    required: false
    defaultValue: 800
  - name: tone
    type: select
    options: [professional, friendly, educational, urgent]
    description: Tone of voice
    required: false
    defaultValue: professional
  - name: key_points
    type: string
    description: Specific points to cover (comma-separated)
    required: false
  - name: include_faq
    type: boolean
    description: Include FAQ section at the end
    required: false
    defaultValue: true
---

You are a professional dental content writer for 32Smiles Dental Clinic in Lagos, Nigeria. Write a blog article that is:

- Informative and evidence-based
- Written for a {{audience}} audience
- In a {{tone}} tone
- Approximately {{word_count}} words
- Formatted with H2 and H3 headings
- Includes practical tips where applicable
- Ends with a clear call-to-action

{{#if key_points}}
Key points to cover: {{key_points}}
{{/if}}

{{#if include_faq}}
Also include a FAQ section at the end with 3-5 common questions and answers related to the topic.
{{/if}}

Brand voice: Professional, caring, knowledgeable, and approachable. We are a trusted dental clinic in Lagos, Nigeria.

Topic: {{topic}}

Write the complete blog article now.
```

---

## 4. Brand Voice System

### 4.1 Brand Voice Configuration

```typescript
// src/lib/ai/prompt/brand-voice.ts

interface BrandVoiceConfig {
  name: string;
  description: string;
  tone: string;           // "professional", "warm", "clinical", "friendly"
  personality: string;    // Comma-separated traits
  vocabulary: string;     // Words/phrases to use
  avoidWords: string;     // Words/phrases to avoid
  writingStyle: string;   // Guidelines for sentence/paragraph structure
  targetAudience: string; // Primary audience
  systemPrompt: string;   // Full system prompt for this voice
}

class BrandVoiceManager {
  // Gets the active brand voice (or default)
  async getActiveVoice(): Promise<BrandVoiceConfig> {
    // 1. Check for active BrandVoice in database
    // 2. If none, use system default "Professional & Warm"
    // 3. Return config
  }

  // Gets all available brand voices
  async getAllVoices(): Promise<BrandVoiceConfig[]> {
    // Returns all active brand voices for UI selection
  }

  // Injects brand voice into a prompt
  async injectVoice(basePrompt: string, voiceId?: string): Promise<string> {
    // 1. Load brand voice config
    // 2. Prepend voice system prompt to base prompt
    // 3. Add vocabulary and avoid words as constraints
    // 4. Return enhanced prompt
  }

  // Generates the system prompt for a brand voice
  generateSystemPrompt(config: BrandVoiceConfig): string {
    return `You are writing for ${config.name}, a dental clinic.

Tone: ${config.tone}
Personality: ${config.personality}

Writing Style Guidelines:
${config.writingStyle}

Target Audience: ${config.targetAudience}

Vocabulary to use: ${config.vocabulary}
Words/phrases to AVOID: ${config.avoidWords}

Always write in a way that reflects these brand guidelines.`;
  }
}
```

### 4.2 Default Brand Voice

```typescript
const DEFAULT_BRAND_VOICE: BrandVoiceConfig = {
  name: "Professional & Warm",
  description: "Default brand voice for 32Smiles Dental Clinic",
  tone: "professional",
  personality: "caring, knowledgeable, approachable, trustworthy, confident",
  vocabulary: "we, our team, your smile, dental health, oral care, gentle, comfortable, personalized",
  avoidWords: "pain, scary, hurt,cheap, discount, budget, expensive, procedure (use 'treatment' or 'care')",
  writingStyle: "Short to medium sentences. Use active voice. Begin paragraphs with the most important information. Use bullet points for lists. Include actionable advice. End sections with encouraging statements.",
  targetAudience: "patients",
  systemPrompt: `You are a content writer for 32Smiles Dental Clinic, a premium dental practice in Victoria Island, Lagos, Nigeria.

Brand Voice:
- Tone: Professional, warm, and caring
- We speak with authority but always with empathy
- We educate without being condescending
- We use simple, clear language accessible to everyone
- We avoid medical jargon unless writing for professionals

About Us:
- We provide comprehensive dental care
- We use state-of-the-art technology
- Our team of experienced dentists is committed to patient comfort
- We believe everyone deserves a healthy, confident smile

Writing Guidelines:
- Always be factual and evidence-based
- Include practical, actionable advice
- Use "we" and "our" when referring to the clinic
- Use "you" and "your" when addressing the reader
- End content with a call-to-action or encouraging statement
- Never make promises we can't keep
- Always recommend consulting with a dentist for specific concerns

Location context: Lagos, Nigeria. We serve patients across Lagos and beyond.`,
};
```

---

## 5. RAG Pipeline

### 5.1 Document Ingestion

```typescript
// src/lib/ai/knowledge/rag-pipeline.ts

interface IngestionOptions {
  chunkSize?: number;      // Default: 1000 characters
  chunkOverlap?: number;   // Default: 200 characters
  embeddingModel?: string; // Default: "text-embedding-3-small"
}

class RAGPipeline {
  constructor(
    private vectorStore: VectorStore,
    private embeddingService: EmbeddingService,
    private chunker: DocumentChunker,
  ) {}

  // Ingests a content entity into the knowledge base
  async ingestContent(content: Content): Promise<void> {
    // 1. Extract text from content body (strip HTML)
    // 2. Create KnowledgeBaseEntry record
    // 3. Chunk the text
    // 4. Generate embeddings for each chunk
    // 5. Store chunks + embeddings in pgvector
    // 6. Update lastIndexedAt
  }

  // Ingests when content is published
  async onContentPublished(contentId: string): Promise<void> {
    const content = await this.getContent(contentId);
    await this.ingestContent(content);
  }

  // Updates when content is modified
  async onContentUpdated(contentId: string): Promise<void> {
    // 1. Remove old embeddings for this content
    // 2. Re-ingest with new content
    await this.vectorStore.deleteBySourceId(contentId);
    await this.ingestContent(await this.getContent(contentId));
  }

  // Removes from knowledge base
  async onContentDeleted(contentId: string): Promise<void> {
    await this.vectorStore.deleteBySourceId(contentId);
  }

  // Batch ingestion (for initial seed)
  async ingestBatch(contents: Content[]): Promise<IngestionResult> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    for (const content of contents) {
      try {
        await this.ingestContent(content);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${content.id}: ${error.message}`);
      }
    }
    return results;
  }
}
```

### 5.2 Document Chunking

```typescript
// src/lib/ai/knowledge/chunking.ts

interface Chunk {
  content: string;
  index: number;
  metadata: {
    heading?: string;
    paragraph?: number;
    wordCount: number;
  };
}

class DocumentChunker {
  // Chunks by heading (H2/H3)
  chunkByHeading(text: string, options: { maxChunkSize: number; overlap: number }): Chunk[] {
    // 1. Split on ## and ### headings
    // 2. Each heading + its content = one chunk
    // 3. If chunk exceeds maxChunkSize, split by paragraph
    // 4. Apply overlap between chunks for context continuity
  }

  // Chunks by fixed size with overlap
  chunkBySize(text: string, options: { chunkSize: number; overlap: number }): Chunk[] {
    // 1. Split text into fixed-size chunks
    // 2. Apply character overlap
    // 3. Try to split at sentence boundaries
  }

  // Smart chunking (default)
  chunk(text: string): Chunk[] {
    // 1. Try heading-based chunking first
    // 2. Fall back to paragraph-based
    // 3. Fall back to fixed-size if needed
    // 4. Target: 500-1500 characters per chunk
  }
}
```

### 5.3 Vector Search

```typescript
// src/lib/ai/knowledge/vector-store.ts

interface SearchResult {
  entry: KnowledgeBaseEntry;
  chunk: Chunk;
  similarity: number;     // 0-1 (1 = perfect match)
  metadata: {
    heading?: string;
    sourceType: string;
    sourceUrl?: string;
  };
}

interface SearchOptions {
  topK?: number;          // Default: 5
  minSimilarity?: number; // Default: 0.7
  sourceTypes?: string[]; // Filter by content type
  dateAfter?: Date;       // Filter by date
  tags?: string[];        // Filter by tags
}

class VectorStore {
  // Performs similarity search
  async search(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // 1. Build pgvector query with HNSW index
    // 2. Apply metadata filters
    // 3. Return top-K results with similarity scores
    // 4. Join with KnowledgeBaseEntry for full context
  }

  // Generates embedding for a query
  async embedQuery(query: string): Promise<number[]> {
    // Uses same embedding model as ingestion
    // Default: text-embedding-3-small (1536 dimensions)
  }

  // Stores embedding
  async storeEmbedding(entryId: string, chunk: Chunk, embedding: number[]): Promise<void> {
    // INSERT INTO knowledge_base_embeddings
    // Uses pgvector's <-> (L2 distance) or <=> (cosine distance)
  }

  // Deletes all embeddings for a source
  async deleteBySourceId(sourceId: string): Promise<void> {
    // DELETE FROM knowledge_base_embeddings WHERE entry_id = sourceId
  }
}
```

### 5.4 Retrieval & Context Assembly

```typescript
// src/lib/ai/knowledge/relevance.ts

interface ContextAssembly {
  chunks: RetrievedChunk[];
  fullContext: string;      // Formatted for prompt injection
  sources: SourceCitation[];
  totalTokens: number;
}

interface RetrievedChunk {
  content: string;
  similarity: number;
  source: {
    title: string;
    type: string;
    url?: string;
    publishDate?: Date;
  };
}

class RelevanceScorer {
  // Retrieves relevant context for a generation request
  async retrieveContext(
    query: string,
    options: {
      maxChunks?: number;       // Default: 5
      minSimilarity?: number;   // Default: 0.7
      maxTokens?: number;       // Default: 4000
      sourceTypes?: string[];
    }
  ): Promise<ContextAssembly> {
    // 1. Embed the query
    // 2. Vector similarity search
    // 3. Re-rank by: similarity * freshness * authority
    // 4. Assemble top-K chunks into context
    // 5. Format with source citations
    // 6. Trim to maxTokens
  }

  // Re-ranking algorithm
  private rerank(results: SearchResult[]): SearchResult[] {
    return results.map(r => ({
      ...r,
      // Combined score: similarity (70%) + freshness (20%) + authority (10%)
      relevanceScore:
        r.similarity * 0.7 +
        this.freshnessScore(r.metadata.publishDate) * 0.2 +
        this.authorityScore(r.metadata.sourceType) * 0.1,
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private freshnessScore(date?: Date): number {
    if (!date) return 0.5;
    const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSince / 365)); // Decays over 1 year
  }

  private authorityScore(sourceType: string): number {
    const authority: Record<string, number> = {
      'education': 1.0,
      'service': 0.9,
      'blog': 0.8,
      'product': 0.7,
      'faq': 0.8,
      'manual': 0.6,
    };
    return authority[sourceType] ?? 0.5;
  }
}
```

---

## 6. Content Safety

### 6.1 Safety Checks

```typescript
// src/lib/ai/safety.ts

interface SafetyCheck {
  passed: boolean;
  issues: SafetyIssue[];
  score: number; // 0-1 (1 = fully safe)
}

interface SafetyIssue {
  type: 'medical_claim' | 'guarantee' | 'profanity' | 'bias' | 'competitor_mention' | 'off_brand';
  severity: 'low' | 'medium' | 'high';
  text: string;
  suggestion?: string;
}

class ContentSafetyChecker {
  async check(content: string, contentType: string): Promise<SafetyCheck> {
    const issues: SafetyIssue[] = [];

    // 1. Medical claim check
    //    - Flags phrases like "guaranteed cure", "100% effective", "no side effects"
    //    - Severity: HIGH

    // 2. Promise/guarantee check
    //    - Flags phrases like "we guarantee", "you will", "definitely"
    //    - Severity: MEDIUM

    // 3. Competitor mention check
    //    - Flags mentions of competing clinics
    //    - Severity: LOW

    // 4. Off-brand language check
    //    - Flags words from brand voice's avoidWords list
    //    - Severity: MEDIUM

    // 5. Profanity/inappropriate content check
    //    - Severity: HIGH

    // 6. Bias detection
    //    - Flags gender, racial, age bias
    //    - Severity: HIGH

    // 7. Factual accuracy flags
    //    - Flags unverifiable claims
    //    - Severity: MEDIUM

    return {
      passed: !issues.some(i => i.severity === 'high'),
      issues,
      score: 1 - (issues.length * 0.1),
    };
  }

  // Auto-fix safe issues (typos, formatting)
  autoFix(content: string, issues: SafetyIssue[]): string {
    let fixed = content;
    for (const issue of issues) {
      if (issue.suggestion && issue.severity !== 'high') {
        fixed = fixed.replace(issue.text, issue.suggestion);
      }
    }
    return fixed;
  }
}
```

---

## 7. Rate Limiting & Cost Control

### 7.1 Rate Limiter

```typescript
// src/lib/ai/rate-limiter.ts

class RateLimiter {
  // Per-user rate limiting
  async isUserLimited(userId: string): Promise<boolean> {
    // Default: 10 generations per user per hour
    // Configurable via admin settings
  }

  // Per-provider rate limiting
  async isProviderLimited(providerId: string): Promise<boolean> {
    // Based on provider's rateLimit config
    // Groq: 30 RPM, OpenAI: 500 RPM, etc.
  }

  // Records a generation event
  async record(userId: string, providerId: string): Promise<void> {
    // Increment counters in Redis or in-memory
  }

  // Gets usage stats for a user
  async getUserUsage(userId: string): Promise<UserUsage> {
    // Returns: generations this hour, this day, this month
    // Plus: estimated cost this month
  }
}
```

### 7.2 Cost Tracker

```typescript
// src/lib/ai/cost-tracker.ts

class CostTracker {
  async track(event: CostEvent): Promise<void> {
    // Store in AIGenerationLog table
    // Update provider's monthlySpend
    // Check against monthlyBudget
    // Alert if budget exceeded
  }

  async getMonthlySpend(providerId?: string): Promise<MonthlySpend> {
    // Returns total spend for current month
    // Optionally filtered by provider
  }

  async getBudgetStatus(): Promise<BudgetStatus> {
    // Returns: budget, spent, remaining for each provider
    // Flags providers that are near or over budget
  }

  async getCostByUser(userId: string): Promise<UserCost> {
    // Returns: total cost, generations count, average cost per generation
  }
}
```

---

## 8. API Endpoints

### 8.1 Generation API

```typescript
// POST /api/ai/generate

interface GenerateAPIRequest {
  prompt: string;
  contentType: ContentType;
  topic: string;
  provider?: string;        // AI provider preference
  brandVoiceId?: string;    // Brand voice to use
  useKnowledgeBase?: boolean;
  promptTemplateId?: string;
  variables?: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface GenerateAPIResponse {
  draftId: string;          // Created draft ID
  content: string;          // Generated content
  provider: string;         // Which provider was used
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  latencyMs: number;
  safetyCheck: SafetyCheck;
  wordCount: number;
  readingTime: number;      // minutes
}
```

### 8.2 Provider Management API

```typescript
// GET    /api/ai/providers           — List all providers
// PUT    /api/ai/providers/:id       — Update provider config
// POST   /api/ai/providers/:id/test  — Test provider connection
// GET    /api/ai/providers/:id/usage — Get provider usage stats
// POST   /api/ai/providers/health    — Check all providers health
```

### 8.3 Prompt Template API

```typescript
// GET    /api/ai/prompts             — List all templates
// POST   /api/ai/prompts             — Create new template
// GET    /api/ai/prompts/:id         — Get template detail
// PUT    /api/ai/prompts/:id         — Update template
// DELETE /api/ai/prompts/:id         — Delete template (soft)
// GET    /api/ai/prompts/:id/versions — Get version history
// POST   /api/ai/prompts/:id/versions — Create new version
// POST   /api/ai/prompts/:id/revert   — Revert to version
// POST   /api/ai/prompts/preview      — Preview compiled prompt
```

### 8.4 Knowledge Base API

```typescript
// GET    /api/ai/knowledge-base          — List entries
// POST   /api/ai/knowledge-base          — Create entry
// PUT    /api/ai/knowledge-base/:id      — Update entry
// DELETE /api/ai/knowledge-base/:id      — Delete entry
// POST   /api/ai/knowledge-base/ingest   — Trigger ingestion
// POST   /api/ai/knowledge-base/search   — Search KB
// GET    /api/ai/knowledge-base/stats    — Get KB statistics
// POST   /api/ai/knowledge-base/reindex  — Reindex all entries
```

### 8.5 Brand Voice API

```typescript
// GET    /api/ai/brand-voices           — List all voices
// POST   /api/ai/brand-voices           — Create voice
// PUT    /api/ai/brand-voices/:id       — Update voice
// DELETE /api/ai/brand-voices/:id       — Delete voice
// PUT    /api/ai/brand-voices/:id/default — Set as default
```

---

## 9. Error Handling

### 9.1 Error Types

```typescript
class AIEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public recoverable: boolean = true,
    public metadata?: Record<string, unknown>,
  ) { super(message); }
}

class ProviderError extends AIEngineError {
  // Provider-specific errors (rate limit, auth, etc.)
}

class SafetyError extends AIEngineError {
  // Content failed safety checks
}

class BudgetError extends AIEngineError {
  // Monthly budget exceeded
}

class RateLimitError extends AIEngineError {
  // Rate limit exceeded
}
```

### 9.2 Fallback Strategy

```
Request
  │
  ├─ Try Primary Provider
  │   ├─ Success → Return response
  │   ├─ Rate Limit → Try next provider
  │   ├─ Auth Error → Try next provider
  │   ├─ Timeout → Try next provider
  │   ├─ Content Filter → Return error (user must modify prompt)
  │   └─ Server Error → Try next provider
  │
  ├─ Try Secondary Provider
  │   └─ (same error handling)
  │
  ├─ Try Tertiary Provider
  │   └─ (same error handling)
  │
  └─ Try Ollama (Local)
      ├─ Success → Return response (with "local" flag)
      └─ Not available → Return "All providers unavailable" error
```

---

## 10. Monitoring & Observability

### 10.1 Metrics to Track

| Metric | Description | Alert Threshold |
|---|---|---|
| `ai.request.count` | Total generation requests | - |
| `ai.request.latency` | Response time (p50, p95, p99) | p95 > 30s |
| `ai.request.error_rate` | Error percentage | > 5% |
| `ai.request.cost_usd` | Total cost | > monthly budget |
| `ai.provider.health` | Provider health status | Any unhealthy |
| `ai.provider.fallback_rate` | Fallback frequency | > 20% |
| `ai.provider.latency_by_provider` | Per-provider latency | p95 > 60s |
| `ai.content.safety_failures` | Safety check failures | > 10% |
| `ai.kb.search_relevance` | Average relevance score | < 0.6 |
| `ai.user.usage_by_user` | Per-user generation count | - |

### 10.2 Logging

```typescript
// All AI interactions are logged with:
interface AILogEntry {
  timestamp: Date;
  requestId: string;
  userId?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  status: 'success' | 'error' | 'fallback';
  errorCode?: string;
  safetyPassed: boolean;
  metadata?: Record<string, unknown>;
}
```
