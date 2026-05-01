'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EXERCISES, CATEGORIES } from '@/lib/exercises'
import BottomNav from '@/components/BottomNav'

export default function TemplatePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState([])
  const [view, setView] = useState('list') // list | create | edit
  const [editTemplate, setEditTemplate] = useState(null)
  const [tName, setTName] = useState('')
  const [tExercises, setTExercises] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('workout_templates').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
    if (data) setTemplates(data)
  }

  function startCreate() {
    setTName(''); setTExercises([]); setEditTemplate(null); setView('create')
  }

  function startEdit(t) {
    setTName(t.name); setTExercises(t.exercises||[]); setEditTemplate(t); setView('create')
  }

  async function save() {
    if (!tName.trim()) return
    setSaving(true)
    const { data:{ user } } = await supabase.auth.getUser()
    const payload = { user_id:user.id, name:tName, exercises:tExercises }
    if (editTemplate) await supabase.from('workout_templates').update(payload).eq('id', editTemplate.id)
    else await supabase.from('workout_templates').insert(payload)
    setSaving(false); load(); setView('list')
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return
    await supabase.from('workout_templates').delete().eq('id', id)
    load()
  }

  function addExercise(ex) {
    setTExercises(p=>[...p,{...ex,sets:ex.sets||3,reps:ex.reps||8}])
    setShowPicker(false)
  }

  const filtered = EXERCISES.filter(e=>
    (filterCat==='All'||e.category===filterCat)&&
    (!searchQ||e.name.toLowerCase().includes(searchQ.toLowerCase()))
  )

  if (view==='list') return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, background:'var(--card)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize:22, fontWeight:700, flex:1 }}>Templates</h1>
          <button onClick={startCreate} style={{ background:'var(--primary)', border:'none', borderRadius:12, padding:'8px 16px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>+ New</button>
        </div>

        {templates.length===0?(
          <div className="card" style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No templates yet</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Create reusable workout templates</div>
            <button className="btn btn-primary" style={{ width:'auto', padding:'12px 24px' }} onClick={startCreate}>Create first template</button>
          </div>
        ):(
          templates.map(t=>(
            <div key={t.id} className="card" style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:16 }}>{t.name}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>startEdit(t)} style={{ background:'var(--card2)', border:'1.5px solid var(--border)', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer', color:'var(--text)' }}>Edit</button>
                  <button onClick={()=>deleteTemplate(t.id)} style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer', color:'#dc2626' }}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>{(t.exercises||[]).length} exercises</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                {(t.exercises||[]).map((e,i)=>(
                  <div key={i} style={{ padding:'4px 10px', background:'var(--primary-bg)', borderRadius:99, fontSize:11, fontWeight:600, color:'var(--primary)' }}>{e.name}</div>
                ))}
              </div>
              <button onClick={()=>router.push('/workout/active?template='+t.id)}
                style={{ width:'100%', padding:'11px', borderRadius:12, background:'var(--primary)', border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                Start workout
              </button>
            </div>
          ))
        )}
      </div>
      <BottomNav/>
    </div>
  )

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={()=>setView('list')} style={{ width:36, height:36, borderRadius:10, background:'var(--card)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize:20, fontWeight:700, flex:1 }}>{editTemplate?'Edit':'New'} Template</h1>
          <button onClick={save} disabled={saving||!tName.trim()} style={{ background:'var(--primary)', border:'none', borderRadius:12, padding:'8px 16px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', opacity:!tName.trim()?0.5:1 }}>
            {saving?'Saving…':'Save'}
          </button>
        </div>

        <input value={tName} onChange={e=>setTName(e.target.value)} placeholder="Template name e.g. Push Day A"
          style={{ fontSize:18, fontWeight:700, marginBottom:20 }}/>

        {tExercises.map((ex,i)=>(
          <div key={i} className="card" style={{ marginBottom:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{ex.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{ex.name}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{ex.sets} sets × {ex.reps} reps</div>
            </div>
            <button onClick={()=>setTExercises(p=>p.filter((_,j)=>j!==i))}
              style={{ background:'#fef2f2', border:'none', borderRadius:8, width:28, height:28, cursor:'pointer', color:'#dc2626', fontSize:14 }}>✕</button>
          </div>
        ))}

        <button onClick={()=>setShowPicker(true)}
          style={{ width:'100%', padding:'14px', borderRadius:16, background:'var(--primary-bg)', border:'2px dashed var(--primary)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--primary)', marginBottom:16 }}>
          + Add Exercise
        </button>
      </div>

      {showPicker&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'var(--surface)', width:'100%', maxWidth:430, margin:'0 auto', borderRadius:'24px 24px 0 0', maxHeight:'80dvh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:18 }}>Add Exercise</div>
              <button onClick={()=>setShowPicker(false)} style={{ background:'var(--card2)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
              <input type="text" placeholder="Search…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ marginBottom:10 }}/>
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
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'12px 20px', background:'none', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{ex.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{ex.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{ex.category} · {ex.muscle}</div>
                  </div>
                  <div style={{ color:'var(--primary)', fontSize:20 }}>+</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <BottomNav/>
    </div>
  )
}
