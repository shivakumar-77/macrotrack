'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BODY_MUSCLES, EXERCISES } from '@/lib/exercises'
import BottomNav from '@/components/BottomNav'

const MUSCLE_PARTS = [
  { id:'chest',     label:'Chest',     color:'#6366f1', desc:'Pecs, upper chest', front:true },
  { id:'shoulders', label:'Shoulders', color:'#3b82f6', desc:'Front, side & rear delts', front:true },
  { id:'arms',      label:'Arms',      color:'#8b5cf6', desc:'Biceps, triceps, forearms', front:true },
  { id:'core',      label:'Core',      color:'#10b981', desc:'Abs, obliques', front:true },
  { id:'legs',      label:'Legs',      color:'#f59e0b', desc:'Quads, hamstrings, glutes, calves', front:true },
  { id:'back',      label:'Back',      color:'#ef4444', desc:'Lats, traps, rhomboids', front:false },
]

export default function BodyMapPage() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('front') // front | back
  const [gender, setGender] = useState('male')

  const selectedMuscle = selected ? BODY_MUSCLES[selected] : null
  const visibleParts = MUSCLE_PARTS.filter(p => view==='front' ? p.front : !p.front || p.id==='back' || p.id==='legs' || p.id==='arms')

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, background:'var(--card)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize:22, fontWeight:700, flex:1 }}>Body Map</h1>
          {/* Gender toggle */}
          <div style={{ display:'flex', background:'var(--card2)', borderRadius:10, padding:2, border:'1.5px solid var(--border)' }}>
            {['male','female'].map(g=>(
              <button key={g} onClick={()=>setGender(g)}
                style={{ padding:'5px 12px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background:gender===g?'var(--primary)':'transparent', color:gender===g?'#fff':'var(--muted)', textTransform:'capitalize' }}>
                {g==='male'?'♂ Male':'♀ Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Front/Back toggle */}
        <div style={{ display:'flex', background:'var(--card2)', borderRadius:14, padding:4, marginBottom:20, border:'1.5px solid var(--border)' }}>
          {['front','back'].map(v=>(
            <button key={v} onClick={()=>{setView(v);setSelected(null)}}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:view===v?'var(--primary)':'transparent', color:view===v?'#fff':'var(--muted)', textTransform:'capitalize' }}>
              {v === 'front' ? 'Front View' : 'Back View'}
            </button>
          ))}
        </div>

        {/* SVG Body */}
        <div style={{ background:'var(--card)', borderRadius:20, border:'1.5px solid var(--border)', padding:'20px', marginBottom:20, position:'relative' }}>
          <svg width="100%" viewBox="0 0 200 420" style={{ display:'block', maxHeight:380 }}>
            {/* Body outline */}
            {view==='front' ? (
              <g>
                {/* Head */}
                <ellipse cx="100" cy="30" rx="22" ry="26" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Neck */}
                <rect x="91" y="54" width="18" height="18" rx="4" fill="var(--card2)" stroke="var(--border)" strokeWidth="1"/>
                {/* Torso */}
                <path d="M65 72 L135 72 L140 180 L60 180 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Left arm */}
                <path d="M65 76 L42 80 L30 160 L50 165 L60 100 L72 96 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Right arm */}
                <path d="M135 76 L158 80 L170 160 L150 165 L140 100 L128 96 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Left forearm */}
                <path d="M30 160 L25 220 L42 222 L50 165 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Right forearm */}
                <path d="M170 160 L175 220 L158 222 L150 165 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Left leg */}
                <path d="M75 180 L62 280 L72 282 L90 190 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Right leg */}
                <path d="M125 180 L138 280 L128 282 L110 190 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Left calf */}
                <path d="M62 280 L58 360 L72 362 L72 282 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                {/* Right calf */}
                <path d="M138 280 L142 360 L128 362 L128 282 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>

                {/* CLICKABLE MUSCLE ZONES */}
                {/* Chest */}
                <ellipse cx="100" cy="115" rx="30" ry="25"
                  fill={selected==='chest'?'#6366f1':'#6366f1'} fillOpacity={selected==='chest'?0.7:0.25}
                  stroke="#6366f1" strokeWidth={selected==='chest'?2:1} style={{cursor:'pointer'}}
                  onClick={()=>setSelected(selected==='chest'?null:'chest')}/>
                <text x="100" y="119" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6366f1" style={{pointerEvents:'none'}}>CHEST</text>

                {/* Shoulders */}
                <ellipse cx="58" cy="92" rx="16" ry="12" fill="#3b82f6" fillOpacity={selected==='shoulders'?0.7:0.25} stroke="#3b82f6" strokeWidth={selected==='shoulders'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='shoulders'?null:'shoulders')}/>
                <ellipse cx="142" cy="92" rx="16" ry="12" fill="#3b82f6" fillOpacity={selected==='shoulders'?0.7:0.25} stroke="#3b82f6" strokeWidth={selected==='shoulders'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='shoulders'?null:'shoulders')}/>
                <text x="100" y="90" textAnchor="middle" fontSize="8" fontWeight="700" fill="#3b82f6" style={{pointerEvents:'none'}}>SHOULDERS</text>

                {/* Arms (biceps) */}
                <ellipse cx="43" cy="128" rx="12" ry="22" fill="#8b5cf6" fillOpacity={selected==='arms'?0.7:0.25} stroke="#8b5cf6" strokeWidth={selected==='arms'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='arms'?null:'arms')}/>
                <ellipse cx="157" cy="128" rx="12" ry="22" fill="#8b5cf6" fillOpacity={selected==='arms'?0.7:0.25} stroke="#8b5cf6" strokeWidth={selected==='arms'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='arms'?null:'arms')}/>
                <text x="100" y="135" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8b5cf6" style={{pointerEvents:'none'}}>ARMS</text>

                {/* Core/Abs */}
                <rect x="76" y="142" width="48" height="34" rx="8" fill="#10b981" fillOpacity={selected==='core'?0.7:0.25} stroke="#10b981" strokeWidth={selected==='core'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='core'?null:'core')}/>
                <text x="100" y="162" textAnchor="middle" fontSize="9" fontWeight="700" fill="#10b981" style={{pointerEvents:'none'}}>CORE</text>

                {/* Legs (quads) */}
                <ellipse cx="82" cy="230" rx="16" ry="44" fill="#f59e0b" fillOpacity={selected==='legs'?0.7:0.25} stroke="#f59e0b" strokeWidth={selected==='legs'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='legs'?null:'legs')}/>
                <ellipse cx="118" cy="230" rx="16" ry="44" fill="#f59e0b" fillOpacity={selected==='legs'?0.7:0.25} stroke="#f59e0b" strokeWidth={selected==='legs'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='legs'?null:'legs')}/>
                <text x="100" y="233" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f59e0b" style={{pointerEvents:'none'}}>LEGS</text>
              </g>
            ) : (
              <g>
                {/* Back view */}
                <ellipse cx="100" cy="30" rx="22" ry="26" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <rect x="91" y="54" width="18" height="18" rx="4" fill="var(--card2)" stroke="var(--border)" strokeWidth="1"/>
                <path d="M65 72 L135 72 L140 180 L60 180 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M65 76 L42 80 L30 160 L50 165 L60 100 L72 96 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M135 76 L158 80 L170 160 L150 165 L140 100 L128 96 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M30 160 L25 220 L42 222 L50 165 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M170 160 L175 220 L158 222 L150 165 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M75 180 L62 280 L72 282 L90 190 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M125 180 L138 280 L128 282 L110 190 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M62 280 L58 360 L72 362 L72 282 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M138 280 L142 360 L128 362 L128 282 Z" fill="var(--card2)" stroke="var(--border)" strokeWidth="1.5"/>

                {/* Back muscles */}
                <path d="M72 78 L100 90 L128 78 L132 145 L100 155 L68 145 Z" fill="#ef4444" fillOpacity={selected==='back'?0.7:0.3} stroke="#ef4444" strokeWidth={selected==='back'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='back'?null:'back')}/>
                <text x="100" y="120" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ef4444" style={{pointerEvents:'none'}}>BACK</text>
                <text x="100" y="131" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#ef4444" style={{pointerEvents:'none'}}>LATS · TRAPS</text>

                {/* Shoulders back */}
                <ellipse cx="58" cy="92" rx="16" ry="12" fill="#3b82f6" fillOpacity={selected==='shoulders'?0.7:0.25} stroke="#3b82f6" strokeWidth={selected==='shoulders'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='shoulders'?null:'shoulders')}/>
                <ellipse cx="142" cy="92" rx="16" ry="12" fill="#3b82f6" fillOpacity={selected==='shoulders'?0.7:0.25} stroke="#3b82f6" strokeWidth={selected==='shoulders'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='shoulders'?null:'shoulders')}/>

                {/* Triceps */}
                <ellipse cx="43" cy="128" rx="12" ry="22" fill="#8b5cf6" fillOpacity={selected==='arms'?0.7:0.25} stroke="#8b5cf6" strokeWidth={selected==='arms'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='arms'?null:'arms')}/>
                <ellipse cx="157" cy="128" rx="12" ry="22" fill="#8b5cf6" fillOpacity={selected==='arms'?0.7:0.25} stroke="#8b5cf6" strokeWidth={selected==='arms'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='arms'?null:'arms')}/>
                <text x="100" y="135" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8b5cf6" style={{pointerEvents:'none'}}>TRICEPS</text>

                {/* Glutes/Hamstrings */}
                <ellipse cx="88" cy="198" rx="20" ry="16" fill="#f59e0b" fillOpacity={selected==='legs'?0.7:0.25} stroke="#f59e0b" strokeWidth={selected==='legs'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='legs'?null:'legs')}/>
                <ellipse cx="112" cy="198" rx="20" ry="16" fill="#f59e0b" fillOpacity={selected==='legs'?0.7:0.25} stroke="#f59e0b" strokeWidth={selected==='legs'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='legs'?null:'legs')}/>
                <ellipse cx="82" cy="248" rx="14" ry="38" fill="#f59e0b" fillOpacity={selected==='legs'?0.6:0.2} stroke="#f59e0b" strokeWidth={selected==='legs'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='legs'?null:'legs')}/>
                <ellipse cx="118" cy="248" rx="14" ry="38" fill="#f59e0b" fillOpacity={selected==='legs'?0.6:0.2} stroke="#f59e0b" strokeWidth={selected==='legs'?2:1} style={{cursor:'pointer'}} onClick={()=>setSelected(selected==='legs'?null:'legs')}/>
                <text x="100" y="200" textAnchor="middle" fontSize="8" fontWeight="700" fill="#f59e0b" style={{pointerEvents:'none'}}>GLUTES</text>
                <text x="100" y="252" textAnchor="middle" fontSize="8" fontWeight="700" fill="#f59e0b" style={{pointerEvents:'none'}}>HAMSTRINGS</text>
              </g>
            )}
          </svg>

          <div style={{ textAlign:'center', marginTop:8 }}>
            <div style={{ fontSize:11, color:'var(--muted)' }}>Tap any muscle group to see exercises</div>
          </div>
        </div>

        {/* Muscle chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
          {MUSCLE_PARTS.filter(p=>view==='front'?p.front:true).map(p=>(
            <button key={p.id} onClick={()=>setSelected(selected===p.id?null:p.id)}
              style={{ padding:'8px 16px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', border:'2px solid '+(selected===p.id?p.color:'var(--border)'), background:selected===p.id?p.color:'var(--card)', color:selected===p.id?'#fff':'var(--text)' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Selected muscle details */}
        {selectedMuscle && (
          <div className="slide-up">
            <div style={{ background:'var(--card)', borderRadius:20, border:'1.5px solid var(--border)', overflow:'hidden', marginBottom:16 }}>
              <div style={{ background:'linear-gradient(135deg,var(--primary),#818cf8)', padding:'16px 20px', color:'#fff' }}>
                <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{selectedMuscle.label}</div>
                <div style={{ fontSize:13, opacity:0.85 }}>{selectedMuscle.muscles.join(' · ')}</div>
              </div>
              <div style={{ padding:'16px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
                  {selectedMuscle.exercises.length} exercises
                </div>
                {selectedMuscle.exercises.map(ex=>(
                  <button key={ex.id}
                    onClick={()=>router.push('/workout/active?quick=1')}
                    style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{ex.emoji}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{ex.name}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{ex.equipment} · {ex.sets} sets × {ex.reps} reps</div>
                      <div style={{ fontSize:11, color:'var(--primary)', marginTop:4, lineHeight:1.5 }}>{ex.instructions.slice(0,80)}…</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
