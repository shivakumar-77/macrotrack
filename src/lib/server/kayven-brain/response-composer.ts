import type {
  KAYVENIntent,
} from '@/lib/server/kayven-ai'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type BrainDecision = {
  intent?: KAYVENIntent
  confidence?: number
  complexity?: 'simple' | 'moderate' | 'complex'
  needsUserData?: boolean
  requiredData?: string[]
  resolvedReferences?: string[]
  shouldAskClarification?: boolean
  responseStrategy?: string
}

type ComposeInput = {
  message: string
  intent: KAYVENIntent
  context: any
  conversation: ChatMessage[]
  brainDecision: BrainDecision
  safetyStatus: 'allowed' | 'constrained' | 'escalate'
}

export type KAYVENComposedResponse = {
  text: string | null
  suggestedActions: string[]
  shouldFallback: boolean
}

function clean(value: unknown): string {
  return String(value ?? '').trim()
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : null
}

function formatNumber(
  value: number | null,
  digits = 0,
): string | null {
  if (value === null) return null

  return value.toFixed(digits)
}

function getLatestAssistantMessage(
  conversation: ChatMessage[],
): string | null {
  const reversed = [...conversation].reverse()

  const message = reversed.find(
    item => item.role === 'assistant',
  )

  return message
    ? clean(message.content)
    : null
}

function isFollowUp(
  message: string,
): boolean {
  const normalized =
    message.trim().toLowerCase()

  return (
    normalized.length < 70 ||
    /^(why|how|what|when|is that|is it|should i|can i|but|then|okay|ok|yes|no|more|explain)/i.test(
      normalized,
    )
  )
}

function needsClarification(
  input: ComposeInput,
): boolean {
  if (
    input.brainDecision
      ?.shouldAskClarification
  ) {
    return true
  }

  const message =
    input.message.trim().toLowerCase()

  if (
    message.length < 3 ||
    message === 'help'
  ) {
    return true
  }

  return false
}

function buildClarificationResponse(
  input: ComposeInput,
): KAYVENComposedResponse {
  const previous =
    getLatestAssistantMessage(
      input.conversation,
    )

  if (previous && isFollowUp(input.message)) {
    return {
      text:
        'I want to make sure I answer that in the right context. Could you tell me which part of my previous answer you mean?',
      suggestedActions: [],
      shouldFallback: false,
    }
  }

  return {
    text:
      'Sure — tell me a little more about what you want to know, and I’ll help based on your KAYVEN data where available.',
    suggestedActions: [],
    shouldFallback: false,
  }
}

function buildDataAwareOpening(
  input: ComposeInput,
): string {
  const profileName =
    clean(
      input.context?.user
        ?.profile?.name,
    )

  if (
    input.brainDecision
      ?.needsUserData
  ) {
    return profileName
      ? `${profileName}, based on your available KAYVEN data, `
      : 'Based on your available KAYVEN data, '
  }

  return ''
}

function buildProgressResponse(
  input: ComposeInput,
): KAYVENComposedResponse | null {
  const currentWeight =
    numberOrNull(
      input.context?.body
        ?.currentWeightKg,
    )

  const weightGoal =
    numberOrNull(
      input.context?.user
        ?.goals?.weightGoalKg,
    )

  const trend =
    numberOrNull(
      input.context?.body
        ?.weightTrendKg,
    )

  if (
    currentWeight === null &&
    trend === null
  ) {
    return null
  }

  let text =
    buildDataAwareOpening(input)

  if (currentWeight !== null) {
    text +=
      `your latest recorded weight is ${formatNumber(currentWeight, 1)} kg`
  } else {
    text +=
      'your recent weight trend is available'
  }

  if (weightGoal !== null) {
    text +=
      ` and your goal is ${formatNumber(weightGoal, 1)} kg`
  }

  text += '.'

  if (trend !== null) {
    if (trend < 0) {
      text +=
        ` Across the loaded period, your weight is down about ${formatNumber(Math.abs(trend), 1)} kg.`
    } else if (trend > 0) {
      text +=
        ` Across the loaded period, your weight is up about ${formatNumber(trend, 1)} kg.`
    } else {
      text +=
        ' Across the loaded period, your weight is roughly unchanged.'
    }
  }

  text +=
    ' The important thing is the overall trend, not a single day.'

  return {
    text,
    suggestedActions: [
      'Check weight progress',
    ],
    shouldFallback: false,
  }
}

function buildNutritionResponse(
  input: ComposeInput,
): KAYVENComposedResponse | null {
  const nutrition =
    input.context?.nutrition?.today

  if (!nutrition) return null

  const calories =
    numberOrNull(
      nutrition.calories,
    )

  const protein =
    numberOrNull(
      nutrition.proteinG,
    )

  const calorieTarget =
    numberOrNull(
      input.context?.user
        ?.goals?.calorieTarget,
    )

  const proteinTarget =
    numberOrNull(
      input.context?.user
        ?.goals?.proteinTargetG,
    )

  if (
    calories === null &&
    protein === null
  ) {
    return null
  }

  let text =
    buildDataAwareOpening(input)

  text += 'here is where you stand today: '

  const parts: string[] = []

  if (calories !== null) {
    parts.push(
      calorieTarget !== null
        ? `${formatNumber(calories)} kcal out of ${formatNumber(calorieTarget)} kcal`
        : `${formatNumber(calories)} kcal`,
    )
  }

  if (protein !== null) {
    parts.push(
      proteinTarget !== null
        ? `${formatNumber(protein, 1)} g protein out of ${formatNumber(proteinTarget, 1)} g`
        : `${formatNumber(protein, 1)} g protein`,
    )
  }

  text += parts.join(', ') + '.'

  if (
    protein !== null &&
    proteinTarget !== null &&
    protein < proteinTarget
  ) {
    const remaining =
      proteinTarget - protein

    text +=
      ` Your biggest remaining gap appears to be protein — approximately ${formatNumber(remaining, 1)} g remaining.`
  }

  return {
    text,
    suggestedActions: [
      'Log your next meal',
    ],
    shouldFallback: false,
  }
}

function buildHydrationResponse(
  input: ComposeInput,
): KAYVENComposedResponse | null {
  const water =
    numberOrNull(
      input.context?.hydration
        ?.todayMl,
    )

  const target =
    numberOrNull(
      input.context?.hydration
        ?.targetMl,
    )

  if (
    water === null ||
    water <= 0
  ) {
    return null
  }

  let text =
    buildDataAwareOpening(input)

  text +=
    `you have logged about ${formatNumber(water / 1000, 1)} L of water today`

  if (target !== null) {
    const remaining =
      Math.max(target - water, 0)

    text +=
      ` against a ${formatNumber(target / 1000, 1)} L target`

    if (remaining > 0) {
      text +=
        `. You have roughly ${formatNumber(remaining / 1000, 1)} L remaining`
    }
  }

  text +=
    '. Spread it gradually through the rest of the day.'

  return {
    text,
    suggestedActions: [
      'Log water intake',
    ],
    shouldFallback: false,
  }
}

export function composeKAYVENResponse(
  input: ComposeInput,
): KAYVENComposedResponse {
  if (
    input.safetyStatus === 'escalate'
  ) {
    return {
      text: null,
      suggestedActions: [],
      shouldFallback: true,
    }
  }

  if (needsClarification(input)) {
    return buildClarificationResponse(
      input,
    )
  }

  switch (input.intent) {
    case 'nutrition_question': {
      const response =
        buildNutritionResponse(input)

      if (response) return response

      break
    }

    case 'weight_loss_question':
    case 'progress_question': {
      const response =
        buildProgressResponse(input)

      if (response) return response

      break
    }

    case 'hydration': {
      const response =
        buildHydrationResponse(input)

      if (response) return response

      break
    }
  }

  return {
    text: null,
    suggestedActions: [],
    shouldFallback: true,
  }
}
