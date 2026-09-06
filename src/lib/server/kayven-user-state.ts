/**
 * KAYVEN USER STATE ENGINE
 *
 * Converts existing user intelligence context into a compact,
 * deterministic representation of the user's current state.
 *
 * This module:
 * - does not call external AI
 * - does not write to the database
 * - does not modify user data
 * - is safe to run on every coach request
 */

export type KayvenStatus =
  | 'unknown'
  | 'very_low'
  | 'low'
  | 'behind'
  | 'on_track'
  | 'near_target'
  | 'target_reached'
  | 'over_target'

export type KayvenPriority =
  | 'nutrition'
  | 'protein'
  | 'hydration'
  | 'activity'
  | 'workout'
  | 'weight_progress'

type WeightProgressStatus =
  | 'unknown'
  | 'at_goal'
  | 'progressing'
  | 'needs_attention'

type WeightDirection = 'lose' | 'gain' | 'maintain' | 'unknown'

type WeightPoint = {
  valueKg: number
  recordedAt: string | null
}

type WeightTrend = {
  trendKg: number | null
  hasSufficientHistory: boolean
}

/*
 * Weight can fluctuate naturally from day to day. These thresholds require
 * a meaningful change over a meaningful period before assigning a trend.
 */
const AT_GOAL_DISTANCE_KG = 0.5
const MEANINGFUL_WEIGHT_CHANGE_KG = 0.5
const MIN_WEIGHT_TREND_DURATION_DAYS = 14
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export interface KayvenMetricState {
  current: number | null
  target: number | null
  remaining: number | null
  percentage: number | null
  status: KayvenStatus
}

export interface KayvenUserState {
  generatedAt: string

  primaryGoal: string | null

  nutrition: {
    calories: KayvenMetricState
    protein: KayvenMetricState
    carbs: KayvenMetricState
    fat: KayvenMetricState
    fiber: KayvenMetricState
  }

  hydration: KayvenMetricState

  activity: {
    steps: KayvenMetricState
  }

  workout: {
    status: 'unknown' | 'pending' | 'completed'
    recentWorkoutCount: number
  }

  weight: {
    currentKg: number | null
    goalKg: number | null
    remainingKg: number | null
    progressStatus: WeightProgressStatus
    direction?: WeightDirection
    trendKg?: number | null
    dataPointCount?: number
  }

  topPriorities: KayvenPriority[]

  summary: string[]
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function positiveNumberOrNull(value: unknown): number | null {
  const number = numberOrNull(value)

  return number !== null && number > 0 ? number : null
}

function createMetricState(
  currentValue: unknown,
  targetValue: unknown,
  options?: {
    lowerIsBetter?: boolean
  }
): KayvenMetricState {
  const current = numberOrNull(currentValue)
  const target = numberOrNull(targetValue)

  if (current === null || target === null || target <= 0) {
    return {
      current,
      target,
      remaining: null,
      percentage: null,
      status: 'unknown',
    }
  }

  const percentage = (current / target) * 100
  const remaining = target - current

  const lowerIsBetter = options?.lowerIsBetter === true

  let status: KayvenStatus

  if (lowerIsBetter) {
    if (percentage <= 90) {
      status = 'on_track'
    } else if (percentage <= 100) {
      status = 'near_target'
    } else {
      status = 'over_target'
    }
  } else {
    if (percentage < 25) {
      status = 'very_low'
    } else if (percentage < 50) {
      status = 'low'
    } else if (percentage < 80) {
      status = 'behind'
    } else if (percentage < 100) {
      status = 'on_track'
    } else if (percentage <= 110) {
      status = 'target_reached'
    } else {
      status = 'over_target'
    }
  }

  return {
    current,
    target,
    remaining,
    percentage: Math.round(percentage * 10) / 10,
    status,
  }
}

/**
 * Safely searches multiple possible paths because the existing
 * KAYVEN context structure may evolve between modules.
 */
function getValue(
  object: Record<string, any>,
  paths: string[]
): unknown {
  for (const path of paths) {
    const parts = path.split('.')

    let value: any = object

    for (const part of parts) {
      if (
        value === null ||
        value === undefined ||
        typeof value !== 'object'
      ) {
        value = undefined
        break
      }

      value = value[part]
    }

    if (value !== undefined && value !== null) {
      return value
    }
  }

  return null
}

function getArrayLength(
  object: Record<string, any>,
  paths: string[]
): number {
  const value = getValue(object, paths)

  return Array.isArray(value) ? value.length : 0
}

function validRecordedAt(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeWeightHistory(value: unknown): WeightPoint[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.reduce<WeightPoint[]>((points, entry) => {
    if (entry === null || typeof entry !== 'object') {
      return points
    }

    const record = entry as Record<string, unknown>
    const valueKg = positiveNumberOrNull(record.weightKg)

    if (valueKg === null) {
      return points
    }

    points.push({
      valueKg,
      recordedAt: validRecordedAt(record.date),
    })

    return points
  }, [])
}

function determineWeightDirection(
  currentWeightKg: number | null,
  goalWeightKg: number | null
): WeightDirection {
  if (currentWeightKg === null || goalWeightKg === null) {
    return 'unknown'
  }

  if (Math.abs(currentWeightKg - goalWeightKg) < AT_GOAL_DISTANCE_KG) {
    return 'maintain'
  }

  return currentWeightKg > goalWeightKg ? 'lose' : 'gain'
}

function calculateWeightTrend(history: WeightPoint[]): WeightTrend {
  const datedHistory = history
    .filter((point): point is WeightPoint & { recordedAt: string } => {
      return point.recordedAt !== null
    })
    .sort((a, b) => {
      return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    })

  if (datedHistory.length < 2) {
    return { trendKg: null, hasSufficientHistory: false }
  }

  const oldestTime = new Date(datedHistory[0].recordedAt).getTime()
  const newestTime = new Date(datedHistory[datedHistory.length - 1].recordedAt).getTime()
  const durationDays = (newestTime - oldestTime) / MILLISECONDS_PER_DAY

  if (durationDays < MIN_WEIGHT_TREND_DURATION_DAYS) {
    return { trendKg: null, hasSufficientHistory: false }
  }

  const midpoint = oldestTime + (newestTime - oldestTime) / 2
  const olderPoints = datedHistory.filter(point => {
    return new Date(point.recordedAt).getTime() <= midpoint
  })
  const recentPoints = datedHistory.filter(point => {
    return new Date(point.recordedAt).getTime() > midpoint
  })

  if (olderPoints.length === 0 || recentPoints.length === 0) {
    return { trendKg: null, hasSufficientHistory: false }
  }

  const average = (points: WeightPoint[]) => {
    return points.reduce((total, point) => total + point.valueKg, 0) / points.length
  }
  const trendKg = average(recentPoints) - average(olderPoints)

  return { trendKg, hasSufficientHistory: true }
}

function determineWeightProgressStatus(
  direction: WeightDirection,
  trend: WeightTrend
): WeightProgressStatus {
  if (direction === 'unknown') {
    return 'unknown'
  }

  if (direction === 'maintain') {
    return 'at_goal'
  }

  if (!trend.hasSufficientHistory || trend.trendKg === null) {
    return 'unknown'
  }

  const movementTowardGoal = direction === 'lose'
    ? -trend.trendKg
    : trend.trendKg

  if (movementTowardGoal >= MEANINGFUL_WEIGHT_CHANGE_KG) {
    return 'progressing'
  }

  if (movementTowardGoal <= -MEANINGFUL_WEIGHT_CHANGE_KG) {
    return 'needs_attention'
  }

  return 'needs_attention'
}

export function buildKayvenUserState(
  context: Record<string, any>
): KayvenUserState {
  const primaryGoal =
    getValue(context, [
      'user.goals.goal',
      'goals.goal',
      'user.goal',
      'profile.goal',
    ]) as string | null

  /*
   * NUTRITION
   */

  const caloriesCurrent = getValue(context, [
    'nutrition.today.calories',
    'nutrition.today.totalCalories',
    'nutrition.today.summary.calories',
  ])

  const caloriesTarget = getValue(context, [
    'user.goals.calorieTarget',
    'nutrition.calorieTarget',
    'goals.calorieTarget',
    'user.calorieTarget',
    'profile.calorieTarget',
  ])

  const proteinCurrent = getValue(context, [
    'nutrition.today.proteinG',
    'nutrition.today.protein',
    'nutrition.today.totalProtein',
    'nutrition.today.summary.protein',
  ])

  const proteinTarget = getValue(context, [
    'user.goals.proteinTargetG',
    'nutrition.proteinTarget',
    'goals.proteinTargetG',
    'user.proteinTarget',
    'profile.proteinTarget',
  ])

  const carbsCurrent = getValue(context, [
    'nutrition.today.carbsG',
    'nutrition.today.carbs',
    'nutrition.today.totalCarbs',
    'nutrition.today.summary.carbs',
  ])

  const carbsTarget = getValue(context, [
    'user.goals.carbTargetG',
    'goals.carbTargetG',
    'nutrition.carbTarget',
    'profile.carbTarget',
  ])

  const fatCurrent = getValue(context, [
    'nutrition.today.fatG',
    'nutrition.today.fat',
    'nutrition.today.totalFat',
    'nutrition.today.summary.fat',
  ])

  const fatTarget = getValue(context, [
    'user.goals.fatTargetG',
    'goals.fatTargetG',
    'nutrition.fatTarget',
    'profile.fatTarget',
  ])

  const fiberCurrent = getValue(context, [
    'nutrition.today.fiberG',
    'nutrition.today.fiber',
    'nutrition.today.totalFiber',
    'nutrition.today.summary.fiber',
  ])

  const fiberTarget = getValue(context, [
    'user.goals.fiberTargetG',
    'goals.fiberTargetG',
    'nutrition.fiberTarget',
    'profile.fiberTarget',
  ])

  /*
   * HYDRATION
   */

  const waterCurrent = getValue(context, [
    'hydration.todayMl',
    'hydration.today',
    'hydration.currentMl',
  ])

  const waterTarget = getValue(context, [
    'hydration.targetMl',
    'goals.waterGoal',
    'profile.waterGoal',
  ])

  /*
   * ACTIVITY
   *
   * Steps may not yet exist in the current KAYVEN schema.
   * This safely remains unknown until connected.
   */

  const stepsCurrent = getValue(context, [
    'activity.steps.today',
    'activity.todaySteps',
    'steps.today',
  ])

  const stepsTarget = getValue(context, [
    'activity.steps.target',
    'activity.stepTarget',
    'goals.stepTarget',
  ])

  /*
   * WORKOUT
   */

  const recentWorkoutCount = getArrayLength(context, [
    'fitness.recentWorkouts',
    'fitness.workouts',
  ])

  const workoutCompletedToday = Boolean(
    getValue(context, [
      'fitness.todayWorkout.completed',
      'fitness.workoutToday.completed',
    ])
  )

  let workoutStatus: KayvenUserState['workout']['status'] = 'unknown'

  if (getValue(context, [
    'fitness.todayWorkout',
    'fitness.workoutToday',
  ])) {
    workoutStatus = workoutCompletedToday
      ? 'completed'
      : 'pending'
  }

  /*
   * WEIGHT
   */

  const currentWeightKg = positiveNumberOrNull(
    getValue(context, [
      'body.currentWeightKg',
      'body.currentWeight',
      'weight.currentKg',
    ])
  )

  const goalWeightKg = positiveNumberOrNull(
    getValue(context, [
      'user.goals.weightGoalKg',
      'goals.weightGoalKg',
      'body.goalWeightKg',
      'profile.goalWeightKg',
    ])
  )

  let remainingWeightKg: number | null = null

  const weightHistory = normalizeWeightHistory(
    getValue(context, [
      'body.weights',
    ])
  )
  const weightDirection = determineWeightDirection(
    currentWeightKg,
    goalWeightKg
  )
  const weightTrend = calculateWeightTrend(weightHistory)
  const weightProgressStatus = determineWeightProgressStatus(
    weightDirection,
    weightTrend
  )

  if (
    currentWeightKg !== null &&
    goalWeightKg !== null
  ) {
    remainingWeightKg = Math.abs(
      currentWeightKg - goalWeightKg
    )

  }

  /*
   * BUILD METRIC STATES
   */

  const nutrition = {
    calories: createMetricState(
      caloriesCurrent,
      caloriesTarget
    ),

    protein: createMetricState(
      proteinCurrent,
      proteinTarget
    ),

    carbs: createMetricState(
      carbsCurrent,
      carbsTarget
    ),

    fat: createMetricState(
      fatCurrent,
      fatTarget,
      { lowerIsBetter: true }
    ),

    fiber: createMetricState(
      fiberCurrent,
      fiberTarget
    ),
  }

  const hydration = createMetricState(
    waterCurrent,
    waterTarget
  )

  const activity = {
    steps: createMetricState(
      stepsCurrent,
      stepsTarget
    ),
  }

  /*
   * PRIORITY ENGINE
   *
   * Rank the most important gaps.
   */

  const priorities: KayvenPriority[] = []

  if (
    nutrition.protein.status === 'very_low' ||
    nutrition.protein.status === 'low'
  ) {
    priorities.push('protein')
  }

  if (
    nutrition.calories.status === 'very_low' ||
    nutrition.calories.status === 'low'
  ) {
    priorities.push('nutrition')
  }

  if (
    hydration.status === 'very_low' ||
    hydration.status === 'low'
  ) {
    priorities.push('hydration')
  }

  if (
    activity.steps.status === 'very_low' ||
    activity.steps.status === 'low'
  ) {
    priorities.push('activity')
  }

  if (workoutStatus === 'pending') {
    priorities.push('workout')
  }

  if (weightProgressStatus === 'needs_attention') {
    priorities.push('weight_progress')
  }

  /*
   * HUMAN-READABLE SUMMARY
   */

  const summary: string[] = []

  if (primaryGoal) {
    summary.push(`Primary goal: ${primaryGoal}`)
  }

  if (
    nutrition.protein.current !== null &&
    nutrition.protein.target !== null
  ) {
    summary.push(
      `Protein: ${nutrition.protein.current}g / ${nutrition.protein.target}g`
    )
  }

  if (
    nutrition.calories.current !== null &&
    nutrition.calories.target !== null
  ) {
    summary.push(
      `Calories: ${nutrition.calories.current} / ${nutrition.calories.target}`
    )
  }

  if (
    hydration.current !== null &&
    hydration.target !== null
  ) {
    summary.push(
      `Water: ${hydration.current}ml / ${hydration.target}ml`
    )
  }

  if (currentWeightKg !== null) {
    summary.push(
      `Current weight: ${currentWeightKg}kg`
    )
  }

  if (weightTrend.hasSufficientHistory) {
    if (weightProgressStatus === 'at_goal') {
      summary.push('Weight is at your goal.')
    } else if (weightProgressStatus === 'progressing') {
      summary.push('Weight is moving toward your goal.')
    } else if (weightProgressStatus === 'needs_attention') {
      const movementTowardGoal = weightDirection === 'lose'
        ? -(weightTrend.trendKg ?? 0)
        : weightTrend.trendKg ?? 0

      summary.push(
        movementTowardGoal <= -MEANINGFUL_WEIGHT_CHANGE_KG
          ? 'Recent weight trend is moving away from your goal.'
          : 'Weight has not changed meaningfully in the recent tracked period.'
      )
    }
  }

  return {
    generatedAt: new Date().toISOString(),

    primaryGoal,

    nutrition,

    hydration,

    activity,

    workout: {
      status: workoutStatus,
      recentWorkoutCount,
    },

    weight: {
      currentKg: currentWeightKg,
      goalKg: goalWeightKg,
      remainingKg: remainingWeightKg,
      progressStatus: weightProgressStatus,
      direction: weightDirection,
      trendKg: weightTrend.trendKg,
      dataPointCount: weightHistory.length,
    },

    topPriorities: priorities.slice(0, 3),

    summary,
  }
}
