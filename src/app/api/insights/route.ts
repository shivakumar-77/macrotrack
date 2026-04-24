import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { weeklyLogs, targets, profile } = await req.json()
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'No key' }, { status: 503 })

    const summary = weeklyLogs.map(day =>
      `${day.date}: ${Math.round(day.cal)}kcal, ${Math.round(day.protein)}g protein, ${Math.round(day.carb)}g carbs, ${Math.round(day.fat)}g fat`
    ).join('\n')

    const prompt = `You are an expert nutrition coach analyzing a week of data for a ${profile?.gender || 'person'} with goal: ${profile?.goal || 'lose weight'}.

Weekly nutrition data:
${summary}

Daily targets: ${targets.cal}kcal, ${targets.protein}g protein, ${targets.carb}g carbs, ${targets.fat}g fat

Respond ONLY with this JSON:
{
  "headline": "Short week summary (max 10 words)",
  "score": 75,
  "calories_avg": 0,
  "protein_avg": 0,
  "insights": [
    {"icon": "💪", "title": "Strength", "body": "What they did well (max 20 words)"},
    {"icon": "⚡", "title": "Opportunity", "body": "What to improve (max 20 words)"},
    {"icon": "🎯", "title": "This week focus", "body": "One specific action (max 20 words)"}
  ],
  "best_day": "Mon",
  "consistency": 80
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: prompt }] })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? '{}'
    let result
    try { result = JSON.parse(text.replace(/```json|```/g, '').trim()) } catch { result = null }
    return NextResponse.json({ result })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
