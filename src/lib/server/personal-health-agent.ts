import { KayvenIntelligenceContext } from './kayven-intelligence-context'
import { NextBestAction } from './next-best-action'

export type AgentStatus = 'needs_attention' | 'on_track' | 'no_action'

export interface PersonalHealthAgentState {
  generatedAt: string
  contextRange: KayvenIntelligenceContext['range']
  status: AgentStatus
  action: NextBestAction
  dataAvailable: boolean
}

function rounded(value: number) {
  return Math.max(0, Math.round(value))
}

function recentWorkout(context: KayvenIntelligenceContext) {
  return context.fitness.recentWorkouts.some(workout => {
    const startedAt = new Date(String(workout.started_at || ''))
    return Number.isFinite(startedAt.getTime()) && Date.now() - startedAt.getTime() <= 36 * 60 * 60 * 1000
  })
}

function candidateActions(context: KayvenIntelligenceContext): NextBestAction[] {
  const today = context.nutrition.today
  const goals = context.user.goals
  const calorieTarget = goals.calorieTarget
  const proteinTarget = goals.proteinTargetG
  const calorieGap = calorieTarget == null ? null : calorieTarget - today.calories
  const proteinGap = proteinTarget == null ? null : proteinTarget - today.proteinG
  const waterTarget = context.hydration.targetMl
  const waterGap = waterTarget == null ? null : waterTarget - context.hydration.todayMl
  const hour = new Date().getHours()
  const mealDates = new Set(context.nutrition.recentMeals.filter(meal => meal.date === new Date().toISOString().slice(0, 10)).map(meal => meal.mealType))
  const mealWindow = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner'
  const calorieOnTrack = calorieTarget != null && today.calories <= calorieTarget * 1.05 && today.calories >= calorieTarget * 0.75
  const proteinOnTrack = proteinTarget == null || today.proteinG >= proteinTarget * 0.85
  const waterOnTrack = waterTarget == null || context.hydration.todayMl >= waterTarget * 0.8
  const overallOnTrack = today.daysWithLogs > 0 && calorieOnTrack && proteinOnTrack && waterOnTrack
  const candidates: Array<NextBestAction & { score: number }> = []

  if (!today.daysWithLogs && !mealDates.has(mealWindow)) {
    candidates.push({ actionType:'LOG_MEAL', priority:0.9, score:0.9, title:'Log your next meal', message:'Nothing has been logged today yet.', reason:'A meal log is the clearest next step when today has no nutrition data.', suggestedAction:`Log ${mealWindow} to start today’s picture.`, destination:'/log' })
  }

  if (waterTarget != null && waterTarget > 0 && waterGap != null && waterGap > waterTarget * 0.35) {
    const urgency = Math.min(1, waterGap / waterTarget + (hour >= 16 ? 0.12 : 0))
    candidates.push({ actionType:'HYDRATION', priority:Math.min(0.95, 0.68 + urgency * 0.25), score:0.68 + urgency * 0.25, title:'Top up your hydration', message:`You have logged ${rounded(context.hydration.todayMl)}ml of your ${rounded(waterTarget)}ml water target today.`, reason:'Hydration is substantially behind the recorded target for this point in the day.', suggestedAction:`Drink about ${rounded(waterGap)}ml more today.`, destination:'/water' })
  }

  if (recentWorkout(context) && proteinGap != null && proteinGap >= 20 && (calorieGap == null || calorieGap >= 150)) {
    const score = 0.74 + Math.min(0.2, proteinGap / Math.max(proteinTarget || 1, 1) * 0.2)
    candidates.push({ actionType:'RECOVERY', priority:score, score, title:'Fuel your recovery', message:`You are about ${rounded(proteinGap)}g short of your protein target after a recent workout.`, reason:'A recent workout makes recovery nutrition more relevant than a general macro reminder.', suggestedAction:calorieGap == null ? 'Choose a protein-rich next meal.' : `Choose a protein-rich meal within your remaining ${rounded(calorieGap)} calories.`, destination:'/log' })
  }

  if (proteinGap != null && proteinGap >= 25 && (calorieGap == null || calorieGap >= 150)) {
    const hydrationPenalty = waterTarget && waterGap != null && waterGap > waterTarget * 0.35 ? 0.22 : 0
    const score = 0.56 + Math.min(0.25, proteinGap / Math.max(proteinTarget || 1, 1) * 0.35) - hydrationPenalty
    candidates.push({ actionType:'PROTEIN', priority:Math.max(0.35, score), score, title:'Close your protein gap', message:`You are about ${rounded(proteinGap)}g short of your protein target today.`, reason:'Protein is below target, but this recommendation is balanced against hydration, timing, and calorie availability.', suggestedAction:calorieGap == null ? 'Log a protein-focused next meal.' : `Log a protein-focused meal within your remaining ${rounded(calorieGap)} calories.`, destination:'/log' })
  }

  if (calorieGap != null && calorieGap > 200 && today.daysWithLogs > 0 && !overallOnTrack) {
    const score = (hour >= 17 ? 0.72 : 0.5) + Math.min(0.12, calorieGap / Math.max(calorieTarget || 1, 1) * 0.12)
    candidates.push({ actionType:'NUTRITION', priority:score, score, title:'Plan your next meal', message:`You have about ${rounded(calorieGap)} calories remaining today.`, reason:'There is meaningful room for a planned meal, with timing considered.', suggestedAction:'Choose a balanced meal that fits your remaining calories.', destination:'/meal-plan' })
  }

  if (context.mealPlanning.currentPlan && hour >= 11) {
    candidates.push({ actionType:'MEAL_PLAN', priority:0.57, score:0.57, title:'Check your meal plan', message:'You have a meal plan available for today.', reason:'An existing plan can guide the next meal without inventing new nutrition data.', suggestedAction:'Open the plan and continue with the next meal.', destination:'/meal-plan' })
  }

  const trend = context.body.weightTrendKg
  const goal = String(goals.goal || '').toLowerCase()
  const trendSupportsGoal = trend != null && ((goal === 'lose' && trend < -0.2) || (goal === 'gain' && trend > 0.2) || (goal !== 'lose' && goal !== 'gain' && Math.abs(trend) <= 0.4))
  if (context.body.weights.length >= 2 && trendSupportsGoal) {
    candidates.push({ actionType:'PROGRESS', priority:0.48, score:0.48, title:'You are moving in the right direction', message:`Your recent weight trend is ${trend > 0 ? 'up' : 'down'} ${rounded(Math.abs(trend) * 10) / 10}kg, aligned with your ${goal || 'current'} goal.`, reason:'The available 30-day weight trend supports the user’s stated direction.', suggestedAction:'Keep the habits that are working.', destination:'/insights' })
  }

  if (overallOnTrack && !recentWorkout(context)) {
    candidates.push({ actionType:'PROGRESS', priority:0.4, score:0.4, title:'You are on track today', message:'Your logged nutrition and hydration are tracking well against your targets.', reason:'Current data does not show a meaningful gap that needs correcting.', suggestedAction:'Keep the consistency going.', destination:'/insights' })
  }

  return candidates.sort((left, right) => right.score - left.score).map(({ score: _score, ...candidate }) => candidate)
}

export function getPersonalHealthAgentState(context: KayvenIntelligenceContext): PersonalHealthAgentState {
  const action = candidateActions(context)[0] || { actionType:'NONE', priority:0 }
  const dataAvailable = Boolean(
    context.user.profile ||
    context.nutrition.macroSummary.daysWithLogs ||
    context.body.weights.length ||
    context.fitness.recentWorkouts.length
  )

  return {
    generatedAt: new Date().toISOString(),
    contextRange: context.range,
    status: action.actionType === 'NONE' ? (dataAvailable ? 'on_track' : 'no_action') : 'needs_attention',
    action,
    dataAvailable
  }
}