import type {
  KAYVENAIRequest,
  KAYVENAIResponse,
  KAYVENIntent,
  KAYVENMemory,
  KAYVENSafetyDecision,
  KAYVENTool,
} from './kayven-ai'

function numberValue(value: unknown): number | null {
  const valueNumber = Number(value)
  return Number.isFinite(valueNumber) ? valueNumber : null
}

function formatNumber(value: number | null, decimals = 0): string {
  if (value === null || !Number.isFinite(value)) return 'not available'
  return value.toFixed(decimals)
}

export function classifyKayvenIntent(message: string): KAYVENIntent {
  const text = message.toLowerCase()

  if (/emergency|chest pain|shortness of breath|stroke|faint|severe bleeding|suicid|hospital|urgent/i.test(text)) {
    return 'emergency_high_risk_health_question'
  }

  if (/account|login|sign in|logout|profile|settings|password|email|bug|app question|help/i.test(text)) {
    return 'account_app_question'
  }

  if (/weight loss|lose weight|losing weight|fat loss|cutting|cut|lean|slim/i.test(text)) {
    return 'weight_loss_question'
  }

  if (/meal plan|meal planning|diet plan|breakfast|lunch|dinner|snack/i.test(text)) {
    return 'meal_planning'
  }

  if (/workout|training|exercise|bench|squat|deadlift|cardio|session|gym/i.test(text)) {
    return 'workout_question'
  }

  if (/progress|trend|streak|weekly|monthly|month|results|improvement|weight change/i.test(text)) {
    return 'progress_question'
  }

  if (/hydrate|water|hydration|fluid/i.test(text)) {
    return 'hydration'
  }

  if (/supplement|protein powder|creatine|vitamin|multivitamin/i.test(text)) {
    return 'supplements'
  }

  if (/steps|activity|walking|movement/i.test(text)) {
    return 'activity_steps'
  }

  if (/nutrition|protein|carbs|calories|macro|food|meal|eat/i.test(text)) {
    return 'nutrition_question'
  }

  if (/health|wellness|body|symptom|condition/i.test(text)) {
    return 'health_information_question'
  }

  return 'general_conversation'
}

export function getKAYVENSystemPrompt(): string {
  return `KAYVEN uses a local intelligence system built from intent classification, safety rules, user context, deterministic calculations, and Supabase data. KAYVEN never invents user data and only uses information available in the current request context.`
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

  const goal = (context as any)?.user?.goals?.goal
  const calorieTarget = (context as any)?.user?.goals?.calorieTarget
  const proteinTarget = (context as any)?.user?.goals?.proteinTargetG

  if (goal) keySignals.push(`Goal: ${goal}`)
  if (typeof calorieTarget === 'number') keySignals.push(`Calorie target: ${calorieTarget} kcal`)
  if (typeof proteinTarget === 'number') keySignals.push(`Protein target: ${proteinTarget} g`)

  return {
    shortTerm: {
      recentMessages: [],
      summary: 'Current conversation context is active.'
    },
    longTerm: {
      profile,
      nutrition,
      fitness,
      body,
      preferences,
      mealPlan,
      supplements
    },
    keySignals
  }
}

export function evaluateKayvenSafety(
  message: string,
  context?: Record<string, unknown>
): KAYVENSafetyDecision {
  const text = message.toLowerCase()

  if (/emergency|chest pain|shortness of breath|stroke|faint|severe bleeding|suicid/i.test(text)) {
    return {
      status: 'escalate',
      reasons: ['High-risk health concern detected'],
      restrictions: ['Do not diagnose or provide treatment instructions'],
      shouldEscalate: true
    }
  }

  if (/diagnose|cure|treat|stop medication|increase medication|replace doctor/i.test(text)) {
    return {
      status: 'constrained',
      reasons: ['Medical treatment request detected'],
      restrictions: ['Provide general wellness information only'],
      shouldEscalate: false
    }
  }

  return {
    status: 'allowed',
    reasons: ['Routine nutrition or fitness request'],
    restrictions: ['Use actual KAYVEN data and avoid assumptions'],
    shouldEscalate: false
  }
}

export function getDefaultReadTools(): KAYVENTool[] {
  return [
    {
      name: 'getUserProfile',
      description: 'Read user profile and goals.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    },
    {
      name: 'getNutrition',
      description: 'Read nutrition logs and targets.',
      inputSchema: {
        type: 'object',
        properties: {
          range: {
            type: 'string',
            enum: ['today', '7d', '30d']
          }
        }
      },
      permission: 'read'
    },
    {
      name: 'getProgress',
      description: 'Read weight and progress information.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    },
    {
      name: 'getWorkout',
      description: 'Read workout information.',
      inputSchema: { type: 'object', properties: {} },
      permission: 'read'
    }
  ]
}

export function buildKAYVENPrompt(request: KAYVENAIRequest): string {
  return JSON.stringify({
    intent: request.intent,
    message: request.message,
    context: request.context
  })
}

export async function attemptDeterministicToolResponse(
  request: KAYVENAIRequest,
  supabase: any
): Promise<KAYVENAIResponse | null> {
  const { decideTool } = await import('./kayven-tools')
  const { executeSafeTool } = await import('./kayven-tool-executor')

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

  return {
    text: formatToolResponseAsText(decision.tool, toolResult.data),
    safetyStatus: 'allowed',
    provider: {
      name: 'custom',
      model: 'kayven-deterministic'
    },
    metadata: {
      usedAI: false,
      toolUsed: decision.tool,
      intent: request.intent,
      executionPath: 'deterministic_tool'
    }
  }
}

export async function attemptLocalIntelligenceResponse(
  request: KAYVENAIRequest
): Promise<KAYVENAIResponse> {
  const context: any = request.context
  const message = request.message.trim()
  const intent = request.intent

  const goals = context?.user?.goals || {}
  const nutrition = context?.nutrition || {}
  const body = context?.body || {}
  const hydration = context?.hydration || {}
  const fitness = context?.fitness || {}
  const supplements = context?.supplements || {}

  const currentWeight = numberValue(body.currentWeightKg)
  const weightGoal = numberValue(goals.weightGoalKg)
  const calorieTarget = numberValue(goals.calorieTarget)
  const proteinTarget = numberValue(goals.proteinTargetG)
  const currentCalories = numberValue(nutrition?.today?.calories) ?? 0
  const currentProtein = numberValue(nutrition?.today?.proteinG) ?? 0
  const currentWater = numberValue(hydration.todayMl) ?? 0
  const waterTarget = numberValue(hydration.targetMl)
  const weightTrend = numberValue(body.weightTrendKg)

  let text = ''
  let suggestedActions: string[] = []

  if (intent === 'emergency_high_risk_health_question') {
    text = `This could be serious. Please seek urgent medical care or contact your local emergency service now. KAYVEN cannot safely assess or diagnose an emergency through chat.`
  }

  else if (intent === 'nutrition_question') {
    const asksProtein = /protein/i.test(message)

    if (asksProtein) {
      if (proteinTarget !== null) {
        text =
          `Your current KAYVEN protein target is ${formatNumber(proteinTarget)} g per day. ` +
          `Today you have logged ${formatNumber(currentProtein, 1)} g. ` +
          `That leaves approximately ${formatNumber(Math.max(0, proteinTarget - currentProtein), 1)} g remaining.`
      } else if (weightGoal !== null) {
        const minimum = Math.round(weightGoal * 1.6)
        const maximum = Math.round(weightGoal * 2.2)
        const practical = Math.round((minimum + maximum) / 2)

        text =
          `Using your goal weight of ${formatNumber(weightGoal, 1)} kg as a practical reference, ` +
          `a general protein range is approximately ${minimum}–${maximum} g per day. ` +
          `A practical starting target is around ${practical} g per day.`
      } else {
        text =
          `I can calculate a more personalized protein target, but I need your current weight or goal weight in your KAYVEN profile.`
      }

      suggestedActions = ['Check protein target', 'Log your next meal']
    }

    else if (calorieTarget !== null) {
      const remaining = Math.max(0, calorieTarget - currentCalories)

      text =
        `Today you have logged ${formatNumber(currentCalories)} kcal out of your ${formatNumber(calorieTarget)} kcal target. ` +
        `${formatNumber(remaining)} kcal remain based on your current target. ` +
        `You have also logged ${formatNumber(currentProtein, 1)} g of protein.`

      suggestedActions = ['Log your next meal', 'Check daily nutrition']
    }

    else {
      text =
        `I can analyse your nutrition from your logged meals. Your calorie or macro targets are not fully available yet, so I will not invent a target.`
    }
  }

  else if (intent === 'hydration') {
    if (waterTarget !== null && waterTarget > 0) {
      const remaining = Math.max(0, waterTarget - currentWater)
      const percentage = Math.min(100, Math.round((currentWater / waterTarget) * 100))

      text =
        `Today you have logged ${formatNumber(currentWater)} ml of water out of your ${formatNumber(waterTarget)} ml target. ` +
        `${formatNumber(remaining)} ml remain, and you are at approximately ${percentage}% of your target.`

      suggestedActions = ['Log water', 'Check hydration target']
    } else {
      text =
        `You have logged ${formatNumber(currentWater)} ml of water today. Your KAYVEN hydration target is not set, so I will not assume one.`
    }
  }

  else if (intent === 'progress_question') {
    if (currentWeight !== null) {
      const trendText =
        weightTrend === null
          ? 'There is not enough weight history yet to calculate a trend.'
          : weightTrend < 0
            ? `Your recorded trend over this period is down ${formatNumber(Math.abs(weightTrend), 1)} kg.`
            : weightTrend > 0
              ? `Your recorded trend over this period is up ${formatNumber(weightTrend, 1)} kg.`
              : `Your recorded weight trend is currently stable.`

      text =
        `Your latest recorded weight is ${formatNumber(currentWeight, 1)} kg. ${trendText}`

      if (weightGoal !== null) {
        text += ` Your goal weight is ${formatNumber(weightGoal, 1)} kg.`
      }

      suggestedActions = ['Check weight progress', 'Log weight']
    } else {
      text = `I don't have a current weight entry available in your KAYVEN data yet. Log your weight to start tracking progress.`
    }
  }

  else if (intent === 'workout_question') {
    const frequency = numberValue(fitness.workoutFrequency) ?? 0

    text =
      frequency > 0
        ? `You have recorded workouts on ${formatNumber(frequency)} day${frequency === 1 ? '' : 's'} in the current KAYVEN context period.`
        : `I don't see recent workout data in the current context yet.`

    suggestedActions = ['Log workout', 'Check workout history']
  }

  else if (intent === 'weight_loss_question') {
    if (currentWeight !== null && weightGoal !== null) {
      const difference = currentWeight - weightGoal

      text =
        difference > 0
          ? `Your current recorded weight is ${formatNumber(currentWeight, 1)} kg and your goal is ${formatNumber(weightGoal, 1)} kg. ` +
            `That is ${formatNumber(difference, 1)} kg above your current goal. We can focus on consistent nutrition, activity, and progress tracking rather than chasing extreme changes.`
          : `Your latest recorded weight is ${formatNumber(currentWeight, 1)} kg and your goal is ${formatNumber(weightGoal, 1)} kg.`
    } else {
      text =
        `I can personalise your fat-loss guidance, but I need both your current weight and goal weight recorded in KAYVEN.`
    }

    suggestedActions = ['Check weight progress', 'Review calorie target']
  }

  else if (intent === 'supplements') {
    const items = Array.isArray(supplements.currentItems)
      ? supplements.currentItems
      : []

    if (items.length > 0) {
      const names = items
        .slice(0, 6)
        .map((item: any) => String(item.name || item.supplement_name || 'Supplement'))
        .join(', ')

      text = `You currently have ${items.length} active supplement${items.length === 1 ? '' : 's'} in KAYVEN: ${names}.`
    } else {
      text = `I don't see any active supplements recorded in your KAYVEN data.`
    }

    suggestedActions = ['Review supplements']
  }

  else {
    const recentUserMessage = request.conversationHistory
      .slice()
      .reverse()
      .find(item => item.role === 'user' && item.content !== message)

    if (/^(yes|yeah|yep|ok|okay|sure)$/i.test(message) && recentUserMessage) {
      text =
        `Got it. Based on what we were discussing, tell me what you want to check next and I can use your logged KAYVEN data for nutrition, protein, weight progress, hydration, or workouts.`
    } else {
      text =
        `I'm KAYVEN, your nutrition and fitness intelligence system. I can analyse your logged nutrition, protein, calories, weight progress, hydration, workouts, supplements, and goals using your actual KAYVEN data.`
    }

    suggestedActions = [
      'Check today’s nutrition',
      'Check protein target'
    ]
  }

  return {
    text,
    suggestedActions,
    safetyStatus: 'allowed',
    provider: {
      name: 'custom',
      model: 'kayven-local-intelligence'
    },
    metadata: {
      usedAI: false,
      provider: 'custom',
      intent: request.intent,
      executionPath: 'local_intelligence'
    }
  }
}

function formatToolResponseAsText(
  toolName: string,
  data: unknown
): string {
  const toolData = (data || {}) as Record<string, any>

  switch (toolName) {
    case 'get_user_profile': {
      const targets = toolData.targets || {}

      return `Your fitness goal is ${toolData.goal || 'not set'}. ` +
        `Targets: ${targets.calories ?? 'not set'} kcal and ${targets.protein_g ?? 'not set'} g protein.`
    }

    case 'get_today_nutrition': {
      const mealsLogged = numberValue(toolData.meals_logged) ?? 0

      return `You've logged ${mealsLogged} meals today with ` +
        `${toolData.calories ?? 0} calories, ` +
        `${toolData.protein_g ?? 0} g protein, ` +
        `${toolData.carbs_g ?? 0} g carbs, and ` +
        `${toolData.fat_g ?? 0} g fat.`
    }

    case 'get_weight_progress': {
      return `Your current recorded weight is ${toolData.current_weight_kg ?? 'not available'} kg.`
    }

    case 'get_hydration': {
      return `You've consumed ${toolData.consumed_ml ?? 0} ml of ` +
        `${toolData.target_ml ?? 'your target'} ml water today. ` +
        `${toolData.remaining_ml ?? 0} ml remain.`
    }

    default:
      return 'Your KAYVEN data was retrieved successfully.'
  }
}
