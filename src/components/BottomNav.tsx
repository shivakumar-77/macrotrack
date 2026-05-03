'use client'
import { useRouter, usePathname } from 'next/navigation'

const items = [
  { href:'/dashboard', label:'Home', icon:<svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href:'/log', label:'Nutrition', icon:<svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { href:'/workout', label:'Workout', icon:<svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4"/></svg> },
  { href:'/weight', label:'Weight', icon:<svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2"/></svg> },
  { href:'/profile', label:'Account', icon:<svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()
  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const active = path===item.href||(item.href!=='/dashboard'&&path?.startsWith(item.href))
        return (
          <button key={item.href} className={`nav-item${active?' active':''}`} onClick={()=>router.push(item.href)}>
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
