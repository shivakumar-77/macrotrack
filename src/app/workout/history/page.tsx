'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [chartData, setChartData] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).order('started_at',{ascending:false}).limit(50)
    if (data) {
      setLogs(data)
      // Build weekly volume chart
      const weeks = {}
      data.forEach(l=>{
        const d = new Date(l.started_at)
        const wk = new Date(d); wk.setDate(d.getDate()-d.getDay())
        const key = wk.toISOString().slice(0,10)
        weeks[key] = (weeks[key]||0) + (l.total_volume_kg||0)
      })
      const sorted = Object.entries(weeks).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8)
      setChartData(sorted)
    }
    setLoading(false)
  }

  function fmtDuration(sec) {
    if (!sec) return '—'
    const m=Math.floor(sec/60), h=Math.floor(m/60)
    return h>0?`${h}h ${m%60}m`:`${m}m`
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short',year:'numeric'})
  }

  function groupByMonth(logs) {
    const groups = {}
    logs.forEach(l=>{
      const key = new Date(l.started_at).toLocaleDateString('en-IN',{month:'long',year:'numeric'})
      if (!groups[key]) groups[key]=[]
      groups[key].push(l)
    })
    return groups
  }

  const grouped = groupByMonth(logs)
  const maxVol = Math.max(...chartData.map(([,v])=>v), 1)

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100dvh'}}><div style={{width:32,height:32,borderRadius:'50%',border:'3px solid var(--primary)',borderTopColor:'transparent',animation:'spin 0.7s linear infinite'}}/></div>

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, background:'var(--card)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize:22, fontWeight:700 }}>History</h1>
        </div>

        {/* Volume chart */}
        {chartData.length>1&&(
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Weekly volume</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>Total kg lifted per week</div>
            <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:80 }}>
              {chartData.map(([week,vol],i)=>{
                const h = Math.max(6, (vol/maxVol)*68)
                const isLatest = i===chartData.length-1
                return (
                  <div key={week} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:8, color:'var(--primary)', fontWeight:700 }}>
                      {vol>=1000?Math.round(vol/1000)+'k':Math.round(vol)}
                    </div>
                    <div style={{ width:'100%', height:h, background:isLatest?'var(--primary)':'var(--primary)', borderRadius:4, opacity:isLatest?1:0.4, transition:'height 0.4s' }}/>
                    <div style={{ fontSize:8, color:'var(--muted)', fontWeight:500 }}>
                      {new Date(week+'T12:00:00').toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Grouped logs */}
        {Object.entries(grouped).map(([month, monthLogs])=>(
          <div key={month} style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{month}</div>
            {monthLogs.map(log=>(
              <div key={log.id} className="card" style={{ marginBottom:10 }}>
                <button onClick={()=>setExpanded(expanded===log.id?null:log.id)}
                  style={{ width:'100%', background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:16 }}>{log.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                      {new Date(log.started_at).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:16, marginBottom:8 }}>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>⏱️ {fmtDuration(log.duration_seconds)}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>⚡ {log.total_volume_kg||0} kg</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>💪 {(log.exercises||[]).length} exercises</div>
                  </div>
                </button>

                {expanded===log.id&&(
                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginTop:4 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
                      {(log.exercises||[]).map((ex,i)=>{
                        const done = (ex.sets||[]).filter(s=>s.done)
                        const bestSet = done.reduce((best,s)=>(!best||(parseFloat(s.weight)||0)>(parseFloat(best.weight)||0)?s:best),null)
                        return (
                          <div key={i} style={{ background:'var(--card2)', borderRadius:10, padding:'10px' }}>
                            <div style={{ fontWeight:600, fontSize:12, marginBottom:2 }}>{ex.name}</div>
                            <div style={{ fontSize:11, color:'var(--muted)' }}>{done.length} sets</div>
                            {bestSet&&<div style={{ fontSize:11, color:'var(--primary)', fontWeight:600, marginTop:2 }}>Best: {bestSet.weight}kg × {bestSet.reps}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {logs.length===0&&(
          <div className="card" style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No workouts yet</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Complete your first workout to see history</div>
            <button className="btn btn-primary" style={{ width:'auto', padding:'12px 24px' }} onClick={()=>router.push('/workout')}>Start workout</button>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
