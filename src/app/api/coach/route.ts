import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/server/supabase'
import { getKayvenIntelligenceContext } from '@/lib/server/kayven-intelligence-context'
import { AIProvider } from '@/lib/server/ai-provider'
import { AnthropicProvider, OpenAIProvider } from '@/lib/server/ai-providers'

export const dynamic = 'force-dynamic'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function provider(): AIProvider {
  return process.env.AI_PROVIDER === 'openai' ? new OpenAIProvider() : new AnthropicProvider()
}

function contextRange(message: string): 'today' | '7d' | '30d' {
  return /weight|lose|losing|trend|progress|month|30 day|30-day/i.test(message) ? '30d'
    : /week|weekly|workout|training|consistent/i.test(message) ? '7d'
      : 'today'
}

function compactContext(context: any) {
  return {
    range: context.range,
    user: { profile: context.user.profile, goals: context.user.goals, preferences: context.user.preferences },
    nutrition: {
      today: context.nutrition.today,
      targets: { calories: context.nutrition.calorieTarget, proteinG: context.nutrition.proteinTarget },
      recentMeals: context.nutrition.recentMeals.slice(0, 20),
      weeklySummary: context.nutrition.weeklySummary
    },
    body: { currentWeightKg: context.body.currentWeightKg, weightTrendKg: context.body.weightTrendKg, weights: context.body.weights },
    fitness: { recentWorkouts: context.fitness.recentWorkouts.slice(0, 12), workoutFrequency: context.fitness.workoutFrequency },
    hydration: context.hydration,
    mealPlanning: context.mealPlanning,
    supplements: context.supplements
  }
}

function systemPrompt() {
  return `You are KAYVEN Coach, a concise nutrition and fitness companion. Use only the supplied KAYVEN context and conversation. Never invent logged meals, targets, preferences, workouts, or health facts. When data is missing, say what is unavailable. Prefer: Observation, Recommendation, Action. Give practical general nutrition and fitness guidance, not diagnoses or medical treatment. Do not claim to be a doctor or dietitian. For potentially serious medical questions, recommend a qualified healthcare professional. Do not tell anyone to stop prescribed medication. Keep replies under 180 words. When useful, end with one or two action labels in this exact format: ACTIONS: [Build dinner] [Review my week].`
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), timeoutMs))])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const messages = Array.isArray(body?.messages) ? body.messages : []
    if (!message || message.length > 1200) return NextResponse.json({ error: 'Please enter a question under 1,200 characters.' }, { status: 400 })

    const conversation: ChatMessage[] = messages
      .filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string')
      .slice(-8)
      .map((item: any) => ({ role: item.role, content: item.content.slice(0, 1200) }))
    conversation.push({ role: 'user', content: message })

    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Please sign in to use KAYVEN Coach.' }, { status: 401 })

    const context = await getKayvenIntelligenceContext(supabase, user.id, { range: contextRange(message) })
    const history = conversation.slice(0, -1).map(item => `${item.role === 'user' ? 'User' : 'Coach'}: ${item.content}`).join('\n')
    const prompt = `KAYVEN CONTEXT (range: ${context.range}):\n${JSON.stringify(compactContext(context))}\n\nCONVERSATION:\n${history || '(new conversation)'}\n\nUSER QUESTION:\n${message}`
    const response = await withTimeout(provider().generateResponse({ system: systemPrompt(), prompt, maxTokens: 350 }), 30000)
    if (!response.trim()) throw new Error('AI returned an empty response')

    const actionMatch = response.match(/ACTIONS:\s*(.*)$/i)
    const actions = actionMatch ? Array.from(actionMatch[1].matchAll(/\[([^\]]+)\]/g)).map(match => match[1]).slice(0, 2) : []
    const answer = response.replace(/\s*ACTIONS:\s*.*$/i, '').trim()
    console.info('[Kayven Coach] Response generated', { provider: process.env.AI_PROVIDER === 'openai' ? 'openai' : 'anthropic', range: context.range })
    return NextResponse.json({ answer, actions })
  } catch (error) {
    console.error('[Kayven Coach] Request failed', { message: error instanceof Error ? error.message : 'Unknown error' })
    const timedOut = error instanceof Error && error.message.includes('timed out')
    return NextResponse.json({ error: timedOut ? 'The Coach took too long to respond. Please try again.' : 'The Coach is unavailable right now. Please try again.' }, { status: timedOut ? 504 : 502 })
  }
}