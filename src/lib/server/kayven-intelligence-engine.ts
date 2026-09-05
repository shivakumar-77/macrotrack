import { AnthropicProvider, OpenAIProvider } from './ai-providers'
import { AIProvider, AITextRequest } from './ai-provider'
import { decideTool, executeTool } from './kayven-tools'
import { executeSafeTool } from './kayven-tool-executor'
import type {
  KAYVENAIRequest,
  KAYVENAIResponse,
  KAYVENIntent,
  KAYVENMemory,
  KAYVENSafetyDecision,
  KAYVENTool,
} from './kayven-ai'

export function classifyKayvenIntent(message: string): KAYVENIntent {
  const text = message.toLowerCase()

  if (/emergency|chest pain|shortness of breath|faint|severe|medical|doctor|hospital|urgent|danger/i.test(text)) {
    return 'emergency_high_risk_health_question'
  }

  if (/account|login|sign in|logout|profile|settings|password|email|app question|bug|help/i.test(text)) {
    return 'account_app_question'
  }

  if (/weight loss|lose weight|fat loss|cut|lean|slim/i.test(text)) return 'weight_loss_question'
  if (/meal plan|meal planning|dinner|lunch|breakfast|snack|diet plan/i.test(text)) return 'meal_planning'
  if (/workout|training|exercise|lift|bench|squat|cardio|session/i.test(text)) return 'workout_question'
  if (/progress|trend|streak|weekly|month|results|improvement|weight change/i.test(text)) return 'progress_question'
  if (/hydrate|water|hydration|fluid/i.test(text)) return 'hydration'
  if (/supplement|protein powder|creatine|vitamin|multivitamin|pill/i.test(text)) return 'supplements'
  if (/steps|activity|walking|movement|daily movement/i.test(text)) return 'activity_steps'
  if (/nutrition|protein|carbs|calories|macro|food|meal|eat/i.test(text)) return 'nutrition_question'
  if (/health|wellness|body|symptom|conditions|medical info/i.test(text)) return 'health_information_question'

  return 'general_conversation'
}

export function getKAYVENSystemPrompt(): string {
  return `You are KAYVEN, the nutrition and fitness intelligence layer for a health tracking product. Use the provided KAYVEN context, conversation history, and user data. Never invent facts about the user, their health history, or their logs. If the data is missing, say exactly what is missing. Keep recommendations practical, safe, and non-diagnostic. Avoid pretending to be a medical professional. Recommend professional medical care for emergency or high-risk concerns. Keep the tone helpful, grounded, and specific to the user's actual context. Prefer concise, action-oriented guidance. Do not mention hidden chain-of-thought or private internal reasoning. Only provide safe summaries and decisions.`
}

export function getKAYVENMemory(context: Record<string, unknown>): KAYVENMemory {
  const profile = (context as any)?.user?.profile ?? null
  const nutrition = (context as any)?.nutrition ?? {}
  const fitness = (context as any)?.fitness ?? {}
  const body = (context as any)?.body ?? {}
  const mealPlan = (context as any)?.mealPlanning?.currentPlan ?? null
  const supplements = (context as any)?.supplements ?? {}
  const preferences = (context as any)?.user?.preferences ?? {}

  const keySignals: string[] = []
  const goal = (profile as any)?.goal || (context as any)?.user?.goals?.goal
  if (goal) keySignals.push(`Goal: ${String(goal)}`)

  const calorieTarget = (context as any)?.user?.goals?.calorieTarget ?? (context as any)?.nutrition?.calorieTarget
  if (typeof calorieTarget === 'number') keySignals.push(`Calorie target: ${calorieTarget} kcal`)

  const proteinTarget = (context as any)?.user?.goals?.proteinTargetG ?? (context as any)?.nutrition?.proteinTarget
  if (typeof proteinTarget === 'number') keySignals.push(`Protein target: ${proteinTarget} g`)

  return {
    shortTerm: {
      recentMessages: [],
      summary: 'Current conversation context is active and should be used before historical assumptions.'
    },
    longTerm: {
      profile: profile ?? null,
      nutrition: nutrition ?? {},
      fitness: fitness ?? {},
      body: body ?? {},
      preferences: preferences ?? {},
      mealPlan: mealPlan ?? null,
      supplements: supplements ?? {}
    },
    keySignals
  }
}

export function evaluateKayvenSafety(message: string, context?: Record<string, unknown>): KAYVENSafetyDecision {
  const reasons: string[] = []
  const restrictions: string[] = []
  const text = message.toLowerCase()

  if (/emergency|chest pain|shortness of breath|stroke|faint|severe bleeding|suicid/i.test(text)) {
    reasons.push('High-risk medical issue detected')
    restrictions.push('Do not provide diagnostic guidance or treatment instructions')
    return { status: 'escalate', reasons, restrictions, shouldEscalate: true }
  }

  if (/diagnose|cure|treat|stop medication|increase medication|replace doctor/i.test(text)) {
    reasons.push('Medical advice request detected')
    restrictions.push('Use general wellness guidance only and direct to a qualified professional')
    return { status: 'constrained', reasons, restrictions, shouldEscalate: false }
  }

  if (context && typeof context === 'object') {
    const profile = (context as any)?.user?.profile
    if (profile && !profile?.id) {
      reasons.push('No authenticated user context available')
      restrictions.push('Avoid using assumed health data when identity is missing')
      return { status: 'constrained', reasons, restrictions, shouldEscalate: false }
    }
  }

  return {
    status: 'allowed',
    reasons: ['Routine nutrition or fitness question'],
    restrictions: ['Use only actual KAYVEN data and avoid assumptions'],
    shouldEscalate: false
  }
}

export function getDefaultReadTools(): KAYVENTool[] {
  return [
    {
      name: 'getUserProfile',
      description: 'Read the user profile and current goals.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    },
    {
      name: 'getNutrition',
      description: 'Read nutrition logs and targets for the selected time range.',
      inputSchema: { type: 'object', properties: { range: { type: 'string', enum: ['today', '7d', '30d'] } } },
      permission: 'read'
    },
    {
      name: 'getProgress',
      description: 'Read progress and weight trend information.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    },
    {
      name: 'getWorkout',
      description: 'Read recent workouts and workout history.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    },
    {
      name: 'getMealPlan',
      description: 'Read the user current meal plan for context.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    }
  ]
}

export function selectKAYVENProvider(intent: KAYVENIntent): AIProvider {
  if (process.env.AI_PROVIDER === 'openai') return new OpenAIProvider()
  return new AnthropicProvider()
}

export async function routeKAYVENRequest(request: KAYVENAIRequest): Promise<KAYVENAIResponse> {
  const selectedProvider = selectKAYVENProvider(request.intent)
  const providerRequest: AITextRequest = {
    prompt: buildKAYVENPrompt(request),
    system: getKAYVENSystemPrompt(),
    maxTokens: 350,
    metadata: {
      intent: request.intent,
      responseMode: request.responseMode,
      conversationId: request.conversationId,
    },
  }

  const text = await selectedProvider.generateResponse(providerRequest)

  return {
    text,
    safetyStatus: 'allowed',
    provider: {
      name: selectedProvider.name,
      model: process.env.ANTHROPIC_MODEL || process.env.OPENAI_MODEL || 'default'
    },
  }
}

export function buildKAYVENPrompt(request: KAYVENAIRequest): string {
  const contextSummary = JSON.stringify(request.context, null, 2)
  const historySummary = request.conversationHistory
    .slice(-8)
    .map(entry => `${entry.role.toUpperCase()}: ${entry.content}`)
    .join('\n')

  return `KAYVEN SYSTEM:\n${getKAYVENSystemPrompt()}\n\nINTENT: ${request.intent}\nRESPONSE MODE: ${request.responseMode}\n\nUSER: ${request.user.displayName || request.user.email || request.user.id}\n\nKAYVEN CONTEXT:\n${contextSummary}\n\nCONVERSATION HISTORY:\n${historySummary || '(no prior messages)'}\n\nCURRENT USER MESSAGE:\n${request.message}`
}

export async function attemptDeterministicToolResponse(
  request: KAYVENAIRequest,
  supabase: any
): Promise<KAYVENAIResponse | null> {
  const decision = decideTool(request.intent, request.message)

  if (!decision.canHandle || !decision.tool) {
    return null
  }

  const toolResult = await executeSafeTool(
    decision.tool,
    request.message,
    request.user.id,
    supabase,
    request.context
  )

  if (!toolResult.success || toolResult.safetyBlocked) {
    return null
  }

  const toolData = toolResult.data
  const responseText = formatToolResponseAsText(decision.tool, toolData)

  return {
    text: responseText,
    safetyStatus: 'allowed',
    provider: { name: 'anthropic', model: 'deterministic_tool' },
    metadata: {
      usedAI: false,
      toolUsed: decision.tool,
      intent: request.intent,
      executionPath: 'deterministic_tool'
    }
  }
}

function formatToolResponseAsText(toolName: string, data: unknown): string {
  const toolData = data as Record<string, unknown>

  switch (toolName) {
    case 'get_user_profile': {
      const targets = toolData.targets as Record<string, unknown> || {}
      return `Your fitness goals: ${toolData.goal}. Targets: ${targets.calories} kcal, ${targets.protein_g}g protein.`
    }

    case 'get_today_nutrition': {
      const mealsLogged = typeof toolData.meals_logged === 'number' ? toolData.meals_logged : 0
      return `You've logged ${mealsLogged} meals today with ${toolData.calories} calories, ${toolData.protein_g}g protein, ${toolData.carbs_g}g carbs, ${toolData.fat_g}g fat. Target: ${toolData.target_calories} kcal.`
    }

    case 'get_weight_progress': {
      const latest = toolData.latest_entry as Record<string, unknown> || {}
      const trend = toolData.trend_kg as number | undefined
      const trendText = trend ? (trend > 0 ? `up ${trend}kg` : `down ${Math.abs(trend as number)}kg`) : 'stable'
      return `Current weight: ${toolData.current_weight_kg}kg (trend: ${trendText}). Latest: ${latest.weight_kg}kg on ${latest.date}.`
    }

    case 'get_hydration': {
      const remaining = typeof toolData.remaining_ml === 'number' ? toolData.remaining_ml : 0
      const percentage = typeof toolData.percentage === 'number' ? toolData.percentage : 0
      return `You've consumed ${toolData.consumed_ml}ml of ${toolData.target_ml}ml water today. ${remaining}ml remaining (${percentage}%).`
    }

    case 'get_recent_workouts': {
      const count = typeof toolData.recent_count === 'number' ? toolData.recent_count : 0
      return `You've done ${count} recent workouts (${toolData.frequency}). Latest: ${count > 0 ? 'recorded' : 'none yet'}.`
    }

    case 'get_supplements': {
      const count = typeof toolData.count === 'number' ? toolData.count : 0
      const supplements = (toolData.active_supplements as Array<Record<string, unknown>>) || []
      const list = supplements.map(s => `${s.name} (${s.dose})`).join(', ')
      return `You're taking ${count} supplement${count !== 1 ? 's' : ''}: ${list || 'none'}.`
    }

    case 'get_current_meal_plan': {
      const meals = (toolData.meals as Array<Record<string, unknown>>) || []
      if (meals.length === 0) return (toolData.message as string) || 'No meal plan created yet.'
      return `Your meal plan includes: ${meals.map(m => m.type).join(', ')}. Total meals: ${meals.length}.`
    }

    default:
      return 'Tool result retrieved.'
  }
}
