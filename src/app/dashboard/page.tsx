'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import MacroRing from '@/components/MacroRing'

const today = () => new Date().toISOString().slice(0, 10)

const FOOD_IMAGES = {
  egg: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=80&h=80&fit=crop',
  chicken: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=80&h=80&fit=crop',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef88?w=80&h=80&fit=crop',
  dal: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&h=80&fit=crop',
  roti: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=80&h=80&fit=crop',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=80&h=80&fit=crop',
  dosa: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=80&h=80&fit=crop',
  idli: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=80&h=80&fit=crop',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=80&h=80&fit=crop',
  oats: 'https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=80&h=80&fit=crop',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=80&h=80&fit=crop',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop',
  protein: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=80&h=80&fit=crop',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=80&h=80&fit=crop',
  default: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=80&h=80&fit=crop',
}

function getFoodImage(name) {
  const n = name.toLowerCase()
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (n.includes(key)) return url
  }
  return FOOD_IMAGES.default
}

const STATUS_CONFIG = {
  on_track: { icon: '✅', label: 'On track', color: '#10b981', bg: '#d1fae5' },
  low_protein: { icon: '💪', label: 'Low protein', color: '#3b82f6', bg: '#dbeafe' },
  low_calories: { icon: '⚡', label: 'Need more food', color: '#f59e0b', bg: '#fef3c7' },
  over_calories: { icon: '⚠️', label: 'Over calories', color: '#ef4444', bg: '#fee2e2' },
  great: { icon: '🏆', label: 'Perfect day!', color: '#10b981', bg: '#d1fae5' },
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [logs, setLogs] = useState([])
  const [waterMl, setWaterMl] = useState(0)
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState(null)
  const [sugLoading, setSugLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

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
    if (prof && foodLogs?.length > 0) loadSuggestions(prof, foodLogs)
  }, [router])

  useEffect(() => { load() }, [load])

  async function loadSuggestions(prof, foodLogs) {
    setSugLoading(true)
    try {
      const totals = foodLogs.reduce((a, l) => ({ cal: a.cal+l.cal, protein: a.protein+l.protein, carb: a.carb+l.carb, fat: a.fat+l.fat }), { cal:0, protein:0, carb:0, fat:0 })
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totals, targets: { cal: prof.cal_target, protein: prof.protein_target, carb: prof.carb_target, fat: prof.fat_target }, logs: foodLogs })
      })
      const data = await res.json()
      if (data.result) setSuggestions(data.result)
    } catch {} finally { setSugLoading(false) }
  }

  const totals = logs.reduce((a, l) => ({ cal: a.cal+l.cal, protein: a.protein+l.protein, carb: a.carb+l.carb, fat: a.fat+l.fat, fiber: a.fiber+l.fiber }), { cal:0, protein:0, carb:0, fat:0, fiber:0 })
  const g = profile ?? { cal_target:1700, protein_target:167, carb_target:144, fat_target:60, fiber_target:25, water_goal:2000 }
  const waterGoal = g.water_goal || 2000
  const waterPct = Math.min(1, waterMl / waterGoal)

  async function deleteLog(id) {
    await supabase.from('food_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const mealGroups = ['breakfast','lunch','dinner','snack','other']
  const mealColors = { breakfast:'#f59e0b', lunch:'#10b981', dinner:'#6366f1', snack:'#ef4444', other:'#94a3b8' }
  const mealIcons = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍎', other:'🍽️' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid var(--primary)', borderTopColor:'transparent', animation:'spin 0.7s linear infinite' }}/>
    </div>
  )

  const statusConf = suggestions ? (STATUS_CONFIG[suggestions.status] || STATUS_CONFIG.on_track) : null

  return (
    <div className="page">
      {/* Header with photo */}
      <div style={{ paddingTop:24, paddingBottom:4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ color:'var(--muted)', fontSize:13, fontWeight:500 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
          </p>
          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.02em', marginTop:2 }}>
            {profile?.name ? 'Hey, ' + profile.name.split(' ')[0] + ' 👋' : 'Today'}
          </h1>
        </div>
        <button onClick={() => router.push('/profile')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <div style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,var(--primary),#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', border:'2px solid var(--border)' }}>
            {profile?.photo_url ? <img src={profile.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (profile?.name?.[0]?.toUpperCase() || '?')}
          </div>
        </button>
      </div>

      {/* AI tip banner */}
      {suggestions?.tip && (
        <div style={{ margin:'12px 0', padding:'12px 16px', background:'linear-gradient(135deg,var(--primary-bg),#e0e7ff)', borderRadius:16, border:'1.5px solid #c7d2fe', display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:20, flexShrink:0 }}>🤖</span>
          <span style={{ fontSize:13, color:'var(--primary)', fontWeight:500, lineHeight:1.5 }}>{suggestions.tip}</span>
        </div>
      )}

      {/* Status badge */}
      {statusConf && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:99, background:statusConf.bg, marginBottom:4 }}>
          <span style={{ fontSize:14 }}>{statusConf.icon}</span>
          <span style={{ fontSize:12, fontWeight:700, color:statusConf.color }}>{statusConf.label}</span>
        </div>
      )}

      {/* Macro ring — clickable */}
      <div onClick={() => router.push('/calories')} style={{ display:'flex', justifyContent:'center', marginTop:16, cursor:'pointer' }}>
        <div style={{ position:'relative' }}>
          <MacroRing cal={totals.cal} calTarget={g.cal_target} protein={totals.protein} proteinTarget={g.protein_target} carb={totals.carb} carbTarget={g.carb_target} fat={totals.fat} fatTarget={g.fat_target} remaining={g.cal_target-totals.cal}/>
          <div style={{ position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap', background:'var(--surface)', padding:'2px 8px', borderRadius:99, border:'1px solid var(--border)' }}>
            Tap for details →
          </div>
        </div>
      </div>

      {/* Ring legend */}
      <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:20, marginBottom:4 }}>
        {[{label:'Calories',color:'#6366f1'},{label:'Protein',color:'#3b82f6'},{label:'Carbs',color:'#f59e0b'}].map(m=>(
          <div key={m.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:m.color }}/>
            <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Macro cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
        {[
          {label:'Protein',val:totals.protein,target:g.protein_target,unit:'g',color:'#3b82f6'},
          {label:'Carbs',val:totals.carb,target:g.carb_target,unit:'g',color:'#f59e0b'},
          {label:'Fat',val:totals.fat,target:g.fat_target,unit:'g',color:'#ef4444'},
          {label:'Fiber',val:totals.fiber,target:g.fiber_target,unit:'g',color:'#10b981'},
        ].map(m=>(
          <div key={m.label} className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:m.color }}/>
              <div style={{ fontSize:12, color:'var(--muted)', fontWeight:600 }}>{m.label}</div>
            </div>
            <div style={{ fontSize:20, fontWeight:700 }}>{Math.round(m.val)}<span style={{ fontSize:13, color:'var(--muted)', fontWeight:400 }}>/{m.target}{m.unit}</span></div>
            <div style={{ marginTop:8, height:4, background:'var(--card2)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:2, background:m.color, width:Math.min(100,(m.val/m.target)*100)+'%', transition:'width 0.6s ease' }}/>
            </div>
          </div>
        ))}
      </div>

      {/* AI Food Suggestions */}
      {(sugLoading || suggestions?.suggestions?.length > 0) && (
        <div className="card" style={{ marginTop:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>🤖 AI suggestions</div>
            <span style={{ fontSize:11, color:'var(--muted)' }}>to complete your macros</span>
          </div>
          {sugLoading ? (
            <div style={{ display:'flex', gap:8 }}>
              {[1,2,3].map(i=><div key={i} style={{ flex:1, height:60, background:'var(--card2)', borderRadius:12 }}/>)}
            </div>
          ) : (
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
              {suggestions?.suggestions?.map((s,i)=>(
                <div key={i} style={{ flexShrink:0, background:'var(--card2)', borderRadius:14, padding:'12px', width:130, cursor:'pointer' }}
                  onClick={() => { setExpanded(expanded===i?null:i) }}>
                  <img src={getFoodImage(s.name)} alt={s.name}
                    style={{ width:'100%', height:60, objectFit:'cover', borderRadius:8, marginBottom:8 }}
                    onError={e => { e.currentTarget.src = FOOD_IMAGES.default }}/>
                  <div style={{ fontWeight:600, fontSize:12, marginBottom:3 }}>{s.name}</div>
                  <div style={{ fontSize:10, color:'var(--muted)', lineHeight:1.4 }}>{s.reason}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', marginTop:4 }}>{s.cal} kcal · {s.protein}g P</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Water tracker — clickable */}
      <div onClick={() => router.push('/water')} className="card"
        style={{ marginTop:12, cursor:'pointer', padding:'16px 20px', border:'1.5px solid '+(waterMl>=waterGoal?'#6ee7b7':'var(--border)') }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:12, background:waterMl>=waterGoal?'#d1fae5':'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💧</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>Hydration</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>
                <span style={{ fontWeight:700, color:waterMl>=waterGoal?'#10b981':'#3b82f6' }}>{waterMl}ml</span> of {waterGoal}ml
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:99, background:waterMl>=waterGoal?'#d1fae5':'#dbeafe', color:waterMl>=waterGoal?'#059669':'#3b82f6' }}>
              {waterMl>=waterGoal?'🎉 Done!':waterGoal-waterMl+'ml left'}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div style={{ height:8, background:'var(--card2)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:4, background:waterMl>=waterGoal?'#10b981':'#3b82f6', width:waterPct*100+'%', transition:'width 0.6s ease' }}/>
        </div>
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:8, textAlign:'center', fontWeight:500 }}>Tap to log water →</div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 }}>
        <button onClick={() => router.push('/meal-plan')}
          style={{ padding:'14px', borderRadius:16, background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', cursor:'pointer', textAlign:'left', fontWeight:600, fontSize:13 }}>
          <div style={{ fontSize:22, marginBottom:4 }}>🍽️</div>
          Meal Planner
          <div style={{ fontSize:11, opacity:0.8, marginTop:2, fontWeight:400 }}>AI-generated plan</div>
        </button>
        <button onClick={() => router.push('/weight')}
          style={{ padding:'14px', borderRadius:16, background:'linear-gradient(135deg,var(--primary),#818cf8)', color:'#fff', border:'none', cursor:'pointer', textAlign:'left', fontWeight:600, fontSize:13 }}>
          <div style={{ fontSize:22, marginBottom:4 }}>📊</div>
          Insights
          <div style={{ fontSize:11, opacity:0.8, marginTop:2, fontWeight:400 }}>Weekly AI report</div>
        </button>
      </div>

      {/* Log food */}
      <button className="btn btn-primary pulse-primary"
        style={{ width:'100%', marginTop:12, fontSize:16, fontWeight:700, padding:'16px' }}
        onClick={() => router.push('/log')}>
        + Log food
      </button>

      {/* Food logs with real images */}
      <div style={{ marginTop:28 }}>
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}>
            <div style={{ position:'relative', width:80, height:80, margin:'0 auto 16px' }}>
              <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=80&h=80&fit=crop" alt="food" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', opacity:0.5 }}/>
            </div>
            <p style={{ fontWeight:600, marginBottom:4 }}>Nothing logged yet</p>
            <p style={{ fontSize:13 }}>Tap "Log food" to start tracking</p>
          </div>
        ) : (
          mealGroups.map(meal => {
            const items = logs.filter(l => l.meal_type === meal)
            if (!items.length) return null
            const mealCal = items.reduce((s,l)=>s+l.cal,0)
            return (
              <div key={meal} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>{mealIcons[meal]}</span>
                    <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)' }}>{meal}</p>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:mealColors[meal] }}>{Math.round(mealCal)} kcal</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {items.map(log => (
                    <div key={log.id} className="card slide-up" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                      <img
                        src={getFoodImage(log.name)}
                        alt={log.name}
                        style={{ width:48, height:48, borderRadius:12, objectFit:'cover', flexShrink:0 }}
                        onError={e => { e.currentTarget.src = FOOD_IMAGES.default }}
                      />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{log.name}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>
                          {log.qty}{log.unit} · {Math.round(log.protein)}g P · {Math.round(log.carb)}g C · {Math.round(log.fat)}g F
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:16, fontWeight:700 }}>{Math.round(log.cal)}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>kcal</div>
                      </div>
                      <button onClick={() => deleteLog(log.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:4, fontSize:18, lineHeight:1, flexShrink:0 }}>×</button>
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
