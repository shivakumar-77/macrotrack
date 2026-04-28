'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ label = '', href = '' }: { label?: string; href?: string }) {
  const router = useRouter()
  function go() { href ? router.push(href) : router.back() }
  return (
    <button onClick={go}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--primary)', fontSize: 16, fontWeight: 600,
        padding: '4px 0', WebkitTapHighlightColor: 'transparent',
      }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      {label || 'Back'}
    </button>
  )
}
