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
  const [restTimer, setRestTimer] = useState(null)
  const [restElapsed, setRestElapsed] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [showMetricsModal, setShowMetricsModal] = useState(false)
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

  function estimatedOneRM(weight, reps) {
    if (!weight || !reps || reps >= 37) return null
    return Math.round(weight / (1.0278 - 0.0278 * reps))
  }

  function getExercisePR(ex) {
    if (!ex.sets || ex.sets.length === 0) return null
    const completedSets = ex.sets.filter(s => s.done && s.weight && s.reps)
    if (completedSets.length === 0) return null
    return completedSets.reduce((max, s) => {
      const weight = parseFloat(s.weight) || 0
      const reps = parseFloat(s.reps) || 0
      const volume = weight * reps
      return volume > max ? volume : max
    }, 0)
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

      {/* Professional Header */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'linear-gradient(135deg, var(--surface) 0%, rgba(99,102,241,0.03) 100%)', borderBottom:'1px solid var(--border)', padding:'calc(env(safe-area-inset-top,0px) + 16px) 20px 16px', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <button onClick={() => { if(confirm('Discard workout?')){localStorage.removeItem('macrotrack_active_workout');router.push('/workout')} }}
            style={{ width:40, height:40, borderRadius:12, background:'var(--card2)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontWeight:800, fontSize:28, background:'linear-gradient(135deg, #6366f1, #ec4899)', backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.02em' }}>{fmtTime(elapsed)}</div>
            <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, marginTop:4 }}>{completedSets}/{totalSets} sets • {exercises.length} exercises</div>
          </div>

          <button onClick={() => setShowMetricsModal(true)}
            style={{ width:40, height:40, borderRadius:12, background:'var(--primary-bg)', border:'1.5px solid var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', flexShrink:0, fontSize:20 }}>
            📊
          </button>
        </div>

        {/* Professional Progress bar */}
        <div style={{ marginTop:14, height:2.5, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg, #6366f1, #ec4899)', width:(totalSets>0?Math.round(completedSets/totalSets*100):0)+'%', transition:'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', borderRadius:2 }}/>
        </div>
      </div>

      {/* Professional Rest Timer */}
      {restTimer && (
        <div style={{ margin:'16px 20px 0', background:'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', borderRadius:16, padding:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', color:'#fff', boxShadow:'0 8px 24px rgba(59, 130, 246, 0.3)', animation:'slideUp 0.3s ease-out' }}>
          <div>
            <div style={{ fontSize:10, opacity:0.9, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:4 }}>Rest Timer</div>
            <div style={{ fontSize:32, fontWeight:900, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.02em' }}>{fmtTime(restTimer - restElapsed)}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {[30,60,90,120].map(s=>(
              <button key={s} onClick={()=>startRest(s)}
                style={{ padding:'6px 12px', borderRadius:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.2s', backdropFilter:'blur(10px)' }}>
                {s}s
              </button>
            ))}
            <button onClick={()=>{clearInterval(restRef.current);setRestTimer(null)}}
              style={{ padding:'6px 12px', borderRadius:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.2s', backdropFilter:'blur(10px)' }}>✕</button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div style={{ padding:'20px' }}>
        {/* Editable Workout Name */}
        <input value={name} onChange={e=>setName(e.target.value)}
          placeholder="My Workout"
          style={{ fontSize:24, fontWeight:800, background:'transparent', border:'none', borderBottom:'2px solid transparent', padding:'0 0 12px', width:'100%', outline:'none', color:'var(--text)', letterSpacing:'-0.02em', transition:'border-color 0.2s', cursor:'pointer' }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}/>

        {/* Volume Stats Card */}
        {totalVolume()>0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16, marginBottom:20 }}>
            <div style={{ background:'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius:14, padding:'14px', color:'#fff' }}>
              <div style={{ fontSize:10, opacity:0.9, fontWeight:600, letterSpacing:'0.05em' }}>VOLUME</div>
              <div style={{ fontSize:22, fontWeight:800, marginTop:4 }}>{Math.round(totalVolume())} kg</div>
            </div>
            <div style={{ background:'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', borderRadius:14, padding:'14px', color:'#fff' }}>
              <div style={{ fontSize:10, opacity:0.9, fontWeight:600, letterSpacing:'0.05em' }}>INTENSITY</div>
              <div style={{ fontSize:22, fontWeight:800, marginTop:4 }}>{exercises.length > 0 ? Math.round(totalVolume() / exercises.length) : 0} kg/ex</div>
            </div>
          </div>
        )}

        {/* Exercises List */}
        {exercises.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', opacity:0.6 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>💪</div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Start your workout</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>Add exercises to begin tracking</div>
          </div>
        ) : (
          exercises.map((ex, exIdx)=>(
            <div key={ex.uid||exIdx} style={{ background:'var(--card)', borderRadius:16, border:'1.5px solid var(--border)', marginBottom:14, overflow:'hidden', transition:'all 0.2s' }}>
              {/* Professional Exercise Header */}
              <div style={{ padding:'16px', borderBottom:expandedExercise===exIdx ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, background:expandedExercise===exIdx ? 'var(--primary-bg)' : 'transparent', cursor:'pointer' }} onClick={() => setExpandedExercise(expandedExercise === exIdx ? null : exIdx)}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:16, color:'var(--primary)', marginBottom:4 }}>{ex.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', display:'flex', gap:8 }}>
                    <span>{ex.emoji} {ex.category}</span>
                    <span>•</span>
                    <span>{ex.equipment}</span>
                    <span>•</span>
                    <span>{ex.muscle}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <div style={{ background:'var(--card2)', borderRadius:10, padding:'6px 10px', fontSize:11, fontWeight:700, color:'var(--text)' }}>
                    {ex.sets.filter(s => s.done).length}/{ex.sets.length}
                  </div>
                  <button onClick={(e) => {e.stopPropagation(); removeExercise(exIdx)}}
                    style={{ width:32, height:32, borderRadius:10, background:'#fef2f2', border:'1.5px solid #fecaca', cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all 0.2s' }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Professional Instructions Panel */}
              {expandedExercise===exIdx && (
                <div style={{ padding:'16px', background:'linear-gradient(135deg, var(--primary-bg) 0%, rgba(99,102,241,0.05) 100%)', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <span>📋</span> How to Perform
                  </div>
                  <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.8, marginBottom:12 }}>{ex.instructions}</div>
                  <div style={{ fontSize:12, color:'var(--primary)', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                    <span>💡</span> {ex.tips}
                  </div>
                </div>
              )}

              {/* Professional Set Tracking */}
              <div style={{ padding:'12px 16px', background:'var(--card2)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 70px 70px 50px', gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', lineHeight:'28px' }}>Set</div>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', lineHeight:'28px' }}>Prev</div>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center', lineHeight:'28px' }}>Weight</div>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center', lineHeight:'28px' }}>Reps</div>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center', lineHeight:'28px' }}>1RM</div>
                </div>

                {/* Sets Rows */}
                {ex.sets.map((set, setIdx)=>{
                  const oneRM = estimatedOneRM(parseFloat(set.weight), parseFloat(set.reps))
                  return (
                    <div key={setIdx}>
                      <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 70px 70px 50px', gap:8, padding:'10px 0', alignItems:'center', background:set.done?'rgba(16,185,129,0.08)':'transparent', borderRadius:10, transition:'all 0.2s' }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:set.done?'#10b981':'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:set.done?'#fff':'var(--primary)' }}>
                          {setIdx+1}
                        </div>
                        <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>
                          {ex.previousSets?.[setIdx] ? `${ex.previousSets[setIdx].weight} × ${ex.previousSets[setIdx].reps}` : '—'}
                        </div>
                        <input type="text" inputMode="decimal" value={set.weight} onChange={e=>updateSet(exIdx,setIdx,'weight',e.target.value)}
                          placeholder="0" onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--primary)'}
                          onBlur={(e) => e.target.style.boxShadow = 'none'}
                          style={{ textAlign:'center', fontWeight:700, fontSize:14, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:10, padding:'8px 6px', color:'var(--text)', outline:'none', transition:'all 0.2s' }}/>
                        <input type="text" inputMode="numeric" value={set.reps} onChange={e=>updateSet(exIdx,setIdx,'reps',e.target.value)}
                          placeholder="0" onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--primary)'}
                          onBlur={(e) => e.target.style.boxShadow = 'none'}
                          style={{ textAlign:'center', fontWeight:700, fontSize:14, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:10, padding:'8px 6px', color:'var(--text)', outline:'none', transition:'all 0.2s' }}/>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textAlign:'center' }}>
                          {oneRM ? `${oneRM}` : '—'}
                        </div>
                      </div>
                      <button onClick={()=>toggleSetDone(exIdx,setIdx)}
                        style={{ width:'100%', marginTop:6, padding:'10px', borderRadius:10, background:set.done?'#10b981':'var(--card)', border:set.done?'1.5px solid #059669':'1.5px dashed var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:set.done?'#fff':'var(--muted)', transition:'all 0.2s', fontWeight:600, fontSize:12 }}>
                        {set.done ? '✓ Completed' : '○ Mark Complete'}
                      </button>
                      {setIdx<ex.sets.length-1&&<div style={{ height:1, background:'var(--border)', margin:'8px 0' }}/>}
                    </div>
                  )
                })}
              </div>

              {/* Add/Remove Set Buttons */}
              <div style={{ display:'flex', gap:8, padding:'12px 16px' }}>
                <button onClick={()=>addSet(exIdx)}
                  style={{ flex:1, padding:'12px', borderRadius:12, background:'var(--primary-bg)', border:'1.5px solid var(--primary)', cursor:'pointer', fontSize:13, fontWeight:700, color:'var(--primary)', transition:'all 0.2s' }}>
                  + Add Set
                </button>
                {ex.sets.length>1&&(
                  <button onClick={()=>removeSet(exIdx,ex.sets.length-1)}
                    style={{ padding:'12px 16px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca', cursor:'pointer', fontSize:13, fontWeight:700, color:'#dc2626', transition:'all 0.2s' }}>
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
          ))
        )}

        {/* Professional Add Exercise Button */}
        <button onClick={()=>setShowExercisePicker(true)}
          style={{ width:'100%', padding:'18px', borderRadius:14, background:'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border:'none', cursor:'pointer', fontSize:15, fontWeight:800, color:'#fff', marginBottom:20, transition:'all 0.3s', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>
          + Add Exercise
        </button>

        {/* Finish Button */}
        <button onClick={finishWorkout} disabled={saving||exercises.length===0}
          style={{ width:'100%', padding:'16px', borderRadius:14, background:exercises.length===0?'var(--border)':'linear-gradient(135deg, #10b981 0%, #059669 100%)', border:'none', cursor:exercises.length===0?'not-allowed':'pointer', fontSize:15, fontWeight:800, color:'#fff', transition:'all 0.3s', boxShadow:exercises.length===0?'none':'0 4px 12px rgba(16,185,129,0.3)', opacity:saving?0.7:1 }}>
          {saving?'Saving Workout…':'✓ Finish Workout'}
        </button>
      </div>

      {/* Professional Exercise Picker Modal */}
      {showExercisePicker&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease-out' }}>
          <div style={{ background:'var(--surface)', width:'100%', maxWidth:430, margin:'0 auto', borderRadius:'24px 24px 0 0', maxHeight:'90dvh', display:'flex', flexDirection:'column', boxShadow:'0 -8px 32px rgba(0,0,0,0.15)' }}>
            {/* Modal Header */}
            <div style={{ padding:'20px 20px 16px', borderBottom:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg, var(--surface) 0%, rgba(99,102,241,0.03) 100%)' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:20, color:'var(--text)' }}>Add Exercise</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2, fontWeight:500 }}>Search or browse exercises</div>
              </div>
              <button onClick={()=>setShowExercisePicker(false)} style={{ background:'var(--card2)', border:'1.5px solid var(--border)', borderRadius:12, width:40, height:40, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', transition:'all 0.2s' }}>✕</button>
            </div>

            {/* Search and Filter */}
            <div style={{ padding:'14px 16px', borderBottom:'1.5px solid var(--border)', background:'var(--card)' }}>
              <input type="text" placeholder="Search exercises…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                style={{ width:'100%', padding:'12px 14px', borderRadius:12, fontSize:14, background:'var(--card2)', border:'1.5px solid var(--border)', color:'var(--text)', outline:'none', marginBottom:12, transition:'all 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}/>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setFilterCat(c)}
                    style={{ padding:'8px 16px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0, border:'1.5px solid '+(filterCat===c?'var(--primary)':'var(--border)'), background:filterCat===c?'var(--primary)':'transparent', color:filterCat===c?'#fff':'var(--muted)', transition:'all 0.2s' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div style={{ overflowY:'auto', flex:1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--muted)' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>No exercises found</div>
                  <div style={{ fontSize:12, marginTop:4 }}>Try different search terms or filters</div>
                </div>
              ) : (
                filtered.map(ex=>(
                  <button key={ex.id} onClick={()=>{addExercise(ex);setShowExercisePicker(false)}}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'transparent', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width:48, height:48, borderRadius:14, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                      {ex.emoji}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{ex.name}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:3, display:'flex', gap:6 }}>
                        <span>{ex.category}</span>
                        <span>•</span>
                        <span>{ex.equipment}</span>
                        <span>•</span>
                        <span>{ex.muscle}</span>
                      </div>
                    </div>
                    <div style={{ color:'var(--primary)', fontSize:20, flexShrink:0, fontWeight:700 }}>→</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {showMetricsModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:'20px' }}>
          <div style={{ background:'var(--card)', borderRadius:20, padding:'24px', maxWidth:'100%', width:'100%', maxWidth:340, boxShadow:'0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:18, color:'var(--text)' }}>Workout Metrics</div>
              <button onClick={() => setShowMetricsModal(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'var(--muted)' }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div style={{ background:'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius:14, padding:'16px', color:'#fff' }}>
                <div style={{ fontSize:10, opacity:0.9, fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>TOTAL VOLUME</div>
                <div style={{ fontSize:20, fontWeight:800 }}>{Math.round(totalVolume())} kg</div>
              </div>
              <div style={{ background:'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', borderRadius:14, padding:'16px', color:'#fff' }}>
                <div style={{ fontSize:10, opacity:0.9, fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>SETS DONE</div>
                <div style={{ fontSize:20, fontWeight:800 }}>{completedSets} of {totalSets}</div>
              </div>
              <div style={{ background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius:14, padding:'16px', color:'#fff' }}>
                <div style={{ fontSize:10, opacity:0.9, fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>TIME ELAPSED</div>
                <div style={{ fontSize:20, fontWeight:800 }}>{fmtTime(elapsed)}</div>
              </div>
              <div style={{ background:'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius:14, padding:'16px', color:'#fff' }}>
                <div style={{ fontSize:10, opacity:0.9, fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>EXERCISES</div>
                <div style={{ fontSize:20, fontWeight:800 }}>{exercises.length}</div>
              </div>
            </div>

            <button onClick={() => setShowMetricsModal(false)}
              style={{ width:'100%', padding:'12px', borderRadius:12, background:'var(--primary-bg)', border:'1.5px solid var(--primary)', color:'var(--primary)', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:600, color:'var(--muted)' }}>Loading workout…</div>}>
      <ActiveWorkoutContent />
    </Suspense>
  )
}
