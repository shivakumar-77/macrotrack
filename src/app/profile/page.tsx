'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const router = useRouter()
  const [section, setSection] = useState('personal')
  const [weights, setWeights] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weightVal, setWeightVal] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ name:'', age:'', height:'', gender:'male', goal:'lose', cal_target:1700, protein_target:167, carb_target:144, fat_target:60, fiber_target:25, weight_goal:72, water_goal:2000 })
  const [secForm, setSecForm] = useState({ newEmail:'', newPassword:'', confirmPassword:'' })

  useEffect(() => {
    async function load() {
      const { data:{user} } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      const [{ data:prof }, { data:wlogs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at',{ascending:true}).limit(30)
      ])
      if (prof) setForm({ name:prof.name??'', age:prof.age??'', height:prof.height??'', gender:prof.gender??'male', goal:prof.goal??'lose', cal_target:prof.cal_target??1700, protein_target:prof.protein_target??167, carb_target:prof.carb_target??144, fat_target:prof.fat_target??60, fiber_target:prof.fiber_target??25, weight_goal:prof.weight_goal??72, water_goal:prof.water_goal??2000 })
      if (wlogs) setWeights(wlogs)
    }
    load()
  }, [])

  async function saveForm() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false); setSaved(true); showMsg('Saved!')
    setTimeout(() => setSaved(false), 2000)
  }

  async function logWeight() {
    const val = parseFloat(weightVal); if (!val) return
    const { data:{user} } = await supabase.auth.getUser(); if (!user) return
    const today = new Date().toISOString().slice(0,10)
    await supabase.from('weight_logs').upsert({ user_id:user.id, logged_at:today, weight_kg:val })
    setWeightVal(''); showMsg('Weight logged!')
    const { data } = await supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at',{ascending:true}).limit(30)
    if (data) setWeights(data)
  }

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function changeEmail() {
    if (!secForm.newEmail) return
    const { error } = await supabase.auth.updateUser({ email:secForm.newEmail })
    if (error) showMsg(error.message)
    else { showMsg('Check your new email to confirm.'); setSecForm(p=>({...p,newEmail:''})) }
  }

  async function changePassword() {
    if (!secForm.newPassword || secForm.newPassword !== secForm.confirmPassword) { showMsg('Passwords do not match.'); return }
    const { error } = await supabase.auth.updateUser({ password:secForm.newPassword })
    if (error) showMsg(error.message)
    else { showMsg('Password updated!'); setSecForm(p=>({...p,newPassword:'',confirmPassword:''})) }
  }

  const latest = weights[weights.length-1]
  const change = weights.length >= 2 ? (weights[weights.length-1].weight_kg - weights[weights.length-2].weight_kg).toFixed(1) : null

  function WeightGraph() {
    if (weights.length < 2) return <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:13}}>Log at least 2 entries to see your trend</div>
    const vals=weights.map(w=>w.weight_kg), min=Math.min(...vals)-0.5, max=Math.max(...vals)+0.5
    const W=320, H=100
    const pts=weights.map((w,i)=>({ x:(i/(weights.length-1))*W, y:H-((w.weight_kg-min)/(max-min))*H }))
    const d=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{overflow:'visible'}}>
        <defs><linearGradient id="wgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.15"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient></defs>
        <path d={`${d} L${W},${H+20} L0,${H+20} Z`} fill="url(#wgg)"/>
        <path d={d} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2"/>
            {(i===0||i===pts.length-1||weights.length<=6) && <text x={p.x} y={p.y-9} textAnchor="middle" fontSize="9" fontWeight="700" fill="#6366f1">{weights[i].weight_kg}</text>}
          </g>
        ))}
        <text x="0" y={H+18} fontSize="9" fill="var(--muted)">{weights[0]?.logged_at?.slice(5)}</text>
        <text x={W} y={H+18} textAnchor="end" fontSize="9" fill="var(--muted)">{weights[weights.length-1]?.logged_at?.slice(5)}</text>
      </svg>
    )
  }

  const Label = ({text}) => <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{text}</label>
  const tabs = [{id:'personal',icon:'👤',label:'Personal'},{id:'goals',icon:'🎯',label:'Goals'},{id:'weight',icon:'⚖️',label:'Weight'},{id:'security',icon:'🔒',label:'Security'}]

  return (
    <div className="page" style={{paddingTop:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,letterSpacing:'-0.02em'}}>Profile</h1>
        <button className="btn btn-ghost" style={{fontSize:13,padding:'8px 16px',color:'#ef4444',borderColor:'#fecaca'}}
          onClick={async()=>{await supabase.auth.signOut();router.replace('/auth')}}>Sign out</button>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24,padding:'16px',background:'var(--card)',borderRadius:20,border:'1.5px solid var(--border)'}}>
        <div style={{width:54,height:54,borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>
          {form.name?form.name[0].toUpperCase():'?'}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:16}}>{form.name||'Your name'}</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{form.goal==='lose'?'📉 Fat loss':form.goal==='gain'?'💪 Muscle gain':'⚖️ Maintain'} · {form.cal_target} kcal/day</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setSection(t.id)}
            style={{padding:'10px 6px',borderRadius:14,border:`2px solid ${section===t.id?'var(--primary)':'var(--border)'}`,background:section===t.id?'var(--primary-bg)':'var(--card)',cursor:'pointer',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:section===t.id?'var(--primary)':'var(--muted)'}}>{t.label}</span>
          </button>
        ))}
      </div>

      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}

      {section==='personal'&&(
        <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div><Label text="Full name"/><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your full name"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><Label text="Age"/><input type="number" value={form.age} onChange={e=>setForm(p=>({...p,age:e.target.value}))} placeholder="e.g. 25"/></div>
            <div><Label text="Height (cm)"/><input type="number" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))} placeholder="e.g. 175"/></div>
          </div>
          <div>
            <Label text="Gender"/>
            <div style={{display:'flex',gap:8}}>
              {['male','female','other'].map(g=>(
                <button key={g} onClick={()=>setForm(p=>({...p,gender:g}))}
                  style={{flex:1,padding:'10px',borderRadius:12,border:`2px solid ${form.gender===g?'var(--primary)':'var(--border)'}`,background:form.gender===g?'var(--primary-bg)':'transparent',color:form.gender===g?'var(--primary)':'var(--muted)',fontWeight:700,fontSize:12,cursor:'pointer',textTransform:'capitalize'}}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={saveForm} disabled={saving}>
            {saving?'Saving…':saved?'✓ Saved!':'Save personal details'}
          </button>
        </div>
      )}

      {section==='goals'&&(
        <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <Label text="My goal"/>
            <div style={{display:'flex',gap:8}}>
              {[{key:'lose',label:'Lose fat',icon:'📉',color:'#10b981',bg:'#d1fae5'},{key:'maintain',label:'Maintain',icon:'⚖️',color:'#f59e0b',bg:'#fef3c7'},{key:'gain',label:'Build muscle',icon:'💪',color:'#3b82f6',bg:'#dbeafe'}].map(g=>(
                <button key={g.key} onClick={()=>setForm(p=>({...p,goal:g.key}))}
                  style={{flex:1,padding:'12px 6px',borderRadius:14,border:`2px solid ${form.goal===g.key?g.color:'var(--border)'}`,background:form.goal===g.key?g.bg:'transparent',cursor:'pointer',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{g.icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:form.goal===g.key?g.color:'var(--muted)'}}>{g.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'Calories (kcal)',k:'cal_target'},{l:'Protein (g)',k:'protein_target'},{l:'Carbs (g)',k:'carb_target'},{l:'Fat (g)',k:'fat_target'},{l:'Fiber (g)',k:'fiber_target'},{l:'Goal weight (kg)',k:'weight_goal'},{l:'Water goal (ml)',k:'water_goal'}].map(f=>(
              <div key={f.k}><Label text={f.l}/><input type="number" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:parseFloat(e.target.value)||0}))}/></div>
            ))}
          </div>
          <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={saveForm} disabled={saving}>
            {saving?'Saving…':saved?'✓ Saved!':'Save goals'}
          </button>
        </div>
      )}

      {section==='weight'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div className="card" style={{padding:'16px'}}>
              <Label text="Current"/>
              <div style={{fontSize:28,fontWeight:800}}>{latest?latest.weight_kg:'—'}<span style={{fontSize:14,color:'var(--muted)',fontWeight:400}}> kg</span></div>
              {change&&<div style={{fontSize:12,fontWeight:700,color:parseFloat(change)<=0?'#10b981':'#ef4444',marginTop:4}}>{parseFloat(change)>0?'+':''}{change} kg</div>}
            </div>
            <div className="card" style={{padding:'16px'}}>
              <Label text="Goal"/>
              <div style={{fontSize:28,fontWeight:800}}>{form.weight_goal}<span style={{fontSize:14,color:'var(--muted)',fontWeight:400}}> kg</span></div>
              {latest&&<div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{Math.abs(latest.weight_kg-form.weight_goal).toFixed(1)} kg to go</div>}
            </div>
          </div>
          <div className="card">
            <Label text="Log today's weight"/>
            <div style={{display:'flex',gap:8}}>
              <input type="number" placeholder="e.g. 75.5" value={weightVal} onChange={e=>setWeightVal(e.target.value)} step="0.1" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&logWeight()}/>
              <button className="btn btn-primary" onClick={logWeight} style={{flexShrink:0,padding:'12px 22px',fontWeight:700}}>Log</button>
            </div>
          </div>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14}}>Weight trend</div>
              <div style={{fontSize:11,color:'var(--muted)'}}>{weights.length} entries</div>
            </div>
            <WeightGraph/>
            {weights.length>0&&(
              <div style={{marginTop:16}}>
                {[...weights].reverse().slice(0,5).map(w=>(
                  <div key={w.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:13,color:'var(--muted)'}}>{new Date(w.logged_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                    <span style={{fontWeight:700,fontSize:14}}>{w.weight_kg} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section==='security'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📧 Change email</div>
            <Label text="New email address"/>
            <input type="email" placeholder="new@email.com" value={secForm.newEmail} onChange={e=>setSecForm(p=>({...p,newEmail:e.target.value}))} style={{marginBottom:10}}/>
            <button className="btn btn-primary" style={{width:'100%',padding:'13px',fontWeight:700}} onClick={changeEmail}>Update email</button>
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🔑 Change password</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div><Label text="New password"/><input type="password" placeholder="Min 6 characters" value={secForm.newPassword} onChange={e=>setSecForm(p=>({...p,newPassword:e.target.value}))}/></div>
              <div><Label text="Confirm password"/><input type="password" placeholder="Repeat password" value={secForm.confirmPassword} onChange={e=>setSecForm(p=>({...p,confirmPassword:e.target.value}))}/></div>
            </div>
            <button className="btn btn-primary" style={{width:'100%',padding:'13px',fontWeight:700,marginTop:10}} onClick={changePassword}>Update password</button>
            <button className="btn btn-ghost" style={{width:'100%',padding:'12px',fontSize:13,fontWeight:600,marginTop:8}}
              onClick={async()=>{const{data:{user}}=await supabase.auth.getUser();if(user?.email){await supabase.auth.resetPasswordForEmail(user.email);showMsg('Reset link sent!')}}}>
              Send reset link to email
            </button>
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🔔 Notifications</div>
            <p style={{fontSize:13,color:'var(--muted)',marginBottom:14,lineHeight:1.6}}>Enable browser notifications for meal and hydration reminders.</p>
            <button className="btn btn-ghost" style={{width:'100%',padding:'13px',fontSize:13,fontWeight:600}}
              onClick={async()=>{const p=await Notification.requestPermission();if(p==='granted'){new Notification('MacroTrack',{body:'Notifications enabled!'});showMsg('Notifications enabled!')}else showMsg('Please allow in browser settings.')}}>
              Enable notifications
            </button>
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📄 Legal</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {['Terms & Conditions','Privacy Policy','Data & Privacy'].map(item=>(
                <a key={item} href="#" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:12,background:'var(--card2)',textDecoration:'none',color:'var(--text)'}}>
                  <span style={{fontSize:14,fontWeight:500}}>{item}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              ))}
            </div>
          </div>
          <div className="card" style={{border:'1.5px solid #fecaca'}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:'#dc2626'}}>⚠️ Danger zone</div>
            <p style={{fontSize:13,color:'var(--muted)',marginBottom:14,lineHeight:1.6}}>Permanently delete your account and all data.</p>
            <button style={{width:'100%',padding:'13px',borderRadius:14,background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontWeight:700,fontSize:14,cursor:'pointer'}}
              onClick={async()=>{if(confirm('Delete your account permanently?')){await supabase.auth.signOut();router.replace('/auth')}}}>
              Delete my account
            </button>
          </div>
        </div>
      )}
      <div style={{height:20}}/>
      <BottomNav/>
    </div>
  )
}
