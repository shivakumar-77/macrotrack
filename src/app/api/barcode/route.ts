import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code')

  // Input validation
  if (!code) return NextResponse.json({ error: 'No barcode' }, { status: 400 })
  if (!/^\d{6,14}$/.test(code.trim())) {
    return NextResponse.json({ error: 'Invalid barcode format' }, { status: 400 })
  }

  try {
    const res = await fetch(
      'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code.trim()) + '.json',
      { headers: { 'User-Agent': 'MacroTrack/2.0 (contact@macrotrack.app)' }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const data = await res.json()
    if (data.status !== 1 || !data.product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const p = data.product, n = p.nutriments ?? {}
    const name = (p.product_name || p.generic_name || '').trim()
    if (!name) return NextResponse.json({ error: 'Product name missing' }, { status: 404 })

    return NextResponse.json({
      result: {
        name,
        qty: 100, unit: 'g',
        cal: Math.round(Math.max(0, n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0)),
        protein: Math.round(Math.max(0, n.proteins_100g ?? 0) * 10) / 10,
        carb: Math.round(Math.max(0, n.carbohydrates_100g ?? 0) * 10) / 10,
        fat: Math.round(Math.max(0, n.fat_100g ?? 0) * 10) / 10,
        fiber: Math.round(Math.max(0, n.fiber_100g ?? 0) * 10) / 10,
      }
    })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
