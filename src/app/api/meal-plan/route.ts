import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { targets, profile, preferences } = await req.json()
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'No key' }, { status: 503 })

    const prompt = `Create a full day meal plan for a ${profile?.gender || 'person'}, goal: ${profile?.goal || 'lose weight'}.
Targets: ${targets.cal}kcal, ${targets.protein}g protein, ${targets.carb}g carbs, ${targets.fat}g fat.
Cuisine preference: Indian / Mixed. Include common Indian foods.

Respond ONLY with this JSON:
{
  "meals": [
    {
      "type": "Breakfast",
      "time": "7:00 - 9:00 AM",
      "items": [
        {"name": "food name", "qty": "200g", "cal": 0, "protein": 0, "carb": 0, "fat": 0}
      ],
      "total_cal": 0,
      "total_protein": 0,
      "tip": "brief eating tip"
    },
    {"type": "Lunch", "time": "12:00 - 2:00 PM", "items": [...], "total_cal": 0, "total_protein": 0, "tip": "..."},
    {"type": "Snack", "time": "4:00 - 5:00 PM", "items": [...], "total_cal": 0, "total_protein": 0, "tip": "..."},
    {"type": "Dinner", "time": "7:00 - 9:00 PM", "items": [...], "total_cal": 0, "total_protein": 0, "tip": "..."}
  ],
  "day_total_cal": 0,
  "day_total_protein": 0,
  "hydration_tip": "water drinking advice"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
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
