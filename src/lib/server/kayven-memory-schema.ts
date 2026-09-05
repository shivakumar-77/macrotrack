export type KAYVENMemoryCategory =
  | 'preference'
  | 'dietary_preference'
  | 'dietary_restriction'
  | 'food_like'
  | 'food_dislike'
  | 'workout_preference'
  | 'fitness_goal'
  | 'habit'
  | 'routine'
  | 'constraint'
  | 'important_context'
  | 'user_correction'

export type KAYVENMemorySource =
  | 'user_explicit'
  | 'user_correction'
  | 'system_derived'
  | 'tool_derived'

export interface KAYVENMemoryRecord {
  id?: string
  user_id?: string
  category: KAYVENMemoryCategory
  key: string
  value: Record<string, unknown> | string | number | boolean
  source: KAYVENMemorySource
  confidence?: number
  importance?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface KAYVENMemoryCandidate {
  category: KAYVENMemoryCategory
  key: string
  value: string | number | boolean | Record<string, unknown>
  source: KAYVENMemorySource
  confidence: number
  importance: number
  reason: string
}

export interface MemoryExtractorResult {
  candidates: KAYVENMemoryCandidate[]
  message: string
  usedAI: false
}

export interface MemoryValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  isDuplicate: boolean
  conflictsWith?: string
}
