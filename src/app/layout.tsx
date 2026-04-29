import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'MacroTrack',
  description: 'AI-powered nutrition and macro tracking',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'MacroTrack' },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="MacroTrack"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="theme-color" content="#6366f1"/>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = localStorage.getItem('macrotrack_theme') || 'auto';
            if (t === 'dark') document.documentElement.setAttribute('data-theme','dark');
            else if (t === 'light') document.documentElement.setAttribute('data-theme','light');
          })();
        `}}/>
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
            })
          }
        `}}/>
      </body>
    </html>
  )
}
