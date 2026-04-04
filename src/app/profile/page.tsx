'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [weights, setWeights] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weightVal, setWeightVal] = useState('')
  const [form, setForm] = useState({ name: '', goal: 'lose', cal_target: 1700, protein_target: 167, carb_target: 144, fat_target: 60, fiber_target: 25, weight_goal: 72, water_goal: 2000 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      const [{ data: prof }, { data: wlogs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(14)
      ])
      if (prof) {
        setProfile(prof)
        setForm({ name: prof.name ?? '', goal: prof.goal ?? 'lose', cal_target: prof.cal_target ?? 1700, protein_target: prof.protein_target ?? 167, carb_target: prof.carb_target ?? 144, fat_target: prof.fat_target ?? 60, fiber_target: prof.fiber_target ?? 25, weight_goal: prof.weight_goal ?? 72, water_goal: prof.water_goal ?? 2000 })
      }
      if (wlogs) setWeights(wlogs)
    }
    load()
  }, [router])

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function logWeight() {
    const val = parseFloat(weightVal); if (!val) return
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('weight_logs').upsert({ user_id: user.id, logged_at: today, weight_kg: val })
    setWeightVal('')
    const { data } = await supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(14)
    if (data) setWeights(data)
  }

  const latest = weights[0]
  const prev = weights[1]
  const change = latest && prev ? (latest.weight_kg - prev.weight_kg).toFixed(1) : null

  const goalOptions = [
    { key: 'lose', label: 'Lose fat', icon: '📉', color: '#10b981', bg: '#d1fae5' },
    { key: 'maintain', label: 'Maintain', icon: '⚖️', color: '#f59e0b', bg: '#fef3c7' },
    { key: 'gain', label: 'Build muscle', icon: '💪', color: '#3b82f6', bg: '#dbeafe' },
  ]

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Profile</h1>
        <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px', color: '#ef4444', borderColor: '#fecaca' }}
          onClick={async () => { await supabase.auth.signOut(); router.replace('/auth') }}>
          Sign out
        </button>
      </div>

      {/* Weight card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight log</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 16px', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Current</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{latest ? `${latest.weight_kg}` : '—'}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}> kg</span></div>
            {change && <div style={{ fontSize: 12, color: parseFloat(change) <= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: 4 }}>{parseFloat(change) > 0 ? '+' : ''}{change} kg</div>}
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 16px', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Goal</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{form.weight_goal}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}> kg</span></div>
            {latest && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{Math.abs(latest.weight_kg - form.weight_goal).toFixed(1)} kg to go</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input type="number" placeholder="Today's weight (kg)" value={weightVal} onChange={e => setWeightVal(e.target.value)} step="0.1" style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={logWeight} style={{ flexShrink: 0, padding: '12px 18px' }}>Log</button>
        </div>

        {weights.length > 1 && (
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 50 }}>
            {[...weights].reverse().map((w, i) => {
              const vals = weights.map(x => x.weight_kg)
              const min = Math.min(...vals) - 0.5
              const max = Math.max(...vals) + 0.5
              const h = Math.round(((w.weight_kg - min) / (max - min)) * 40) + 10
              return (
                <div key={w.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', height: h, background: i === weights.length - 1 ? 'var(--primary)' : 'var(--border)', borderRadius: 3 }} />
                  <div style={{ fontSize: 8, color: 'var(--muted)' }}>{w.logged_at.slice(5)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Goals card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals & preferences</p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My goal</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {goalOptions.map(g => (
              <button key={g.key} onClick={() => setForm(p => ({ ...p, goal: g.key }))}
                style={{ flex: 1, padding: '12px 8px', borderRadius: 14, border: `2px solid ${form.goal === g.key ? g.color : 'var(--border)'}`, background: form.goal === g.key ? g.bg : 'transparent', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{g.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: form.goal === g.key ? g.color : 'var(--muted)' }}>{g.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Calories', key: 'cal_target', unit: 'kcal' },
            { label: 'Protein', key: 'protein_target', unit: 'g' },
            { label: 'Carbs', key: 'carb_target', unit: 'g' },
            { label: 'Fat', key: 'fat_target', unit: 'g' },
            { label: 'Fiber', key: 'fiber_target', unit: 'g' },
            { label: 'Goal weight', key: 'weight_goal', unit: 'kg' },
            { label: 'Water goal', key: 'water_goal', unit: 'ml' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label} ({f.unit})</label>
              <input type="number" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))} />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700 }} onClick={saveProfile} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save goals'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reminders</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>Enable browser notifications to get meal logging reminders.</p>
        <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={async () => {
          const p = await Notification.requestPermission()
          if (p === 'granted') new Notification('MacroTrack reminders on!', { body: "We'll remind you to log your meals." })
        }}>Enable notifications</button>
      </div>

      <BottomNav />
    </div>
  )
}
