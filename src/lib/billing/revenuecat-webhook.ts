import type { NextRequest } from 'next/server'
import { getRevenueCatConfig } from './revenuecat-config'
import { normalizeRevenueCatStatus, type RevenueCatEventPayload } from './revenuecat-normalizer'
import type { RevenueCatProvider } from './revenuecat'

export interface VerifiedRevenueCatEvent {
  id: string
  type: string
  appUserId: string
  payload: RevenueCatEventPayload
}

export function verifyRevenueCatWebhookAuthorization(request: NextRequest, secret: string): boolean {
  const authorization = request.headers.get('authorization')
  return Boolean(authorization && authorization === `Bearer ${secret}`)
}

export function parseRevenueCatWebhook(body: unknown): VerifiedRevenueCatEvent | null {
  if (!body || typeof body !== 'object') return null
  const event = (body as { event?: RevenueCatEventPayload }).event
  if (!event?.id || !event.type || !event.app_user_id) return null
  return { id: event.id, type: event.type, appUserId: event.app_user_id, payload: event }
}

export async function syncRevenueCatWebhookEvent(
  supabase: any,
  provider: RevenueCatProvider,
  verifiedEvent: VerifiedRevenueCatEvent,
): Promise<{ ok: boolean; duplicate: boolean }> {
  const config = getRevenueCatConfig()
  if (!config) return { ok: false, duplicate: false }

  const { data: existing, error: lookupError } = await supabase
    .from('billing_webhook_events')
    .select('id, status')
    .eq('provider', 'revenuecat')
    .eq('provider_event_id', verifiedEvent.id)
    .maybeSingle()

  if (lookupError) return { ok: false, duplicate: false }
  if (existing) return { ok: true, duplicate: true }

  const { error: insertError } = await supabase
    .from('billing_webhook_events')
    .insert({
      provider: 'revenuecat',
      provider_event_id: verifiedEvent.id,
      event_type: verifiedEvent.type,
      provider_user_id: verifiedEvent.appUserId,
      status: 'processing',
    })

  if (insertError) {
    const duplicate = insertError.code === '23505'
    return { ok: duplicate, duplicate }
  }

  const subscriberState = provider.normalizeSubscriber(verifiedEvent.appUserId, {
    entitlements: verifiedEvent.payload.entitlement_ids?.reduce<Record<string, { product_identifier?: string | null; expires_date?: string | null }>>((result, entitlement) => {
      result[entitlement] = {
        product_identifier: verifiedEvent.payload.product_id || null,
        expires_date: verifiedEvent.payload.expiration_at_ms ? new Date(verifiedEvent.payload.expiration_at_ms).toISOString() : null,
      }
      return result
    }, {}),
    subscriptions: verifiedEvent.payload.product_id ? {
      [verifiedEvent.payload.product_id]: {
        expires_date: verifiedEvent.payload.expiration_at_ms ? new Date(verifiedEvent.payload.expiration_at_ms).toISOString() : null,
        unsubscribe_detected_at: normalizeRevenueCatStatus(verifiedEvent.payload) === 'canceled' ? new Date().toISOString() : null,
        billing_issues_detected_at: normalizeRevenueCatStatus(verifiedEvent.payload) === 'past_due' ? new Date().toISOString() : null,
      },
    } : {},
  })

  const status = normalizeRevenueCatStatus(verifiedEvent.payload)
  const productPlan = provider.mapProviderProductToPlan(verifiedEvent.payload.product_id || '')
  const planId = subscriberState.planId === 'free' && status !== 'expired'
    ? productPlan || 'free'
    : subscriberState.planId
  const state = subscriberState.state || (planId !== 'free' ? {
    provider: 'revenuecat' as const,
    providerCustomerId: verifiedEvent.appUserId,
    productId: verifiedEvent.payload.product_id || null,
    status,
    currentPeriodEnd: verifiedEvent.payload.expiration_at_ms ? new Date(verifiedEvent.payload.expiration_at_ms).toISOString() : null,
  } : null)
  const periodStillActive = Boolean(state?.currentPeriodEnd && new Date(state.currentPeriodEnd).getTime() > Date.now())
  const persistedStatus = status === 'canceled' && periodStillActive ? 'active' : status
  const subscription = state ? {
    user_id: verifiedEvent.appUserId,
    provider: 'revenuecat',
    provider_customer_id: state.providerCustomerId || verifiedEvent.appUserId,
    provider_subscription_id: verifiedEvent.payload.original_transaction_id || verifiedEvent.payload.transaction_id || verifiedEvent.id,
    plan_id: planId,
    status: persistedStatus,
    current_period_start: state.currentPeriodStart || null,
    current_period_end: state.currentPeriodEnd || null,
    cancel_at_period_end: state.cancelAtPeriodEnd || status === 'canceled',
  } : null

  const syncError = subscription
    ? (await supabase.from('subscriptions').upsert(subscription, { onConflict: 'provider,provider_subscription_id' })).error
    : (await supabase.from('subscriptions').update({ status, plan_id: 'free', updated_at: new Date().toISOString() }).eq('user_id', verifiedEvent.appUserId).eq('provider', 'revenuecat')).error

  await supabase
    .from('billing_webhook_events')
    .update({ status: syncError ? 'failed' : 'processed', processed_at: syncError ? null : new Date().toISOString() })
    .eq('provider', 'revenuecat')
    .eq('provider_event_id', verifiedEvent.id)

  return { ok: !syncError, duplicate: false }
}
