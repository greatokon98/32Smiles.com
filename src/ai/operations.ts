import prisma from "@/lib/prisma"
import type { AIProviderName } from "./types"

// ─── Rate Limiter ────────────────────────────────────────

interface RateLimitConfig {
  rpm: number // requests per minute
  tpd: number // tokens per day
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export const rateLimiter = {
  async check(
    provider: AIProviderName,
    userId: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const now = Date.now()
    const minuteKey = `rpm:${provider}:${userId}:${Math.floor(now / 60000)}`
    const dayKey = `tpd:${provider}:${userId}:${new Date().toISOString().split("T")[0]}`

    // Check RPM
    const rpmEntry = rateLimitStore.get(minuteKey)
    if (rpmEntry && rpmEntry.count >= config.rpm) {
      return {
        allowed: false,
        retryAfterMs: rpmEntry.resetAt - now,
      }
    }

    // Check TPD
    const tpdEntry = rateLimitStore.get(dayKey)
    if (tpdEntry && tpdEntry.count >= config.tpd) {
      return {
        allowed: false,
        retryAfterMs: tpdEntry.resetAt - now,
      }
    }

    // Increment counters
    if (rpmEntry) {
      rpmEntry.count++
    } else {
      rateLimitStore.set(minuteKey, {
        count: 1,
        resetAt: Math.ceil(now / 60000) * 60000,
      })
    }

    if (tpdEntry) {
      tpdEntry.count++
    } else {
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      rateLimitStore.set(dayKey, {
        count: 1,
        resetAt: endOfDay.getTime(),
      })
    }

    return { allowed: true }
  },

  // Cleanup old entries (call periodically)
  cleanup() {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  },
}

// ─── Cost Tracker ────────────────────────────────────────

export const costTracker = {
  async track(data: {
    provider: AIProviderName
    model: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCostUsd: number
    userId?: string
    contentId?: string
    operationType: string
  }) {
    return prisma.aIUsageLog.create({
      data: {
        provider: data.provider,
        model: data.model,
        inputTokens: data.promptTokens,
        outputTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        estimatedCost: data.estimatedCostUsd,
        userId: data.userId,
        metadata: {
          operationType: data.operationType,
          contentId: data.contentId,
        },
      },
    })
  },

  async getUsageSummary(provider?: AIProviderName, days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const where = {
      createdAt: { gte: since },
      ...(provider && { provider }),
    }

    const [total, byProvider, byDay] = await Promise.all([
      prisma.aIUsageLog.aggregate({
        where,
        _sum: {
          totalTokens: true,
          estimatedCost: true,
        },
        _count: true,
      }),
      prisma.aIUsageLog.groupBy({
        by: ["provider"],
        where,
        _sum: {
          totalTokens: true,
          estimatedCost: true,
        },
        _count: true,
      }),
      prisma.aIUsageLog.groupBy({
        by: ["createdAt"],
        where,
        _sum: {
          totalTokens: true,
          estimatedCost: true,
        },
      }),
    ])

    return {
      totalRequests: total._count,
      totalTokens: total._sum.totalTokens || 0,
      totalCostUsd: total._sum.estimatedCost || 0,
      byProvider: byProvider.map((p) => ({
        provider: p.provider,
        requests: p._count,
        tokens: p._sum.totalTokens || 0,
        cost: p._sum.estimatedCost || 0,
      })),
      byDay,
    }
  },

  async getDailySpend(provider?: AIProviderName) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const where = {
      createdAt: { gte: today },
      ...(provider && { provider }),
    }

    const result = await prisma.aIUsageLog.aggregate({
      where,
      _sum: { estimatedCost: true, totalTokens: true },
      _count: true,
    })

    return {
      requests: result._count,
      tokens: result._sum.totalTokens || 0,
      cost: result._sum.estimatedCost || 0,
    }
  },
}

// ─── Content Safety ──────────────────────────────────────

export interface SafetyCheckResult {
  safe: boolean
  flags: string[]
  confidence: number
}

export const contentSafety = {
  // Basic keyword-based safety check
  check(content: string): SafetyCheckResult {
    const flags: string[] = []

    // Medical disclaimers check
    const medicalTerms = ["guarantee", "cure", "100% effective", "no side effects", "miracle"]
    for (const term of medicalTerms) {
      if (content.toLowerCase().includes(term)) {
        flags.push(`Contains potentially misleading medical claim: "${term}"`)
      }
    }

    // Competitor mentions
    const competitorPatterns = ["competitor name", "other clinic"]
    for (const pattern of competitorPatterns) {
      if (content.toLowerCase().includes(pattern)) {
        flags.push(`Contains competitor reference: "${pattern}"`)
      }
    }

    // Inappropriate content
    const inappropriateTerms = ["cheap", "discount price", "lowest cost"]
    for (const term of inappropriateTerms) {
      if (content.toLowerCase().includes(term)) {
        flags.push(`Contains brand-inconsistent language: "${term}"`)
      }
    }

    return {
      safe: flags.length === 0,
      flags,
      confidence: flags.length === 0 ? 1 : 0.5,
    }
  },
}
