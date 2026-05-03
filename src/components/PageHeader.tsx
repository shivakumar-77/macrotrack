'use client'
import { useRouter } from 'next/navigation'
import { BackIcon } from '@/lib/icons'

interface Props {
  title: string
  subtitle?: string
  href?: string
  onBack?: () => void
  right?: React.ReactNode
  transparent?: boolean
}

export default function PageHeader({ title, subtitle, href, onBack, right, transparent }: Props) {
  const router = useRouter()
  function go() {
    if (onBack) { onBack(); return }
    if (href) { router.push(href); return }
    router.back()
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: transparent ? 'transparent' : 'var(--surface)',
      paddingTop: 'calc(env(safe-area-inset-top,0px) + 12px)',
      paddingLeft: 'calc(env(safe-area-inset-left,0px) + 20px)',
      paddingRight: 'calc(env(safe-area-inset-right,0px) + 20px)',
      paddingBottom: 12,
      borderBottom: transparent ? 'none' : '0.5px solid var(--border)',
      backdropFilter: transparent ? 'none' : 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: transparent ? 'none' : 'saturate(180%) blur(20px)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={go} className="press-effect"
        style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card2)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--primary)' }}>
        <BackIcon size={18} color="var(--primary)" strokeWidth={2.5}/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
