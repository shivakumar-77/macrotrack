import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { totals, targets, logs } = await req.json()
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'No key' }, { status: 503 })

    const remaining = {
      cal: Math.max(0, targets.cal - totals.cal),
      protein: Math.max(0, targets.protein - totals.protein),
      carb: Math.max(0, targets.carb - totals.carb),
      fat: Math.max(0, targets.fat - totals.fat),
    }

    const prompt = `You are a nutrition coach. A user has eaten today:
- Calories: ${Math.round(totals.cal)} / ${targets.cal} kcal (${Math.round(remaining.cal)} remaining)
- Protein: ${Math.round(totals.protein)}g / ${targets.protein}g (${Math.round(remaining.protein)}g remaining)
- Carbs: ${Math.round(totals.carb)}g / ${targets.carb}g (${Math.round(remaining.carb)}g remaining)
- Fat: ${Math.round(totals.fat)}g / ${targets.fat}g (${Math.round(remaining.fat)}g remaining)
Foods eaten: ${logs.slice(-5).map(l => l.name).join(', ') || 'nothing yet'}

Respond ONLY with this JSON, no markdown:
{
  "tip": "One short motivational tip (max 12 words)",
  "suggestions": [
    {"name": "food name", "reason": "why (max 8 words)", "cal": 0, "protein": 0},
    {"name": "food name", "reason": "why (max 8 words)", "cal": 0, "protein": 0},
    {"name": "food name", "reason": "why (max 8 words)", "cal": 0, "protein": 0}
  ],
  "status": "on_track" | "low_protein" | "low_calories" | "over_calories" | "great"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] })
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
