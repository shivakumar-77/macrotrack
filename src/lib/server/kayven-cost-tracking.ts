export interface KAYVENCostMetadata {
  usedAI: boolean
  provider?: string
  toolUsed?: string
  intent?: string
  executionPath: 'deterministic_tool' | 'local_intelligence' | 'ai_fallback' | 'error'
  timestamp: string
}

export function createCostMetadata(options: {
  usedAI: boolean
  provider?: string
  toolUsed?: string
  intent?: string
  executionPath: 'deterministic_tool' | 'local_intelligence' | 'ai_fallback' | 'error'
}): KAYVENCostMetadata {
  return {
    usedAI: options.usedAI,
    provider: options.provider,
    toolUsed: options.toolUsed,
    intent: options.intent,
    executionPath: options.executionPath,
    timestamp: new Date().toISOString()
  }
}

export class KAYVENCostTracker {
  private metrics = {
    totalRequests: 0,
    aiCalls: 0,
    toolCalls: 0,
    errors: 0,
    memoriesExtracted: 0,
    memoriesStored: 0,
    memoriesRejected: 0,
    memoryDuplicates: 0,
    memoryConflicts: 0,
    toolsByName: new Map<string, number>(),
    intentsByName: new Map<string, number>()
  }

  recordRequest(metadata: KAYVENCostMetadata): void {
    this.metrics.totalRequests++

    if (metadata.usedAI) {
      this.metrics.aiCalls++
    } else if (metadata.toolUsed) {
      this.metrics.toolCalls++
      this.metrics.toolsByName.set(
        metadata.toolUsed,
        (this.metrics.toolsByName.get(metadata.toolUsed) || 0) + 1
      )
    }

    if (metadata.executionPath === 'error') {
      this.metrics.errors++
    }

    if (metadata.intent) {
      this.metrics.intentsByName.set(
        metadata.intent,
        (this.metrics.intentsByName.get(metadata.intent) || 0) + 1
      )
    }
  }

  recordMemoryOperations(stats: {
    memoriesExtracted: number
    memoriesStored: number
    memoriesRejected: number
    memoryDuplicates: number
    memoryConflicts: number
  }): void {
    this.metrics.memoriesExtracted += stats.memoriesExtracted
    this.metrics.memoriesStored += stats.memoriesStored
    this.metrics.memoriesRejected += stats.memoriesRejected
    this.metrics.memoryDuplicates += stats.memoryDuplicates
    this.metrics.memoryConflicts += stats.memoryConflicts
  }

  getDeterministicRate(): number {
    if (this.metrics.totalRequests === 0) return 0
    return this.metrics.toolCalls / this.metrics.totalRequests
  }

  getAIFallbackRate(): number {
    if (this.metrics.totalRequests === 0) return 0
    return this.metrics.aiCalls / this.metrics.totalRequests
  }

  getMetrics() {
    return {
      totalRequests: this.metrics.totalRequests,
      aiCalls: this.metrics.aiCalls,
      toolCalls: this.metrics.toolCalls,
      errors: this.metrics.errors,
      memoriesExtracted: this.metrics.memoriesExtracted,
      memoriesStored: this.metrics.memoriesStored,
      memoriesRejected: this.metrics.memoriesRejected,
      memoryDuplicates: this.metrics.memoryDuplicates,
      memoryConflicts: this.metrics.memoryConflicts,
      deterministicRate: this.getDeterministicRate(),
      aiFallbackRate: this.getAIFallbackRate(),
      toolUsage: Object.fromEntries(this.metrics.toolsByName),
      intentDistribution: Object.fromEntries(this.metrics.intentsByName)
    }
  }
}

export const globalKAYVENCostTracker = new KAYVENCostTracker()
