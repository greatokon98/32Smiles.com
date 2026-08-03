import prisma from "@/lib/prisma"
import { getAIRegistry } from "@/ai/providers/registry"

// ─── Knowledge Base Service ──────────────────────────────

export interface KBEntryInput {
  title: string
  content: string
  sourceType: string
  sourceId?: string
  sourceUrl?: string
  author?: string
  tags?: string[]
}

export interface KBSearchResult {
  entry: {
    id: string
    title: string
    content: string
    sourceType: string
    sourceId: string | null
  }
  score: number
}

export const knowledgeBaseService = {
  // Ingest content into knowledge base
  async ingest(input: KBEntryInput): Promise<string> {
    // Create entry
    const entry = await prisma.knowledgeBaseEntry.create({
      data: {
        title: input.title,
        content: input.content,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceUrl: input.sourceUrl,
        author: input.author,
        tags: input.tags || [],
        isActive: true,
      },
    })

    // Generate embedding
    try {
      const registry = await getAIRegistry()
      const openai = registry.get("openai")

      if (openai && "embed" in openai && openai.embed) {
        const result = await openai.embed({ input: input.content })

        if (result.embeddings[0]) {
          // Store embedding using raw SQL (vector type is unsupported by Prisma)
          const embeddingStr = `[${result.embeddings[0].join(",")}]`
          await prisma.$executeRaw`
            INSERT INTO knowledge_base_embeddings ("id", "entryId", "chunk", "chunkIndex", embedding, "createdAt")
            VALUES (gen_random_uuid(), ${entry.id}, ${input.content.slice(0, 500)}, 0, ${embeddingStr}::vector, NOW())
          `
        }
      }
    } catch (error) {
      console.error("[KB] Embedding generation failed:", error)
      // Entry is still created, just without embedding
    }

    return entry.id
  },

  // Ingest all published content
  async ingestAllContent(): Promise<number> {
    const contents = await prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        blogPost: true,
        service: true,
        product: true,
        educationArticle: true,
        faq: true,
        teamMember: true,
      },
    })

    let count = 0
    for (const content of contents) {
      const contentText = [
        content.title,
        content.excerpt,
        content.body,
      ].filter(Boolean).join("\n\n")

      if (contentText.length < 50) continue

      await this.ingest({
        title: content.title,
        content: contentText.slice(0, 8000),
        sourceType: this.mapContentType(content.type),
        sourceId: content.id,
      })
      count++
    }

    return count
  },

  // Semantic search
  async search(query: string, limit = 5): Promise<KBSearchResult[]> {
    try {
      const registry = await getAIRegistry()
      const openai = registry.get("openai")

      if (!openai || !("embed" in openai) || !openai.embed) {
        // Fallback to text search
        return this.textSearch(query, limit)
      }

      const result = await openai.embed({ input: query })
      const queryEmbedding = result.embeddings[0]

      if (!queryEmbedding) {
        return this.textSearch(query, limit)
      }

      // Use pgvector for similarity search
      const embeddings = await prisma.$queryRaw`
        SELECT
          e.id,
          e."entryId",
          1 - (e.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as score
        FROM knowledge_base_embeddings e
        JOIN knowledge_base_entries k ON k.id = e."entryId"
        WHERE k."isActive" = true
        ORDER BY e.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      ` as Array<{ id: string; entryId: string; score: number }>

      const results: KBSearchResult[] = []
      for (const emb of embeddings) {
        const entry = await prisma.knowledgeBaseEntry.findUnique({
          where: { id: emb.entryId },
        })
        if (entry) {
          results.push({
            entry: {
              id: entry.id,
              title: entry.title,
              content: entry.content,
              sourceType: entry.sourceType,
              sourceId: entry.sourceId,
            },
            score: emb.score,
          })
        }
      }

      return results
    } catch (error) {
      console.error("[KB] Semantic search failed, falling back to text:", error)
      return this.textSearch(query, limit)
    }
  },

  // Fallback text search
  async textSearch(query: string, limit = 5): Promise<KBSearchResult[]> {
    const entries = await prisma.knowledgeBaseEntry.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    })

    return entries.map((entry) => ({
      entry: {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
      },
      score: 0.5,
    }))
  },

  // Get context for AI generation
  async getContextForQuery(query: string, maxTokens = 2000): Promise<string> {
    const results = await this.search(query, 3)

    if (results.length === 0) return ""

    const contextParts = results.map(
      (r) => `### ${r.entry.title}\n${r.entry.content.slice(0, 1000)}`
    )

    let context = contextParts.join("\n\n---\n\n")

    // Truncate to approximate token limit
    if (context.length > maxTokens * 4) {
      context = context.slice(0, maxTokens * 4)
    }

    return context
  },

  // Delete entry
  async delete(entryId: string) {
    await prisma.$executeRaw`DELETE FROM knowledge_base_embeddings WHERE "entryId" = ${entryId}`
    await prisma.knowledgeBaseEntry.delete({ where: { id: entryId } })
  },

  // List entries
  async list(options?: { sourceType?: string; page?: number; limit?: number }) {
    const page = options?.page || 1
    const limit = options?.limit || 20

    const where = {
      isActive: true,
      ...(options?.sourceType && { sourceType: options.sourceType }),
    }

    const [entries, total] = await Promise.all([
      prisma.knowledgeBaseEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.knowledgeBaseEntry.count({ where }),
    ])

    return {
      data: entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  // Helper to map content types
  mapContentType(type: string): "BLOG" | "SERVICE" | "FAQ" | "EDUCATION" | "PRODUCT" | "TEAM" | "CUSTOM" {
    const map: Record<string, "BLOG" | "SERVICE" | "FAQ" | "EDUCATION" | "PRODUCT" | "TEAM" | "CUSTOM"> = {
      BLOG_POST: "BLOG",
      SERVICE: "SERVICE",
      PRODUCT: "PRODUCT",
      EDUCATION_PATIENT: "EDUCATION",
      EDUCATION_PROFESSIONAL: "EDUCATION",
      FAQ: "FAQ",
      TEAM_MEMBER: "TEAM",
    }
    return map[type] || "CUSTOM"
  },
}
