'use client'
import { useRouter } from 'next/navigation'

interface Props {
  title: string
  subtitle?: string
  href?: string
  right?: React.ReactNode
}

export default function PageHeader({ title, subtitle, href, right }: Props) {
  const router = useRouter()
  function go() { href ? router.push(href) : router.back() }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--surface)',
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 20px)',
      paddingRight: 'calc(env(safe-area-inset-right, 0px) + 20px)',
      paddingBottom: '12px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <button onClick={go}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--card2)', border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
