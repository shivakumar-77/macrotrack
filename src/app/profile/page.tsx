'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const router = useRouter()
  const [tab, setTab] = useState('setting')
  const [weights, setWeights] = useState([])
  const [saving, setSaving] = useState(false)
  const [weightVal, setWeightVal] = useState('')
  const [msg, setMsg] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [form, setForm] = useState({ name:'', age:'', height:'', gender:'male', goal:'lose', cal_target:1700, protein_target:167, carb_target:144, fat_target:60, fiber_target:25, weight_goal:72, water_goal:2000 })
  const [secForm, setSecForm] = useState({ newEmail:'', newPassword:'', confirmPassword:'' })
  const [legalPage, setLegalPage] = useState(null)

  useEffect(() => {
    async function load() {
      const { data:{user} } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      setUserEmail(user.email || '')
      const [{ data:prof }, { data:wlogs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at',{ascending:true}).limit(30)
      ])
      if (prof) setForm({ name:prof.name??'', age:prof.age??'', height:prof.height??'', gender:prof.gender??'male', goal:prof.goal??'lose', cal_target:prof.cal_target??1700, protein_target:prof.protein_target??167, carb_target:prof.carb_target??144, fat_target:prof.fat_target??60, fiber_target:prof.fiber_target??25, weight_goal:prof.weight_goal??72, water_goal:prof.water_goal??2000 })
      if (wlogs) setWeights(wlogs)
    }
    load()
  }, [])

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function saveForm() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false); showMsg('Saved successfully!')
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

  async function changeEmail() {
    if (!secForm.newEmail) return
    const { error } = await supabase.auth.updateUser({ email:secForm.newEmail })
    if (error) showMsg(error.message)
    else { showMsg('Check your new email to confirm!'); setSecForm(p=>({...p,newEmail:''})) }
  }

  async function changePassword() {
    if (!secForm.newPassword || secForm.newPassword !== secForm.confirmPassword) { showMsg('Passwords do not match'); return }
    const { error } = await supabase.auth.updateUser({ password:secForm.newPassword })
    if (error) showMsg(error.message)
    else { showMsg('Password updated!'); setSecForm(p=>({...p,newPassword:'',confirmPassword:''})) }
  }

  const latest = weights[weights.length-1]
  const profilePct = [form.name, form.age, form.height, form.gender, form.goal].filter(Boolean).length / 5

  function WeightGraph() {
    if (weights.length < 2) return <div style={{textAlign:'center',padding:'20px',color:'var(--muted)',fontSize:13}}>Log at least 2 entries to see your trend</div>
    const vals=weights.map(w=>w.weight_kg), min=Math.min(...vals)-0.5, max=Math.max(...vals)+0.5
    const W=320, H=90
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
            {(i===0||i===pts.length-1||weights.length<=5) && <text x={p.x} y={p.y-9} textAnchor="middle" fontSize="9" fontWeight="700" fill="#6366f1">{weights[i].weight_kg}</text>}
          </g>
        ))}
        <text x="0" y={H+18} fontSize="9" fill="var(--muted)">{weights[0]?.logged_at?.slice(5)}</text>
        <text x={W} y={H+18} textAnchor="end" fontSize="9" fill="var(--muted)">{weights[weights.length-1]?.logged_at?.slice(5)}</text>
      </svg>
    )
  }

  const Label = ({text}) => <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{text}</label>

  const MenuItem = ({icon, label, sublabel, onClick, danger=false, rightEl=null}) => (
    <button onClick={onClick} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'15px 16px',background:'var(--card2)',borderRadius:16,border:'none',cursor:'pointer',textAlign:'left',marginBottom:8,transition:'background 0.15s'}}
      onMouseEnter={e=>e.currentTarget.style.background='#e8eaf6'}
      onMouseLeave={e=>e.currentTarget.style.background='var(--card2)'}>
      <div style={{width:38,height:38,borderRadius:12,background:danger?'#fef2f2':'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        {icon}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:14,color:danger?'#dc2626':'var(--text)'}}>{label}</div>
        {sublabel && <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>{sublabel}</div>}
      </div>
      {rightEl || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
    </button>
  )

  // Legal pages
  if (legalPage === 'terms') return (
    <div className="page" style={{paddingTop:24}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>setLegalPage(null)} style={{width:38,height:38,borderRadius:12,background:'var(--card2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{fontSize:20,fontWeight:700}}>Terms & Conditions</h1>
      </div>
      <div className="card" style={{lineHeight:1.8,fontSize:13,color:'var(--muted)'}}>
        <p style={{fontWeight:700,color:'var(--text)',marginBottom:8}}>Last updated: April 2025</p>
        <p style={{marginBottom:16}}>Welcome to MacroTrack. By using our app, you agree to these terms. Please read them carefully.</p>
        {[{t:'1. Use of Service',b:'MacroTrack provides nutrition tracking tools for personal use only. You agree not to misuse the service or attempt to access it using methods other than the interface we provide.'},
          {t:'2. Account Responsibility',b:'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.'},
          {t:'3. Health Disclaimer',b:'MacroTrack is not a medical service. The nutritional information and goals provided are for general informational purposes only and should not replace professional medical advice, diagnosis, or treatment.'},
          {t:'4. Data Accuracy',b:'While we strive to provide accurate nutritional data, we cannot guarantee the accuracy of all food entries. Always verify important nutritional information with a qualified dietitian.'},
          {t:'5. Changes to Terms',b:'We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.'},
          {t:'6. Termination',b:'We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.'},
          {t:'7. Contact',b:'For questions about these Terms, contact us at support@macrotrack.app'}
        ].map(s=>(
          <div key={s.t} style={{marginBottom:16}}>
            <div style={{fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.t}</div>
            <div>{s.b}</div>
          </div>
        ))}
      </div>
      <BottomNav/>
    </div>
  )

  if (legalPage === 'privacy') return (
    <div className="page" style={{paddingTop:24}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>setLegalPage(null)} style={{width:38,height:38,borderRadius:12,background:'var(--card2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{fontSize:20,fontWeight:700}}>Privacy Policy</h1>
      </div>
      <div className="card" style={{lineHeight:1.8,fontSize:13,color:'var(--muted)'}}>
        <p style={{fontWeight:700,color:'var(--text)',marginBottom:8}}>Last updated: April 2025</p>
        <p style={{marginBottom:16}}>Your privacy matters to us. This policy explains how MacroTrack collects, uses, and protects your information.</p>
        {[{t:'Information We Collect',b:'We collect information you provide directly: name, email, age, height, weight, nutrition goals, and food logs. We also collect usage data to improve our service.'},
          {t:'How We Use Your Information',b:'Your data is used to provide personalized nutrition tracking, calculate macro targets, and improve your experience. We never sell your personal data to third parties.'},
          {t:'Data Storage',b:'Your data is securely stored using Supabase, a trusted database provider with enterprise-grade security. All data is encrypted in transit and at rest.'},
          {t:'Data Sharing',b:'We do not share your personal information with advertisers or third parties. We may share anonymized, aggregated data for research purposes only.'},
          {t:'Your Rights',b:'You have the right to access, correct, or delete your personal data at any time. You can delete your account from the Profile > Security section.'},
          {t:'Cookies',b:'We use minimal cookies necessary for authentication and session management. We do not use tracking or advertising cookies.'},
          {t:'Contact Us',b:'For privacy concerns or data requests, contact us at privacy@macrotrack.app'}
        ].map(s=>(
          <div key={s.t} style={{marginBottom:16}}>
            <div style={{fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.t}</div>
            <div>{s.b}</div>
          </div>
        ))}
      </div>
      <BottomNav/>
    </div>
  )

  if (legalPage === 'data') return (
    <div className="page" style={{paddingTop:24}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>setLegalPage(null)} style={{width:38,height:38,borderRadius:12,background:'var(--card2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{fontSize:20,fontWeight:700}}>Data & Privacy</h1>
      </div>
      <div className="card" style={{lineHeight:1.8,fontSize:13,color:'var(--muted)'}}>
        <p style={{fontWeight:700,color:'var(--text)',marginBottom:16}}>Your data rights under GDPR & privacy laws</p>
        {[{t:'What data we store',b:'• Profile: name, age, height, gender, goals\n• Food logs: meals, macros, timestamps\n• Weight logs: daily weight entries\n• Water logs: daily hydration entries\n• Authentication: email, encrypted password'},
          {t:'How long we keep it',b:'Your data is kept as long as your account is active. When you delete your account, all personal data is permanently removed within 30 days.'},
          {t:'Export your data',b:'You can request a copy of all your data by emailing data@macrotrack.app. We will provide a JSON export within 7 business days.'},
          {t:'Delete your data',b:'You can delete your account and all associated data from Profile > Security > Delete my account. This action is immediate and irreversible.'},
          {t:'Third-party services',b:'We use Supabase for database storage and authentication. Their privacy policy is available at supabase.com/privacy. We use Anthropic AI for food scanning — only the food image is sent, no personal data.'},
          {t:'Security measures',b:'All data is encrypted using AES-256. Connections are secured with TLS 1.3. We conduct regular security audits and follow OWASP best practices.'}
        ].map(s=>(
          <div key={s.t} style={{marginBottom:16}}>
            <div style={{fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.t}</div>
            <div style={{whiteSpace:'pre-line'}}>{s.b}</div>
          </div>
        ))}
      </div>
      <BottomNav/>
    </div>
  )

  return (
    <div className="page" style={{paddingTop:24}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.02em'}}>Account</h1>
      </div>

      {/* Avatar card */}
      <div style={{background:'var(--card)',borderRadius:24,padding:'20px',border:'1.5px solid var(--border)',marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
        <div style={{position:'relative',flexShrink:0}}>
          <div style={{width:68,height:68,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff'}}>
            {form.name?form.name[0].toUpperCase():'?'}
          </div>
          {/* Progress ring */}
          <svg style={{position:'absolute',top:-4,left:-4}} width="76" height="76" viewBox="0 0 76 76">
            <circle cx="38" cy="38" r="34" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
            <circle cx="38" cy="38" r="34" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={2*Math.PI*34*(1-profilePct)}
              style={{transformOrigin:'38px 38px',transform:'rotate(-90deg)'}}/>
          </svg>
          <div style={{position:'absolute',bottom:0,right:0,background:'var(--primary)',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid white',fontSize:10,color:'white',fontWeight:700}}>
            {Math.round(profilePct*100)}
          </div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:17,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{form.name||'Your name'}</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{userEmail}</div>
        </div>
        <button onClick={()=>setTab('profile')} style={{width:36,height:36,borderRadius:10,background:'var(--card2)',border:'1.5px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      {msg&&<div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>}

      {/* Tabs */}
      <div style={{display:'flex',background:'var(--card2)',borderRadius:16,padding:4,marginBottom:24,border:'1.5px solid var(--border)'}}>
        {[{id:'profile',label:'Profile'},{id:'setting',label:'Setting'},{id:'plan',label:'My Plan'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:'10px',borderRadius:12,border:'none',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.15s',background:tab===t.id?'var(--primary)':'transparent',color:tab===t.id?'#fff':'var(--muted)',boxShadow:tab===t.id?'0 2px 8px rgba(99,102,241,0.3)':'none'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab==='profile'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Personal details</div>
            <div><Label text="Full name"/><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your full name"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><Label text="Age"/><input type="number" value={form.age} onChange={e=>setForm(p=>({...p,age:e.target.value}))} placeholder="25"/></div>
              <div><Label text="Height (cm)"/><input type="number" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))} placeholder="175"/></div>
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
              {saving?'Saving…':'Save profile'}
            </button>
          </div>

          {/* Weight section */}
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>⚖️ Weight tracker</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Current</div>
                <div style={{fontSize:26,fontWeight:800}}>{latest?latest.weight_kg:'—'}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kg</span></div>
              </div>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Goal</div>
                <div style={{fontSize:26,fontWeight:800}}>{form.weight_goal}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kg</span></div>
                {latest&&<div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{Math.abs(latest.weight_kg-form.weight_goal).toFixed(1)} kg to go</div>}
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              <input type="number" placeholder="Today's weight (kg)" value={weightVal} onChange={e=>setWeightVal(e.target.value)} step="0.1" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&logWeight()}/>
              <button className="btn btn-primary" onClick={logWeight} style={{flexShrink:0,padding:'12px 20px',fontWeight:700}}>Log</button>
            </div>
            <WeightGraph/>
          </div>
        </div>
      )}

      {/* SETTING TAB */}
      {tab==='setting'&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Account</div>
          <MenuItem icon="🎯" label="My Goals" sublabel="Calories, macros & targets" onClick={()=>setTab('goals')}/>
          <MenuItem icon="🔔" label="Notifications" sublabel="Meal & hydration reminders" onClick={async()=>{
            const p=await Notification.requestPermission()
            if(p==='granted'){new Notification('MacroTrack',{body:'Notifications enabled!'});showMsg('Notifications enabled!')}
            else showMsg('Please allow notifications in browser settings.')
          }}/>
          <MenuItem icon="🔑" label="Change Password" sublabel="Update your password" onClick={()=>setTab('password')}/>
          <MenuItem icon="📧" label="Change Email" sublabel={userEmail} onClick={()=>setTab('email')}/>

          <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10,marginTop:20}}>Other</div>
          <MenuItem icon="📋" label="Terms & Conditions" onClick={()=>setLegalPage('terms')}/>
          <MenuItem icon="🔒" label="Privacy Policy" onClick={()=>setLegalPage('privacy')}/>
          <MenuItem icon="🛡️" label="Data & Privacy" onClick={()=>setLegalPage('data')}/>
          <MenuItem icon="🚪" label="Log Out" danger onClick={async()=>{await supabase.auth.signOut();router.replace('/auth')}}/>
        </div>
      )}

      {/* GOALS SUB-PAGE */}
      {tab==='goals'&&(
        <div>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🎯 My Goals</div>
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
              {saving?'Saving…':'Save goals'}
            </button>
          </div>
        </div>
      )}

      {/* PASSWORD SUB-PAGE */}
      {tab==='password'&&(
        <div>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🔑 Change Password</div>
            <div><Label text="New password"/><input type="password" placeholder="Min 6 characters" value={secForm.newPassword} onChange={e=>setSecForm(p=>({...p,newPassword:e.target.value}))}/></div>
            <div><Label text="Confirm password"/><input type="password" placeholder="Repeat new password" value={secForm.confirmPassword} onChange={e=>setSecForm(p=>({...p,confirmPassword:e.target.value}))}/></div>
            <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={changePassword}>Update password</button>
            <div style={{height:1,background:'var(--border)'}}/>
            <button className="btn btn-ghost" style={{width:'100%',padding:'13px',fontSize:13,fontWeight:600}}
              onClick={async()=>{const{data:{user}}=await supabase.auth.getUser();if(user?.email){await supabase.auth.resetPasswordForEmail(user.email);showMsg('Reset link sent to your email!')}}}>
              Send reset link via email
            </button>
          </div>
          <div className="card" style={{marginTop:12,border:'1.5px solid #fecaca'}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:'#dc2626'}}>⚠️ Delete Account</div>
            <p style={{fontSize:13,color:'var(--muted)',marginBottom:14,lineHeight:1.6}}>Permanently delete your account and all data. This cannot be undone.</p>
            <button style={{width:'100%',padding:'13px',borderRadius:14,background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontWeight:700,fontSize:14,cursor:'pointer'}}
              onClick={async()=>{if(confirm('Are you sure? This will permanently delete your account.')){await supabase.auth.signOut();router.replace('/auth')}}}>
              Delete my account
            </button>
          </div>
        </div>
      )}

      {/* EMAIL SUB-PAGE */}
      {tab==='email'&&(
        <div>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>📧 Change Email</div>
            <div style={{padding:'12px 14px',borderRadius:12,background:'var(--card2)',fontSize:13,color:'var(--muted)'}}>Current: <strong style={{color:'var(--text)'}}>{userEmail}</strong></div>
            <div><Label text="New email address"/><input type="email" placeholder="new@email.com" value={secForm.newEmail} onChange={e=>setSecForm(p=>({...p,newEmail:e.target.value}))}/></div>
            <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={changeEmail}>Update email</button>
          </div>
        </div>
      )}

      {/* MY PLAN TAB */}
      {tab==='plan'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>📊 Daily targets</div>
            {[{l:'Calories',v:form.cal_target,u:'kcal',c:'#6366f1',bg:'#eef2ff'},{l:'Protein',v:form.protein_target,u:'g',c:'#3b82f6',bg:'#dbeafe'},{l:'Carbohydrates',v:form.carb_target,u:'g',c:'#f59e0b',bg:'#fef3c7'},{l:'Fat',v:form.fat_target,u:'g',c:'#ef4444',bg:'#fee2e2'},{l:'Fiber',v:form.fiber_target,u:'g',c:'#10b981',bg:'#d1fae5'},{l:'Water',v:form.water_goal,u:'ml',c:'#0ea5e9',bg:'#e0f2fe'}].map(m=>(
              <div key={m.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:m.c,flexShrink:0}}/>
                  <span style={{fontSize:14,fontWeight:500}}>{m.l}</span>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:m.c}}>{m.v} <span style={{fontSize:12,fontWeight:400,color:'var(--muted)'}}>{m.u}</span></div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>🎯 Current goal</div>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px',borderRadius:14,background:form.goal==='lose'?'#d1fae5':form.goal==='gain'?'#dbeafe':'#fef3c7',border:`1.5px solid ${form.goal==='lose'?'#6ee7b7':form.goal==='gain'?'#93c5fd':'#fde68a'}`}}>
              <div style={{fontSize:32}}>{form.goal==='lose'?'📉':form.goal==='gain'?'💪':'⚖️'}</div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:form.goal==='lose'?'#059669':form.goal==='gain'?'#2563eb':'#d97706'}}>{form.goal==='lose'?'Fat Loss':form.goal==='gain'?'Muscle Gain':'Maintain Weight'}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Target: {form.weight_goal} kg</div>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{width:'100%',padding:'14px',fontWeight:600}} onClick={()=>setTab('goals')}>
            Edit my plan →
          </button>
        </div>
      )}

      <div style={{height:20}}/>
      <BottomNav/>
    </div>
  )
}
