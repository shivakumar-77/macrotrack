import { NextResponse } from 'next/server'

import { ALL_FOODS } from '@/lib/foodDatabase'

const FOODS = ALL_FOODS

function findMatches(query) {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []
  return FOODS.map(f => {
    const name = f.name.toLowerCase(); let score = 0
    if (name === q) score = 10
    else if (name.startsWith(q)) score = 8
    else if (name.includes(q)) score = 5
    else {
      const qw = q.split(' '), nw = name.split(' ')
      const m = qw.filter(w => nw.some(n => n.startsWith(w)))
      if (m.length === qw.length) score = 6
      else if (m.length > 0) score = m.length * 2
    }
    return { ...f, score }
  }).filter(f => f.score > 0).sort((a, b) => b.score - a.score).slice(0, 8)
}

export async function POST(req) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ results: [] })
    const matches = findMatches(query)
    if (matches.length > 0) return NextResponse.json({ results: matches })
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`)
    const data = await res.json()
    const products = (data.products ?? []).filter(p => p.nutriments && p.product_name).slice(0, 5).map(p => ({
      name: p.product_name, cal: Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
      protein: Math.round((p.nutriments.proteins_100g ?? 0) * 10) / 10,
      carb: Math.round((p.nutriments.carbohydrates_100g ?? 0) * 10) / 10,
      fat: Math.round((p.nutriments.fat_100g ?? 0) * 10) / 10,
      fiber: Math.round((p.nutriments.fiber_100g ?? 0) * 10) / 10,
      unit: 'g', baseQty: 100
    }))
    return NextResponse.json({ results: products })
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
