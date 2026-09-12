'use client'

import type { EntitlementId } from '@/lib/billing/entitlements'
import { useEntitlement } from '@/lib/billing/client'
import UpgradePrompt from './UpgradePrompt'

interface FeatureGateProps {
  feature: EntitlementId
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { enabled, loading, error } = useEntitlement(feature)

  if (loading) return <div aria-busy="true" style={{ minHeight: 80, borderRadius: 16, background: 'var(--card2)' }} />
  if (error || !enabled) return fallback || <UpgradePrompt message="This feature is not included in your current plan." />
  return <>{children}</>
}
