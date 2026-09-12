import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/server/supabase'
import { getBillingState } from '@/lib/billing/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Please sign in to view subscription state.' }, { status: 401 })
  }

  const state = await getBillingState(supabase, user.id)
  const remainingAIRequests = state.aiLimit === null
    ? null
    : Math.max(0, state.aiLimit - state.usage.request_count)

  return NextResponse.json({
    currentPlan: state.plan.id,
    subscriptionStatus: state.subscription?.status || 'free',
    entitlements: state.entitlements,
    aiUsage: state.usage.request_count,
    aiLimit: state.aiLimit,
    remainingAIRequests,
    currentPeriodStart: state.subscription?.current_period_start || null,
    currentPeriodEnd: state.subscription?.current_period_end || state.usage.period_end,
    cancelAtPeriodEnd: state.subscription?.cancel_at_period_end || false,
    billingProvider: state.subscription?.provider || null,
    managementUrl: null,
    managementUrlAvailable: false,
  })
}
