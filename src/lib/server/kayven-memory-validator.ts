import type { KAYVENMemoryCandidate, MemoryValidationResult, KAYVENMemoryCategory } from './kayven-memory-schema'
import { getMemoryByKey } from './kayven-memory'

const PROHIBITED_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /auth/i,
  /credential/i,
  /ssh/i,
  /private[_-]?key/i,
  /sk[-_]/,
  /payment/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i
]

const VALID_CATEGORIES: readonly KAYVENMemoryCategory[] = [
  'preference',
  'dietary_preference',
  'dietary_restriction',
  'food_like',
  'food_dislike',
  'workout_preference',
  'fitness_goal',
  'habit',
  'routine',
  'constraint',
  'important_context',
  'user_correction'
]

export async function validateMemory(
  candidate: KAYVENMemoryCandidate,
  supabase: any,
  userId: string
): Promise<MemoryValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check category validity
  if (!VALID_CATEGORIES.includes(candidate.category)) {
    errors.push(`Invalid category: ${candidate.category}`)
  }

  // Check value is not empty
  const valueStr = String(candidate.value).trim()
  if (valueStr.length === 0) {
    errors.push('Memory value cannot be empty')
  }

  // Check value length
  if (valueStr.length > 500) {
    errors.push('Memory value too long (max 500 chars)')
  }

  // Check for prohibited patterns (secrets, credentials)
  if (PROHIBITED_PATTERNS.some(pattern => pattern.test(valueStr))) {
    errors.push('Memory contains prohibited sensitive information')
  }

  // Check confidence
  if (candidate.confidence < 0 || candidate.confidence > 1) {
    warnings.push('Confidence outside [0, 1] range, clamping')
  }

  // Check importance
  if (candidate.importance < 1 || candidate.importance > 5) {
    warnings.push('Importance outside [1, 5] range, clamping')
  }

  // Check for duplicates and conflicts
  let isDuplicate = false
  let conflictsWith: string | undefined = undefined

  try {
    const existing = await getMemoryByKey(supabase, userId, candidate.category, candidate.key)

    if (existing) {
      if (String(existing.value).toLowerCase() === valueStr.toLowerCase()) {
        isDuplicate = true
      } else if (candidate.category === 'user_correction') {
        // Corrections are allowed even if they conflict with existing memories
        conflictsWith = existing.id
      } else if (/dislike|like|prefer|hate/i.test(candidate.key)) {
        // For preference types, conflicting values are allowed (they indicate preference change)
        conflictsWith = existing.id
      }
    }
  } catch (error) {
    warnings.push(`Could not check for duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const valid = errors.length === 0 && !isDuplicate

  return {
    valid,
    errors,
    warnings,
    isDuplicate,
    conflictsWith
  }
}

export function sanitizeMemoryValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim().substring(0, 500)
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.parse(JSON.stringify(value))
  }
  return value
}
