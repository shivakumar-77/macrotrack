'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import SubscriptionStatusCard from '@/components/SubscriptionStatusCard'
import AIUsageMeter from '@/components/AIUsageMeter'
import UpgradePrompt from '@/components/UpgradePrompt'
import { refreshSubscription, useSubscription } from '@/lib/billing/client'
import { useRevenueCat } from '@/lib/billing/revenuecat-client'

export default function ManageSubscriptionPage() {
  const router = useRouter()
  const subscription = useSubscription()
  const revenueCat = useRevenueCat()
  const [refreshing, setRefreshing] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState('')

  async function refreshStatus() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await revenueCat.refresh()
      await fetch('/api/subscription/refresh', { method: 'POST' }).catch(() => undefined)
      await refreshSubscription()
    } finally {
      setRefreshing(false)
    }
  }

  async function restorePurchases() {
    if (refreshing) return
    setRefreshing(true)
    setRestoreMessage('Restoring purchases...')
    try {
      const nextRevenueCat = await revenueCat.restore()
      const serverState = await refreshSubscription()
      if (serverState.currentPlan !== 'free') {
        setRestoreMessage('Purchase restored successfully.')
      } else if (!nextRevenueCat.customerInfo?.entitlements.active || Object.keys(nextRevenueCat.customerInfo.entitlements.active).length === 0) {
        setRestoreMessage('No active subscription was found.')
      } else {
        setRestoreMessage("Purchase restored. We're syncing your subscription...")
      }
    } catch {
      setRestoreMessage("We couldn't restore your purchases. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  if (subscription.loading) return <main style={{ minHeight: '100dvh', background: 'var(--surface)' }}><PageHeader title="Manage subscription" href="/subscription" /><div style={{ padding: 20, color: 'var(--muted)' }}>Loading subscription status...</div><BottomNav /></main>

  if (subscription.error || !subscription.state) return <main style={{ minHeight: '100dvh', background: 'var(--surface)' }}><PageHeader title="Manage subscription" href="/subscription" /><div style={{ padding: 20 }}><UpgradePrompt context="billing_unavailable" title="Subscription status unavailable" message="Unable to refresh subscription status. Your access will be verified when you use protected features." /></div><BottomNav /></main>

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--surface)', paddingBottom: 112 }}>
      <PageHeader title="Manage subscription" subtitle="Your billing access and status" href="/subscription" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        <SubscriptionStatusCard state={subscription.state} managementUrl={revenueCat.customerInfo?.managementURL} onRefresh={refreshStatus} refreshing={refreshing} />
        <div style={{ marginTop: 14 }}><AIUsageMeter /></div>
        {restoreMessage && <p role="status" aria-live="polite" style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>{restoreMessage}</p>}
        {revenueCat.configured && revenueCat.initialized && <button type="button" onClick={() => void restorePurchases()} disabled={refreshing} aria-busy={refreshing} style={{ marginTop: 14, width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-2)', fontWeight: 700 }}>{refreshing ? 'Restoring purchases...' : 'Restore purchases'}</button>}
        <button type="button" onClick={() => router.push('/subscription')} style={{ marginTop: 10, width: '100%', padding: '12px 14px', borderRadius: 12, border: 0, background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 700 }}>View plans</button>
      </div>
      <BottomNav />
    </main>
  )
}
