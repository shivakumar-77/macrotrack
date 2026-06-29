'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'auto'
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'auto', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto')

  useEffect(() => {
    const saved = localStorage.getItem('macrotrack_theme') as Theme || 'auto'
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('macrotrack_theme', t)
    applyTheme(t)
  }

  function applyTheme(t: Theme) {
    const root = document.documentElement
    root.removeAttribute('data-theme')
    if (t === 'dark') root.setAttribute('data-theme', 'dark')
    else if (t === 'light') root.setAttribute('data-theme', 'light')
    // auto = follow system via media query
  }

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>
}

export function useTheme() { return useContext(ThemeCtx) }
