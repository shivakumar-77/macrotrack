'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import AIUsageMeter from '@/components/AIUsageMeter'
import UpgradePrompt from '@/components/UpgradePrompt'
import { refreshSubscription, useSubscription } from '@/lib/billing/client'
import { ENTITLEMENT_DEFINITIONS, canUseFeature, getPlanEntitlements } from '@/lib/billing/entitlements'
import { PLANS, type PlanId } from '@/lib/billing/plans'
import { getPublicProductPlan, useRevenueCat } from '@/lib/billing/revenuecat-client'

const PLAN_ORDER: PlanId[] = ['free', 'premium', 'pro']

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { state, loading, error } = useSubscription()
  const revenueCat = useRevenueCat()
  const [actionState, setActionState] = useState<'idle' | 'purchasing' | 'restoring' | 'syncing' | 'success' | 'empty' | 'error'>('idle')
  const [actionMessage, setActionMessage] = useState('')

  if (loading) {
    return <main style={{ minHeight: '100dvh', background: 'var(--surface)' }}><PageHeader title="Plans" href="/dashboard" /><div style={{ maxWidth: 900, margin: '0 auto', padding: 20, color: 'var(--muted)' }}>Loading your plan...</div><BottomNav /></main>
  }

  if (error || !state) {
    const signedOut = error === 'Please sign in to view subscription state.'
    return <main style={{ minHeight: '100dvh', background: 'var(--surface)' }}><PageHeader title="Plans" href="/dashboard" /><div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}><UpgradePrompt title={signedOut ? 'Sign in to view plans' : 'Plans are unavailable'} message={signedOut ? 'Sign in to see your current plan, AI Coach usage, and available upgrades.' : 'We could not load your subscription state. Please try again later.'} /></div><BottomNav /></main>
  }

  const currentPlan = PLANS[state.currentPlan] || PLANS.free
  const periodEnd = formatDate(state.currentPeriodEnd)
  const configuredPackages = revenueCat.offering?.availablePackages.filter(pkg => getPublicProductPlan(pkg.webBillingProduct.identifier)) || []
  const statusLabel = state.cancelAtPeriodEnd && state.subscriptionStatus === 'active'
    ? 'Canceling at period end'
    : state.subscriptionStatus === 'trialing'
      ? 'Trial'
      : state.subscriptionStatus === 'past_due'
        ? 'Billing issue'
        : state.subscriptionStatus === 'expired'
          ? 'Expired'
          : state.subscriptionStatus === 'free' ? 'Active' : state.subscriptionStatus

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--surface)', paddingBottom: 112 }}>
      <PageHeader title="KAYVEN Plans" subtitle="Your access, clearly explained" href="/dashboard" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        <section style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg, var(--primary-bg), var(--card))', border: '1px solid color-mix(in srgb, var(--primary) 18%, var(--border))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
            <div><div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Current plan</div><h1 style={{ marginTop: 6, fontSize: 28 }}>{currentPlan.displayName}</h1><p style={{ marginTop: 6, color: 'var(--muted)', lineHeight: 1.5 }}>{currentPlan.description}</p></div>
            <span style={{ padding: '7px 10px', borderRadius: 99, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>{statusLabel}</span>
          </div>
          {periodEnd && <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 13 }}>{state.cancelAtPeriodEnd ? `Access continues until ${periodEnd}.` : `Current period ends ${periodEnd}.`}</p>}
          <button type="button" onClick={() => router.push('/subscription/manage')} style={{ marginTop: 16, padding: '10px 13px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-2)', fontWeight: 700 }}>Manage subscription</button>
        </section>

        <div style={{ marginTop: 16 }}><AIUsageMeter /></div>

        {revenueCat.configured && revenueCat.initialized && <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" onClick={async () => { if (actionState === 'restoring') return; setActionState('restoring'); setActionMessage('Restoring purchases...'); try { const restored = await revenueCat.restore(); const refreshed = await refreshSubscription(); if (refreshed.currentPlan !== 'free') { setActionState('success'); setActionMessage('Purchase restored. Your subscription is active.') } else if (!restored.customerInfo?.entitlements.active || Object.keys(restored.customerInfo.entitlements.active).length === 0) { setActionState('empty'); setActionMessage('No active subscription was found.') } else { setActionState('syncing'); setActionMessage("Purchase restored. We're syncing your subscription...") } } catch { setActionState('error'); setActionMessage('We could not restore purchases. Please try again.') } }} disabled={actionState === 'restoring'} aria-busy={actionState === 'restoring'} style={{ padding: '10px 13px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-2)', fontWeight: 700 }}>{actionState === 'restoring' ? 'Restoring purchases...' : 'Restore purchases'}</button></div>}
        {actionMessage && <p role="status" aria-live="polite" style={{ marginTop: 10, color: actionState === 'error' ? 'var(--red)' : 'var(--muted)', fontSize: 13 }}>{actionMessage}</p>}

        <section style={{ marginTop: 26 }}>
          <div style={{ marginBottom: 12 }}><h2 style={{ fontSize: 20 }}>Choose your level</h2><p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{revenueCat.configured && configuredPackages.length ? 'Live plans from RevenueCat are available below.' : 'Subscriptions are coming soon. Your current access remains active.'}</p></div>
          {revenueCat.error && <p role="status" style={{ marginBottom: 12, color: 'var(--muted)', fontSize: 13 }}>{revenueCat.error}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 12 }}>
            {PLAN_ORDER.map(planId => {
              const plan = PLANS[planId]
              const entitlements = planId === state.currentPlan ? state.entitlements : getPlanEntitlements(planId)
              return <article key={plan.id} style={{ position: 'relative', padding: 18, borderRadius: 18, background: 'var(--card)', border: plan.id === state.currentPlan ? '2px solid var(--primary)' : '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                {plan.id === state.currentPlan && <span style={{ position: 'absolute', right: 14, top: 14, color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>CURRENT</span>}
                <h3 style={{ fontSize: 18 }}>{plan.displayName}</h3><p style={{ marginTop: 6, minHeight: 42, color: 'var(--muted)', fontSize: 13, lineHeight: 1.4 }}>{plan.description}</p>
                <div style={{ margin: '14px 0', color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{plan.aiRequestsPerPeriod === null ? 'AI usage: no configured limit' : `${plan.aiRequestsPerPeriod} AI requests / month`}</div>
                <ul style={{ display: 'grid', gap: 9, padding: 0, listStyle: 'none' }}>
                  {Object.entries(ENTITLEMENT_DEFINITIONS).map(([feature, definition]) => {
                    const enabled = canUseFeature(entitlements, feature as keyof typeof ENTITLEMENT_DEFINITIONS)
                    if (!enabled && definition.availability === 'coming_soon') return null
                    return <li key={feature} style={{ display: 'flex', gap: 8, alignItems: 'start', fontSize: 12, color: enabled ? 'var(--text-2)' : 'var(--muted)' }}><span aria-hidden="true" style={{ color: enabled ? 'var(--green)' : 'var(--muted)' }}>{enabled ? '✓' : '○'}</span><span>{definition.label}{definition.availability === 'coming_soon' ? ' · Coming soon' : ''}</span></li>
                  })}
                </ul>
                {plan.id !== state.currentPlan && (() => {
                  const planPackage = configuredPackages.find(pkg => getPublicProductPlan(pkg.webBillingProduct.identifier) === plan.id)
                  const price = planPackage?.webBillingProduct.price?.formattedPrice
                  const purchasing = revenueCat.loading
                  return <button type="button" onClick={async () => {
                    if (!planPackage) return
                    if (actionState === 'purchasing' || actionState === 'syncing') return
                    setActionState('purchasing')
                    setActionMessage('Purchase received. We\'re syncing your subscription...')
                    try {
                      await revenueCat.purchase(planPackage)
                      const refreshed = await refreshSubscription()
                      if (refreshed.currentPlan === plan.id) {
                        setActionState('success')
                        setActionMessage(`${plan.displayName} access is active.`)
                      } else {
                        setActionState('syncing')
                        setActionMessage("Purchase received. We're waiting for subscription sync.")
                      }
                    } catch {
                      setActionState('error')
                      setActionMessage('The purchase was not completed. No plan changes were made.')
                    }
                  }} disabled={!planPackage || purchasing || actionState === 'syncing'} title={planPackage ? `Upgrade to ${plan.displayName}` : 'Billing is not available yet'} style={{ width: '100%', marginTop: 18, padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', background: planPackage ? 'var(--primary)' : 'var(--card2)', color: planPackage ? '#fff' : 'var(--muted)', fontWeight: 700 }}>{planPackage ? `Upgrade to ${plan.displayName}${price ? ` · ${price}` : ''}` : 'Coming soon'}</button>
                })()}
              </article>
            })}
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  )
}
