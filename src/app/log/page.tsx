'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import BarcodeScanner from '@/components/BarcodeScanner'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other']
const today = () => new Date().toISOString().slice(0, 10)
const HISTORY_KEY = 'macrotrack_food_history'

function scale(food, qty) {
  const r = qty / food.baseQty
  return { ...food, qty, cal: Math.round(food.cal * r), protein: Math.round(food.protein * r * 10) / 10, carb: Math.round(food.carb * r * 10) / 10, fat: Math.round(food.fat * r * 10) / 10, fiber: Math.round(food.fiber * r * 10) / 10 }
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(item) {
  try {
    const h = getHistory().filter(i => i.name !== item.name)
    h.unshift(item)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)))
  } catch {}
}

export default function LogPage() {
  const router = useRouter()
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [history, setHistory] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(100)
  const [mealType, setMealType] = useState('other')
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [manual, setManual] = useState({ name: '', qty: '100', unit: 'g', cal: '', protein: '', carb: '', fat: '', fiber: '' })
  const fileRef = useRef(null)
  const debounceRef = useRef(null)
  const qtyRef = useRef(null)

  useEffect(() => { setHistory(getHistory()) }, [])

  function onQueryChange(val) {
    setQuery(val); setSelected(null)
    clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(() => searchFood(val), 300)
  }

  async function searchFood(q) {
    setSearching(true)
    try {
      const res = await fetch('/api/meal-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
      const data = await res.json()
      setResults(data.results ?? [])
    } catch { setResults([]) } finally { setSearching(false) }
  }

  function selectFood(food) {
    setSelected(food); setQty(food.baseQty); setResults([]); setQuery(food.name)
  }

  function selectHistory(food) {
    setSelected({ ...food, baseQty: food.baseQty || 100 })
    setQty(food.baseQty || 100)
    setQuery(food.name)
    setResults([])
  }

  const preview = selected ? scale(selected, qty) : null

  async function logFood() {
    if (!preview) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    await supabase.from('food_logs').insert({
      user_id: user.id, logged_at: today(), name: preview.name, qty: preview.qty, unit: preview.unit,
      cal: preview.cal, protein: preview.protein, carb: preview.carb, fat: preview.fat, fiber: preview.fiber, meal_type: mealType
    })
    saveHistory({ ...selected, baseQty: selected.baseQty })
    setHistory(getHistory())
    setSaving(false); router.push('/dashboard')
  }

  async function logManual() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    const entry = {
      user_id: user.id, logged_at: today(), name: manual.name || 'Custom food',
      qty: parseFloat(manual.qty) || 1, unit: manual.unit,
      cal: parseFloat(manual.cal) || 0, protein: parseFloat(manual.protein) || 0,
      carb: parseFloat(manual.carb) || 0, fat: parseFloat(manual.fat) || 0,
      fiber: parseFloat(manual.fiber) || 0, meal_type: mealType
    }
    await supabase.from('food_logs').insert(entry)
    saveHistory({ name: entry.name, cal: entry.cal, protein: entry.protein, carb: entry.carb, fat: entry.fat, fiber: entry.fiber, unit: entry.unit, baseQty: entry.qty })
    setSaving(false); router.push('/dashboard')
  }

  async function autoFill() {
    if (!manual.name) return
    setSearching(true)
    try {
      const res = await fetch('/api/meal-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: manual.name }) })
      const data = await res.json()
      if (data.results?.[0]) {
        const f = data.results[0]
        setManual(p => ({ ...p, cal: String(f.cal), protein: String(f.protein), carb: String(f.carb), fat: String(f.fat), fiber: String(f.fiber), unit: f.unit, qty: String(f.baseQty) }))
      }
    } catch {} finally { setSearching(false) }
  }

  async function scanPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    setScanError(''); setScanning(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1]
      setPhotoPreview(ev.target.result)
      try {
        const res = await fetch('/api/ai-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, mimeType: file.type }) })
        const data = await res.json()
        if (data.result) { setSelected({ ...data.result, baseQty: data.result.qty }); setQty(data.result.qty) }
        else setScanError(data.error || 'Could not identify food. Try a clearer photo.')
      } catch { setScanError('Scan failed. Try again.') }
      finally { setScanning(false) }
    }
    reader.readAsDataURL(file); e.target.value = ''
  }

  const MacroBadges = ({ p }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
      {[{ l: 'Cal', v: p.cal, u: 'kcal', c: '#6366f1', bg: '#eef2ff' }, { l: 'Protein', v: p.protein, u: 'g', c: '#3b82f6', bg: '#dbeafe' }, { l: 'Carbs', v: p.carb, u: 'g', c: '#f59e0b', bg: '#fef3c7' }, { l: 'Fat', v: p.fat, u: 'g', c: '#ef4444', bg: '#fee2e2' }].map(m => (
        <div key={m.l} style={{ background: m.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: m.c, fontWeight: 600, marginBottom: 3 }}>{m.l}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{m.v}</div>
          <div style={{ fontSize: 10, color: m.c, opacity: 0.7 }}>{m.u}</div>
        </div>
      ))}
    </div>
  )

  // KEY FIX: qty input uses type=text + inputMode to prevent keyboard dismiss
  const QtyPicker = ({ food }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Quantity ({food.unit})
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <button onClick={() => setQty(q => Math.max(food.unit === 'piece' || food.unit === 'scoop' ? 1 : 10, q - (food.unit === 'piece' || food.unit === 'scoop' ? 1 : 10)))}
          style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-bg)', border: '1.5px solid var(--primary)', color: 'var(--primary)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>−</button>
        <input
          type="text"
          inputMode="decimal"
          value={qty}
          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) setQty(v) }}
          style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, flex: 1, color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 12, padding: '10px', background: 'var(--primary-bg)', outline: 'none' }}
        />
        <button onClick={() => setQty(q => q + (food.unit === 'piece' || food.unit === 'scoop' ? 1 : 10))}
          style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(food.unit === 'g' || food.unit === 'ml' ? [50, 100, 150, 200, 250, 300] : [1, 2, 3, 4, 5]).map(v => (
          <button key={v} onClick={() => setQty(v)}
            style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid ' + (qty === v ? 'var(--primary)' : 'var(--border)'), background: qty === v ? 'var(--primary-bg)' : 'transparent', color: qty === v ? 'var(--primary)' : 'var(--muted)' }}>
            {v}{food.unit}
          </button>
        ))}
      </div>
    </div>
  )

  const MealPicker = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add to meal</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MEAL_TYPES.map(m => (
          <button key={m} onClick={() => setMealType(m)}
            style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid ' + (mealType === m ? 'var(--primary)' : 'var(--border)'), background: mealType === m ? 'var(--primary)' : 'transparent', color: mealType === m ? '#fff' : 'var(--muted)' }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )

  const FoodResult = ({ food, onSelect }) => (
    <button onClick={() => onSelect(food)}
      style={{ width: '100%', padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{food.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>per {food.baseQty}{food.unit} · <strong style={{ color: 'var(--primary)' }}>{food.cal} kcal</strong> · {food.protein}g protein</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  )

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>Log food</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {[{ id: 'search', e: '🔍', l: 'Search' }, { id: 'scan', e: '📷', l: 'AI Scan' }, { id: 'barcode', e: '📦', l: 'Barcode' }, { id: 'manual', e: '✏️', l: 'Manual' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 12, whiteSpace: 'nowrap', cursor: 'pointer', border: '1.5px solid ' + (tab === t.id ? 'var(--primary)' : 'var(--border)'), background: tab === t.id ? 'var(--primary)' : 'var(--card)', color: tab === t.id ? '#fff' : 'var(--muted)' }}>
            {t.e} {t.l}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      {tab === 'search' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Search food — egg, chicken, dosa, dal…"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              autoFocus
            />
            {query && <button onClick={() => { setQuery(''); setResults([]); setSelected(null) }}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>}
          </div>

          {/* Search results */}
          {results.length > 0 && !selected && (
            <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              {results.map((r, i) => <FoodResult key={i} food={r} onSelect={selectFood}/>)}
            </div>
          )}

          {searching && <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Searching…</p>}

          {/* Recent history — show when no query */}
          {!query && !selected && history.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🕐 Recent</div>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {history.slice(0, 8).map((h, i) => <FoodResult key={i} food={h} onSelect={selectHistory}/>)}
              </div>
            </div>
          )}

          {!query && !selected && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <div style={{ width: 64, height: 64, background: 'var(--primary-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🥗</div>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Search any food</p>
              <p style={{ fontSize: 13 }}>egg, chicken, rice, dal, roti, dosa…</p>
            </div>
          )}

          {selected && preview && (
            <div className="slide-up">
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>per {selected.baseQty} {selected.unit}</div>
                  </div>
                  <button onClick={() => { setSelected(null); setQuery('') }}
                    style={{ background: 'var(--card2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>×</button>
                </div>
                <MacroBadges p={preview}/>
                <QtyPicker food={selected}/>
                <MealPicker/>
                <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700 }} onClick={logFood} disabled={saving}>
                  {saving ? 'Saving…' : 'Add ' + preview.cal + ' kcal to ' + mealType}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI SCAN */}
      {tab === 'scan' && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={scanPhoto} style={{ display: 'none' }}/>
          {!photoPreview && !selected && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 80, height: 80, background: 'var(--primary-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>📷</div>
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>AI Food Scanner</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>Take a photo of your meal — AI identifies the food and calculates macros automatically</p>
              <button className="btn btn-primary pulse-primary" style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 700 }} onClick={() => fileRef.current?.click()}>
                Take photo of food
              </button>
            </div>
          )}
          {scanning && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {photoPreview && <img src={photoPreview} alt="Food" style={{ width: '100%', borderRadius: 20, marginBottom: 20, maxHeight: 280, objectFit: 'cover' }}/>}
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}/>
              <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>AI is analysing your food…</p>
            </div>
          )}
          {scanError && !scanning && (
            <div>
              {photoPreview && <img src={photoPreview} alt="Food" style={{ width: '100%', borderRadius: 20, marginBottom: 16, maxHeight: 280, objectFit: 'cover' }}/>}
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ color: '#dc2626', fontSize: 13 }}>{scanError}</p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setPhotoPreview(null); setScanError(''); fileRef.current?.click() }}>Try again</button>
            </div>
          )}
          {selected && preview && !scanning && tab === 'scan' && (
            <div className="slide-up">
              {photoPreview && <img src={photoPreview} alt="Food" style={{ width: '100%', borderRadius: 20, marginBottom: 16, maxHeight: 240, objectFit: 'cover' }}/>}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: '#d1fae5', color: '#059669', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>AI IDENTIFIED</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{selected.name}</div>
                {selected.description && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{selected.description}</p>}
                <MacroBadges p={preview}/>
                <QtyPicker food={selected}/>
                <MealPicker/>
                <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700 }} onClick={logFood} disabled={saving}>
                  {saving ? 'Saving…' : 'Add ' + preview.cal + ' kcal to ' + mealType}
                </button>
                <button onClick={() => { setSelected(null); setPhotoPreview(null); setScanError(''); fileRef.current?.click() }}
                  style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>
                  Scan another food
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BARCODE */}
      {tab === 'barcode' && (
        <BarcodeScanner onResult={f => { setSelected({ ...f, baseQty: f.qty }); setQty(f.qty); setTab('search') }}/>
      )}

      {/* MANUAL */}
      {tab === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Food name</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="e.g. Chicken tikka, Masala dosa…" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }}/>
              <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '12px 16px', fontSize: 13 }} disabled={!manual.name || searching} onClick={autoFill}>
                {searching ? '…' : 'Auto-fill'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
              <input type="text" inputMode="decimal" value={manual.qty} onChange={e => setManual(p => ({ ...p, qty: e.target.value }))}/>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</div>
              <select value={manual.unit} onChange={e => setManual(p => ({ ...p, unit: e.target.value }))}>
                <option value="piece">piece / egg</option>
                <option value="g">grams (g)</option>
                <option value="ml">ml</option>
                <option value="scoop">scoop</option>
                <option value="slice">slice</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ l: 'Calories (kcal)', k: 'cal', c: '#6366f1' }, { l: 'Protein (g)', k: 'protein', c: '#3b82f6' }, { l: 'Carbs (g)', k: 'carb', c: '#f59e0b' }, { l: 'Fat (g)', k: 'fat', c: '#ef4444' }, { l: 'Fiber (g)', k: 'fiber', c: '#10b981' }].map(f => (
              <div key={f.k}>
                <div style={{ fontSize: 12, fontWeight: 700, color: f.c, marginBottom: 6 }}>{f.l}</div>
                <input type="text" inputMode="decimal" placeholder="0" value={manual[f.k]} onChange={e => setManual(p => ({ ...p, [f.k]: e.target.value }))}/>
              </div>
            ))}
          </div>
          <MealPicker/>
          <button className="btn btn-primary" style={{ padding: '15px', fontSize: 15, fontWeight: 700 }} onClick={logManual} disabled={saving}>
            {saving ? 'Saving…' : 'Add to log'}
          </button>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
