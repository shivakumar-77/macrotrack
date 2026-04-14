'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function ProgressPage() {
  const router = useRouter()
  const [weights, setWeights] = useState([])
  const [foodStreak, setFoodStreak] = useState({ current: 0, longest: 0, dates: [] })
  const [waterStreak, setWaterStreak] = useState({ current: 0, longest: 0, dates: [] })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState({ before: null, after: null })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      const [{ data: prof }, { data: wlogs }, { data: flogs }, { data: watlogs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }).limit(30),
        supabase.from('food_logs').select('logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }),
        supabase.from('water_logs').select('logged_at,amount_ml').eq('user_id', user.id).order('logged_at', { ascending: false }),
      ])
      if (prof) setProfile(prof)
      if (wlogs) setWeights(wlogs)
      if (flogs) setFoodStreak(calcStreak([...new Set(flogs.map(l => l.logged_at))]))
      if (watlogs) {
        const grouped = {}
        watlogs.forEach(l => { grouped[l.logged_at] = (grouped[l.logged_at] || 0) + l.amount_ml })
        const goal = prof?.water_goal || 2000
        setWaterStreak(calcStreak(Object.entries(grouped).filter(([, v]) => v >= goal).map(([k]) => k)))
      }
      setLoading(false)
    }
    load()
  }, [])

  function calcStreak(dates) {
    if (!dates.length) return { current: 0, longest: 0, dates: [] }
    const sorted = [...dates].sort((a, b) => b.localeCompare(a))
    const set = new Set(sorted)
    const todayStr = new Date().toISOString().slice(0, 10)
    const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    let current = 0
    if (set.has(todayStr) || set.has(yestStr)) {
      let d = new Date(set.has(todayStr) ? todayStr : yestStr)
      while (set.has(d.toISOString().slice(0, 10))) { current++; d.setDate(d.getDate() - 1) }
    }
    let longest = 0, streak = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i-1]) - new Date(sorted[i])) / 86400000
      if (diff === 1) { streak++; longest = Math.max(longest, streak) } else streak = 1
    }
    return { current, longest: Math.max(longest, streak, current), dates: sorted }
  }

  const latest = weights[weights.length - 1]
  const first = weights[0]
  const change = weights.length >= 2 ? (latest.weight_kg - first.weight_kg).toFixed(1) : null

  function WeightChart() {
    if (weights.length < 2) return (
      <div style={{ height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 8 }}>
        <div style={{ fontSize: 32 }}>📊</div>
        <div style={{ fontSize: 13 }}>Log at least 2 weights to see chart</div>
      </div>
    )
    const vals = weights.map(w => w.weight_kg)
    const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1
    const W = 340, H = 120
    const pts = weights.map((w, i) => ({ x: (i / (weights.length - 1)) * W, y: H - ((w.weight_kg - min) / (max - min)) * H, w }))
    const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
    const lc = parseFloat(change) < 0 ? '#10b981' : parseFloat(change) > 0 ? '#ef4444' : '#6366f1'
    return (
      <svg width="100%" viewBox={'0 0 ' + W + ' ' + (H + 28)} style={{ overflow: 'visible' }}>
        <defs><linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lc} stopOpacity="0.2"/><stop offset="100%" stopColor={lc} stopOpacity="0"/></linearGradient></defs>
        <path d={d + ' L' + W + ',' + (H+28) + ' L0,' + (H+28) + ' Z'} fill="url(#wfill)"/>
        <path d={d} fill="none" stroke={lc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === 0 || i === pts.length - 1 ? 5 : 3.5} fill={lc} stroke="white" strokeWidth="2"/>
            {(i === 0 || i === pts.length - 1 || weights.length <= 5) && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={lc}>{p.w.weight_kg}</text>
            )}
          </g>
        ))}
        <text x="0" y={H + 22} fontSize="9" fill="var(--muted)">{first?.logged_at?.slice(5)}</text>
        <text x={W} y={H + 22} textAnchor="end" fontSize="9" fill="var(--muted)">{latest?.logged_at?.slice(5)}</text>
      </svg>
    )
  }

  function StreakGrid({ data, color, label }) {
    const today = new Date()
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (29 - i))
      return d.toISOString().slice(0, 10)
    })
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{data.current}🔥</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>CURRENT</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--muted)' }}>{data.longest}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>BEST</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {days.map(day => {
            const done = data.dates?.includes(day)
            const isToday = day === new Date().toISOString().slice(0, 10)
            return <div key={day} style={{ width: 30, height: 30, borderRadius: 8, background: done ? color : 'var(--card2)', border: isToday ? '2px solid ' + color : '2px solid transparent', opacity: done ? 1 : 0.35 }}/>
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: color }}/><span style={{ fontSize: 10, color: 'var(--muted)' }}>Completed</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--card2)', opacity: 0.4 }}/><span style={{ fontSize: 10, color: 'var(--muted)' }}>Missed</span></div>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}><div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }}/></div>

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100dvh', maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Progress</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Current', val: latest ? latest.weight_kg + ' kg' : '—', color: 'var(--primary)', icon: '⚖️' },
            { label: 'Change', val: change ? (parseFloat(change) > 0 ? '+' : '') + change + ' kg' : '—', color: parseFloat(change) < 0 ? '#10b981' : '#ef4444', icon: parseFloat(change) < 0 ? '📉' : '📈' },
            { label: 'Goal', val: profile?.weight_goal ? profile.weight_goal + ' kg' : '—', color: '#f59e0b', icon: '🎯' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Weight trend</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{weights.length} entries</div>
          </div>
          <WeightChart/>
          {weights.length > 0 && (
            <div style={{ marginTop: 14, maxHeight: 150, overflowY: 'auto' }}>
              {[...weights].reverse().map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(w.logged_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{w.weight_kg} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Streaks — Last 30 days</div>
          <StreakGrid data={foodStreak} color="#6366f1" label="Food logging"/>
          <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }}/>
          <StreakGrid data={waterStreak} color="#3b82f6" label="Hydration goal"/>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Before and After</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>Document your transformation. Photos stored locally.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ key: 'before', label: 'Before' }, { key: 'after', label: 'After' }].map(p => (
              <div key={p.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{p.label}</div>
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; setPhotos(prev => ({ ...prev, [p.key]: URL.createObjectURL(f) })) }}/>
                  <div style={{ aspectRatio: '3/4', borderRadius: 16, border: '2px dashed ' + (photos[p.key] ? 'var(--primary)' : 'var(--border)'), overflow: 'hidden', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    {photos[p.key] ? <img src={photos[p.key]} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <><div style={{ fontSize: 28 }}>📷</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Tap to add</div></>}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Achievements</div>
          {[
            { icon: '🥇', label: 'First log', desc: 'Logged your first meal', done: foodStreak.dates?.length > 0 },
            { icon: '🔥', label: '7-day streak', desc: 'Logged food 7 days in a row', done: foodStreak.longest >= 7 },
            { icon: '💧', label: 'Hydration hero', desc: 'Hit water goal 7 days', done: waterStreak.longest >= 7 },
            { icon: '⚖️', label: 'Scale master', desc: 'Logged weight 5 times', done: weights.length >= 5 },
            { icon: '📉', label: 'First milestone', desc: 'Lost your first 1kg', done: parseFloat(change) <= -1 },
            { icon: '🏅', label: 'Month warrior', desc: '30-day logging streak', done: foodStreak.longest >= 30 },
          ].map(a => (
            <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, background: a.done ? '#d1fae5' : 'var(--card2)', border: '1.5px solid ' + (a.done ? '#6ee7b7' : 'var(--border)'), opacity: a.done ? 1 : 0.5, marginBottom: 10 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: a.done ? '#059669' : 'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.desc}</div>
              </div>
              {a.done && <div style={{ fontSize: 18 }}>✅</div>}
            </div>
          ))}
        </div>
      </div>
      <BottomNav/>
    </div>
  )
}
