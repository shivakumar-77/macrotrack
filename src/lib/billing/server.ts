import { getAIRequestLimit, getUserEntitlements, planFromSubscription, type Entitlements, type EntitlementId } from './entitlements'
import { DEFAULT_PLAN_ID, getPlanConfig, type PlanConfig } from './plans'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'

export interface UserSubscription {
  id?: string
  user_id: string
  provider: string
  provider_customer_id?: string | null
  provider_subscription_id?: string | null
  plan_id: string
  status: SubscriptionStatus
  current_period_start?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean
  created_at?: string
  updated_at?: string
}

export interface AIUsage {
  user_id: string
  period_start: string
  period_end: string
  request_count: number
  input_tokens: number
  output_tokens: number
  estimated_cost: number
}

export interface BillingState {
  subscription: UserSubscription | null
  plan: PlanConfig
  entitlements: Entitlements
  usage: AIUsage
  aiLimit: number | null
}

export interface EntitlementCheck {
  allowed: boolean
  state: BillingState
  requiredPlan: 'premium' | 'pro' | null
}

export function entitlementDeniedPayload(check: EntitlementCheck) {
  return {
    error: 'FEATURE_NOT_AVAILABLE' as const,
    message: 'This feature is not included in your current plan.',
    requiredPlan: check.requiredPlan || 'premium',
  }
}

export function requiredPlanForFeature(feature: EntitlementId): 'premium' | 'pro' | null {
  if (feature === 'advanced_ai_coach' || feature === 'workout_planning' || feature === 'health_insights') return 'pro'
  if (feature === 'advanced_meal_planning' || feature === 'advanced_progress') return 'premium'
  return null
}

export function suggestedUpgradePlan(planId: string): 'premium' | 'pro' | null {
  if (planId === 'free') return 'premium'
  if (planId === 'premium') return 'pro'
  return null
}

function periodBounds(now = new Date()): { start: string; end: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

function freeUsage(userId: string): AIUsage {
  const bounds = periodBounds()
  return {
    user_id: userId,
    period_start: bounds.start,
    period_end: bounds.end,
    request_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    estimated_cost: 0,
  }
}

export function isDevelopmentOverrideAllowed(
  userId: string,
  environment = process.env.NODE_ENV,
  configuredPlan = process.env.KAYVEN_DEV_PLAN,
  configuredUserId = process.env.KAYVEN_DEV_USER_ID,
): boolean {
  return environment !== 'production'
    && Boolean(configuredPlan)
    && configuredUserId === userId
}

export async function getUserSubscription(supabase: any, userId: string): Promise<UserSubscription | null> {
  const developmentPlan = process.env.KAYVEN_DEV_PLAN
  if (developmentPlan && isDevelopmentOverrideAllowed(userId)) {
    return {
      user_id: userId,
      provider: 'development',
      plan_id: developmentPlan,
      status: 'active',
    }
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data as UserSubscription
  } catch {
    return null
  }
}

export async function getAIUsage(supabase: any, userId: string): Promise<AIUsage> {
  const bounds = periodBounds()

  try {
    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', bounds.start)
      .maybeSingle()

    if (error || !data) return freeUsage(userId)
    return data as AIUsage
  } catch {
    return freeUsage(userId)
  }
}

export async function getBillingState(supabase: any, userId: string): Promise<BillingState> {
  const subscription = await getUserSubscription(supabase, userId)
  const plan = planFromSubscription(subscription) || getPlanConfig(DEFAULT_PLAN_ID)
  const entitlements = getUserEntitlements(subscription)
  const usage = await getAIUsage(supabase, userId)

  return {
    subscription,
    plan,
    entitlements,
    usage,
    aiLimit: getAIRequestLimit(entitlements),
  }
}

export async function canUseFeature(supabase: any, userId: string, feature: EntitlementId): Promise<boolean> {
  return (await requireEntitlement(supabase, userId, feature)).allowed
}

export async function requireEntitlement(supabase: any, userId: string, feature: EntitlementId): Promise<EntitlementCheck> {
  const state = await getBillingState(supabase, userId)
  const value = state.entitlements[feature]
  const allowed = typeof value === 'boolean' ? value : value.enabled
  return { allowed, state, requiredPlan: allowed ? null : requiredPlanForFeature(feature) }
}

export async function canUseAI(supabase: any, userId: string): Promise<{ allowed: boolean; usage: AIUsage; limit: number | null; planId: string }> {
  const state = await getBillingState(supabase, userId)
  const allowed = state.aiLimit === null || state.usage.request_count < state.aiLimit
  return { allowed, usage: state.usage, limit: state.aiLimit, planId: state.plan.id }
}

export async function recordAIUsage(
  supabase: any,
  userId: string,
  usage: { inputTokens?: number; outputTokens?: number; estimatedCost?: number } = {},
): Promise<boolean> {
  const bounds = periodBounds()

  try {
    const { error } = await supabase.rpc('record_ai_usage', {
      p_period_start: bounds.start,
      p_period_end: bounds.end,
      p_input_tokens: Math.max(0, Math.round(usage.inputTokens || 0)),
      p_output_tokens: Math.max(0, Math.round(usage.outputTokens || 0)),
      p_estimated_cost: Math.max(0, Number(usage.estimatedCost || 0)),
    })

    return !error
  } catch {
    return false
  }
}
