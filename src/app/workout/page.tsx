'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { PageLoader } from '@/components/Skeleton'
import { TimerIcon, BoltIcon, MuscleIcon, PlayIcon, ChartBarIcon, ClipboardIcon, HeartBeatIcon } from '@/lib/icons'

export default function WorkoutPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [templates, setTemplates] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [stats, setStats] = useState({ total:0, volume:0, week:0 })
  const [loading, setLoading] = useState(true)
  const [activeWorkout, setActiveWorkout] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    const [{ data:prof }, { data:tmpl }, { data:logs }] = await Promise.all([
      supabase.from('profiles').select('name,photo_url').eq('id', user.id).single(),
      supabase.from('workout_templates').select('*').eq('user_id', user.id).order('created_at',{ascending:false}),
      supabase.from('workout_logs').select('*').eq('user_id', user.id).order('started_at',{ascending:false}).limit(20),
    ])
    if (prof) setProfile(prof)
    if (tmpl) setTemplates(tmpl)
    if (logs) {
      setRecentLogs(logs.slice(0,5))
      const week = new Date(); week.setDate(week.getDate()-7)
      setStats({
        total: logs.length,
        week: logs.filter(l=>new Date(l.started_at)>week).length,
        volume: Math.round(logs.reduce((s,l)=>s+(l.total_volume_kg||0),0))
      })
    }
    const active = localStorage.getItem('macrotrack_active_workout')
    if (active) { try { setActiveWorkout(JSON.parse(active)) } catch {} }
    setLoading(false)
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})
  }
  function fmtDur(s) {
    if (!s) return ''
    const m=Math.floor(s/60), h=Math.floor(m/60)
    return h>0?`${h}h ${m%60}m`:`${m}m`
  }

  function getIcon(iconName) {
    const icons = {
      MuscleIcon: <MuscleIcon size={18}/>,
      ClipboardIcon: <ClipboardIcon size={18}/>,
      ChartBarIcon: <ChartBarIcon size={18}/>,
      HeartBeatIcon: <HeartBeatIcon size={18}/>,
    }
    return icons[iconName] || null
  }

  if (loading) return <PageLoader/>

  return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:100}}>
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 20px) 20px 0'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <div>
            <p style={{fontSize:13,color:'var(--muted)',fontWeight:500}}>Hey, {profile?.name?.split(' ')[0]||'there'}</p>
            <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.03em',marginTop:2}}>Start Workout</h1>
          </div>
          <button onClick={()=>router.push('/profile')} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <div style={{width:46,height:46,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',border:'2px solid var(--border)'}}>
              {profile?.photo_url?<img src={profile.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(profile?.name?.[0]?.toUpperCase()||'?')}
            </div>
          </button>
        </div>

        {/* Active workout banner */}
        {activeWorkout && (
          <button onClick={()=>router.push('/workout/active')}
            style={{width:'100%',background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:16,padding:'14px 18px',border:'none',cursor:'pointer',textAlign:'left',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Active workout</div>
              <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>{activeWorkout.name} — tap to resume</div>
            </div>
            <div style={{fontSize:26,display:'flex',alignItems:'center',justifyContent:'center'}}><PlayIcon size={24} color='#fff'/></div>
          </button>
        )}

        {/* Quick start */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:13,color:'var(--muted)',fontWeight:500,marginBottom:10}}>Quick start</p>
          <button onClick={()=>router.push('/workout/active?quick=1')}
            style={{width:'100%',background:'var(--primary)',borderRadius:16,padding:'16px',border:'none',cursor:'pointer',fontSize:16,fontWeight:700,color:'#fff',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
            Start an empty workout
          </button>
        </div>

        {/* 2x2 grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:28}}>
          {[
            {label:'Exercises',icon:'MuscleIcon',sub:'Browse all',action:()=>router.push('/workout/exercises')},
            {label:'Create Templates',icon:'ClipboardIcon',sub:'Build routines',action:()=>router.push('/workout/template')},
            {label:'History',icon:'ChartBarIcon',sub:`${stats.total} workouts`,action:()=>router.push('/workout/history')},
            {label:'Body Anatomy',icon:'HeartBeatIcon',sub:'Muscle map',action:()=>router.push('/workout/body')},
          ].map(item=>(
            <button key={item.label} onClick={item.action}
              style={{background:'var(--card)',borderRadius:20,padding:'18px 16px',border:'1.5px solid var(--border)',cursor:'pointer',textAlign:'left',position:'relative',WebkitTapHighlightColor:'transparent',minHeight:110,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              <div style={{width:32,height:32,borderRadius:8,background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                {getIcon(item.icon)}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'var(--text)',marginBottom:2}}>{item.label}</div>
                <div style={{fontSize:11,color:'var(--muted)'}}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Templates section */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <h2 style={{fontSize:20,fontWeight:700}}>Templates</h2>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>router.push('/workout/template')}
                style={{background:'var(--primary-bg)',border:'1.5px solid var(--primary)',borderRadius:99,padding:'5px 14px',fontSize:12,fontWeight:700,color:'var(--primary)',cursor:'pointer'}}>
                + Template
              </button>
            </div>
          </div>

          {templates.length===0?(
            <div style={{background:'var(--card)',borderRadius:20,border:'2px dashed var(--border)',padding:'28px',textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:8}}>📋</div>
              <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>No templates yet</div>
              <div style={{fontSize:12,color:'var(--muted)',marginBottom:14}}>Create reusable workout routines</div>
              <button onClick={()=>router.push('/workout/template')} style={{background:'var(--primary)',border:'none',borderRadius:12,padding:'10px 20px',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                Create template
              </button>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {templates.map(t=>(
                <div key={t.id} style={{background:'var(--primary)',borderRadius:20,padding:'18px 16px',position:'relative',minHeight:120,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:18,color:'#fff',marginBottom:4}}>{t.name}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.75)'}}>{(t.exercises||[]).length} exercises</div>
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:10}}>
                    <button onClick={()=>router.push('/workout/active?template='+t.id)}
                      style={{flex:1,background:'rgba(255,255,255,0.2)',border:'none',borderRadius:10,padding:'8px',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                      Start
                    </button>
                    <button onClick={()=>router.push('/workout/template?edit='+t.id)}
                      style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:10,padding:'8px 10px',color:'#fff',fontSize:12,cursor:'pointer'}}>
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent history */}
        {recentLogs.length>0&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h2 style={{fontSize:20,fontWeight:700}}>Recent</h2>
              <button onClick={()=>router.push('/workout/history')} style={{background:'none',border:'none',color:'var(--primary)',fontSize:13,fontWeight:600,cursor:'pointer'}}>See all</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {recentLogs.map(log=>(
                <div key={log.id} style={{background:'var(--card)',borderRadius:16,padding:'14px 16px',border:'1.5px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={{fontWeight:700,fontSize:14}}>{log.name}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>{fmtDate(log.started_at)}</div>
                  </div>
                  <div style={{display:'flex',gap:14}}>
                    {log.duration_seconds&&<div style={{fontSize:12,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}><TimerIcon size={14} color='var(--muted)'/> {fmtDur(log.duration_seconds)}</div>}
                    {log.total_volume_kg&&<div style={{fontSize:12,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}><BoltIcon size={14} color='var(--muted)'/> {log.total_volume_kg}kg</div>}
                    <div style={{fontSize:12,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}><MuscleIcon size={14} color='var(--muted)'/> {(log.exercises||[]).length} exercises</div>
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
