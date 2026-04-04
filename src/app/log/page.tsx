'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import BarcodeScanner from '@/components/BarcodeScanner'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other']
const today = () => new Date().toISOString().slice(0, 10)

function scale(food, qty) {
  const r = qty / food.baseQty
  return { ...food, qty, cal: Math.round(food.cal * r), protein: Math.round(food.protein * r * 10) / 10, carb: Math.round(food.carb * r * 10) / 10, fat: Math.round(food.fat * r * 10) / 10, fiber: Math.round(food.fiber * r * 10) / 10 }
}

export default function LogPage() {
  const router = useRouter()
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(1)
  const [mealType, setMealType] = useState('other')
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [manual, setManual] = useState({ name: '', qty: '1', unit: 'piece', cal: '', protein: '', carb: '', fat: '', fiber: '' })
  const fileRef = useRef(null)
  const debounceRef = useRef(null)

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

  function selectFood(food) { setSelected(food); setQty(food.baseQty); setResults([]); setQuery(food.name) }
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
    setSaving(false); router.push('/dashboard')
  }

  async function logManual() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('food_logs').insert({
      user_id: user.id, logged_at: today(), name: manual.name || 'Custom food',
      qty: parseFloat(manual.qty) || 1, unit: manual.unit,
      cal: parseFloat(manual.cal) || 0, protein: parseFloat(manual.protein) || 0,
      carb: parseFloat(manual.carb) || 0, fat: parseFloat(manual.fat) || 0,
      fiber: parseFloat(manual.fiber) || 0, meal_type: mealType
    })
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
    } catch { } finally { setSearching(false) }
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

  const QtyPicker = ({ food }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Quantity ({food.unit})
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <button onClick={() => setQty(q => Math.max(food.unit === 'piece' || food.unit === 'scoop' ? 1 : 10, q - (food.unit === 'piece' || food.unit === 'scoop' ? 1 : 10)))}
          style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-bg)', border: '1.5px solid var(--primary)', color: 'var(--primary)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>−</button>
        <input type="number" value={qty} onChange={e => setQty(Math.max(0, parseFloat(e.target.value) || 0))}
          style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, flex: 1, color: 'var(--primary)' }} />
        <button onClick={() => setQty(q => q + (food.unit === 'piece' || food.unit === 'scoop' ? 1 : 10))}
          style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(food.unit === 'g' || food.unit === 'ml' ? [50, 100, 150, 200, 250, 300] : [1, 2, 3, 4, 5]).map(v => (
          <button key={v} onClick={() => setQty(v)}
            style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${qty === v ? 'var(--primary)' : 'var(--border)'}`, background: qty === v ? 'var(--primary-bg)' : 'transparent', color: qty === v ? 'var(--primary)' : 'var(--muted)' }}>
            {v}{food.unit}
          </button>
        ))}
      </div>
    </div>
  )

  const MealPicker = () => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add to meal</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MEAL_TYPES.map(m => (
          <button key={m} onClick={() => setMealType(m)}
            style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${mealType === m ? 'var(--primary)' : 'var(--border)'}`, background: mealType === m ? 'var(--primary)' : 'transparent', color: mealType === m ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )

  const tabs = [
    { id: 'search', label: 'Search', emoji: '🔍' },
    { id: 'scan', label: 'AI Scan', emoji: '📷' },
    { id: 'barcode', label: 'Barcode', emoji: '📦' },
    { id: 'manual', label: 'Manual', emoji: '✏️' },
  ]

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>Log food</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 12, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${tab === t.id ? 'var(--primary)' : 'var(--border)'}`, background: tab === t.id ? 'var(--primary)' : 'var(--card)', color: tab === t.id ? '#fff' : 'var(--muted)' }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      {tab === 'search' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input placeholder="Search food — egg, chicken, dosa, dal…" value={query} onChange={e => onQueryChange(e.target.value)} autoFocus />
            {query && <button onClick={() => { setQuery(''); setResults([]); setSelected(null) }}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>×</button>}
          </div>

          {results.length > 0 && !selected && (
            <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => selectFood(r)}
                  style={{ width: '100%', padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>per {r.baseQty}{r.unit} · <strong style={{ color: 'var(--primary)' }}>{r.cal} kcal</strong> · {r.protein}g protein</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          )}

          {searching && <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Searching…</p>}

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
                <MacroBadges p={preview} />
                <QtyPicker food={selected} />
                <MealPicker />
                <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700 }} onClick={logFood} disabled={saving}>
                  {saving ? 'Saving…' : `Add ${preview.cal} kcal to ${mealType}`}
                </button>
              </div>
            </div>
          )}

          {!query && !selected && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <div style={{ width: 64, height: 64, background: 'var(--primary-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🥗</div>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Search any food</p>
              <p style={{ fontSize: 13 }}>egg, chicken, rice, dal, roti, dosa…</p>
            </div>
          )}
        </div>
      )}

      {/* AI SCAN */}
      {tab === 'scan' && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={scanPhoto} style={{ display: 'none' }} />

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
              {photoPreview && <img src={photoPreview} alt="Food" style={{ width: '100%', borderRadius: 20, marginBottom: 20, maxHeight: 280, objectFit: 'cover' }} />}
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>AI is analysing your food…</p>
            </div>
          )}

          {scanError && !scanning && (
            <div>
              {photoPreview && <img src={photoPreview} alt="Food" style={{ width: '100%', borderRadius: 20, marginBottom: 16, maxHeight: 280, objectFit: 'cover' }} />}
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ color: '#dc2626', fontSize: 13 }}>{scanError}</p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setPhotoPreview(null); setScanError(''); fileRef.current?.click() }}>Try again</button>
            </div>
          )}

          {selected && preview && !scanning && tab === 'scan' && (
            <div className="slide-up">
              {photoPreview && <img src={photoPreview} alt="Food" style={{ width: '100%', borderRadius: 20, marginBottom: 16, maxHeight: 240, objectFit: 'cover' }} />}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ background: '#d1fae5', color: '#059669', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>AI IDENTIFIED</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{selected.name}</div>
                {selected.description && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{selected.description}</p>}
                <MacroBadges p={preview} />
                <QtyPicker food={selected} />
                <MealPicker />
                <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700 }} onClick={logFood} disabled={saving}>
                  {saving ? 'Saving…' : `Add ${preview.cal} kcal to ${mealType}`}
                </button>
                <button onClick={() => { setSelected(null); setPhotoPreview(null); setScanError(''); fileRef.current?.click() }}
                  style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  Scan another food
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BARCODE */}
      {tab === 'barcode' && (
        <BarcodeScanner onResult={f => { setSelected({ ...f, baseQty: f.qty }); setQty(f.qty); setTab('search') }} />
      )}

      {/* MANUAL */}
      {tab === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Food name</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="e.g. Chicken tikka, Masala dosa…" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }} />
              <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '12px 16px', fontSize: 13 }} disabled={!manual.name || searching} onClick={autoFill}>
                {searching ? '…' : 'Auto-fill'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>Tap Auto-fill to get macros automatically</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</label>
              <input type="number" value={manual.qty} onChange={e => setManual(p => ({ ...p, qty: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</label>
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
                <label style={{ fontSize: 12, fontWeight: 700, color: f.c, display: 'block', marginBottom: 6 }}>{f.l}</label>
                <input type="number" placeholder="0" value={manual[f.k]} onChange={e => setManual(p => ({ ...p, [f.k]: e.target.value }))} />
              </div>
            ))}
          </div>

          <MealPicker />
          <button className="btn btn-primary" style={{ padding: '15px', fontSize: 15, fontWeight: 700 }} onClick={logManual} disabled={saving}>
            {saving ? 'Saving…' : 'Add to log'}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
