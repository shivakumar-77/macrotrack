import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const cat = req.nextUrl.searchParams.get('cat') || ''
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0')
  const limit = 20

  if (!q && !cat) return NextResponse.json({ results: [] })

  try {
    let query = supabase
      .from('foods')
      .select('id,name,name_local,category,cal,protein,carb,fat,fiber,serving_size,serving_unit,brand,is_indian')
      .range(page * limit, (page + 1) * limit - 1)

    if (q) {
      // Full text search + name_local for Indian names
      query = query.or(`name.ilike.%${q}%,name_local.ilike.%${q}%`)
    }
    if (cat) {
      query = query.eq('category', cat)
    }

    query = query.order('is_indian', { ascending: false }).order('name')

    const { data: localResults, error } = await query

    let combined: any[] = localResults || []

    // If fewer than 10 local results and has query, also fetch OpenFoodFacts
    if (q && combined.length < 10) {
      try {
        const offRes = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,serving_size,brands`,
          { signal: AbortSignal.timeout(3000) }
        )
        if (offRes.ok) {
          const offData = await offRes.json()
          const offFoods = (offData.products || [])
            .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'])
            .slice(0, 10)
            .map((p: any) => ({
              id: 'off_' + p.code,
              name: p.product_name,
              name_local: null,
              category: 'Packaged Foods',
              brand: p.brands || null,
              cal: Math.round(p.nutriments['energy-kcal_100g'] || 0),
              protein: Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
              carb: Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
              fat: Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
              fiber: Math.round((p.nutriments['fiber_100g'] || 0) * 10) / 10,
              serving_size: 100,
              serving_unit: 'g',
              is_indian: false,
              source: 'openfoodfacts'
            }))
          combined = [...combined, ...offFoods]
        }
      } catch {}
    }

    return NextResponse.json({ results: combined, page, hasMore: (localResults?.length || 0) === limit })
  } catch (err) {
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
