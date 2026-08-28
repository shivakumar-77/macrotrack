import { KayvenIntelligenceContext } from './kayven-intelligence-context'

export const ACTION_TYPES = ['LOG_MEAL', 'NUTRITION', 'PROTEIN', 'HYDRATION', 'WORKOUT', 'RECOVERY', 'WEIGHT', 'MEAL_PLAN', 'PROGRESS', 'AI_COACH', 'NONE'] as const
export type NextActionType = typeof ACTION_TYPES[number]

export interface NextBestAction {
  actionType: NextActionType
  priority: number
  title?: string
  message?: string
  reason?: string
  suggestedAction?: string
  destination?: string
}

function round(value: number) {
  return Math.max(0, Math.round(value))
}

function isRecentWorkout(workout: Record<string, unknown>) {
  const startedAt = new Date(String(workout.started_at || ''))
  return Number.isFinite(startedAt.getTime()) && Date.now() - startedAt.getTime() <= 36 * 60 * 60 * 1000
}

export function getNextBestAction(context: KayvenIntelligenceContext): NextBestAction {
  const today = context.nutrition.today
  const goals = context.user.goals
  const caloriesRemaining = goals.calorieTarget == null ? null : goals.calorieTarget - today.calories
  const proteinRemaining = goals.proteinTargetG == null ? null : goals.proteinTargetG - today.proteinG
  const waterTarget = context.hydration.targetMl
  const recentWorkout = context.fitness.recentWorkouts.some(isRecentWorkout)

  if (!today.daysWithLogs) {
    return {
      actionType: 'LOG_MEAL', priority: 0.8, title: 'Log your next meal',
      message: 'Nothing has been logged today yet.',
      reason: 'A meal log is needed before KAYVEN can give more personalized nutrition guidance.',
      suggestedAction: 'Start with your next meal or snack.', destination: '/log'
    }
  }

  if (recentWorkout && proteinRemaining != null && proteinRemaining >= 20 && (caloriesRemaining == null || caloriesRemaining >= 150)) {
    return {
      actionType: 'RECOVERY', priority: 0.96, title: 'Fuel your recovery',
      message: `You are about ${round(proteinRemaining)}g short of your protein target after a recent workout.`,
      reason: 'A recent workout and an available protein target make recovery nutrition the most useful next step.',
      suggestedAction: caloriesRemaining == null ? 'Choose a protein-rich next meal.' : `Choose a protein-rich meal within your remaining ${round(caloriesRemaining)} calories.`,
      destination: '/log'
    }
  }

  if (proteinRemaining != null && proteinRemaining >= 25 && (caloriesRemaining == null || caloriesRemaining >= 150)) {
    return {
      actionType: 'PROTEIN', priority: 0.92, title: 'Close your protein gap',
      message: `You are about ${round(proteinRemaining)}g short of your protein target today.`,
      reason: 'Protein intake is meaningfully below the user target while there is room for more food.',
      suggestedAction: caloriesRemaining == null ? 'Log a protein-focused next meal.' : `Log a protein-focused meal within your remaining ${round(caloriesRemaining)} calories.`,
      destination: '/log'
    }
  }

  if (waterTarget != null && waterTarget > 0 && context.hydration.todayMl < waterTarget * 0.6) {
    return {
      actionType: 'HYDRATION', priority: 0.84, title: 'Top up your hydration',
      message: `You have logged ${round(context.hydration.todayMl)}ml of your ${round(waterTarget)}ml water target today.`,
      reason: 'Today’s hydration is substantially below the recorded target.',
      suggestedAction: `Drink about ${round(waterTarget - context.hydration.todayMl)}ml more today.`,
      destination: '/water'
    }
  }

  if (caloriesRemaining != null && caloriesRemaining > 200 && today.daysWithLogs > 0) {
    return {
      actionType: 'NUTRITION', priority: 0.68, title: 'Plan your next meal',
      message: `You have about ${round(caloriesRemaining)} calories remaining today.`,
      reason: 'There is meaningful room within the calorie target for another planned meal.',
      suggestedAction: 'Choose a balanced meal that fits your remaining calories.', destination: '/meal-plan'
    }
  }

  if (context.mealPlanning.currentPlan) {
    return {
      actionType: 'MEAL_PLAN', priority: 0.62, title: 'Check your meal plan',
      message: 'You have a meal plan available for today.',
      reason: 'An existing plan is a useful source of direction without creating new recommendations.',
      suggestedAction: 'Open the plan and continue with the next meal.', destination: '/meal-plan'
    }
  }

  if (context.nutrition.weeklySummary.length >= 3 && context.nutrition.macroSummary.daysWithLogs >= 3) {
    return {
      actionType: 'PROGRESS', priority: 0.45, title: 'Review your week',
      message: `You have logged nutrition on ${context.nutrition.macroSummary.daysWithLogs} recent days.`,
      reason: 'There is enough recent data to review consistency without overreacting to one day.',
      suggestedAction: 'Review your nutrition insights.', destination: '/insights'
    }
  }

  return { actionType: 'NONE', priority: 0 }
}