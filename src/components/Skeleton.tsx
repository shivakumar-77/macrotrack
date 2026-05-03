'use client'

interface SkeletonProps { width?: string; height?: number; rounded?: boolean; className?: string }

export function Skeleton({ width='100%', height=14, rounded=false, className='' }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`}
      style={{ width, height, borderRadius: rounded ? 9999 : 10 }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <Skeleton width="48px" height={48} rounded className="skeleton-avatar"/>
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={18} className="skeleton-title" />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={8} className="skeleton-bar" />
      <div style={{ marginTop: 8 }}>
        <Skeleton width="30%" height={8} className="skeleton-bar" />
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 24px) 20px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Skeleton width="80px" height={12} className="skeleton-text" />
          <Skeleton width="140px" height={28} />
        </div>
        <Skeleton width="44px" height={44} rounded />
      </div>
      {/* Hero card */}
      <div className="skeleton" style={{ height: 160, borderRadius: 22, marginBottom: 16 }}/>
      {/* Macro grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 18 }}/>
        ))}
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

export function SkeletonList({ count=4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '0.5px solid var(--border)', alignItems: 'center' }}>
          <Skeleton width="44px" height={44} rounded />
          <div style={{ flex: 1 }}>
            <Skeleton width="65%" height={14} className="skeleton-text" />
            <Skeleton width="40%" height={11} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--card2)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.7s linear infinite'
      }}/>
      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Loading…</div>
    </div>
  )
}
