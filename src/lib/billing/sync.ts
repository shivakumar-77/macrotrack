import { toSubscriptionRecord, type BillingProvider } from './provider'
import { getPlanConfig, type PlanId } from './plans'

export async function syncSubscriptionState(
  supabase: any,
  userId: string,
  provider: BillingProvider,
  customerId: string,
): Promise<boolean> {
  const state = await provider.getCustomerSubscriptionState(customerId)
  if (!state) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan_id: 'free', status: 'expired', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', provider.name)
    return !error
  }

  if (!(await provider.verifyEntitlements(state))) return false

  const planId = provider.mapProviderProductToPlan(state.productId || '')
  if (!planId || !getPlanConfig(planId).id) return false

  const subscription = toSubscriptionRecord(userId, state, planId)
  const { error } = await supabase
    .from('subscriptions')
    .upsert(subscription, { onConflict: 'provider,provider_subscription_id' })

  return !error
}
