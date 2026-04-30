import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { targets, profile, preferences, customPrompt } = await req.json()
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'No key' }, { status: 503 })

    const prompt = customPrompt || `Create a full day meal plan for a ${profile?.gender||'person'}, goal: ${profile?.goal||'lose weight'}.
Targets: ${targets.cal}kcal, ${targets.protein}g protein, ${targets.carb}g carbs, ${targets.fat}g fat.
Cuisine: Indian / Mixed. Return valid JSON only with meals array containing Breakfast, Lunch, Snack, Dinner.
Each meal has: type, time, emoji, items (name,qty,cal,protein,carb,fat,note), total_cal, total_protein, total_carb, total_fat, tip.
Also include: summary, day_total_cal, day_total_protein, shopping_list, hydration_tip, pro_tip.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body: JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:2500,
        messages:[{role:'user',content:prompt+'\n\nReturn ONLY valid JSON. No markdown, no explanation.'}]
      })
    })

    if (!response.ok) return NextResponse.json({ error: 'AI error' }, { status: 502 })
    const data = await response.json()
    const text = data.content?.[0]?.text??''
    let result = null
    try {
      const clean = text.replace(/```json|```/g,'').trim()
      result = JSON.parse(clean)
    } catch { result = null }
    if (!result?.meals) return NextResponse.json({ error: 'Could not generate plan' }, { status: 422 })
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
