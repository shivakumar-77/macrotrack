'use client'

import { useAIUsage } from '@/lib/billing/client'

export default function AIUsageMeter({ compact = false }: { compact?: boolean }) {
  const { state, loading, error, usage, limit, remaining } = useAIUsage()

  if (loading) {
    return <div aria-busy="true" style={{ color: 'var(--muted)', fontSize: 13 }}>Loading AI Coach usage...</div>
  }

  if (error || !state) {
    return <div role="status" style={{ color: 'var(--muted)', fontSize: 13 }}>AI Coach usage is unavailable right now.</div>
  }

  const unlimited = limit === null
  const percentage = unlimited ? 0 : Math.min(100, Math.round((usage / Math.max(limit, 1)) * 100))
  const warning = !unlimited && percentage >= 100
    ? "You've reached your monthly AI Coach limit."
    : !unlimited && percentage >= 90
      ? 'You have only a few AI Coach requests remaining this month.'
      : !unlimited && percentage >= 75
        ? "You're getting close to your monthly AI Coach limit."
        : null

  if (compact) {
    return <div role="status" aria-live="polite" style={{ color: warning ? 'var(--orange)' : 'var(--muted)', fontSize: 12 }}>{warning || (unlimited ? `${usage} AI requests used` : `${remaining} AI Coach requests remaining`)}</div>
  }

  return (
    <section aria-label="AI Coach usage" style={{ padding: 16, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <strong>AI Coach</strong>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{unlimited ? `${usage} used` : `${usage} / ${limit} requests used`}</span>
      </div>
      {!unlimited && <div role="progressbar" aria-label={`${percentage}% of AI Coach requests used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} style={{ height: 8, marginTop: 12, borderRadius: 99, background: 'var(--card2)', overflow: 'hidden' }}><div style={{ width: `${percentage}%`, height: '100%', borderRadius: 99, background: percentage >= 90 ? 'var(--orange)' : 'var(--primary)', transition: 'width .3s ease' }} /></div>}
      <p style={{ marginTop: 10, color: warning ? 'var(--orange)' : 'var(--muted)', fontSize: 12 }}>{warning || (unlimited ? 'Your plan has no configured monthly limit.' : `${remaining} requests remaining this period.`)}</p>
    </section>
  )
}
