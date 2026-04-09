import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    const errorParam = `error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    return NextResponse.redirect(`${origin}/auth?${errorParam}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set({ name, value, ...options }),
          remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
        },
      }
    )
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (e) {
      console.error('[Auth Callback] Session exchange error:', e)
      return NextResponse.redirect(`${origin}/auth?error=session_exchange_failed`)
    }
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
