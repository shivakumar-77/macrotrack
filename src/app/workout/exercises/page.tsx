'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EXERCISES, CATEGORIES } from '@/lib/exercises'
import BottomNav from '@/components/BottomNav'

const EQUIPMENT_ICONS = {
  'Barbell':'🏋️','Dumbbell':'🏋️','Cable':'🔗','Machine':'⚙️',
  'Bodyweight':'💪','Band':'🔴','Kettlebell':'🫙','Pull Up Bar':'🔝',
  'Stability Ball':'⚽','Bench':'📐','Box':'📦','Plate':'⭕',
  'Wheel':'⚙️','Wrist Roller':'⚙️','T-Bar':'🏋️','GHD Machine':'⚙️',
  'Captain\'s Chair':'🪑','Smith Machine':'🏋️','Parallel Bars':'🏋️',
  'Medicine Ball':'🏐','Rowing Machine':'🚣','Stationary Bike':'🚴',
  'Treadmill':'🏃','Jump Rope':'🏃','Skates':'⛸️','Skis':'⛷️',
  'Snowboard':'🏂','Pool':'🏊','Mat':'🧘','Bike':'🚴','None':'🏃',
  'Trap Bar':'🏋️',
}

export default function ExercisesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedEx, setSelectedEx] = useState(null)
  const [sortBy, setSortBy] = useState('name') // name | equipment

  const filtered = EXERCISES.filter(e =>
    (category === 'All' || e.category === category) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) ||
     e.muscle.toLowerCase().includes(search.toLowerCase()) ||
     e.equipment.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return a.equipment.localeCompare(b.equipment)
  })

  // Group by first letter
  const grouped = {}
  filtered.forEach(e => {
    const letter = e.name[0].toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(e)
  })

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:100 }}>

      {/* Sticky header + search */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'var(--surface)', borderBottom:'1px solid var(--border)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
        <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 12px) 16px 10px', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.back()}
            style={{ width:36, height:36, borderRadius:10, background:'var(--card)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize:20, fontWeight:700, flex:1 }}>Exercises</h1>
          <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>{filtered.length}</div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{ fontSize:12, padding:'5px 8px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', cursor:'pointer', width:'auto' }}>
            <option value="name">A–Z</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ position:'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search exercise, muscle, equipment…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:36, borderRadius:12 }}/>
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:16 }}>×</button>}
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'0 16px 12px', scrollbarWidth:'none' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0, border:'1.5px solid '+(category===c?'var(--primary)':'var(--border)'), background:category===c?'var(--primary)':'var(--card)', color:category===c?'#fff':'var(--muted)', WebkitTapHighlightColor:'transparent' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list grouped by letter */}
      <div style={{ padding:'8px 0' }}>
        {Object.keys(grouped).sort().map(letter => (
          <div key={letter}>
            <div style={{ padding:'8px 16px 4px', fontSize:12, fontWeight:700, color:'var(--muted)', background:'var(--surface)' }}>
              {letter}
            </div>
            {grouped[letter].map(ex => (
              <button key={ex.id} onClick={() => setSelectedEx(selectedEx?.id===ex.id?null:ex)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:selectedEx?.id===ex.id?'var(--primary-bg)':'none', border:'none', borderBottom:'0.5px solid var(--border)', cursor:'pointer', textAlign:'left', WebkitTapHighlightColor:'transparent' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:selectedEx?.id===ex.id?'var(--primary)':'var(--card2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, border:'1.5px solid var(--border)' }}>
                  {EQUIPMENT_ICONS[ex.equipment] || '🏋️'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:selectedEx?.id===ex.id?'var(--primary)':'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{ex.category} · {ex.equipment}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <div style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:99, background:'var(--card2)', color:'var(--muted)', border:'1px solid var(--border)' }}>
                    {ex.muscle.split(' ').slice(0,2).join(' ')}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                    {selectedEx?.id===ex.id ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                  </svg>
                </div>
              </button>
            ))}

            {/* Expanded exercise detail */}
            {grouped[letter].some(e => e.id === selectedEx?.id) && selectedEx && (
              <div style={{ margin:'0 12px 12px', background:'var(--card)', borderRadius:16, border:'1.5px solid var(--primary)', padding:'16px', animation:'slideUp 0.25s ease' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:17, color:'var(--primary)', marginBottom:4 }}>{selectedEx.name}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'var(--primary-bg)', color:'var(--primary)' }}>{selectedEx.category}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'var(--card2)', color:'var(--muted)' }}>{selectedEx.equipment}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:32, marginLeft:12 }}>{selectedEx.emoji}</div>
                </div>

                {/* Muscles */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Muscles worked</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:99, background:'#eef2ff', color:'#6366f1', border:'1px solid #c7d2fe' }}>🎯 {selectedEx.muscle}</span>
                    {selectedEx.secondary.map(s => (
                      <span key={s} style={{ fontSize:11, fontWeight:500, padding:'4px 10px', borderRadius:99, background:'var(--card2)', color:'var(--muted)', border:'1px solid var(--border)' }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Default sets/reps */}
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  <div style={{ flex:1, background:'var(--surface)', borderRadius:10, padding:'10px', textAlign:'center', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)' }}>{selectedEx.sets}</div>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>Sets</div>
                  </div>
                  <div style={{ flex:1, background:'var(--surface)', borderRadius:10, padding:'10px', textAlign:'center', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)' }}>{selectedEx.reps}</div>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>{selectedEx.unit==='seconds'?'Seconds':selectedEx.unit==='minutes'?'Minutes':'Reps'}</div>
                  </div>
                </div>

                {/* Instructions */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>How to perform</div>
                  <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.8, background:'var(--surface)', borderRadius:10, padding:'12px', border:'1px solid var(--border)' }}>
                    {selectedEx.instructions}
                  </div>
                </div>

                {/* Tips */}
                <div style={{ background:'#fef3c7', borderRadius:10, padding:'10px 12px', border:'1px solid #fde68a' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#d97706', marginBottom:4 }}>💡 Pro tip</div>
                  <div style={{ fontSize:12, color:'#92400e', lineHeight:1.6 }}>{selectedEx.tips}</div>
                </div>

                {/* Add to workout button */}
                <button onClick={() => router.push('/workout/active?quick=1')}
                  style={{ width:'100%', marginTop:12, padding:'12px', borderRadius:12, background:'var(--primary)', border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                  + Start workout with this exercise
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <div style={{ fontWeight:600, fontSize:16, marginBottom:6 }}>No exercises found</div>
            <div style={{ fontSize:13 }}>Try a different search or category</div>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
