'use client'
import { useRouter, usePathname } from 'next/navigation'
import { HomeIcon, NutritionIcon, WorkoutIcon, WeightIcon, ProfileIcon } from '@/lib/icons'

const NAV = [
  { href:'/dashboard', label:'Home',     Icon:HomeIcon },
  { href:'/log',       label:'Nutrition', Icon:NutritionIcon },
  { href:'/workout',   label:'Workout',   Icon:WorkoutIcon },
  { href:'/weight',    label:'Weight',   Icon:WeightIcon },
  { href:'/profile',   label:'Account',  Icon:ProfileIcon },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname() || '/'

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {NAV.map(({ href, label, Icon }) => {
        const active = href === '/dashboard'
          ? path === '/' || path === '/dashboard' || path.startsWith('/dashboard')
          : path === href || path.startsWith(href)

        return (
          <button
            key={href}
            className={`nav-item press-effect${active ? ' active' : ''}`}
            onClick={() => router.push(href)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
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
