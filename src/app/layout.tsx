import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MacroTrack — Nutrition Tracker',
  description: 'Track calories, macros, water and get AI-powered nutrition insights',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MacroTrack',
    startupImage: '/icon-512.png',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
        {/* PWA iOS required tags */}
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="MacroTrack"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png"/>
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-192.png"/>
        <link rel="apple-touch-icon" sizes="76x76" href="/icon-192.png"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="theme-color" content="#6366f1"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        {/* Preload critical font */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="dns-prefetch" href="https://yxhfnjlwtmkxnrgdxoal.supabase.co"/>
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          // Register service worker for PWA
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(function(reg) { console.log('SW registered') })
                .catch(function(e) { console.log('SW failed:', e) })
            })
          }
        `}}/>
      </body>
    </html>
  )
}
