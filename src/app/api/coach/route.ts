import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/server/supabase'
import { getKayvenIntelligenceContext } from '@/lib/server/kayven-intelligence-context'
import {
  buildKAYVENPrompt,
  classifyKayvenIntent,
  getDefaultReadTools,
  getKAYVENMemory,
  getKAYVENSystemPrompt,
  selectKAYVENProvider,
  attemptDeterministicToolResponse,
} from '@/lib/server/kayven-intelligence-engine'
import { validateKAYVENSafety } from '@/lib/server/kayven-safety'
import { globalKAYVENCostTracker, createCostMetadata } from '@/lib/server/kayven-cost-tracking'
import type { KAYVENAIRequest, KAYVENMessage } from '@/lib/server/kayven-ai'

export const dynamic = 'force-dynamic'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function contextRange(message: string): 'today' | '7d' | '30d' {
  return /weight|lose|losing|trend|progress|month|30 day|30-day/i.test(message) ? '30d'
    : /week|weekly|workout|training|consistent/i.test(message) ? '7d'
      : 'today'
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), timeoutMs))])
}

async function loadConversationHistory(supabase: any, userId: string, conversationId?: string | null, clientMessages?: any[]) {
  const normalized: ChatMessage[] = Array.isArray(clientMessages)
    ? clientMessages.filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string')
        .slice(-8)
        .map((item: any) => ({ role: item.role, content: item.content.slice(0, 1200) }))
    : []

  if (normalized.length > 0) return normalized
  if (!conversationId) return []

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('role,content')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (error) return []
    return (data || []).map((row: any) => ({ role: row.role, content: String(row.content || '').slice(0, 1200) })).filter((row: ChatMessage) => row.role === 'user' || row.role === 'assistant')
  } catch {
    return []
  }
}

async function ensureConversation(supabase: any, userId: string, conversationId?: string | null, title?: string) {
  if (!conversationId) {
    try {
      const { data, error } = await supabase.from('conversations').insert({
        user_id: userId,
        title: title || 'KAYVEN Coach'
      }).select('id').single()
      if (!error && data?.id) return data.id
    } catch {
      return null
    }
    return null
  }

  try {
    const { data, error } = await supabase.from('conversations').select('id').eq('id', conversationId).eq('user_id', userId).maybeSingle()
    if (!error && data?.id) return data.id
    if (error) return null
  } catch {
    return null
  }

  return null
}

async function persistConversationTurn(supabase: any, userId: string, conversationId: string | null, userMessage: string, assistantMessage: string) {
  const effectiveConversationId = await ensureConversation(supabase, userId, conversationId, userMessage.slice(0, 80))
  if (!effectiveConversationId) return null

  try {
    await supabase.from('messages').insert([
      { conversation_id: effectiveConversationId, user_id: userId, role: 'user', content: userMessage.slice(0, 1200) },
      { conversation_id: effectiveConversationId, user_id: userId, role: 'assistant', content: assistantMessage.slice(0, 1200) }
    ])
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', effectiveConversationId)
  } catch {
    return null
  }

  return effectiveConversationId
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const conversationId = typeof body?.conversationId === 'string' && body.conversationId.trim() ? body.conversationId.trim() : null
    if (!message || message.length > 1200) return NextResponse.json({ error: 'Please enter a question under 1,200 characters.' }, { status: 400 })

    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Please sign in to use KAYVEN Coach.' }, { status: 401 })

    const conversation: ChatMessage[] = await loadConversationHistory(supabase, user.id, conversationId, messages)
    conversation.push({ role: 'user', content: message })

    const range = contextRange(message)
    const context = await getKayvenIntelligenceContext(supabase, user.id, { range })
    const memory = getKAYVENMemory(context as any)
    const intent = classifyKayvenIntent(message)
    const safety = validateKAYVENSafety(message)

    const kyRequest: KAYVENAIRequest = {
      user: {
        id: user.id,
        email: user.email || null,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || null,
      },
      message,
      conversationId,
      context: { ...context, memory },
      conversationHistory: conversation.map((item: ChatMessage) => ({ role: item.role, content: item.content } as KAYVENMessage)),
      availableTools: getDefaultReadTools(),
      safetyConstraints: [
        { category: 'medical', mode: safety.status === 'allowed' ? 'allow' : safety.status === 'constrained' ? 'restrict' : 'escalate', message: safety.reasons[0] },
        { category: 'nutrition', mode: 'allow', message: 'Use real logged data only' },
        { category: 'data_use', mode: 'allow', message: 'Never invent or disclose hidden data' }
      ],
      responseMode: 'chat',
      intent,
    }

    let kayvenResponse = await attemptDeterministicToolResponse(kyRequest, supabase)
    let costMetadata = createCostMetadata({ usedAI: false, toolUsed: kayvenResponse?.metadata?.toolUsed, intent, executionPath: kayvenResponse ? 'deterministic_tool' : 'ai_fallback' })

    if (!kayvenResponse) {
      const provider = selectKAYVENProvider(intent)
      const prompt = buildKAYVENPrompt(kyRequest)
      const aiResponse = await withTimeout(provider.generateResponse({ system: getKAYVENSystemPrompt(), prompt, maxTokens: 350 }), 30000)
      if (!aiResponse.trim()) throw new Error('AI returned an empty response')

      const actionMatch = aiResponse.match(/ACTIONS:\s*(.*)$/i)
      const actions = actionMatch ? Array.from(actionMatch[1].matchAll(/\[([^\]]+)\]/g)).map(match => match[1]).slice(0, 2) : []
      const answer = aiResponse.replace(/\s*ACTIONS:\s*.*$/i, '').trim()

      kayvenResponse = {
        text: answer,
        safetyStatus: 'allowed',
        provider: { name: provider.name, model: process.env.ANTHROPIC_MODEL || process.env.OPENAI_MODEL || 'default' },
        metadata: { usedAI: true, provider: provider.name, intent, executionPath: 'ai_fallback' }
      }
    }

    globalKAYVENCostTracker.recordRequest(costMetadata)
    const answer = kayvenResponse.text
    const actions = kayvenResponse.metadata?.executionPath === 'ai_fallback' ? answer.match(/ACTIONS:\s*(.*)$/i)?.[1]?.match(/\[([^\]]+)\]/g)?.map(m => m.slice(1, -1)) || [] : []

    const persistedConversationId = await persistConversationTurn(supabase, user.id, conversationId, message, answer)
    const executionPath = kayvenResponse.metadata?.executionPath || 'unknown'
    const toolUsed = kayvenResponse.metadata?.toolUsed || undefined
    console.info('[Kayven Coach] Response generated', { executionPath, toolUsed, provider: kayvenResponse.provider.name, range, intent, conversationId: persistedConversationId || conversationId || 'new' })
    return NextResponse.json({ answer, actions, conversationId: persistedConversationId || conversationId || null, provider: kayvenResponse.provider.name })
  } catch (error) {
    console.error('[Kayven Coach] Request failed', { message: error instanceof Error ? error.message : 'Unknown error' })
    const timedOut = error instanceof Error && error.message.includes('timed out')
    return NextResponse.json({ error: timedOut ? 'The Coach took too long to respond. Please try again.' : 'The Coach is unavailable right now. Please try again.' }, { status: timedOut ? 504 : 502 })
  }
}