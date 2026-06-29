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
    const params = new URLSearchParams({
      error: error,
      description: errorDescription || 'OAuth failed'
    })
    const redirectUrl = new URL(`${origin}/auth`)
    redirectUrl.search = params.toString()
    console.log('[Auth Callback] Redirecting to auth with error:', redirectUrl.href)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    console.error('[Auth Callback] No authorization code received')
    const params = new URLSearchParams({
      error: 'no_code',
      description: 'Authorization code not found'
    })
    return NextResponse.redirect(new URL(`${origin}/auth?${params.toString()}`))
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          console.log('[Auth Callback] Setting cookie:', name)
          return cookieStore.set({ name, value, ...options })
        },
        remove: (name, options) => {
          console.log('[Auth Callback] Removing cookie:', name)
          return cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    console.log('[Auth Callback] Exchanging code for session...')
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', exchangeError)
      const params = new URLSearchParams({
        error: 'session_exchange_failed',
        description: exchangeError.message || 'Failed to establish session'
      })
      return NextResponse.redirect(new URL(`${origin}/auth?${params.toString()}`))
    }
    
    if (data.session) {
      console.log('[Auth Callback] ✓ Session established successfully, redirecting to dashboard')
      // Clear any error params from URL before redirecting
      return NextResponse.redirect(new URL(`${origin}/dashboard`))
    } else {
      console.warn('[Auth Callback] Code exchanged but no session returned')
      const params = new URLSearchParams({
        error: 'no_session',
        description: 'Session establishment failed'
      })
      return NextResponse.redirect(new URL(`${origin}/auth?${params.toString()}`))
    }
  } catch (e) {
    console.error('[Auth Callback] Unexpected error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error occurred'
    const params = new URLSearchParams({
      error: 'callback_error',
      description: message
    })
    return NextResponse.redirect(new URL(`${origin}/auth?${params.toString()}`))
  }
}
