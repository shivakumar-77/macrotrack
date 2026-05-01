'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EXERCISES, CATEGORIES } from '@/lib/exercises'

function ActiveWorkoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [name, setName] = useState('My Workout')
  const [exercises, setExercises] = useState([])
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [saving, setSaving] = useState(false)
  const [restTimer, setRestTimer] = useState(null) // { seconds, running }
  const [restElapsed, setRestElapsed] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const timerRef = useRef(null)
  const restRef = useRef(null)

  useEffect(() => {
    // Load template if provided
    const templateId = params.get('template')
    if (templateId) loadTemplate(templateId)

    // Restore active workout
    const saved = localStorage.getItem('macrotrack_active_workout')
    if (saved && !templateId) {
      try {
        const w = JSON.parse(saved)
        setName(w.name||'My Workout')
        setExercises(w.exercises||[])
      } catch {}
    }

    // Timer
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-startTime)/1000)), 1000)
    return () => { clearInterval(timerRef.current); clearInterval(restRef.current) }
  }, [])

  useEffect(() => {
    // Save to localStorage on every change
    localStorage.setItem('macrotrack_active_workout', JSON.stringify({ name, exercises, startedAt: startTime }))
  }, [name, exercises])

  async function loadTemplate(id) {
    const { data } = await supabase.from('workout_templates').select('*').eq('id', id).single()
    if (data) {
      setName(data.name)
      setExercises((data.exercises||[]).map(e => ({
        ...e,
        sets: (e.sets||[{weight:'',reps:'',done:false}]).map(s=>({...s,done:false}))
      })))
    }
  }

  function fmtTime(s) {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60
    if (h>0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  function addExercise(ex) {
    const newEx = {
      ...ex,
      uid: Date.now()+Math.random(),
      sets: Array.from({length: ex.sets||3}, () => ({ weight:'', reps: ex.reps===60?'60':String(ex.reps||8), done:false }))
    }
    setExercises(p=>[...p,newEx])
    setShowExercisePicker(false)
  }

  function updateSet(exIdx, setIdx, field, val) {
    setExercises(p=>p.map((e,i)=>i!==exIdx?e:{
      ...e, sets: e.sets.map((s,j)=>j!==setIdx?s:{...s,[field]:val})
    }))
  }

  function toggleSetDone(exIdx, setIdx) {
    setExercises(p=>p.map((e,i)=>i!==exIdx?e:{
      ...e, sets: e.sets.map((s,j)=>j!==setIdx?s:{...s,done:!s.done})
    }))
    // Start rest timer
    startRest(120)
  }

  function addSet(exIdx) {
    setExercises(p=>p.map((e,i)=>i!==exIdx?e:{
      ...e, sets:[...e.sets,{ weight:e.sets[e.sets.length-1]?.weight||'', reps:e.sets[e.sets.length-1]?.reps||'8', done:false }]
    }))
  }

  function removeExercise(exIdx) {
    setExercises(p=>p.filter((_,i)=>i!==exIdx))
  }

  function removeSet(exIdx, setIdx) {
    setExercises(p=>p.map((e,i)=>i!==exIdx?e:{
      ...e, sets:e.sets.filter((_,j)=>j!==setIdx)
    }))
  }

  function startRest(seconds) {
    clearInterval(restRef.current)
    setRestTimer(seconds)
    setRestElapsed(0)
    let elapsed = 0
    restRef.current = setInterval(() => {
      elapsed++
      setRestElapsed(elapsed)
      if (elapsed >= seconds) { clearInterval(restRef.current); setRestTimer(null) }
    }, 1000)
  }

  function totalVolume() {
    return exercises.reduce((total, ex) => {
      return total + ex.sets.filter(s=>s.done&&s.weight&&s.reps).reduce((s,set)=>s+(parseFloat(set.weight)||0)*(parseFloat(set.reps)||0), 0)
    }, 0)
  }

  async function finishWorkout() {
    setSaving(true)
    const { data:{ user } } = await supabase.auth.getUser(); if (!user) return
    const vol = totalVolume()
    await supabase.from('workout_logs').insert({
      user_id: user.id,
      name,
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      duration_seconds: elapsed,
      total_volume_kg: Math.round(vol),
      exercises: exercises
    })
    localStorage.removeItem('macrotrack_active_workout')
    setSaving(false)
    router.push('/workout')
  }

  const filtered = EXERCISES.filter(e =>
    (filterCat==='All'||e.category===filterCat) &&
    (!searchQ||e.name.toLowerCase().includes(searchQ.toLowerCase())||e.muscle.toLowerCase().includes(searchQ.toLowerCase()))
  )

  const completedSets = exercises.reduce((s,e)=>s+e.sets.filter(s=>s.done).length,0)
  const totalSets = exercises.reduce((s,e)=>s+e.sets.length,0)

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:20 }}>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'calc(env(safe-area-inset-top,0px) + 10px) 16px 10px', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => { if(confirm('Discard workout?')){localStorage.removeItem('macrotrack_active_workout');router.push('/workout')} }}
            style={{ width:36, height:36, borderRadius:10, background:'var(--card2)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:700, fontSize:13 }}>{fmtTime(elapsed)}</div>
            <div style={{ fontSize:10, color:'var(--muted)' }}>{completedSets}/{totalSets} sets done</div>
          </div>

          <button onClick={finishWorkout} disabled={saving||exercises.length===0}
            style={{ background:'#10b981', border:'none', borderRadius:12, padding:'8px 18px', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', opacity:exercises.length===0?0.5:1 }}>
            {saving?'Saving…':'Finish'}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop:8, height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'#10b981', width:(totalSets>0?Math.round(completedSets/totalSets*100):0)+'%', transition:'width 0.3s', borderRadius:2 }}/>
        </div>
      </div>

      {/* Rest timer */}
      {restTimer && (
        <div style={{ margin:'12px 16px 0', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', color:'#fff' }}>
          <div>
            <div style={{ fontSize:11, opacity:0.8, fontWeight:600 }}>REST TIMER</div>
            <div style={{ fontSize:22, fontWeight:800 }}>{fmtTime(restTimer - restElapsed)}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[30,60,90,120].map(s=>(
              <button key={s} onClick={()=>startRest(s)}
                style={{ padding:'4px 8px', borderRadius:8, background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                {s}s
              </button>
            ))}
            <button onClick={()=>{clearInterval(restRef.current);setRestTimer(null)}}
              style={{ padding:'4px 8px', borderRadius:8, background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', fontSize:12, cursor:'pointer' }}>✕</button>
          </div>
        </div>
      )}

      <div style={{ padding:'16px' }}>
        {/* Workout name */}
        <input value={name} onChange={e=>setName(e.target.value)}
          style={{ fontSize:20, fontWeight:800, background:'transparent', border:'none', padding:'0 0 8px', width:'100%', outline:'none', color:'var(--text)', letterSpacing:'-0.02em' }}/>

        {/* Volume stat */}
        {totalVolume()>0 && (
          <div style={{ fontSize:12, color:'var(--primary)', fontWeight:600, marginBottom:16 }}>
            ⚡ {Math.round(totalVolume())} kg total volume
          </div>
        )}

        {/* Exercises */}
        {exercises.map((ex, exIdx)=>(
          <div key={ex.uid||exIdx} style={{ background:'var(--card)', borderRadius:20, border:'1.5px solid var(--border)', marginBottom:14, overflow:'hidden' }}>
            {/* Exercise header */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={()=>setSelectedExercise(selectedExercise===exIdx?null:exIdx)}
                style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left', flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--primary)' }}>{ex.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{ex.category} · {ex.equipment} · {ex.muscle}</div>
              </button>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setSelectedExercise(selectedExercise===exIdx?null:exIdx)}
                  style={{ width:30, height:30, borderRadius:8, background:'var(--primary-bg)', border:'none', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ℹ️
                </button>
                <button onClick={()=>removeExercise(exIdx)}
                  style={{ width:30, height:30, borderRadius:8, background:'#fef2f2', border:'none', cursor:'pointer', fontSize:14, color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Instructions panel */}
            {selectedExercise===exIdx && (
              <div style={{ padding:'12px 16px', background:'var(--primary-bg)', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--primary)', marginBottom:4 }}>How to perform</div>
                <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.7, marginBottom:8 }}>{ex.instructions}</div>
                <div style={{ fontSize:11, color:'var(--primary)', fontWeight:600 }}>💡 {ex.tips}</div>
              </div>
            )}

            {/* Set headers */}
            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 80px 80px 36px', gap:6, padding:'8px 16px', background:'var(--card2)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Set</div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Previous</div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', textAlign:'center' }}>kg</div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', textAlign:'center' }}>Reps</div>
              <div/>
            </div>

            {/* Sets */}
            {ex.sets.map((set, setIdx)=>(
              <div key={setIdx}>
                <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 80px 80px 36px', gap:6, padding:'8px 16px', alignItems:'center', background:set.done?'rgba(16,185,129,0.06)':'transparent', transition:'background 0.2s' }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:set.done?'#10b981':'var(--card2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:set.done?'#fff':'var(--muted)' }}>
                    {setIdx+1}
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    {ex.previousSets?.[setIdx] ? `${ex.previousSets[setIdx].weight}kg × ${ex.previousSets[setIdx].reps}` : '—'}
                  </div>
                  <input type="text" inputMode="decimal" value={set.weight} onChange={e=>updateSet(exIdx,setIdx,'weight',e.target.value)}
                    placeholder="0"
                    style={{ textAlign:'center', fontWeight:700, fontSize:15, background:set.done?'rgba(16,185,129,0.1)':'var(--card2)', border:'1.5px solid '+(set.done?'#10b981':'var(--border)'), borderRadius:10, padding:'8px 4px', color:'var(--text)', outline:'none', transition:'all 0.2s' }}/>
                  <input type="text" inputMode="numeric" value={set.reps} onChange={e=>updateSet(exIdx,setIdx,'reps',e.target.value)}
                    placeholder="0"
                    style={{ textAlign:'center', fontWeight:700, fontSize:15, background:set.done?'rgba(16,185,129,0.1)':'var(--card2)', border:'1.5px solid '+(set.done?'#10b981':'var(--border)'), borderRadius:10, padding:'8px 4px', color:'var(--text)', outline:'none', transition:'all 0.2s' }}/>
                  <button onClick={()=>toggleSetDone(exIdx,setIdx)}
                    style={{ width:32, height:32, borderRadius:8, background:set.done?'#10b981':'var(--card2)', border:'1.5px solid '+(set.done?'#10b981':'var(--border)'), cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:set.done?'#fff':'var(--muted)', transition:'all 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                </div>
                {setIdx<ex.sets.length-1&&<div style={{ height:1, background:'var(--border)', margin:'0 16px' }}/>}
              </div>
            ))}

            {/* Add/remove set */}
            <div style={{ display:'flex', gap:8, padding:'10px 16px 14px' }}>
              <button onClick={()=>addSet(exIdx)}
                style={{ flex:1, padding:'9px', borderRadius:12, background:'var(--card2)', border:'1.5px solid var(--border)', cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--muted)' }}>
                + Add set
              </button>
              {ex.sets.length>1&&(
                <button onClick={()=>removeSet(exIdx,ex.sets.length-1)}
                  style={{ padding:'9px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca', cursor:'pointer', fontSize:12, fontWeight:600, color:'#dc2626' }}>
                  − Remove
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add exercise button */}
        <button onClick={()=>setShowExercisePicker(true)}
          style={{ width:'100%', padding:'16px', borderRadius:18, background:'var(--primary-bg)', border:'2px dashed var(--primary)', cursor:'pointer', fontSize:15, fontWeight:700, color:'var(--primary)', marginBottom:16 }}>
          + Add Exercise
        </button>

        {exercises.length===0&&(
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--muted)', marginBottom:16 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>💪</div>
            <div style={{ fontSize:13 }}>Add exercises to start your workout</div>
          </div>
        )}
      </div>

      {/* Exercise picker modal */}
      {showExercisePicker&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'var(--surface)', width:'100%', maxWidth:430, margin:'0 auto', borderRadius:'24px 24px 0 0', maxHeight:'85dvh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:18 }}>Add Exercise</div>
              <button onClick={()=>setShowExercisePicker(false)} style={{ background:'var(--card2)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>✕</button>
            </div>

            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
              <input type="text" placeholder="Search exercises…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                style={{ marginBottom:10 }}/>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setFilterCat(c)}
                    style={{ padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0, border:'1.5px solid '+(filterCat===c?'var(--primary)':'var(--border)'), background:filterCat===c?'var(--primary)':'transparent', color:filterCat===c?'#fff':'var(--muted)' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowY:'auto', flex:1 }}>
              {filtered.map(ex=>(
                <button key={ex.id} onClick={()=>addExercise(ex)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 20px', background:'none', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {ex.emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{ex.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{ex.category} · {ex.equipment} · {ex.muscle}</div>
                  </div>
                  <div style={{ color:'var(--primary)', fontSize:20, flexShrink:0 }}>+</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading…</div>}>
      <ActiveWorkoutContent />
    </Suspense>
  )
}
