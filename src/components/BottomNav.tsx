'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import { House, Utensils, Dumbbell, Pill, UserRound } from 'lucide-react'

const NAV = [
  { href:'/dashboard', label:'Home', Icon:House },
  { href:'/log', label:'Nutrition', Icon:Utensils },
  { href:'/workout', label:'Workout', Icon:Dumbbell },
  { href:'/supplements', label:'Supplement', Icon:Pill },
  { href:'/profile', label:'Account', Icon:UserRound, avatar:true },
]

// Same active-route rule as before, just pulled out so both render paths share one source of truth
function isActive(href, path) {
  return href === '/dashboard'
    ? path === '/' || path === '/dashboard' || path.startsWith('/dashboard')
    : path === href || path.startsWith(href)
}

function NavPortal({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return mounted ? createPortal(children, document.body) : null
}

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname() || '/'

  const activeIdx = NAV.findIndex(n => isActive(n.href, path))

  return (
    <NavPortal><nav aria-label="Bottom navigation" className="floating-bottom-nav fixed bottom-4 left-1/2 z-[1000] flex w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-zinc-900/90 p-2 text-zinc-400 shadow-2xl backdrop-blur-md backdrop-saturate-150 [padding-bottom:calc(0.5rem+env(safe-area-inset-bottom))]">
      {activeIdx >= 0 && (
        <span aria-hidden="true" className="floating-bottom-nav__active pointer-events-none absolute inset-y-1 left-2 w-[calc((100%-1rem)/5)] rounded-full bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] transition-transform duration-300 ease-out" style={{ transform:`translateX(calc(${activeIdx} * (100% + 0.25rem)))` }}/>
      )}
      {NAV.map(({ href, label, Icon, avatar }) => {
        const active = isActive(href, path)
        return (
          <button key={href} onClick={() => router.push(href)} aria-label={label} aria-current={active ? 'page' : undefined} className={`floating-bottom-nav__item relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 py-2 transition-all duration-300 ${active ? 'font-bold text-white' : 'font-medium text-zinc-400 hover:text-zinc-200'}`}>
            {avatar ? <img src="/Kayven.PNG" alt="" className="h-[22px] w-[22px] rounded-full object-cover" /> : <Icon size={22} strokeWidth={active ? 2.4 : 1.8} className={active ? 'text-white' : 'text-zinc-400'} />}
            <span className="floating-bottom-nav__label truncate text-[10px] leading-none">{label}</span>
          </button>
        )
      })}
    </nav></NavPortal>
  )
}
