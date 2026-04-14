'use client'
import { useRouter, usePathname } from 'next/navigation'

const items = [
  { href: '/dashboard', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href: '/log', label: 'Log', icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { href: '/progress', label: 'Progress', icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href: '/profile', label: 'Account', icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()
  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const active = path === item.href || (item.href !== '/dashboard' && path?.startsWith(item.href))
        return (
          <button key={item.href} className={`nav-item${active ? ' active' : ''}`} onClick={() => router.push(item.href)}>
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
