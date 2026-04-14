'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import MacroRing from '@/components/MacroRing'

const today = () => new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [logs, setLogs] = useState([])
  const [waterMl, setWaterMl] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    const [{ data: prof }, { data: foodLogs }, { data: waterLogs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('food_logs').select('*').eq('user_id', user.id).eq('logged_at', today()).order('created_at'),
      supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('logged_at', today())
    ])
    if (prof) setProfile(prof)
    if (foodLogs) setLogs(foodLogs)
    if (waterLogs) setWaterMl(waterLogs.reduce((s, l) => s + l.amount_ml, 0))
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const totals = logs.reduce((a, l) => ({ cal:a.cal+l.cal, protein:a.protein+l.protein, carb:a.carb+l.carb, fat:a.fat+l.fat, fiber:a.fiber+l.fiber }), { cal:0, protein:0, carb:0, fat:0, fiber:0 })
  const g = profile ?? { cal_target:1700, protein_target:167, carb_target:144, fat_target:60, fiber_target:25, water_goal:2000 }
  const waterGoal = g.water_goal || 2000
  const waterPct = Math.min(1, waterMl / waterGoal)
  const waterReached = waterMl >= waterGoal

  async function deleteLog(id) {
    await supabase.from('food_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const mealGroups = ['breakfast','lunch','dinner','snack','other']
  const mealColors = { breakfast:'#f59e0b', lunch:'#10b981', dinner:'#6366f1', snack:'#ef4444', other:'#94a3b8' }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100dvh'}}><div style={{width:32,height:32,borderRadius:'50%',border:'3px solid var(--primary)',borderTopColor:'transparent',animation:'spin 0.7s linear infinite'}}/></div>

  return (
    <div className="page">
      <div style={{paddingTop:24,paddingBottom:4,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="Profile" style={{width:48,height:48,borderRadius:'50%',objectFit:'cover'}}/>
          ) : (
            <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff'}}>
              {profile?.name?profile.name[0].toUpperCase():'?'}
            </div>
          )}
          <div>
            <p style={{color:'var(--muted)',fontSize:13,fontWeight:500}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
            <h1 style={{fontSize:24,fontWeight:700,letterSpacing:'-0.02em',marginTop:2}}>{profile?.name?`Hey, ${profile.name.split(' ')[0]} 👋`:'Today'}</h1>
          </div>
        </div>
        <div style={{padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,background:profile?.goal==='lose'?'#d1fae5':profile?.goal==='gain'?'#dbeafe':'#fef3c7',color:profile?.goal==='lose'?'#059669':profile?.goal==='gain'?'#2563eb':'#d97706'}}>
          {profile?.goal==='lose'?'Fat loss':profile?.goal==='gain'?'Muscle gain':'Maintain'}
        </div>
      </div>

      <div onClick={() => router.push('/calories')} style={{display:'flex',justifyContent:'center',marginTop:20,cursor:'pointer'}}>
        <div style={{position:'relative'}}>
          <MacroRing cal={totals.cal} calTarget={g.cal_target} protein={totals.protein} proteinTarget={g.protein_target} carb={totals.carb} carbTarget={g.carb_target} fat={totals.fat} fatTarget={g.fat_target} remaining={g.cal_target-totals.cal}/>
          <div style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'var(--muted)',fontWeight:600,whiteSpace:'nowrap',background:'var(--surface)',padding:'2px 8px',borderRadius:99,border:'1px solid var(--border)'}}>Tap for details →</div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:20,marginBottom:4}}>
        {[{label:'Calories',color:'#6366f1'},{label:'Protein',color:'#3b82f6'},{label:'Carbs',color:'#f59e0b'}].map(m=>(
          <div key={m.label} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:m.color}}/>
            <span style={{fontSize:11,color:'var(--muted)',fontWeight:500}}>{m.label}</span>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16}}>
        {[{label:'Protein',val:totals.protein,target:g.protein_target,unit:'g',color:'#3b82f6'},{label:'Carbs',val:totals.carb,target:g.carb_target,unit:'g',color:'#f59e0b'},{label:'Fat',val:totals.fat,target:g.fat_target,unit:'g',color:'#ef4444'},{label:'Fiber',val:totals.fiber,target:g.fiber_target,unit:'g',color:'#10b981'}].map(m=>(
          <div key={m.label} className="card" style={{padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:m.color}}/>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600}}>{m.label}</div>
            </div>
            <div style={{fontSize:20,fontWeight:700}}>{Math.round(m.val)}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}>/{m.target}{m.unit}</span></div>
            <div style={{marginTop:8,height:4,background:'var(--card2)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:2,background:m.color,width:`${Math.min(100,(m.val/m.target)*100)}%`,transition:'width 0.6s ease'}}/>
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => router.push('/water')} className="card"
        style={{marginTop:12,cursor:'pointer',padding:'16px 20px',border:`1.5px solid ${waterReached?'#6ee7b7':'var(--border)'}`,transition:'border-color 0.3s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:12,background:waterReached?'#d1fae5':'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>💧</div>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>Hydration</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}><span style={{fontWeight:700,color:waterReached?'#10b981':'#3b82f6'}}>{waterMl}ml</span> of {waterGoal}ml</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:99,background:waterReached?'#d1fae5':'#dbeafe',color:waterReached?'#059669':'#3b82f6'}}>
              {waterReached?'🎉 Done!':`${waterGoal-waterMl}ml left`}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div style={{height:8,background:'var(--card2)',borderRadius:4,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:4,background:waterReached?'#10b981':'#3b82f6',width:`${waterPct*100}%`,transition:'width 0.6s ease'}}/>
        </div>
        <div style={{fontSize:11,color:'var(--muted)',marginTop:8,textAlign:'center',fontWeight:500}}>Tap to log water →</div>
      </div>

      <button className="btn btn-primary pulse-primary" style={{width:'100%',marginTop:16,fontSize:16,fontWeight:700,padding:'16px'}} onClick={()=>router.push('/log')}>+ Log food</button>

      <div style={{marginTop:28}}>
        {logs.length===0?(
          <div style={{textAlign:'center',padding:'32px 0',color:'var(--muted)'}}>
            <div style={{fontSize:40,marginBottom:12}}>🍽️</div>
            <p style={{fontWeight:600,marginBottom:4}}>Nothing logged yet</p>
            <p style={{fontSize:13}}>Tap "Log food" to start tracking</p>
          </div>
        ):(
          mealGroups.map(meal=>{
            const items=logs.filter(l=>l.meal_type===meal); if(!items.length) return null
            return (
              <div key={meal} style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:mealColors[meal]}}/>
                  <p style={{fontSize:12,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--muted)'}}>{meal}</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {items.map(log=>(
                    <div key={log.id} className="card slide-up" style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{log.name}</div>
                        <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>{log.qty}{log.unit} · {Math.round(log.protein)}g P · {Math.round(log.carb)}g C · {Math.round(log.fat)}g F</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:16,fontWeight:700}}>{Math.round(log.cal)}</div>
                        <div style={{fontSize:11,color:'var(--muted)'}}>kcal</div>
                      </div>
                      <button onClick={()=>deleteLog(log.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',padding:4,fontSize:18,lineHeight:1,flexShrink:0}}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
