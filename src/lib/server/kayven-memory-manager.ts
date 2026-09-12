import {
  createMemory,
  deactivateMemory,
  getUserMemories,
  updateMemory,
} from './kayven-memory'
import { sanitizeMemoryValue, validateMemory } from './kayven-memory-validator'
import type {
  KAYVENMemoryCandidate,
  KAYVENMemoryRecord,
} from './kayven-memory-schema'

export interface MemoryOperationStats {
  memoriesExtracted: number
  memoriesStored: number
  memoriesRejected: number
  memoryDuplicates: number
  memoryConflicts: number
}

function normalizedValue(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'item' in value) {
    return String((value as { item: unknown }).item).trim().toLowerCase()
  }

  return String(value).trim().toLowerCase()
}

function isSameSubject(memory: KAYVENMemoryRecord, subject: string): boolean {
  const value = normalizedValue(memory.value)
  return value === subject || memory.key.toLowerCase().includes(subject.replace(/\s+/g, '_'))
}

export async function processMemoryCandidates(
  supabase: any,
  userId: string,
  candidates: KAYVENMemoryCandidate[],
): Promise<MemoryOperationStats> {
  const stats: MemoryOperationStats = {
    memoriesExtracted: candidates.length,
    memoriesStored: 0,
    memoriesRejected: 0,
    memoryDuplicates: 0,
    memoryConflicts: 0,
  }

  for (const candidate of candidates) {
    try {
      const validation = await validateMemory(candidate, supabase, userId)

      if (validation.isDuplicate) {
        stats.memoryDuplicates += 1
        if (validation.conflictsWith) {
          const existing = await getUserMemories(supabase, userId)
          const duplicate = existing.find(memory => memory.id === validation.conflictsWith)
          if (duplicate) {
            await refreshDuplicateMemory(supabase, userId, duplicate)
          }
        }
        continue
      }

      if (!validation.valid) {
        stats.memoriesRejected += 1
        continue
      }

      const safeValue = sanitizeMemoryValue(candidate.value)
      const activeMemories = await getUserMemories(supabase, userId)
      const subject = normalizedValue(safeValue)

      if (candidate.category === 'user_correction') {
        const conflictingMemories = activeMemories.filter(memory =>
          memory.id &&
          memory.category !== 'user_correction' &&
          isSameSubject(memory, subject),
        )

        for (const memory of conflictingMemories) {
          await deactivateMemory(supabase, userId, memory.id as string)
          stats.memoryConflicts += 1
        }
      }

      const stored = await createMemory(supabase, userId, {
        category: candidate.category,
        key: candidate.key,
        value: safeValue as KAYVENMemoryRecord['value'],
        source: candidate.source,
        confidence: Math.min(1, Math.max(0, candidate.confidence)),
        importance: Math.min(5, Math.max(1, candidate.importance)),
        is_active: true,
      })

      if (stored) {
        stats.memoriesStored += 1
      } else {
        stats.memoriesRejected += 1
      }
    } catch {
      stats.memoriesRejected += 1
    }
  }

  return stats
}

export async function refreshDuplicateMemory(
  supabase: any,
  userId: string,
  memory: KAYVENMemoryRecord,
): Promise<KAYVENMemoryRecord | null> {
  if (!memory.id) return null

  return updateMemory(supabase, userId, memory.id, {
    confidence: memory.confidence,
    importance: memory.importance,
    is_active: true,
  })
}
