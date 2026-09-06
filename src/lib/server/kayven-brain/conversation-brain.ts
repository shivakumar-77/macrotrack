import type { KAYVENIntent } from '../kayven-ai'

export type KayvenResponseStrategy =
  | 'direct'
  | 'data_analysis'
  | 'clarify'
  | 'recommend'
  | 'safety'

export type KayvenComplexity =
  | 'simple'
  | 'moderate'
  | 'complex'

export interface KayvenConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface KayvenBrainDecision {
  intent: KAYVENIntent
  confidence: number

  needsUserData: boolean
  requiredData: string[]

  resolvedReferences: string[]

  responseStrategy: KayvenResponseStrategy
  complexity: KayvenComplexity

  shouldAskClarification: boolean
  clarificationQuestion?: string
}

const FOLLOW_UP_PATTERNS = [
  /\b(that|this|it|same|again|one|those|them)\b/i,
  /\bwhat about\b/i,
  /\bis that\b/i,
  /\bhow about\b/i,
]

const DATA_REQUEST_PATTERNS = {
  nutrition: /\b(calorie|calories|protein|carb|carbs|fat|fiber|ate|eaten|meal|food|diet|today)\b/i,
  weight: /\b(weight|weigh|lost|gain|progress|trend|scale)\b/i,
  hydration: /\b(water|hydration|hydrated|drink)\b/i,
  workout: /\b(workout|training|exercise|gym|lift|bench|squat|cardio)\b/i,
  supplements: /\b(supplement|creatine|protein powder|vitamin|omega|fish oil)\b/i,
}

function getRecentUserContext(
  history: KayvenConversationMessage[],
): string[] {
  return history
    .filter(message => message.role === 'user')
    .slice(-4)
    .map(message => message.content.trim())
    .filter(Boolean)
}

function resolveReferences(
  message: string,
  history: KayvenConversationMessage[],
): string[] {
  const hasReference = FOLLOW_UP_PATTERNS.some(pattern =>
    pattern.test(message),
  )

  if (!hasReference) {
    return []
  }

  return getRecentUserContext(history)
    .slice(-2)
}

function detectRequiredData(
  message: string,
  intent: KAYVENIntent,
): string[] {
  const required = new Set<string>()
  const text = message.toLowerCase()

  if (
    intent === 'nutrition_question' ||
    intent === 'meal_planning' ||
    DATA_REQUEST_PATTERNS.nutrition.test(text)
  ) {
    required.add('nutrition')
    required.add('goals')
  }

  if (
    intent === 'weight_loss_question' ||
    intent === 'progress_question' ||
    DATA_REQUEST_PATTERNS.weight.test(text)
  ) {
    required.add('weight')
    required.add('goals')
  }

  if (
    intent === 'hydration' ||
    DATA_REQUEST_PATTERNS.hydration.test(text)
  ) {
    required.add('hydration')
  }

  if (
    intent === 'workout_question' ||
    DATA_REQUEST_PATTERNS.workout.test(text)
  ) {
    required.add('workouts')
  }

  if (
    intent === 'supplements' ||
    DATA_REQUEST_PATTERNS.supplements.test(text)
  ) {
    required.add('supplements')
  }

  return Array.from(required)
}

function detectComplexity(
  message: string,
  requiredData: string[],
  resolvedReferences: string[],
): KayvenComplexity {
  const words = message.trim().split(/\s+/).length

  const reasoningSignals =
    /\b(why|compare|should i|what should|change|improve|plan|because|but|however|despite|although)\b/i
      .test(message)

  if (
    requiredData.length >= 3 ||
    resolvedReferences.length > 0 ||
    reasoningSignals ||
    words > 30
  ) {
    return 'complex'
  }

  if (
    requiredData.length >= 2 ||
    words > 12
  ) {
    return 'moderate'
  }

  return 'simple'
}

function determineStrategy(
  intent: KAYVENIntent,
  requiredData: string[],
  complexity: KayvenComplexity,
): KayvenResponseStrategy {
  if (requiredData.length > 0) {
    return 'data_analysis'
  }

  if (
    intent === 'meal_planning' ||
    intent === 'workout_question' ||
    complexity === 'complex'
  ) {
    return 'recommend'
  }

  return 'direct'
}

function getClarification(
  message: string,
  intent: KAYVENIntent,
  history: KayvenConversationMessage[],
): string | undefined {
  const text = message.trim().toLowerCase()

  const vagueFollowUp =
    text.length < 12 &&
    FOLLOW_UP_PATTERNS.some(pattern => pattern.test(text))

  if (vagueFollowUp && history.length === 0) {
    return 'Can you give me a little more context about what you mean?'
  }

  if (
    intent === 'meal_planning' &&
    /\bwhat should i eat|what can i eat\b/i.test(text)
  ) {
    return 'Do you want me to base that on your remaining calories and protein target for today?'
  }

  return undefined
}

export function understandKayvenConversation(
  message: string,
  intent: KAYVENIntent,
  history: KayvenConversationMessage[] = [],
): KayvenBrainDecision {
  const resolvedReferences = resolveReferences(message, history)

  const requiredData = detectRequiredData(
    message,
    intent,
  )

  const complexity = detectComplexity(
    message,
    requiredData,
    resolvedReferences,
  )

  const responseStrategy = determineStrategy(
    intent,
    requiredData,
    complexity,
  )

  const clarificationQuestion = getClarification(
    message,
    intent,
    history,
  )

  let confidence = 0.95

  if (resolvedReferences.length > 0) {
    confidence -= 0.08
  }

  if (complexity === 'complex') {
    confidence -= 0.1
  }

  if (clarificationQuestion) {
    confidence = Math.min(confidence, 0.65)
  }

  return {
    intent,
    confidence: Math.max(0.4, confidence),

    needsUserData: requiredData.length > 0,
    requiredData,

    resolvedReferences,

    responseStrategy,
    complexity,

    shouldAskClarification: Boolean(
      clarificationQuestion,
    ),
    clarificationQuestion,
  }
}
