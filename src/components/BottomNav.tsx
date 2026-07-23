'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { HomeIcon, NutritionIcon, WorkoutIcon, WeightIcon, ProfileIcon } from '@/lib/icons'

const NAV = [
  { href:'/dashboard', label:'Home',     Icon:HomeIcon },
  { href:'/log',       label:'Nutrition', Icon:NutritionIcon },
  { href:'/workout',   label:'Workout',   Icon:WorkoutIcon },
  { href:'/weight',    label:'Weight',   Icon:WeightIcon },
  { href:'/profile',   label:'Account',  Icon:ProfileIcon },
]

// Same active-route rule as before, just pulled out so both render paths share one source of truth
function isActive(href, path) {
  return href === '/dashboard'
    ? path === '/' || path === '/dashboard' || path.startsWith('/dashboard')
    : path === href || path.startsWith(href)
}

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname() || '/'
  const [platform, setPlatform] = useState('ios') // default: iOS glass style until detected otherwise
  const [ripples, setRipples] = useState({})

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    // Prefer the structured Client Hints API when the browser exposes it (most current Android Chrome) —
    // more robust than string-sniffing since UA strings are increasingly frozen/reduced by browsers.
    const uaDataPlatform = navigator.userAgentData?.platform || ''
    if (/android/i.test(uaDataPlatform)) { setPlatform('android'); return }
    if (/ios|iphone|ipad/i.test(uaDataPlatform)) { setPlatform('ios'); return }
    const ua = navigator.userAgent || ''
    if (/Android/i.test(ua)) setPlatform('android')
    else if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios')
  }, [])

  function addRipple(e, href) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()
    setRipples(r => ({ ...r, [href]: [...(r[href] || []), { id, x, y }] }))
    setTimeout(() => {
      setRipples(r => ({ ...r, [href]: (r[href] || []).filter(rp => rp.id !== id) }))
    }, 500)
  }

  const activeIdx = NAV.findIndex(n => isActive(n.href, path))
  const isAndroid = platform === 'android'

  const wrapStyle = {
    position:'fixed', left:'50%', bottom:'calc(env(safe-area-inset-bottom,0px) + 14px)',
    transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:398, zIndex:1000,
  }

  if (isAndroid) {
    return (
      <nav aria-label="Bottom navigation" style={{ ...wrapStyle, display:'flex', padding:'10px 8px', borderRadius:28, background:'var(--card)', border:'1px solid var(--border)', boxShadow:'0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)' }}>
        <style jsx>{`
          @keyframes mdRipple { from { transform: scale(0); opacity: 0.35; } to { transform: scale(22); opacity: 0; } }
          .md-tap { transition: transform 0.12s ease; }
          .md-tap:active { transform: scale(0.95); }
        `}</style>
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href, path)
          const itemRipples = ripples[href] || []
          return (
            <button key={href} className="md-tap" onClick={() => router.push(href)} onPointerDown={(e) => addRipple(e, href)}
              aria-label={label} aria-current={active ? 'page' : undefined}
              style={{ position:'relative', overflow:'hidden', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 2px', borderRadius:16, WebkitTapHighlightColor:'transparent' }}>
              {itemRipples.map(rp => (
                <span key={rp.id} style={{ position:'absolute', left:rp.x, top:rp.y, width:8, height:8, marginLeft:-4, marginTop:-4, borderRadius:'50%', background:'var(--primary)', opacity:0.25, animation:'mdRipple 0.5s ease-out forwards', pointerEvents:'none' }}/>
              ))}
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:52, height:30, borderRadius:15, background: active ? 'var(--primary-bg)' : 'transparent', transition:'background 0.25s ease' }}>
                <Icon size={21} strokeWidth={active ? 2.2 : 1.8} color={active ? 'var(--primary)' : 'var(--muted)'}/>
              </span>
              <span style={{ fontSize:11, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--muted)', letterSpacing:'0.01em' }}>{label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Bottom navigation" style={{ ...wrapStyle, position:'fixed', display:'flex', padding:6, borderRadius:999, background:'color-mix(in srgb, var(--surface) 72%, transparent)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'1px solid color-mix(in srgb, var(--border) 70%, transparent)', boxShadow:'0 10px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)' }}>
      <style jsx>{`
        .ios-tap { transition: transform 0.15s ease; }
        .ios-tap:active { transform: scale(0.92); }
      `}</style>
      {activeIdx >= 0 && (
        <span style={{ position:'absolute', top:6, bottom:6, left:6, width:`calc((100% - 12px) / ${NAV.length})`, transform:`translateX(calc(${activeIdx} * 100%))`, borderRadius:999, background:'var(--primary-bg)', transition:'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      )}
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(href, path)
        return (
          <button key={href} className="ios-tap" onClick={() => router.push(href)} aria-label={label} aria-current={active ? 'page' : undefined}
            style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'8px 4px', WebkitTapHighlightColor:'transparent' }}>
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} color={active ? 'var(--primary)' : 'var(--muted)'}/>
            <span style={{ fontSize:9.5, fontWeight: active ? 700 : 500, letterSpacing:'0.02em', color: active ? 'var(--primary)' : 'var(--muted)' }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
