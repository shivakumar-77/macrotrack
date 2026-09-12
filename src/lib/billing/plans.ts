export type PlanId = 'free' | 'premium' | 'pro'
export type BillingInterval = 'month' | 'year' | null

export interface PlanConfig {
  id: PlanId
  displayName: string
  description: string
  active: boolean
  billingInterval: BillingInterval
  providerProductIds: {
    revenuecat?: string
    stripe?: string
  }
  aiRequestsPerPeriod: number | null
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    displayName: 'Free',
    description: 'Core nutrition, fitness, and tracking features.',
    active: true,
    billingInterval: null,
    providerProductIds: {},
    aiRequestsPerPeriod: 10,
  },
  premium: {
    id: 'premium',
    displayName: 'Premium',
    description: 'Expanded AI Coach and advanced health intelligence.',
    active: false,
    billingInterval: 'month',
    providerProductIds: {},
    aiRequestsPerPeriod: 100,
  },
  pro: {
    id: 'pro',
    displayName: 'Pro',
    description: 'The complete KAYVEN intelligence experience.',
    active: false,
    billingInterval: 'month',
    providerProductIds: {},
    aiRequestsPerPeriod: 300,
  },
}

export const DEFAULT_PLAN_ID: PlanId = 'free'

export function getPlanConfig(planId: string | null | undefined): PlanConfig {
  return PLANS[planId as PlanId] || PLANS[DEFAULT_PLAN_ID]
}
