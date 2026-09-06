import {
  buildKayvenUserState,
  type KayvenMetricState,
  type KayvenUserState,
} from './kayven-user-state'
import { KayvenIntelligenceContext } from './kayven-intelligence-context'

export const ACTION_TYPES = [
  'LOG_MEAL',
  'NUTRITION',
  'PROTEIN',
  'HYDRATION',
  'ACTIVITY',
  'WORKOUT',
  'RECOVERY',
  'WEIGHT',
  'MEAL_PLAN',
  'PROGRESS',
  'AI_COACH',
  'NONE',
] as const

export type NextActionType = typeof ACTION_TYPES[number]
export type NextActionPriorityLevel = 'high' | 'medium' | 'low'

export interface NextActionMetric {
  current: number | null
  target: number | null
  remaining: number | null
  unit: string
}

export interface NextBestAction {
  actionType: NextActionType
  priority: number
  title?: string
  message?: string
  reason?: string
  suggestedAction?: string
  destination?: string
  priorityLevel?: NextActionPriorityLevel
  metric?: NextActionMetric | null
  source?: 'deterministic'
  generatedAt?: string
}

type ActionCategory =
  | 'protein'
  | 'nutrition'
  | 'hydration'
  | 'weight_progress'
  | 'workout'
  | 'activity'
  | 'meal_plan'

type ActionCandidate = NextBestAction & {
  category: ActionCategory
  urgency: number
  tieBreakOrder: number
}

const ACTION_PRIORITY = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
} as const

const TIE_BREAK_ORDER: Record<ActionCategory, number> = {
  protein: 1,
  nutrition: 2,
  hydration: 3,
  weight_progress: 4,
  workout: 5,
  activity: 6,
  meal_plan: 7,
}

function round(value: number): number {
  return Math.round(value)
}

function metricFor(metric: KayvenMetricState, unit: string): NextActionMetric {
  return {
    current: metric.current,
    target: metric.target,
    remaining: metric.remaining,
    unit,
  }
}

function actionPriorityForStatus(
  status: KayvenMetricState['status']
): NextActionPriorityLevel | null {
  if (status === 'very_low' || status === 'low') {
    return 'high'
  }

  return status === 'behind' ? 'medium' : null
}

function actionCandidate(
  category: ActionCategory,
  priorityLevel: NextActionPriorityLevel,
  action: Omit<NextBestAction, 'priority' | 'priorityLevel' | 'source' | 'generatedAt'>
): ActionCandidate {
  return {
    ...action,
    category,
    priority: ACTION_PRIORITY[priorityLevel],
    priorityLevel,
    source: 'deterministic',
    generatedAt: new Date().toISOString(),
    urgency: ACTION_PRIORITY[priorityLevel],
    tieBreakOrder: TIE_BREAK_ORDER[category],
  }
}

function metricIsActionable(metric: KayvenMetricState): boolean {
  return metric.current !== null &&
    metric.target !== null &&
    metric.remaining !== null &&
    metric.remaining > 0
}

function createProteinCandidate(metric: KayvenMetricState): ActionCandidate | null {
  const priorityLevel = actionPriorityForStatus(metric.status)

  if (!priorityLevel || !metricIsActionable(metric)) {
    return null
  }

  const percentage = metric.percentage === null ? null : round(metric.percentage)

  return actionCandidate('protein', priorityLevel, {
    actionType: 'PROTEIN',
    title: 'Increase your protein intake',
    message: percentage === null
      ? 'Focus on a protein-rich next meal to close today’s protein gap.'
      : `You’ve reached ${percentage}% of your protein target today. Focus on your next protein-rich meal.`,
    reason: 'Protein is currently your largest actionable nutrition gap.',
    suggestedAction: `Aim for about ${round(metric.remaining ?? 0)}g more protein today.`,
    destination: '/log',
    metric: metricFor(metric, 'g'),
  })
}

function createNutritionCandidate(metric: KayvenMetricState): ActionCandidate | null {
  const priorityLevel = actionPriorityForStatus(metric.status)

  if (!priorityLevel || !metricIsActionable(metric)) {
    return null
  }

  return actionCandidate('nutrition', priorityLevel, {
    actionType: 'NUTRITION',
    title: 'Plan your next meal',
    message: `You have reached ${round(metric.percentage ?? 0)}% of your calorie target today.`,
    reason: 'Calories are currently below the recorded daily target.',
    suggestedAction: `Plan a balanced meal with about ${round(metric.remaining ?? 0)} calories remaining.`,
    destination: '/log',
    metric: metricFor(metric, 'kcal'),
  })
}

function createHydrationCandidate(metric: KayvenMetricState): ActionCandidate | null {
  const priorityLevel = actionPriorityForStatus(metric.status)

  if (!priorityLevel || !metricIsActionable(metric)) {
    return null
  }

  return actionCandidate('hydration', priorityLevel, {
    actionType: 'HYDRATION',
    title: 'Top up your hydration',
    message: `You have logged ${round(metric.current ?? 0)}ml of your ${round(metric.target ?? 0)}ml water target today.`,
    reason: 'Hydration is below the recorded daily target.',
    suggestedAction: `Drink about ${round(metric.remaining ?? 0)}ml more today.`,
    destination: '/water',
    metric: metricFor(metric, 'ml'),
  })
}

function createActivityCandidate(metric: KayvenMetricState): ActionCandidate | null {
  const priorityLevel = actionPriorityForStatus(metric.status)

  if (!priorityLevel || !metricIsActionable(metric)) {
    return null
  }

  return actionCandidate('activity', priorityLevel, {
    actionType: 'ACTIVITY',
    title: 'Add more movement today',
    message: `You have logged ${round(metric.current ?? 0)} of your ${round(metric.target ?? 0)} step target.`,
    reason: 'Activity is below the recorded step target.',
    suggestedAction: `Aim for about ${round(metric.remaining ?? 0)} more steps today.`,
    destination: '/workout',
    metric: metricFor(metric, 'steps'),
  })
}

function createWorkoutCandidate(userState: KayvenUserState): ActionCandidate | null {
  if (userState.workout.status !== 'pending') {
    return null
  }

  return actionCandidate('workout', 'medium', {
    actionType: 'WORKOUT',
    title: 'Complete your planned workout',
    message: 'You have a workout scheduled for today that has not been marked complete.',
    reason: 'Your current state shows a pending workout.',
    suggestedAction: 'Open your workout and continue when ready.',
    destination: '/workout',
    metric: null,
  })
}

function createWeightCandidate(userState: KayvenUserState): ActionCandidate | null {
  if (userState.weight.progressStatus !== 'needs_attention') {
    return null
  }

  const recentTrendMovesAway = userState.weight.direction === 'lose'
    ? (userState.weight.trendKg ?? 0) >= 0.5
    : (userState.weight.trendKg ?? 0) <= -0.5
  const message = recentTrendMovesAway
    ? 'Your recent weight trend is moving away from your current goal.'
    : 'Your weight has not changed meaningfully in the recent tracked period.'

  return actionCandidate('weight_progress', 'high', {
    actionType: 'WEIGHT',
    title: 'Review your weight progress',
    message,
    reason: 'Your deterministic weight trend needs attention.',
    suggestedAction: 'Review your recent nutrition and activity consistency.',
    destination: '/insights',
    metric: {
      current: userState.weight.currentKg,
      target: userState.weight.goalKg,
      remaining: userState.weight.remainingKg,
      unit: 'kg',
    },
  })
}

function createMealPlanCandidate(context: KayvenIntelligenceContext): ActionCandidate | null {
  if (!context.mealPlanning.currentPlan) {
    return null
  }

  return actionCandidate('meal_plan', 'low', {
    actionType: 'MEAL_PLAN',
    title: 'Check your meal plan',
    message: 'You have a meal plan available for today.',
    reason: 'An existing meal plan is available as a low-priority planning aid.',
    suggestedAction: 'Open the plan and continue with the next meal.',
    destination: '/meal-plan',
    metric: null,
  })
}

function fallbackAction(): NextBestAction {
  return {
    actionType: 'NONE',
    priority: 0,
    priorityLevel: 'low',
    title: 'Keep building your routine',
    message: 'Track your meals, water, workouts, or weight so KAYVEN can personalise your next step.',
    reason: 'There is not enough recent data to identify a reliable priority.',
    metric: null,
    source: 'deterministic',
    generatedAt: new Date().toISOString(),
  }
}

export function getNextBestAction(
  context: KayvenIntelligenceContext,
  userState: KayvenUserState = buildKayvenUserState(context)
): NextBestAction {
  const candidates = [
    createProteinCandidate(userState.nutrition.protein),
    createNutritionCandidate(userState.nutrition.calories),
    createHydrationCandidate(userState.hydration),
    createActivityCandidate(userState.activity.steps),
    createWorkoutCandidate(userState),
    createWeightCandidate(userState),
    createMealPlanCandidate(context),
  ].filter((candidate): candidate is ActionCandidate => candidate !== null)

  if (candidates.length === 0) {
    return fallbackAction()
  }

  candidates.sort((left, right) => {
    return right.urgency - left.urgency || left.tieBreakOrder - right.tieBreakOrder
  })

  const { category: _category, urgency: _urgency, tieBreakOrder: _tieBreakOrder, ...action } = candidates[0]

  return action
}
