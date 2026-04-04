'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/dashboard' : '/auth')
    })
  }, [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--surface)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}
