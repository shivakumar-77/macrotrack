export type KAYVENProviderName = 'anthropic' | 'openai' | 'gemini' | 'custom'
export type KAYVENIntent =
  | 'general_conversation'
  | 'nutrition_question'
  | 'meal_planning'
  | 'workout_question'
  | 'progress_question'
  | 'weight_loss_question'
  | 'hydration'
  | 'supplements'
  | 'activity_steps'
  | 'health_information_question'
  | 'emergency_high_risk_health_question'
  | 'account_app_question'
  | 'unknown'

export type KAYVENResponseMode = 'chat' | 'summary' | 'action'
export type KAYVENToolPermission = 'read' | 'write'

export interface KAYVENUserIdentity {
  id: string
  email?: string | null
  displayName?: string | null
}

export interface KAYVENMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface KAYVENTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  permission: KAYVENToolPermission
  execute?: (args: Record<string, unknown>, context?: Record<string, unknown>) => Promise<unknown>
}

export interface KAYVENSafetyConstraint {
  category: 'medical' | 'nutrition' | 'privacy' | 'data_use'
  mode: 'allow' | 'restrict' | 'escalate'
  message?: string
}

export interface KAYVENSafetyDecision {
  status: 'allowed' | 'constrained' | 'escalate'
  reasons: string[]
  restrictions: string[]
  shouldEscalate: boolean
}

export interface KAYVENToolCall {
  name: string
  args: Record<string, unknown>
}

export interface KAYVENAIRequest {
  user: KAYVENUserIdentity
  message: string
  conversationId?: string | null
  context: Record<string, unknown>
  conversationHistory: KAYVENMessage[]
  availableTools: KAYVENTool[]
  safetyConstraints: KAYVENSafetyConstraint[]
  responseMode: KAYVENResponseMode
  intent: KAYVENIntent
}

export interface KAYVENAIResponse {
  text: string
  reasoningSummary?: string
  toolCalls?: KAYVENToolCall[]
  citations?: string[]
  suggestedActions?: string[]
  safetyStatus: 'allowed' | 'constrained' | 'escalate'
  provider: {
    name: KAYVENProviderName
    model?: string
  }
  metadata?: {
    usedAI?: boolean
    provider?: string
    toolUsed?: string
    intent?: string
    executionPath?: 'deterministic_tool' | 'local_intelligence' | 'ai_fallback' | 'error'
  }
}

export interface KAYVENMemory {
  shortTerm: {
    recentMessages: KAYVENMessage[]
    summary: string
  }
  longTerm: {
    profile: Record<string, unknown> | null
    nutrition: Record<string, unknown>
    fitness: Record<string, unknown>
    body: Record<string, unknown>
    preferences: Record<string, unknown>
    mealPlan: Record<string, unknown> | null
    supplements: Record<string, unknown>
  }
  keySignals: string[]
}
