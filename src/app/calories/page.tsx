'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CaloriesPage() {
  const router = useRouter()
  const [calTarget, setCalTarget] = useState(1700)
  const [todayCal, setTodayCal] = useState(0)
  const [todayLogs, setTodayLogs] = useState([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [calData, setCalData] = useState({})
  const [userId, setUserId] = useState(null)
  const [targets, setTargets] = useState({ protein: 167, carb: 144, fat: 60 })
  const [todayMacros, setTodayMacros] = useState({ protein: 0, carb: 0, fat: 0 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      setUserId(user.id)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) { setCalTarget(prof.cal_target||1700); setTargets({ protein:prof.protein_target||167, carb:prof.carb_target||144, fat:prof.fat_target||60 }) }
      await loadToday(user.id)
      await loadCalendar(user.id, new Date())
    }
    load()
  }, [])

  async function loadToday(uid) {
    const today = new Date().toISOString().slice(0,10)
    const { data } = await supabase.from('food_logs').select('*').eq('user_id', uid).eq('logged_at', today).order('created_at')
    if (data) {
      setTodayLogs(data)
      setTodayCal(data.reduce((s,l)=>s+l.cal,0))
      setTodayMacros({ protein:data.reduce((s,l)=>s+l.protein,0), carb:data.reduce((s,l)=>s+l.carb,0), fat:data.reduce((s,l)=>s+l.fat,0) })
    }
  }

  async function loadCalendar(uid, month) {
    const year=month.getFullYear(), m=month.getMonth()
    const start=new Date(year,m,1).toISOString().slice(0,10), end=new Date(year,m+1,0).toISOString().slice(0,10)
    const { data } = await supabase.from('food_logs').select('logged_at,cal').eq('user_id',uid).gte('logged_at',start).lte('logged_at',end)
    if (data) {
      const grouped={}
      data.forEach(l=>{ grouped[l.logged_at]=(grouped[l.logged_at]||0)+l.cal })
      setCalData(grouped)
    }
  }

  async function changeMonth(dir) {
    const newMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()+dir, 1)
    setCalMonth(newMonth)
    if (userId) await loadCalendar(userId, newMonth)
  }

  const pct = Math.min(1, todayCal/calTarget)
  const over = todayCal > calTarget
  const cc = over ? '#ef4444' : '#6366f1'

  const year=calMonth.getFullYear(), month=calMonth.getMonth()
  const firstDay=new Date(year,month,1).getDay()
  const daysInMonth=new Date(year,month+1,0).getDate()
  const today=new Date().toISOString().slice(0,10)
  const blanks=firstDay===0?6:firstDay-1

  function getDayColor(dateStr) {
    const cal=calData[dateStr]||0; if(!cal) return null
    const p=cal/calTarget
    if(p>1.1) return '#ef4444'
    if(p>=0.9&&p<=1.1) return '#10b981'
    if(p>=0.6) return '#6366f1'
    if(p>=0.3) return '#a5b4fc'
    return '#e0e7ff'
  }

  const mealGroups=['breakfast','lunch','dinner','snack','other']
  const mealColors={breakfast:'#f59e0b',lunch:'#10b981',dinner:'#6366f1',snack:'#ef4444',other:'#94a3b8'}

  return (
    <div style={{ background:'var(--surface)', minHeight:'100dvh', maxWidth:430, margin:'0 auto', paddingBottom:40 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'52px 20px 20px' }}>
        <button onClick={()=>router.back()} style={{ width:38, height:38, borderRadius:12, background:'var(--card)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Calories</h1>
      </div>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 20px 28px' }}>
        <div style={{ position:'relative', width:180, height:180, marginBottom:24 }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="76" fill="none" stroke="#e2e8f0" strokeWidth="14"/>
            <circle cx="90" cy="90" r="76" fill="none" stroke={cc} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*76}`} strokeDashoffset={2*Math.PI*76*(1-pct)}
              style={{ transformOrigin:'90px 90px', transform:'rotate(-90deg)', transition:'stroke-dashoffset 0.8s ease' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
            <div style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.03em', color:cc }}>{Math.round(todayCal)}</div>
            <div style={{ fontSize:13, color:'var(--muted)', fontWeight:600 }}>of {calTarget} kcal</div>
            <div style={{ fontSize:12, fontWeight:700, color:over?'#ef4444':'#10b981', marginTop:2 }}>{over?`${Math.round(todayCal-calTarget)} over`:`${Math.round(calTarget-todayCal)} left`}</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, width:'100%' }}>
          {[{l:'Protein',v:todayMacros.protein,t:targets.protein,c:'#3b82f6',bg:'#dbeafe'},{l:'Carbs',v:todayMacros.carb,t:targets.carb,c:'#f59e0b',bg:'#fef3c7'},{l:'Fat',v:todayMacros.fat,t:targets.fat,c:'#ef4444',bg:'#fee2e2'}].map(m=>(
            <div key={m.l} style={{ flex:1, background:m.bg, borderRadius:16, padding:'12px 10px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:m.c, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{m.l}</div>
              <div style={{ fontSize:18, fontWeight:800, color:m.c }}>{Math.round(m.v)}<span style={{ fontSize:11, fontWeight:500 }}>g</span></div>
              <div style={{ fontSize:10, color:m.c, opacity:0.7 }}>of {m.t}g</div>
              <div style={{ marginTop:6, height:3, background:'rgba(0,0,0,0.08)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', background:m.c, width:`${Math.min(100,(m.v/m.t)*100)}%`, borderRadius:2, transition:'width 0.6s ease' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 20px 24px' }}>
        <button onClick={()=>router.push('/log')} style={{ width:'100%', padding:'15px', borderRadius:18, background:cc, color:'#fff', fontSize:16, fontWeight:800, border:'none', cursor:'pointer', boxShadow:`0 6px 20px ${cc}40` }}>+ Log Food</button>
      </div>

      {todayLogs.length > 0 && (
        <div style={{ padding:'0 20px 24px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Today's meals</div>
          {mealGroups.map(meal => {
            const items=todayLogs.filter(l=>l.meal_type===meal); if(!items.length) return null
            return (
              <div key={meal} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:mealColors[meal] }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{meal}</span>
                </div>
                {items.map(log=>(
                  <div key={log.id} className="card" style={{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{log.name}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{log.qty}{log.unit} · {Math.round(log.protein)}P · {Math.round(log.carb)}C · {Math.round(log.fat)}F</div>
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, color:cc }}>{Math.round(log.cal)}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ padding:'0 20px' }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <button onClick={()=>changeMonth(-1)} style={{ width:36, height:36, borderRadius:10, background:'var(--card2)', border:'1.5px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ fontWeight:700, fontSize:16 }}>{calMonth.toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</div>
            <button onClick={()=>changeMonth(1)} style={{ width:36, height:36, borderRadius:10, background:'var(--card2)', border:'1.5px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
            {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'var(--muted)' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
            {Array(blanks).fill(null).map((_,i)=><div key={`b${i}`}/>)}
            {Array(daysInMonth).fill(null).map((_,i)=>{
              const day=i+1
              const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const cal=calData[dateStr]||0
              const bg=getDayColor(dateStr)
              const isToday=dateStr===today
              return (
                <div key={day} style={{ aspectRatio:'1', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:bg||(isToday?'var(--primary-bg)':'transparent'), border:isToday?`2px solid ${cc}`:'2px solid transparent' }}>
                  <div style={{ fontSize:12, fontWeight:isToday?800:600, color:bg?'#fff':isToday?cc:'var(--text)' }}>{day}</div>
                  {cal>0&&<div style={{ fontSize:8, fontWeight:700, color:bg?'rgba(255,255,255,0.85)':cc }}>{cal>=1000?`${(cal/1000).toFixed(1)}k`:Math.round(cal)}</div>}
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center', flexWrap:'wrap' }}>
            {[{c:'#10b981',l:'On target'},{c:'#6366f1',l:'60%+'},{c:'#ef4444',l:'Over'},{c:'#a5b4fc',l:'Started'}].map(l=>(
              <div key={l.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:l.c }}/>
                <span style={{ fontSize:10, color:'var(--muted)', fontWeight:500 }}>{l.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
