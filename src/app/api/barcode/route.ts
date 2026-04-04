import { NextResponse } from 'next/server'

export async function GET(req) {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No barcode' }, { status: 400 })
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
      headers: { 'User-Agent': 'MacroTrack/1.0' }
    })
    const data = await res.json()
    if (data.status !== 1 || !data.product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const p = data.product, n = p.nutriments ?? {}
    return NextResponse.json({
      result: {
        name: p.product_name || p.generic_name || 'Unknown product',
        qty: 100, unit: 'g',
        cal: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
        protein: Math.round((n.proteins_100g ?? n.proteins ?? 0) * 10) / 10,
        carb: Math.round((n.carbohydrates_100g ?? n.carbohydrates ?? 0) * 10) / 10,
        fat: Math.round((n.fat_100g ?? n.fat ?? 0) * 10) / 10,
        fiber: Math.round((n.fiber_100g ?? n.fiber ?? 0) * 10) / 10,
      }
    })
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
