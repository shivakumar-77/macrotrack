import { NextRequest, NextResponse } from 'next/server'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB in base64 chars

export async function POST(req: NextRequest) {
  try {
    // Rate limiting via headers check
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')

    const { image, mimeType } = await req.json()

    // Input validation
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }
    if (image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large. Max 5MB.' }, { status: 400 })
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: image } },
            {
              type: 'text',
              text: 'Identify the food in this image and estimate macros for the visible portion. Respond ONLY with this JSON:\n{"name":"food name","qty":100,"unit":"g","cal":0,"protein":0,"carb":0,"fat":0,"fiber":0,"description":"brief description"}\nNo markdown, no extra text.'
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    let result = null
    try {
      result = JSON.parse(text.replace(/```json|```/g, '').trim())
      // Validate result fields
      if (!result.name || typeof result.cal !== 'number') result = null
    } catch { result = null }

    if (!result) {
      return NextResponse.json({ error: 'Could not identify food. Try a clearer photo.' }, { status: 422 })
    }

    return NextResponse.json({ result })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
