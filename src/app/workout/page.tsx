'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function WorkoutPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [stats, setStats] = useState({ totalWorkouts:0, totalVolume:0, thisWeek:0, streak:0 })
  const [loading, setLoading] = useState(true)
  const [activeWorkout, setActiveWorkout] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }

    const [{ data:tmpl }, { data:logs }] = await Promise.all([
      supabase.from('workout_templates').select('*').eq('user_id', user.id).order('created_at', { ascending:false }),
      supabase.from('workout_logs').select('*').eq('user_id', user.id).order('started_at', { ascending:false }).limit(20),
    ])

    if (tmpl) setTemplates(tmpl)
    if (logs) {
      setRecentLogs(logs.slice(0,5))
      const week = new Date(); week.setDate(week.getDate()-7)
      const thisWeek = logs.filter(l => new Date(l.started_at) > week).length
      const totalVol = logs.reduce((s,l) => s + (l.total_volume_kg||0), 0)
      setStats({ totalWorkouts:logs.length, totalVolume:Math.round(totalVol), thisWeek, streak:0 })
    }

    // Check active workout in localStorage
    const active = localStorage.getItem('macrotrack_active_workout')
    if (active) { try { setActiveWorkout(JSON.parse(active)) } catch {} }

    setLoading(false)
  }

  function fmtDuration(sec) {
    if (!sec) return '—'
    const m = Math.floor(sec/60), h = Math.floor(m/60)
    return h > 0 ? `${h}h ${m%60}m` : `${m}m`
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN',{ weekday:'short', day:'numeric', month:'short' })
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid var(--primary)', borderTopColor:'transparent', animation:'spin 0.7s linear infinite' }}/>
    </div>
  )

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 20px) 20px 0' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.02em' }}>Workout</h1>
            <p style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Track your training</p>
          </div>
          <button onClick={() => router.push('/workout/body')}
            style={{ background:'var(--card2)', border:'1.5px solid var(--border)', borderRadius:12, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:'var(--text)', display:'flex', gap:4 }}><span>📚</span> Exercises
          </button>
        </div>

        {/* Resume active workout banner */}
        {activeWorkout && (
          <button onClick={() => router.push('/workout/active')}
            style={{ width:'100%', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:16, padding:'14px 16px', border:'none', cursor:'pointer', textAlign:'left', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Active workout</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{activeWorkout.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>Tap to resume</div>
            </div>
            <div style={{ fontSize:28 }}>▶️</div>
          </button>
        )}

        {/* Stats strip */}
        <div style={{ display:'flex', gap:10, marginBottom:20, overflowX:'auto' }}>
          {[
            { icon:'🏋️', label:'Total', val:stats.totalWorkouts, unit:'sessions' },
            { icon:'📅', label:'This week', val:stats.thisWeek, unit:'sessions' },
            { icon:'⚡', label:'Volume', val:stats.totalVolume>=1000?Math.round(stats.totalVolume/1000)+'k':stats.totalVolume, unit:'kg' },
          ].map(s=>(
            <div key={s.label} style={{ flexShrink:0, background:'var(--card)', borderRadius:16, padding:'12px 14px', border:'1.5px solid var(--border)', textAlign:'center', minWidth:100 }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)' }}>{s.val}</div>
              <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, marginTop:1, textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick start */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          <button onClick={() => router.push('/workout/active?quick=1')}
            style={{ background:'linear-gradient(135deg,var(--primary),#818cf8)', borderRadius:18, padding:'20px 16px', border:'none', cursor:'pointer', textAlign:'left', color:'#fff' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚡</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Quick Start</div>
            <div style={{ fontSize:11, opacity:0.8, marginTop:4 }}>Empty workout</div>
          </button>
          <button onClick={() => router.push('/workout/template')}
            style={{ background:'var(--card)', borderRadius:18, padding:'20px 16px', border:'1.5px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Templates</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Create & manage</div>
          </button>
          <button onClick={() => router.push('/workout/history')}
            style={{ background:'var(--card)', borderRadius:18, padding:'20px 16px', border:'1.5px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
            <div style={{ fontWeight:700, fontSize:15 }}>History</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Past workouts</div>
          </button>
          <button onClick={() => router.push('/workout/body')}
            style={{ background:'var(--card)', borderRadius:18, padding:'20px 16px', border:'1.5px solid var(--border)', cursor:'pointer', textAlign:'left' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🫀</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Body Map</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Muscle guide</div>
          </button>
        </div>

        {/* Templates */}
        {templates.length>0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>My templates</div>
              <button onClick={()=>router.push('/workout/template')} style={{ background:'none', border:'none', color:'var(--primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Manage</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {templates.slice(0,4).map(t=>(
                <button key={t.id} onClick={()=>router.push('/workout/active?template='+t.id)}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'var(--card)', borderRadius:16, border:'1.5px solid var(--border)', cursor:'pointer', textAlign:'left', width:'100%' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏋️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{(t.exercises||[]).length} exercises</div>
                  </div>
                  <div style={{ background:'var(--primary)', borderRadius:10, padding:'6px 12px', color:'#fff', fontSize:12, fontWeight:700, flexShrink:0 }}>Start</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {templates.length===0 && (
          <div className="card" style={{ textAlign:'center', padding:'32px', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No templates yet</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>Create workout templates to get started quickly</div>
            <button className="btn btn-primary" style={{ width:'auto', padding:'12px 24px', fontWeight:700 }} onClick={()=>router.push('/workout/template')}>
              Create template
            </button>
          </div>
        )}

        {/* Recent workouts */}
        {recentLogs.length>0 && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Recent workouts</div>
              <button onClick={()=>router.push('/workout/history')} style={{ background:'none', border:'none', color:'var(--primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>All</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recentLogs.map(log=>(
                <div key={log.id} className="card" style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{log.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{fmtDate(log.started_at)}</div>
                  </div>
                  <div style={{ display:'flex', gap:16 }}>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>⏱️ {fmtDuration(log.duration_seconds)}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>⚡ {log.total_volume_kg||0} kg</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>💪 {(log.exercises||[]).length} exercises</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
