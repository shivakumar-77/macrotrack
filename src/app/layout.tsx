import './globals.css'

export const metadata = {
  title: 'MacroTrack — Eat Smart',
  description: 'Smart nutrition tracking with AI food scanning',
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
