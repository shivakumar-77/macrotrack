'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BMIPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to profile page with BMI calculator tab
    router.replace('/profile?tab=bmi')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🔄</div>
        <p style={{ color: 'var(--muted)' }}>Redirecting to BMI Calculator...</p>
      </div>
    </div>
  )
}
