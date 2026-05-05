'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EXERCISES } from '@/lib/exercises'

// ── Plate calculator ─────────────────────────────────────
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const BAR_WEIGHT = 20

function calcPlates(totalKg: number): { plate: number; count: number }[] {
  let remaining = Math.max(0, (totalKg - BAR_WEIGHT) / 2)
  const result: { plate: number; count: number }[] = []
  for (const p of PLATES) {
    const count = Math.floor(remaining / p)
    if (count > 0) { result.push({ plate: p, count }); remaining -= count * p }
  }
  return result
}

// ── 1RM estimate (Epley formula) ─────────────────────────
function oneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

// ── Timer hook ───────────────────────────────────────────
function useTimer(running: boolean, initial = 0) {
  const [elapsed, setElapsed] = useState(initial)
  const ref = useRef<any>(null)
  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => e + 1), 1000)
    else clearInterval(ref.current)
    return () => clearInterval(ref.current)
  }, [running])
  return elapsed
}

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function ActiveWorkoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [name, setName] = useState('My Workout')
  const [exercises, setExercises] = useState<any[]>([])
  const [startTime] = useState(Date.now())
  const [timerRunning, setTimerRunning] = useState(true)
  const elapsed = useTimer(timerRunning, 0)
  const [showExPicker, setShowExPicker] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const [exCat, setExCat] = useState('All')
  const [saving, setSaving] = useState(false)
  const [restActive, setRestActive] = useState(false)
  const [restTotal, setRestTotal] = useState(120)
  const [restElapsed, setRestElapsed] = useState(0)
  const restRef = useRef<any>(null)
  const [selectedEx, setSelectedEx] = useState<number | null>(null)
  const [showPlateCalc, setShowPlateCalc] = useState<number | null>(null)
  const [prFlash, setPrFlash] = useState<string | null>(null)
  const [previousData, setPreviousData] = useState<Record<string, any[]>>({})
  const [prs, setPRs] = useState<Record<string, any>>({})
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    init()
    return () => clearInterval(restRef.current)
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    setUserId(user.id)

    // Load PRs
    const { data: prData } = await supabase.from('exercise_prs')
      .select('*').eq('user_id', user.id)
    if (prData) {
      const prMap: Record<string, any> = {}
      prData.forEach(p => { prMap[p.exercise_id] = p })
      setPRs(prMap)
    }

    // Load previous workout data for each exercise
    const { data: prevLogs } = await supabase.from('workout_logs')
      .select('exercises').eq('user_id', user.id)
      .order('started_at', { ascending: false }).limit(10)

    const prevMap: Record<string, any[]> = {}
    if (prevLogs) {
      prevLogs.forEach(log => {
        ;(log.exercises || []).forEach((ex: any) => {
          if (!prevMap[ex.id] && ex.sets?.length) prevMap[ex.id] = ex.sets
        })
      })
    }
    setPreviousData(prevMap)

    // Restore active or load template
    const templateId = params.get('template')
    if (templateId) {
      const { data: tmpl } = await supabase.from('workout_templates')
        .select('*').eq('id', templateId).single()
      if (tmpl) {
        setName(tmpl.name)
        setExercises((tmpl.exercises || []).map((e: any) => ({
          ...e, uid: Math.random(),
          sets: (e.sets_config || Array.from({ length: e.sets || 3 }, (_, i) => ({
            weight: previousData[e.id]?.[i]?.weight || '',
            reps: String(e.reps || 8), done: false
          })))
        })))
        return
      }
    }
    const saved = localStorage.getItem('macrotrack_active_workout')
    if (saved && !templateId) {
      try {
        const w = JSON.parse(saved)
        setName(w.name || 'My Workout')
        setExercises(w.exercises || [])
      } catch {}
    }
  }

  // Save to localStorage on change
  useEffect(() => {
    if (exercises.length > 0 || name !== 'My Workout') {
      localStorage.setItem('macrotrack_active_workout', JSON.stringify({ name, exercises, startedAt: startTime }))
    }
  }, [name, exercises])

  // Rest timer
  function startRest(seconds: number) {
    clearInterval(restRef.current)
    setRestTotal(seconds); setRestElapsed(0); setRestActive(true)
    let e = 0
    restRef.current = setInterval(() => {
      e++; setRestElapsed(e)
      if (e >= seconds) { clearInterval(restRef.current); setRestActive(false) }
    }, 1000)
  }

  function updateSet(exIdx: number, setIdx: number, field: string, val: any) {
    setExercises(p => p.map((e, i) => i !== exIdx ? e : {
      ...e, sets: e.sets.map((s: any, j: number) => j !== setIdx ? s : { ...s, [field]: val })
    }))
  }

  async function toggleDone(exIdx: number, setIdx: number) {
    const ex = exercises[exIdx]
    const set = ex.sets[setIdx]
    const nowDone = !set.done
    updateSet(exIdx, setIdx, 'done', nowDone)

    if (nowDone && set.weight && set.reps) {
      startRest(120)
      // Check PR
      const w = parseFloat(set.weight), r = parseInt(set.reps)
      if (w > 0 && r > 0 && userId) {
        const est = oneRM(w, r)
        const current = prs[ex.id]
        if (!current || est > current.one_rm_estimate) {
          // New PR!
          await supabase.from('exercise_prs').upsert({
            user_id: userId, exercise_id: ex.id, exercise_name: ex.name,
            weight_kg: w, reps: r, one_rm_estimate: est, achieved_at: new Date().toISOString()
          }, { onConflict: 'user_id,exercise_id' })
          setPRs(p => ({ ...p, [ex.id]: { weight_kg: w, reps: r, one_rm_estimate: est } }))
          setPrFlash(`🏆 New PR! ${ex.name} — ${est}kg 1RM est.`)
          setTimeout(() => setPrFlash(null), 3500)
        }
      }
    }
  }

  function addSet(exIdx: number) {
    setExercises(p => p.map((e, i) => i !== exIdx ? e : {
      ...e, sets: [...e.sets, {
        weight: e.sets[e.sets.length - 1]?.weight || '',
        reps: e.sets[e.sets.length - 1]?.reps || '8',
        done: false
      }]
    }))
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises(p => p.map((e, i) => i !== exIdx ? e : {
      ...e, sets: e.sets.filter((_: any, j: number) => j !== setIdx)
    }))
  }

  function removeExercise(exIdx: number) {
    setExercises(p => p.filter((_, i) => i !== exIdx))
  }

  function addExercise(ex: any) {
    const prev = previousData[ex.id] || []
    setExercises(p => [...p, {
      ...ex, uid: Math.random(),
      sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
        weight: prev[i]?.weight || '', reps: prev[i]?.reps || String(ex.reps || 8), done: false
      }))
    }])
    setShowExPicker(false)
  }

  function totalVolume() {
    return Math.round(exercises.reduce((t, ex) =>
      t + ex.sets.filter((s: any) => s.done && s.weight && s.reps)
        .reduce((s: number, set: any) => s + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0), 0)
    , 0))
  }

  async function finishWorkout() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('workout_logs').insert({
      user_id: user.id, name,
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      duration_seconds: elapsed,
      total_volume_kg: totalVolume(),
      exercises
    })
    localStorage.removeItem('macrotrack_active_workout')
    setSaving(false)
    router.push('/workout')
  }

  const completedSets = exercises.reduce((s, e) => s + e.sets.filter((s: any) => s.done).length, 0)
  const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0)
  const restRemaining = Math.max(0, restTotal - restElapsed)
  const restPct = restActive ? restElapsed / restTotal : 0

  const CATS = ['All','Core','Arms','Back','Chest','Legs','Shoulders','Olympic','Full Body','Cardio']
  const filteredEx = EXERCISES.filter(e =>
    (exCat === 'All' || e.category === exCat) &&
    (!exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase()) || e.muscle.toLowerCase().includes(exSearch.toLowerCase()))
  )

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100dvh', maxWidth: 430, margin: '0 auto', paddingBottom: 24 }}>

      {/* PR Flash */}
      {prFlash && (
        <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top,0px) + 16px)', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '12px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700, zIndex: 500, boxShadow: '0 8px 24px rgba(245,158,11,0.4)', animation: 'slideDown 0.3s ease', whiteSpace: 'nowrap' }}>
          {prFlash}
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', padding: 'calc(env(safe-area-inset-top,0px) + 10px) 16px 10px', borderBottom: '0.5px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button onClick={() => { if (confirm('Discard this workout?')) { localStorage.removeItem('macrotrack_active_workout'); router.push('/workout') } }}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card2)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
            ✕
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: timerRunning ? 'var(--text)' : 'var(--muted)' }}>
              {fmt(elapsed)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, marginTop: 1 }}>
              {completedSets}/{totalSets} sets · {totalVolume()} kg
            </div>
          </div>

          <button onClick={finishWorkout} disabled={saving || exercises.length === 0}
            style={{ background: '#10b981', border: 'none', borderRadius: 12, padding: '9px 18px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: exercises.length === 0 ? 0.5 : 1 }}>
            {saving ? '…' : 'Finish'}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--card2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--primary),#10b981)', width: totalSets > 0 ? `${Math.round(completedSets / totalSets * 100)}%` : '0%', transition: 'width 0.4s ease', borderRadius: 2 }} />
        </div>
      </div>

      {/* Rest timer */}
      {restActive && (
        <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', borderRadius: 16, padding: '14px 18px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Rest timer</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(restRemaining)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[30, 60, 90, 120].map(s => (
                  <button key={s} onClick={() => startRest(s)}
                    style={{ padding: '4px 9px', borderRadius: 8, background: restTotal === s ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {s}s
                  </button>
                ))}
              </div>
              <button onClick={() => { clearInterval(restRef.current); setRestActive(false) }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                Skip
              </button>
            </div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#fff', borderRadius: 2, width: `${Math.min(100, restPct * 100)}%`, transition: 'width 1s linear' }} />
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Workout name */}
        <input value={name} onChange={e => setName(e.target.value)}
          style={{ fontSize: 22, fontWeight: 800, background: 'transparent', border: 'none', padding: '0 0 12px', width: '100%', outline: 'none', color: 'var(--text)', letterSpacing: '-0.02em' }} />

        {/* Exercises */}
        {exercises.map((ex, exIdx) => {
          const prev = previousData[ex.id] || []
          const pr = prs[ex.id]
          const exVol = Math.round(ex.sets.filter((s: any) => s.done && s.weight && s.reps)
            .reduce((s: number, set: any) => s + parseFloat(set.weight) * parseFloat(set.reps), 0))
          const plateWeight = parseFloat(ex.sets.find((s: any) => s.weight)?.weight || '0')
          const plates = plateWeight >= BAR_WEIGHT ? calcPlates(plateWeight) : []

          return (
            <div key={ex.uid || exIdx} style={{ background: 'var(--card)', borderRadius: 20, border: '0.5px solid var(--border)', marginBottom: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* Exercise header */}
              <div style={{ padding: '14px 16px', background: 'var(--card2)', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => setSelectedEx(selectedEx === exIdx ? null : exIdx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{ex.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{ex.category} · {ex.muscle}</div>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {pr && (
                      <div style={{ padding: '3px 8px', background: '#fef3c7', borderRadius: 8, fontSize: 10, fontWeight: 700, color: '#d97706' }}>
                        PR {pr.one_rm_estimate}kg
                      </div>
                    )}
                    {exVol > 0 && (
                      <div style={{ padding: '3px 8px', background: 'var(--primary-bg)', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>
                        {exVol}kg
                      </div>
                    )}
                    <button onClick={() => setShowPlateCalc(showPlateCalc === exIdx ? null : exIdx)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: showPlateCalc === exIdx ? 'var(--primary)' : 'var(--card)', border: '0.5px solid var(--border)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: showPlateCalc === exIdx ? '#fff' : 'var(--muted)' }}>
                      🏋️
                    </button>
                    <button onClick={() => removeExercise(exIdx)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: '#fef2f2', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Plate calculator */}
              {showPlateCalc === exIdx && plateWeight > 0 && (
                <div style={{ padding: '12px 16px', background: '#1e1b4b', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Plate calculator — {plateWeight}kg total
                  </div>
                  {/* Bar visual */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 10 }}>
                    {/* Left plates */}
                    {[...calcPlates(plateWeight)].reverse().map((p, i) => (
                      Array.from({ length: p.count }).map((_, j) => (
                        <div key={`l-${i}-${j}`} style={{
                          width: p.plate >= 20 ? 14 : p.plate >= 10 ? 12 : 10,
                          height: p.plate >= 20 ? 44 : p.plate >= 10 ? 38 : 30,
                          background: p.plate >= 20 ? '#3b82f6' : p.plate >= 10 ? '#10b981' : p.plate >= 5 ? '#f59e0b' : '#6366f1',
                          borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: 7, color: '#fff', fontWeight: 700, writingMode: 'vertical-rl' }}>{p.plate}</span>
                        </div>
                      ))
                    ))}
                    {/* Bar */}
                    <div style={{ width: 60, height: 8, background: '#94a3b8', borderRadius: 4 }} />
                    {/* Right plates */}
                    {calcPlates(plateWeight).map((p, i) => (
                      Array.from({ length: p.count }).map((_, j) => (
                        <div key={`r-${i}-${j}`} style={{
                          width: p.plate >= 20 ? 14 : p.plate >= 10 ? 12 : 10,
                          height: p.plate >= 20 ? 44 : p.plate >= 10 ? 38 : 30,
                          background: p.plate >= 20 ? '#3b82f6' : p.plate >= 10 ? '#10b981' : p.plate >= 5 ? '#f59e0b' : '#6366f1',
                          borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: 7, color: '#fff', fontWeight: 700, writingMode: 'vertical-rl' }}>{p.plate}</span>
                        </div>
                      ))
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ fontSize: 11, color: '#a5b4fc', padding: '3px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                      Bar {BAR_WEIGHT}kg
                    </div>
                    {calcPlates(plateWeight).map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#fff', padding: '3px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 8 }}>
                        {p.count}×{p.plate}kg each side
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions panel */}
              {selectedEx === exIdx && (
                <div style={{ padding: '12px 16px', background: 'var(--primary-bg)', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>How to perform</div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, marginBottom: 8 }}>{ex.instructions}</div>
                  <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, background: '#fef3c7', padding: '8px 10px', borderRadius: 8 }}>
                    💡 {ex.tips}
                  </div>
                </div>
              )}

              {/* Set headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 76px 76px 32px', gap: 6, padding: '8px 14px', background: 'var(--card2)', borderBottom: '0.5px solid var(--border)' }}>
                {['Set', 'Previous', 'kg', 'Reps', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</div>
                ))}
              </div>

              {/* Sets */}
              {ex.sets.map((set: any, setIdx: number) => {
                const prevSet = prev[setIdx]
                const setVol = set.done && set.weight && set.reps ? parseFloat(set.weight) * parseFloat(set.reps) : 0
                const est1rm = set.done && set.weight && set.reps ? oneRM(parseFloat(set.weight), parseInt(set.reps)) : 0
                const isPR = set.done && est1rm > 0 && (!prs[ex.id] || est1rm >= prs[ex.id].one_rm_estimate)
                return (
                  <div key={setIdx}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 76px 76px 32px', gap: 6,
                      padding: '8px 14px', alignItems: 'center',
                      background: set.done ? 'rgba(16,185,129,0.06)' : 'transparent',
                      transition: 'background 0.3s'
                    }}>
                      {/* Set number */}
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: set.done ? '#10b981' : 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: set.done ? '#fff' : 'var(--muted)' }}>
                        {setIdx + 1}
                      </div>

                      {/* Previous */}
                      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3 }}>
                        {prevSet ? <span style={{ fontWeight: 600 }}>{prevSet.weight}×{prevSet.reps}</span> : '—'}
                        {isPR && set.done && <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>🏆 PR</div>}
                      </div>

                      {/* Weight */}
                      <input type="text" inputMode="decimal" value={set.weight}
                        onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        placeholder="0"
                        style={{
                          textAlign: 'center', fontWeight: 700, fontSize: 15,
                          background: set.done ? 'rgba(16,185,129,0.1)' : 'var(--card2)',
                          border: '1px solid ' + (set.done ? '#10b981' : 'var(--border)'),
                          borderRadius: 9, padding: '7px 4px', color: 'var(--text)',
                          outline: 'none', transition: 'all 0.2s'
                        }} />

                      {/* Reps */}
                      <input type="text" inputMode="numeric" value={set.reps}
                        onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        placeholder="0"
                        style={{
                          textAlign: 'center', fontWeight: 700, fontSize: 15,
                          background: set.done ? 'rgba(16,185,129,0.1)' : 'var(--card2)',
                          border: '1px solid ' + (set.done ? '#10b981' : 'var(--border)'),
                          borderRadius: 9, padding: '7px 4px', color: 'var(--text)',
                          outline: 'none', transition: 'all 0.2s'
                        }} />

                      {/* Check */}
                      <button onClick={() => toggleDone(exIdx, setIdx)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: set.done ? '#10b981' : 'var(--card2)',
                          border: '1px solid ' + (set.done ? '#10b981' : 'var(--border)'),
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: set.done ? '#fff' : 'var(--muted)', transition: 'all 0.2s',
                          animation: set.done ? 'checkPop 0.3s ease' : 'none'
                        }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </button>
                    </div>

                    {/* Set volume below */}
                    {set.done && setVol > 0 && (
                      <div style={{ padding: '0 14px 4px', fontSize: 10, color: 'var(--muted)' }}>
                        vol: {Math.round(setVol)}kg · 1RM est: {est1rm}kg
                      </div>
                    )}
                    {setIdx < ex.sets.length - 1 && <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 14px' }} />}
                  </div>
                )
              })}

              {/* Add/remove set */}
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px 14px' }}>
                <button onClick={() => addSet(exIdx)}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'var(--card2)', border: '0.5px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                  + Add set
                </button>
                {ex.sets.length > 1 && (
                  <button onClick={() => removeSet(exIdx, ex.sets.length - 1)}
                    style={{ padding: '8px 14px', borderRadius: 10, background: '#fef2f2', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                    − Remove
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Add exercise */}
        <button onClick={() => setShowExPicker(true)}
          style={{ width: '100%', padding: '15px', borderRadius: 18, background: 'var(--primary-bg)', border: '2px dashed var(--primary)', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
          + Add Exercise
        </button>

        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💪</div>
            <div style={{ fontSize: 13 }}>Add exercises to start your workout</div>
          </div>
        )}
      </div>

      {/* Exercise picker */}
      {showExPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 430, margin: '0 auto', borderRadius: '24px 24px 0 0', maxHeight: '86dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)' }}>
            <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Add Exercise</div>
              <button onClick={() => setShowExPicker(false)} style={{ background: 'var(--card2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 18, color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ padding: '10px 16px 8px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <input type="text" placeholder="Search exercises…" value={exSearch} onChange={e => setExSearch(e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setExCat(c)}
                    style={{ padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, border: '1px solid ' + (exCat === c ? 'var(--primary)' : 'var(--border)'), background: exCat === c ? 'var(--primary)' : 'transparent', color: exCat === c ? '#fff' : 'var(--muted)' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredEx.map(ex => {
                const pr = prs[ex.id]
                const hasPrev = !!previousData[ex.id]
                return (
                  <button key={ex.id} onClick={() => addExercise(ex)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'none', border: 'none', borderBottom: '0.5px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ex.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{ex.category} · {ex.muscle}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {pr && <div style={{ padding: '2px 6px', background: '#fef3c7', borderRadius: 6, fontSize: 9, fontWeight: 700, color: '#d97706' }}>🏆PR</div>}
                      {hasPrev && <div style={{ padding: '2px 6px', background: 'var(--primary-bg)', borderRadius: 6, fontSize: 9, fontWeight: 700, color: 'var(--primary)' }}>PREV</div>}
                    </div>
                    <div style={{ color: 'var(--primary)', fontSize: 20 }}>+</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
