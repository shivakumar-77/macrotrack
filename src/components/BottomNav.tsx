'use client'
import { useRouter, usePathname } from 'next/navigation'
import { HomeIcon, NutritionIcon, WorkoutIcon, WeightIcon, ProfileIcon } from '@/lib/icons'

const NAV = [
  { href:'/dashboard', label:'Home',     Icon:HomeIcon },
  { href:'/log',       label:'Nutrition', Icon:NutritionIcon },
  { href:'/workout',   label:'Workout',   Icon:WorkoutIcon },
  { href:'/weight',    label:'Weight',    Icon:WeightIcon },
  { href:'/profile',   label:'Account',  Icon:ProfileIcon },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()

  return (
    <>
      {/* Spacer so content doesn't hide behind nav */}
      <div style={{ height: 80 }} aria-hidden="true"/>

      {/* The nav itself — always fixed at bottom */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        background: 'var(--nav-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.5px solid var(--border)',
        paddingTop: 10,
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)`,
        zIndex: 9999,
      }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href || (href !== '/dashboard' && path?.startsWith(href))
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              aria-label={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 9.5,
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.02em',
                color: active ? 'var(--primary)' : 'var(--muted)',
                padding: '4px 12px',
                borderRadius: 12,
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                minWidth: 56,
                position: 'relative',
                transition: 'color 0.2s ease',
              }}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.2 : 1.8}
                color={active ? 'var(--primary)' : 'var(--muted)'}
              />
              <span>{label}</span>
              {active && (
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                }}/>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
