'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BoltIcon, ChevronRightIcon } from '@/lib/icons'

interface Action {
  actionType: string
  priority: number
  title?: string
  message?: string
  suggestedAction?: string
  destination?: string
}

const COOLDOWN_MS = 6 * 60 * 60 * 1000
const STORAGE_KEY = 'Kayven_next_action'

export default function NextBestActionCard() {
  const router = useRouter()
  const [action, setAction] = useState<Action | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.expiresAt > Date.now()) { setAction(parsed.action); return }
        }
        const response = await fetch('/api/health-agent')
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && data.state?.action?.actionType !== 'NONE') {
          setAction(data.state.action)
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ action: data.state.action, expiresAt: Date.now() + COOLDOWN_MS }))
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (!action) return null

  function openAction() {
    if (action?.destination) router.push(action.destination)
  }

  return (
    <section className="next-action-card" aria-label="Next for you">
      <div className="next-action-icon"><BoltIcon size={18} color="var(--primary)" strokeWidth={2.2}/></div>
      <div className="next-action-copy">
        <div className="next-action-label">Next for you</div>
        <h2>{action.title}</h2>
        <p>{action.message}</p>
        {action.suggestedAction && <div className="next-action-suggestion">{action.suggestedAction}</div>}
      </div>
      <button onClick={openAction} aria-label={action.title || 'Open recommendation'}><ChevronRightIcon size={19} color="var(--primary)" strokeWidth={2.3}/></button>
      <style jsx>{`
        .next-action-card { display:flex; align-items:flex-start; gap:12px; margin:14px 0; padding:16px; border:1px solid color-mix(in srgb,var(--primary) 24%,var(--border)); border-radius:16px; background:var(--primary-bg); animation: nextActionIn .35s ease both; }
        .next-action-icon { width:34px; height:34px; flex:0 0 34px; display:grid; place-items:center; border-radius:11px; background:var(--card); }
        .next-action-copy { flex:1; min-width:0; }.next-action-label { color:var(--primary); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
        h2 { font-size:15px; margin:0 0 3px; font-weight:750; }.next-action-copy p { color:var(--text-2); font-size:12px; line-height:1.45; margin:0; }.next-action-suggestion { color:var(--muted); font-size:11px; line-height:1.4; margin-top:6px; }
        button { width:32px; height:32px; flex:0 0 32px; border:0; border-radius:10px; background:var(--card); display:grid; place-items:center; cursor:pointer; margin-top:8px; }
        @keyframes nextActionIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </section>
  )
}