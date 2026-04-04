import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { image, mimeType } = await req.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: image } },
            {
              type: 'text',
              text: `You are a nutrition expert. Analyze this food image carefully.
Identify all visible food items and estimate macros for the total portion shown.
Respond with ONLY this JSON (no markdown, no extra text):
{
  "name": "specific food name",
  "qty": 100,
  "unit": "g",
  "cal": 250,
  "protein": 20,
  "carb": 15,
  "fat": 10,
  "fiber": 2,
  "description": "brief description of what you see"
}
Be specific for Indian foods. Estimate realistic serving size.`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

    const text = data.content?.[0]?.text ?? ''
    let result = null
    try { result = JSON.parse(text.replace(/```json|```/g, '').trim()) } catch { result = null }
    if (!result) return NextResponse.json({ error: 'Could not parse food data. Try a clearer photo.' }, { status: 422 })

    return NextResponse.json({ result })
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
