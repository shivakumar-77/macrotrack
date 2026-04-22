'use client'

import { createBrowserClient } from '@supabase/ssr'

let instance: any = null

// Lazy initialize on first use - allow retries
const getClient = () => {
  // Return existing instance if already created
  if (instance) return instance
  
  // Only initialize in browser
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    
    // Debug logging
    console.log('[Supabase] Init attempt', {
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length,
      keyLength: key?.length
    })
    
    if (!url || url.length === 0) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or empty. Please check your .env.local file.')
    }
    if (!key || key.length === 0) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty. Please check your .env.local file.')
    }
    
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Invalid Supabase URL format: ${url}. Must start with http:// or https://`)
    }
    
    // Validate key format (basic JWT check)
    if (!key.includes('.')) {
      throw new Error('Invalid Supabase anon key format. Key appears to be truncated or malformed.')
    }
    
    console.log(`[Supabase] Creating client with URL: ${url.substring(0, 40)}...`)
    instance = createBrowserClient(url, key)
    console.log('[Supabase] ✓ Client initialized successfully')
    return instance
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Supabase] Init failed: ${errMsg}`)
    return null
  }
}

// Helper to add timeout to async operations
const withTimeout = async (promise: Promise<any>, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ])
}

// Create stub implementations that only work on client
const createStub = () => ({
  auth: {
    getUser: async () => {
      const client = getClient()
      if (!client) {
        console.warn('Supabase not initialized for getUser')
        return { data: { user: null } }
      }
      try {
        return await withTimeout(client.auth.getUser())
      } catch (error) {
        console.error('getUser error:', error)
        return { data: { user: null } }
      }
    },
    getSession: async () => {
      const client = getClient()
      if (!client) {
        console.warn('Supabase not initialized for getSession')
        return { data: { session: null } }
      }
      try {
        return await withTimeout(client.auth.getSession(), 3000)
      } catch (error) {
        console.error('getSession error:', error)
        return { data: { session: null } }
      }
    },
    onAuthStateChange: (callback: any) => {
      const client = getClient()
      if (!client) return { data: { subscription: null } }
      try {
        return client.auth.onAuthStateChange(callback)
      } catch (error) {
        console.error('onAuthStateChange error:', error)
        return { data: { subscription: null } }
      }
    },
    signInWithPassword: async (credentials: any) => {
      const client = getClient()
      if (!client) {
        const error = new Error('Supabase not properly configured. Please check your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).')
        console.error('[Supabase] signInWithPassword - client not initialized:', error.message)
        return { error, data: null }
      }
      try {
        const result = await withTimeout(client.auth.signInWithPassword(credentials), 8000)
        return result
      } catch (error) {
        console.error('signInWithPassword error:', error)
        const err = error instanceof Error ? error : new Error('Login failed')
        return { error: err, data: null }
      }
    },
    signUp: async (credentials: any) => {
      const client = getClient()
      if (!client) {
        const error = new Error('Supabase not properly configured. Please check your environment variables.')
        console.error('[Supabase] signUp - client not initialized:', error.message)
        return { error, data: null }
      }
      try {
        const result = await withTimeout(client.auth.signUp(credentials), 8000)
        return result
      } catch (error) {
        console.error('signUp error:', error)
        const err = error instanceof Error ? error : new Error('Signup failed')
        return { error: err, data: null }
      }
    },
    signOut: async () => {
      const client = getClient()
      if (!client) {
        const error = new Error('Supabase not properly configured.')
        console.error('[Supabase] signOut - client not initialized')
        return { error }
      }
      try {
        const result = await withTimeout(client.auth.signOut(), 5000)
        return result
      } catch (error) {
        console.error('signOut error:', error)
        return { error: error instanceof Error ? error : new Error('Logout failed') }
      }
    },
    signInWithOAuth: async (options: any) => {
      const client = getClient()
      if (!client) {
        const error = new Error('Supabase not properly configured. OAuth is not available.')
        return { error }
      }
      try {
        return await withTimeout(client.auth.signInWithOAuth(options), 10000)
      } catch (error) {
        console.error('signInWithOAuth error:', error)
        return { error }
      }
    }
  },
  from: (table: string) => {
    const client = getClient()
    if (!client) {
      return {
        select: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') })
      }
    }
    return client.from(table)
  }
})

export const supabase = createStub()
