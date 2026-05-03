'use client'
import { useRouter, usePathname } from 'next/navigation'
import { HomeIcon, NutritionIcon, WorkoutIcon, SupplementIcon, ProfileIcon } from '@/lib/icons'

const NAV = [
  { href:'/dashboard', label:'Home',     Icon:HomeIcon },
  { href:'/log',       label:'Nutrition', Icon:NutritionIcon },
  { href:'/workout',   label:'Workout',   Icon:WorkoutIcon },
  { href:'/supplements',label:'Supps',   Icon:SupplementIcon },
  { href:'/profile',   label:'Account',  Icon:ProfileIcon },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()

  return (
    <nav className="bottom-nav">
      {NAV.map(({ href, label, Icon }) => {
        const active = path === href || (href !== '/dashboard' && path?.startsWith(href))
        return (
          <button
            key={href}
            className={`nav-item press-effect${active ? ' active' : ''}`}
            onClick={() => router.push(href)}
            aria-label={label}
          >
            <Icon size={24} strokeWidth={active ? 2.2 : 1.8}/>
            <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 400, marginTop: 1, letterSpacing: '0.02em' }}>
              {label}
            </span>
            {active && (
              <span style={{
                position: 'absolute', bottom: -6,
                width: 4, height: 4, borderRadius: '50%',
                background: 'var(--primary)',
                animation: 'pop 0.3s ease both'
              }}/>
            )}
          </button>
        )
      })}
    </nav>
  )
}
