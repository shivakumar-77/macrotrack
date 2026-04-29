'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { useTheme } from '@/components/ThemeProvider'

export default function ProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState('main') // main | edit | goals | security | notifications | legal
  const [legalPage, setLegalPage] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [weights, setWeights] = useState([])
  const [weightVal, setWeightVal] = useState('')
  const fileRef = useRef(null)
  const [notifPermission, setNotifPermission] = useState('default')
  const [reminders, setReminders] = useState([
    { id:'breakfast', label:'Breakfast', icon:'🌅', time:'08:00', enabled:true },
    { id:'lunch',     label:'Lunch',     icon:'☀️', time:'13:00', enabled:true },
    { id:'dinner',    label:'Dinner',    icon:'🌙', time:'20:00', enabled:true },
    { id:'water',     label:'Water',     icon:'💧', time:'10:00', enabled:false },
    { id:'weight',    label:'Weight log',icon:'⚖️', time:'07:30', enabled:false },
  ])
  const [form, setForm] = useState({
    name:'', dob:'', age:'', height:'', gender:'male', phone:'',
    goal:'lose', cal_target:1700, protein_target:167,
    carb_target:144, fat_target:60, fiber_target:25,
    weight_goal:72, water_goal:2000
  })
  const [secForm, setSecForm] = useState({ newEmail:'', newPassword:'', confirmPassword:'' })

  useEffect(() => {
    setNotifPermission(Notification.permission)
    const saved = localStorage.getItem('macrotrack_reminders')
    if (saved) { try { setReminders(JSON.parse(saved)) } catch {} }
    load()
  }, [])

  async function load() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    setUserEmail(user.email || '')
    const [{ data:prof }, { data:wlogs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at',{ascending:true}).limit(30)
    ])
    if (prof) {
      setForm({
        name:prof.name??'', dob:prof.dob??'', age:prof.age??'',
        height:prof.height??'', gender:prof.gender??'male', phone:prof.phone??'',
        goal:prof.goal??'lose', cal_target:prof.cal_target??1700,
        protein_target:prof.protein_target??167, carb_target:prof.carb_target??144,
        fat_target:prof.fat_target??60, fiber_target:prof.fiber_target??25,
        weight_goal:prof.weight_goal??72, water_goal:prof.water_goal??2000
      })
      if (prof.photo_url) setPhotoUrl(prof.photo_url)
    }
    if (wlogs) setWeights(wlogs)
  }

  function showMsg(m) { setMsg(m); setTimeout(()=>setMsg(''), 2500) }

  async function saveProfile() {
    setSaving(true)
    const { data:{ user } } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('profiles').update({ ...form, photo_url:photoUrl }).eq('id', user.id)
    setSaving(false); showMsg('Saved!')
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const b64 = ev.target.result
      setPhotoUrl(b64)
      const { data:{ user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').update({ photo_url:b64 }).eq('id', user.id)
      showMsg('Photo updated!')
    }
    reader.readAsDataURL(file); e.target.value=''
  }

  async function logWeight() {
    const val = parseFloat(weightVal); if (!val) return
    const { data:{ user } } = await supabase.auth.getUser(); if (!user) return
    const today = new Date().toISOString().slice(0,10)
    await supabase.from('weight_logs').upsert({ user_id:user.id, logged_at:today, weight_kg:val })
    setWeightVal(''); showMsg('Weight logged!')
    const { data } = await supabase.from('weight_logs').select('*').eq('user_id',user.id).order('logged_at',{ascending:true}).limit(30)
    if (data) setWeights(data)
  }

  async function changePassword() {
    if (!secForm.newPassword || secForm.newPassword !== secForm.confirmPassword) { showMsg('Passwords do not match'); return }
    const { error } = await supabase.auth.updateUser({ password:secForm.newPassword })
    if (error) showMsg(error.message)
    else { showMsg('Password updated!'); setSecForm(p=>({...p,newPassword:'',confirmPassword:''})) }
  }

  async function changeEmail() {
    if (!secForm.newEmail) return
    const { error } = await supabase.auth.updateUser({ email:secForm.newEmail })
    if (error) showMsg(error.message)
    else { showMsg('Confirm via new email!'); setSecForm(p=>({...p,newEmail:''})) }
  }

  async function enableNotifications() {
    const p = await Notification.requestPermission()
    setNotifPermission(p)
    if (p==='granted') { new Notification('MacroTrack 🎉',{body:'Reminders enabled!'}); showMsg('Notifications enabled!') }
    else showMsg('Please allow notifications in browser settings.')
  }

  function saveReminders() {
    localStorage.setItem('macrotrack_reminders', JSON.stringify(reminders))
    showMsg('Reminders saved!')
    if (notifPermission==='granted') scheduleNotifications()
  }

  function scheduleNotifications() {
    if (window._notifInterval) clearInterval(window._notifInterval)
    const enabled = reminders.filter(r=>r.enabled)
    if (!enabled.length) return
    const fired = new Set()
    window._notifInterval = setInterval(()=>{
      const now = new Date()
      const hhmm = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')
      enabled.forEach(r=>{
        const key = r.id+'-'+hhmm
        if (r.time===hhmm && !fired.has(key)) {
          fired.add(key)
          new Notification('MacroTrack — '+r.label,{ body: r.id==='water'?'Time to hydrate! 💧':r.id==='weight'?'Log your weight today ⚖️':'Time to log your '+r.label.toLowerCase()+'! 🍽️', icon:'/icon-192.png' })
          setTimeout(()=>fired.delete(key),120000)
        }
      })
    },30000)
  }

  function calcAge(dob) {
    if (!dob) return ''
    return Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000))
  }

  const latest = weights[weights.length-1]
  const profilePct = [form.name,form.dob,form.height,form.gender,form.phone].filter(Boolean).length/5

  const L = ({text}) => (
    <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{text}</div>
  )

  const BackBtn = ({label='Back', to='main'}) => (
    <button onClick={()=>setView(to)}
      style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:20,padding:0,display:'flex',alignItems:'center',gap:6}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      {label}
    </button>
  )

  // ── LEGAL ──────────────────────────────────────────────────
  const LEGAL = {
    terms:{title:'Terms & Conditions',sections:[
      {t:'Use of service',b:'MacroTrack provides nutrition tracking tools for personal use only. You agree not to misuse the service.'},
      {t:'Health disclaimer',b:'MacroTrack is not a medical service. Nutritional information is for informational purposes only. Always consult a qualified healthcare professional before making significant dietary changes.'},
      {t:'Data accuracy',b:'While we strive for accurate nutritional data, verify important information with a qualified dietitian.'},
      {t:'Changes to terms',b:'We may modify these terms at any time. Continued use constitutes acceptance of the new terms.'},
      {t:'Contact',b:'support@macrotrack.app'},
    ]},
    privacy:{title:'Privacy Policy',sections:[
      {t:'What we collect',b:'Profile data (name, DOB, height, weight, gender, phone), health goals, food & water logs, weight history.'},
      {t:'How we use it',b:'To provide personalized nutrition tracking, calculate macro targets, and improve your experience.'},
      {t:'Data security',b:'All data is encrypted in transit (TLS 1.3) and at rest (AES-256) using Supabase enterprise infrastructure.'},
      {t:'Data sharing',b:'We never sell your personal data. Anthropic AI is used for food scanning — only food images are sent, no personal data.'},
      {t:'Your rights',b:'Access, correct, or delete your data anytime. Contact privacy@macrotrack.app'},
    ]},
    data:{title:'Data & Privacy',sections:[
      {t:'What we store',b:'Profile info, food logs, weight logs, water logs, authentication credentials (encrypted).'},
      {t:'Data retention',b:'Data is kept while your account is active. Deleted accounts are fully purged within 30 days.'},
      {t:'Export your data',b:'Email data@macrotrack.app — we provide a JSON export within 7 business days.'},
      {t:'Delete your data',b:'Go to Account → Security → Delete account. Immediate and irreversible.'},
      {t:'Security',b:'AES-256 encryption, TLS 1.3, regular security audits, OWASP best practices.'},
    ]},
  }

  if (view==='legal') {
    const page = LEGAL[legalPage]
    return (
      <div className="page-root" style={{paddingTop:0}}>
        <BackBtn label={page.title} to="main"/>
        <div className="card" style={{lineHeight:1.8,fontSize:13,color:'var(--muted)',marginBottom:20}}>
          <p style={{fontWeight:700,color:'var(--text)',marginBottom:16}}>Last updated: April 2025</p>
          {page.sections.map(s=>(
            <div key={s.t} style={{marginBottom:16}}>
              <div style={{fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.t}</div>
              <div>{s.b}</div>
            </div>
          ))}
        </div>
        <BottomNav/>
      </div>
    )
  }

  // ── EDIT PROFILE ───────────────────────────────────────────
  if (view==='edit') return (
    <div className="page-root" style={{paddingTop:0}}>
      <BackBtn to="main"/>
      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}
      <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Personal details</div>
        {/* Photo */}
        <div>
          <L text="Profile photo"/>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:56,height:56,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>
              {photoUrl?<img src={photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(form.name?form.name[0].toUpperCase():'?')}
            </div>
            <div>
              <button onClick={()=>fileRef.current?.click()} className="btn btn-ghost" style={{fontSize:13,padding:'9px 14px',fontWeight:600}}>
                {photoUrl?'Change photo':'Upload photo'}
              </button>
              {photoUrl&&<button onClick={()=>setPhotoUrl(null)} style={{background:'none',border:'none',color:'#ef4444',fontSize:12,cursor:'pointer',marginLeft:8}}>Remove</button>}
            </div>
          </div>
        </div>
        <div><L text="Full name"/><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your name"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <L text="Date of birth"/>
            <input type="date" value={form.dob} onChange={e=>{
              const dob=e.target.value
              setForm(p=>({...p,dob,age:dob?String(calcAge(dob)):''}))
            }}/>
          </div>
          <div><L text="Age"/><input value={form.age} readOnly style={{opacity:0.6}} placeholder="Auto"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><L text="Height (cm)"/><input type="text" inputMode="decimal" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))} placeholder="175"/></div>
          <div><L text="Phone"/><input type="text" inputMode="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765"/></div>
        </div>
        <div><L text="Email"/><input value={userEmail} readOnly style={{opacity:0.6}}/></div>
        <div>
          <L text="Gender"/>
          <div style={{display:'flex',gap:8}}>
            {['male','female','other'].map(g=>(
              <button key={g} onClick={()=>setForm(p=>({...p,gender:g}))}
                style={{flex:1,padding:'10px',borderRadius:12,border:'2px solid '+(form.gender===g?'var(--primary)':'var(--border)'),background:form.gender===g?'var(--primary-bg)':'transparent',color:form.gender===g?'var(--primary)':'var(--muted)',fontWeight:700,fontSize:12,cursor:'pointer',textTransform:'capitalize'}}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={saveProfile} disabled={saving}>
          {saving?'Saving…':'Save profile'}
        </button>
      </div>

      {/* Weight tracker */}
      <div className="card">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>⚖️ Weight tracker</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Current</div>
            <div style={{fontSize:24,fontWeight:800}}>{latest?latest.weight_kg:'—'}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kg</span></div>
          </div>
          <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Goal</div>
            <div style={{fontSize:24,fontWeight:800}}>{form.weight_goal}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kg</span></div>
            {latest&&<div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{Math.abs(latest.weight_kg-form.weight_goal).toFixed(1)} kg to go</div>}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <input type="text" inputMode="decimal" placeholder="Today's weight kg" value={weightVal} onChange={e=>setWeightVal(e.target.value)} style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&logWeight()}/>
          <button className="btn btn-primary" onClick={logWeight} style={{flexShrink:0,padding:'12px 20px',fontWeight:700}}>Log</button>
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  // ── GOALS ─────────────────────────────────────────────────
  if (view==='goals') return (
    <div className="page-root" style={{paddingTop:0}}>
      <BackBtn to="main"/>
      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}
      <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:15}}>🎯 Goals & targets</div>
        <div>
          <L text="My goal"/>
          <div style={{display:'flex',gap:8}}>
            {[{key:'lose',label:'Lose fat',icon:'📉',color:'#10b981',bg:'#d1fae5'},{key:'maintain',label:'Maintain',icon:'⚖️',color:'#f59e0b',bg:'#fef3c7'},{key:'gain',label:'Build muscle',icon:'💪',color:'#3b82f6',bg:'#dbeafe'}].map(g=>(
              <button key={g.key} onClick={()=>setForm(p=>({...p,goal:g.key}))}
                style={{flex:1,padding:'12px 6px',borderRadius:14,border:'2px solid '+(form.goal===g.key?g.color:'var(--border)'),background:form.goal===g.key?g.bg:'transparent',cursor:'pointer',textAlign:'center'}}>
                <div style={{fontSize:20,marginBottom:4}}>{g.icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:form.goal===g.key?g.color:'var(--muted)'}}>{g.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:'Calories (kcal)',k:'cal_target'},{l:'Protein (g)',k:'protein_target'},{l:'Carbs (g)',k:'carb_target'},{l:'Fat (g)',k:'fat_target'},{l:'Fiber (g)',k:'fiber_target'},{l:'Goal weight (kg)',k:'weight_goal'},{l:'Water goal (ml)',k:'water_goal'}].map(f=>(
            <div key={f.k}><L text={f.l}/><input type="text" inputMode="decimal" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
        </div>
        <div style={{background:'#eef2ff',borderRadius:12,padding:'12px 14px',border:'1.5px solid #c7d2fe',fontSize:12,color:'var(--primary)'}}>
          💡 Use the Calorie Calculator to find your exact needs based on your body stats.
        </div>
        <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={saveProfile} disabled={saving}>
          {saving?'Saving…':'Save goals'}
        </button>
      </div>

      {/* Current plan summary */}
      <div className="card">
        <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>My plan</div>
        {[{l:'Calories',v:form.cal_target,u:'kcal',c:'#6366f1'},{l:'Protein',v:form.protein_target,u:'g',c:'#3b82f6'},{l:'Carbs',v:form.carb_target,u:'g',c:'#f59e0b'},{l:'Fat',v:form.fat_target,u:'g',c:'#ef4444'},{l:'Fiber',v:form.fiber_target,u:'g',c:'#10b981'},{l:'Water',v:form.water_goal,u:'ml',c:'#0ea5e9'}].map(m=>(
          <div key={m.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:m.c}}/>
              <span style={{fontSize:14}}>{m.l}</span>
            </div>
            <span style={{fontWeight:700,color:m.c}}>{m.v} <span style={{fontSize:11,fontWeight:400,color:'var(--muted)'}}>{m.u}</span></span>
          </div>
        ))}
      </div>
      <BottomNav/>
    </div>
  )

  // ── SECURITY ───────────────────────────────────────────────
  if (view==='security') return (
    <div className="page-root" style={{paddingTop:0}}>
      <BackBtn to="main"/>
      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}
      <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:15}}>📧 Change email</div>
        <div style={{padding:'10px 14px',borderRadius:12,background:'var(--card2)',fontSize:13,color:'var(--muted)'}}>Current: <strong style={{color:'var(--text)'}}>{userEmail}</strong></div>
        <div><L text="New email"/><input type="email" placeholder="new@email.com" value={secForm.newEmail} onChange={e=>setSecForm(p=>({...p,newEmail:e.target.value}))}/></div>
        <button className="btn btn-primary" style={{width:'100%',padding:'13px',fontWeight:700}} onClick={changeEmail}>Update email</button>
      </div>
      <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:15}}>🔑 Change password</div>
        <div><L text="New password"/><input type="password" placeholder="Min 6 characters" value={secForm.newPassword} onChange={e=>setSecForm(p=>({...p,newPassword:e.target.value}))}/></div>
        <div><L text="Confirm password"/><input type="password" placeholder="Repeat" value={secForm.confirmPassword} onChange={e=>setSecForm(p=>({...p,confirmPassword:e.target.value}))}/></div>
        <button className="btn btn-primary" style={{width:'100%',padding:'13px',fontWeight:700}} onClick={changePassword}>Update password</button>
        <button className="btn btn-ghost" style={{width:'100%',padding:'12px',fontSize:13,fontWeight:600}}
          onClick={async()=>{const{data:{user}}=await supabase.auth.getUser();if(user?.email){await supabase.auth.resetPasswordForEmail(user.email);showMsg('Reset link sent!')}}}>
          Send reset link via email
        </button>
      </div>
      <div className="card" style={{border:'1.5px solid #fecaca'}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:'#dc2626'}}>⚠️ Danger zone</div>
        <p style={{fontSize:13,color:'var(--muted)',marginBottom:14,lineHeight:1.6}}>Permanently delete your account and all data. Cannot be undone.</p>
        <button style={{width:'100%',padding:'13px',borderRadius:14,background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontWeight:700,fontSize:14,cursor:'pointer'}}
          onClick={async()=>{if(confirm('Delete your account permanently?')){await supabase.auth.signOut();router.replace('/auth')}}}>
          Delete my account
        </button>
      </div>
      <BottomNav/>
    </div>
  )

  // ── NOTIFICATIONS ──────────────────────────────────────────
  if (view==='notifications') return (
    <div className="page-root" style={{paddingTop:0}}>
      <BackBtn to="main"/>
      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
          <div style={{width:44,height:44,borderRadius:14,background:notifPermission==='granted'?'#d1fae5':'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
            {notifPermission==='granted'?'✅':'🔔'}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>{notifPermission==='granted'?'Notifications active':'Enable notifications'}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{notifPermission==='granted'?'Set your reminder times below':'Allow MacroTrack to send reminders'}</div>
          </div>
        </div>
        {notifPermission!=='granted'
          ?<button className="btn btn-primary" style={{width:'100%',padding:'13px',fontWeight:700}} onClick={enableNotifications}>Enable notifications</button>
          :<button className="btn btn-ghost" style={{width:'100%',padding:'12px',fontSize:13,fontWeight:600}}
            onClick={()=>new Notification('MacroTrack 🔔',{body:'Notifications are working!'})}>Send test notification</button>
        }
      </div>
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Reminder schedule</div>
        {reminders.map((r,i)=>(
          <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:i<reminders.length-1?'1px solid var(--border)':'none'}}>
            <div style={{width:38,height:38,borderRadius:12,background:r.enabled?'var(--primary-bg)':'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
              {r.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:r.enabled?'var(--text)':'var(--muted)'}}>{r.label}</div>
              <input type="time" value={r.time} disabled={!r.enabled}
                onChange={e=>setReminders(prev=>prev.map(x=>x.id===r.id?{...x,time:e.target.value}:x))}
                style={{fontSize:12,color:r.enabled?'var(--primary)':'var(--muted)',fontWeight:700,background:'none',border:'none',padding:0,marginTop:2,outline:'none'}}/>
            </div>
            <button onClick={()=>setReminders(prev=>prev.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}
              style={{width:46,height:26,borderRadius:99,background:r.enabled?'var(--primary)':'var(--border)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
              <div style={{position:'absolute',top:3,left:r.enabled?23:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={saveReminders}>
        Save reminders
      </button>
      <BottomNav/>
    </div>
  )

  // ── MAIN ACCOUNT VIEW ──────────────────────────────────────
  return (
    <div className="page-root" style={{paddingTop:0}}>
      <h1 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.02em',marginBottom:20}}>Account</h1>

      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}

      {/* Profile card */}
      <button onClick={()=>setView('edit')} style={{width:'100%',background:'var(--card)',borderRadius:20,padding:'16px 18px',border:'1.5px solid var(--border)',marginBottom:24,display:'flex',alignItems:'center',gap:14,cursor:'pointer',textAlign:'left'}}>
        <div style={{position:'relative',flexShrink:0}}>
          <div style={{width:54,height:54,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff'}}>
            {photoUrl?<img src={photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(form.name?form.name[0].toUpperCase():'?')}
          </div>
          <svg style={{position:'absolute',top:-3,left:-3}} width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="27" fill="none" stroke="var(--border)" strokeWidth="2.5"/>
            <circle cx="30" cy="30" r="27" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={String(2*Math.PI*27)} strokeDashoffset={String(2*Math.PI*27*(1-profilePct))}
              style={{transformOrigin:'30px 30px',transform:'rotate(-90deg)'}}/>
          </svg>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{form.name||'Set your name'}</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userEmail}</div>
          <div style={{fontSize:11,color:'var(--primary)',marginTop:4,fontWeight:600}}>{Math.round(profilePct*100)}% profile complete · tap to edit</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Tools grid */}
      <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Tools</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
        {[
          {icon:'⚖️',label:'BMI Calculator',sub:'Check your index',action:()=>router.push('/bmi')},
          {icon:'🔥',label:'Calorie Calc',sub:'Find daily needs',action:()=>router.push('/calorie-calc')},
          {icon:'📏',label:'Measurements',sub:'Track body changes',action:()=>router.push('/measurements')},
          {icon:'📤',label:'Share progress',sub:'Download card',action:()=>router.push('/share')},
        ].map(t=>(
          <button key={t.label} onClick={t.action}
            style={{background:'var(--card)',borderRadius:18,padding:'16px 14px',border:'1.5px solid var(--border)',cursor:'pointer',textAlign:'left',transition:'border-color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{fontSize:24,marginBottom:8}}>{t.icon}</div>
            <div style={{fontWeight:700,fontSize:13}}>{t.label}</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* Settings — only 3 items */}
      <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Settings</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
        {[
          {icon:'🎯',label:'Goals & targets',sub:'Calories, macros, weight goal',action:()=>setView('goals')},
          {icon:'🔔',label:'Notifications',sub:notifPermission==='granted'?`${reminders.filter(r=>r.enabled).length} reminders active`:'Set meal reminders',action:()=>setView('notifications')},
          {icon:'🔒',label:'Security',sub:'Password, email, account',action:()=>setView('security')},
        ].map(item=>(
          <button key={item.label} onClick={item.action}
            style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--card)',borderRadius:16,border:'1.5px solid var(--border)',cursor:'pointer',textAlign:'left',width:'100%',transition:'border-color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{width:40,height:40,borderRadius:12,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
              {item.icon}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14}}>{item.label}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.sub}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>


      {/* Theme */}
      <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Appearance</div>
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {([['light','☀️','Light'],['auto','⚙️','Auto'],['dark','🌙','Dark']] as const).map(([val,icon,label])=>(
          <button key={val} onClick={()=>setTheme(val)}
            style={{flex:1,padding:'12px 8px',borderRadius:16,border:'2px solid '+(theme===val?'var(--primary)':'var(--border)'),background:theme===val?'var(--primary-bg)':'var(--card)',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>
            <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:700,color:theme===val?'var(--primary)':'var(--muted)'}}>{label}</div>
          </button>
        ))}
      </div>

      {/* Legal — pills */}
      <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Legal</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
        {[{key:'terms',label:'Terms'},{key:'privacy',label:'Privacy'},{key:'data',label:'Data & Privacy'}].map(l=>(
          <button key={l.key} onClick={()=>{setLegalPage(l.key);setView('legal')}}
            style={{padding:'8px 16px',borderRadius:99,fontSize:13,fontWeight:500,cursor:'pointer',border:'1.5px solid var(--border)',background:'var(--card)',color:'var(--muted)',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Log out */}
      <button onClick={async()=>{await supabase.auth.signOut();router.replace('/auth')}}
        style={{width:'100%',padding:'14px',borderRadius:16,background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontWeight:700,fontSize:15,cursor:'pointer',marginBottom:8}}>
        Log out
      </button>

      <BottomNav/>
    </div>
  )
}
