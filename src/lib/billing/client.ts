'use client'

import { useEffect, useState } from 'react'
import type { EntitlementId, Entitlements } from './entitlements'
import type { PlanId } from './plans'

let cachedState: ClientSubscriptionState | null = null
let cachedError: string | null = null
let request: Promise<ClientSubscriptionState> | null = null
const listeners = new Set<(state: ClientSubscriptionState | null) => void>()

async function fetchSubscriptionState(): Promise<ClientSubscriptionState> {
  if (!request) {
    request = fetch('/api/subscription', { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Unable to load subscription state')
        return payload as ClientSubscriptionState
      })
      .then(payload => {
        cachedState = payload
        cachedError = null
        listeners.forEach(listener => listener(payload))
        return payload
      })
      .catch(error => {
        cachedError = error instanceof Error ? error.message : 'Unable to load subscription state'
        throw error
      })
      .finally(() => { request = null })
  }

  return request
}

export async function refreshSubscription(): Promise<ClientSubscriptionState> {
  cachedState = null
  cachedError = null
  return fetchSubscriptionState()
}

export function clearSubscriptionState(): void {
  cachedState = null
  cachedError = null
  request = null
  listeners.forEach(listener => listener(null))
}

export async function waitForSubscriptionPlan(
  expectedPlan: PlanId,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<ClientSubscriptionState | null> {
  const timeoutMs = options.timeoutMs ?? 8000
  const intervalMs = options.intervalMs ?? 1000
  const startedAt = Date.now()

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const current = await refreshSubscription()
      if (current.currentPlan === expectedPlan) return current
    } catch {
      // Keep polling boundedly; the server remains authoritative.
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  return cachedState
}

export interface ClientSubscriptionState {
  currentPlan: PlanId
  subscriptionStatus: string
  entitlements: Entitlements
  aiUsage: number
  aiLimit: number | null
  remainingAIRequests: number | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  billingProvider: string | null
  managementUrl: string | null
  managementUrlAvailable: boolean
}

export function useSubscription() {
  const [state, setState] = useState<ClientSubscriptionState | null>(cachedState)
  const [loading, setLoading] = useState(!cachedState)
  const [error, setError] = useState<string | null>(cachedError)

  useEffect(() => {
    let active = true

    const listener = (nextState: ClientSubscriptionState | null) => {
      if (active) {
        setState(nextState)
        setError(cachedError)
        setLoading(false)
      }
    }
    listeners.add(listener)

    if (!cachedState) {
      fetchSubscriptionState()
        .then(payload => { if (active) setState(payload) })
        .catch(requestError => {
          if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load subscription state')
        })
        .finally(() => { if (active) setLoading(false) })
    }

    return () => { active = false; listeners.delete(listener) }
  }, [])

  return { state, loading, error }
}

export function useEntitlement(feature: EntitlementId) {
  const subscription = useSubscription()
  const value = subscription.state?.entitlements[feature]
  const enabled = typeof value === 'boolean' ? value : value?.enabled === true
  return { ...subscription, enabled }
}

export function useAIUsage() {
  const subscription = useSubscription()
  return {
    ...subscription,
    usage: subscription.state?.aiUsage ?? 0,
    limit: subscription.state?.aiLimit ?? null,
    remaining: subscription.state?.remainingAIRequests ?? null,
  }
}
