'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { SettingsIcon, BellIcon, LockIcon, TargetIcon, ScaleIcon, MeasureIcon, ShareIcon, BMIIcon, CalcIcon, SunIcon, MoonIcon, AutoIcon, LogoutIcon } from '@/lib/icons'
import { PageLoader } from '@/components/Skeleton'
import { useTheme } from '@/components/ThemeProvider'

export default function ProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState('main')
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
        name: prof.name ?? '',
        dob: prof.dob ?? '',
        age: prof.age ? String(prof.age) : '',
        height: prof.height ? String(prof.height) : '',
        gender: prof.gender ?? 'male',
        phone: prof.phone ?? '',
        goal: prof.goal ?? 'lose',
        cal_target: prof.cal_target ?? 1700,
        protein_target: prof.protein_target ?? 167,
        carb_target: prof.carb_target ?? 144,
        fat_target: prof.fat_target ?? 60,
        fiber_target: prof.fiber_target ?? 25,
        weight_goal: prof.weight_goal ?? 72,
        water_goal: prof.water_goal ?? 2000
      })
      if (prof.photo_url) setPhotoUrl(prof.photo_url)
    }
    if (wlogs) setWeights(wlogs)
  }

  function showMsg(m) { setMsg(m); setTimeout(()=>setMsg(''), 2500) }

  async function saveProfile() {
    setSaving(true)
    const { data:{ user } } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('profiles').update({
      name: form.name,
      dob: form.dob || null,
      age: parseInt(form.age) || null,
      height: parseFloat(form.height) || null,
      gender: form.gender,
      phone: form.phone,
      goal: form.goal,
      cal_target: parseInt(form.cal_target) || 1700,
      protein_target: parseInt(form.protein_target) || 167,
      carb_target: parseInt(form.carb_target) || 144,
      fat_target: parseInt(form.fat_target) || 60,
      fiber_target: parseInt(form.fiber_target) || 25,
      weight_goal: parseFloat(form.weight_goal) || 72,
      water_goal: parseInt(form.water_goal) || 2000,
      photo_url: photoUrl
    }).eq('id', user.id)
    setSaving(false)
    showMsg('Saved successfully!')
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
    else { showMsg('Confirm via your new email!'); setSecForm(p=>({...p,newEmail:''})) }
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
  }

  function calcAge(dob) {
    if (!dob) return ''
    return String(Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000)))
  }

  const latest = weights[weights.length-1]
  const profileFields = [form.name, form.dob, form.height, form.gender, form.phone]
  const profilePct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  const L = ({text}) => (
    <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{text}</div>
  )

  const SectionLabel = ({text}) => (
    <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10,marginTop:4}}>{text}</div>
  )

  const MenuItem = ({icon, label, sub, onClick, danger=false}) => (
    <button onClick={onClick}
      style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'15px 16px',background:'var(--card)',borderRadius:16,border:'1.5px solid var(--border)',cursor:'pointer',textAlign:'left',marginBottom:8,WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
      <div style={{width:42,height:42,borderRadius:13,background:danger?'#fef2f2':'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:14,color:danger?'#dc2626':'var(--text)'}}>{label}</div>
        {sub && <div style={{fontSize:12,color:'var(--muted)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sub}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  )

  const BackBtn = ({label='Back'}) => (
    <button onClick={()=>setView('main')}
      style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'var(--primary)',fontSize:15,fontWeight:600,padding:'0 0 16px 0',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      {label}
    </button>
  )

  const MsgBanner = () => msg ? (
    <div style={{background:'#d1fae5',border:'1.5px solid #6ee7b7',borderRadius:12,padding:'10px 16px',marginBottom:16,fontSize:13,fontWeight:600,color:'#059669'}}>✓ {msg}</div>
  ) : null

  // ── LEGAL ──────────────────────────────────────────────────
  const LEGAL = {
    terms: {
      title: 'Terms & Conditions',
      updated: 'April 2025',
      intro: 'Welcome to MacroTrack. By downloading or using our app, you agree to these Terms. Please read them carefully before using the service.',
      sections: [
        { t:'1. Acceptance of terms', b:'By accessing MacroTrack, you confirm you are at least 13 years old and agree to be bound by these Terms. If you are under 18, a parent or guardian must review and agree to these Terms on your behalf.' },
        { t:'2. Use of service', b:'MacroTrack grants you a personal, non-transferable, non-exclusive license to use the app for your individual nutrition tracking. You may not copy, modify, distribute, sell, or lease any part of our service.' },
        { t:'3. Account responsibility', b:'You are solely responsible for maintaining the security of your login credentials. You agree to notify us immediately at support@macrotrack.app of any unauthorized access to your account.' },
        { t:'4. Health & medical disclaimer', b:'MacroTrack is a wellness and tracking tool — it is NOT a medical service. Nothing in the app constitutes medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making significant changes to your diet, exercise routine, or health regimen. Do not use MacroTrack as a substitute for professional medical advice.' },
        { t:'5. Nutritional data accuracy', b:'While we strive to maintain accurate nutritional data, food composition can vary by brand, preparation method, and source. MacroTrack cannot guarantee the accuracy of all nutritional information. For critical dietary requirements (allergies, medical conditions), always verify with certified sources or a registered dietitian.' },
        { t:'6. AI features', b:'MacroTrack uses AI (powered by Anthropic Claude) for food scanning, meal suggestions, and insights. AI-generated results are estimates and should not be relied upon for medical or clinical decisions. The accuracy of food scanning depends on image quality and lighting.' },
        { t:'7. Intellectual property', b:'All content, features, designs, and functionality of MacroTrack are owned by MacroTrack and protected under applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission.' },
        { t:'8. Prohibited conduct', b:'You agree not to: attempt to hack, disrupt, or probe our systems; scrape or extract data from the app; use the app for any unlawful purpose; impersonate other users; or upload malicious code or content.' },
        { t:'9. Termination', b:'We reserve the right to suspend or permanently terminate your account without notice if you violate these Terms or engage in fraudulent, harmful, or abusive behavior.' },
        { t:'10. Limitation of liability', b:'To the maximum extent permitted by law, MacroTrack shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the service.' },
        { t:'11. Changes to terms', b:'We may update these Terms periodically. Continued use of MacroTrack after changes are posted constitutes your acceptance. We will notify you of significant changes via the app or email.' },
        { t:'12. Governing law', b:'These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.' },
        { t:'13. Contact us', b:'For questions about these Terms:\nEmail: support@macrotrack.app\nResponse time: within 5 business days' },
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'April 2025',
      intro: 'Your privacy is fundamental to us. This Privacy Policy explains what information MacroTrack collects, how we use it, and the choices you have. We are committed to protecting your personal data.',
      sections: [
        { t:'Information we collect', b:'Personal data you provide:\n• Profile: name, date of birth, age, gender, height, current weight, phone number\n• Health goals: calorie targets, macro targets, goal weight\n• Activity logs: food entries with nutritional data, timestamps, meal types\n• Weight logs: daily weight entries with dates\n• Water logs: daily hydration tracking\n• Authentication: email address, encrypted password\n• Profile photo (stored as encrypted base64)\n\nData collected automatically:\n• App usage patterns (anonymized)\n• Device type and OS version (for bug fixes)\n• Error logs (no personal data included)' },
        { t:'How we use your information', b:'We use your data exclusively to:\n• Provide personalized calorie and macro tracking\n• Calculate your BMI, TDEE, and nutrition targets\n• Generate AI-powered meal suggestions and insights\n• Send meal and hydration reminders (only if you enable them)\n• Improve app performance and fix bugs\n• Respond to your support requests\n\nWe will NEVER use your data for advertising or sell it to third parties.' },
        { t:'Data storage & security', b:'Your data is stored using Supabase, an enterprise-grade database provider with:\n• AES-256 encryption at rest\n• TLS 1.3 encryption in transit\n• SOC 2 Type 2 compliance\n• Regular security audits\n• Row-level security (your data is only accessible by you)\n\nProfile photos are stored as encrypted base64 strings directly in your profile record.' },
        { t:'Third-party services', b:'MacroTrack uses the following trusted third-party services:\n\n• Supabase (database & authentication)\n  Privacy policy: supabase.com/privacy\n  Data location: AWS infrastructure\n\n• Anthropic Claude AI (food scanning, insights, meal planning)\n  Privacy policy: anthropic.com/privacy\n  Note: Only food images and anonymized nutrition data are sent — NO personal information\n\n• Open Food Facts (barcode scanning)\n  Privacy policy: world.openfoodfacts.org/privacy\n  Note: This is an open-source database — no data is sent from MacroTrack\n\n• Google Fonts (typography)\n  Privacy policy: policies.google.com/privacy\n  Note: Font files only, no tracking' },
        { t:'Data sharing', b:'We do not sell, trade, or rent your personal information. We may share anonymized, aggregated data (e.g., "X% of users hit their protein goal on weekdays") for research purposes only. This data cannot be used to identify you.' },
        { t:'Your privacy rights', b:'You have the right to:\n• Access: Request a copy of all data we hold about you\n• Correction: Update incorrect personal information at any time in the app\n• Deletion: Delete your account and all associated data permanently\n• Portability: Export your data in JSON format\n• Objection: Opt out of any non-essential data processing\n\nTo exercise these rights, contact privacy@macrotrack.app or use the in-app options under Account → Security.' },
        { t:'Cookies & local storage', b:'MacroTrack uses:\n• Authentication cookies: Required for login sessions (cannot be disabled)\n• Local storage: Stores your food search history and favourite meals on your device only — this data never leaves your phone\n• Service worker cache: Stores app files locally for offline access\n\nWe do NOT use advertising cookies, tracking pixels, or third-party analytics.' },
        { t:"Children's privacy", b:'MacroTrack is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us at privacy@macrotrack.app and we will delete it within 72 hours.' },
        { t:'Data retention', b:'Your data is retained as long as your account is active. If you delete your account:\n• Personal data is removed from our active database immediately\n• Backups are purged within 30 days\n• Anonymized aggregate data may be retained indefinitely\n\nIf your account is inactive for 24 months, we will email you before taking any action.' },
        { t:'Changes to this policy', b:'We will notify you of material changes to this Privacy Policy via in-app notification and email at least 14 days before they take effect. Continued use after that date constitutes acceptance.' },
        { t:'Contact our privacy team', b:'For privacy questions or requests:\nEmail: privacy@macrotrack.app\nResponse time: within 72 hours\nFor urgent concerns: support@macrotrack.app' },
      ]
    },
    data: {
      title: 'Data & Privacy Controls',
      updated: 'April 2025',
      intro: 'This page explains exactly what data MacroTrack stores about you, how long we keep it, and how you can control or delete it. You are in full control of your data.',
      sections: [
        { t:'Complete data inventory', b:'Here is every piece of data MacroTrack stores about you:\n\nProfile data:\n• Full name, date of birth, age\n• Gender, height, phone number\n• Profile photo (base64 encoded)\n• Email address\n• Password (bcrypt hashed — we cannot read it)\n\nHealth & fitness data:\n• Daily food logs (food name, quantity, macros, meal type, timestamp)\n• Daily weight logs (weight in kg, date)\n• Daily water logs (amount in ml, date)\n• Body measurements (waist, chest, hips, arms, thighs, shoulders)\n• Nutrition goals (calorie target, macro targets, goal weight, water goal)\n\nApp preferences:\n• Notification reminder times (stored locally on device)\n• Favourite meals (stored locally on device)\n• Food search history (stored locally on device)\n• Theme preference (stored locally on device)\n\nTechnical data:\n• Account creation date\n• Last login timestamp' },
        { t:'Data you control locally', b:'The following data is stored ONLY on your device and never sent to our servers:\n• ⭐ Favourite meals\n• 🕐 Food search history\n• 🔔 Notification reminder times\n• 🎨 App theme preference (light/dark/auto)\n\nClearing your browser/app data will remove these.' },
        { t:'Request your data export', b:'You have the right to receive a complete export of all your MacroTrack data in machine-readable JSON format.\n\nTo request an export:\n1. Email data@macrotrack.app with subject "Data Export Request"\n2. Include the email address associated with your account\n3. We will verify your identity and send your export within 7 business days\n4. Export includes all food logs, weight logs, water logs, measurements, and profile data' },
        { t:'How to delete your data', b:'Option 1 — Delete account in app:\n1. Go to Account → Security → Delete my account\n2. Confirm deletion\n3. All your personal data is immediately removed from our active database\n4. Backup purge completes within 30 days\n\nOption 2 — Email request:\nEmail privacy@macrotrack.app with "Account Deletion Request"\nInclude your registered email address\nWe will process within 48 hours and confirm via email\n\n⚠️ Account deletion is permanent and irreversible. Deleted data cannot be recovered.' },
        { t:'Data security measures', b:'We protect your data using industry-standard security practices:\n\nEncryption:\n• Data at rest: AES-256 encryption\n• Data in transit: TLS 1.3\n• Passwords: bcrypt hashing (never stored in plain text)\n\nAccess controls:\n• Row-level security: each user can only access their own data\n• API authentication: all requests require valid JWT tokens\n• No shared database access between users\n\nInfrastructure:\n• Hosted on Supabase (AWS infrastructure)\n• SOC 2 Type 2 compliant data center\n• Regular automated backups\n• 24/7 infrastructure monitoring\n\nCode security:\n• Input validation on all API endpoints\n• Rate limiting to prevent abuse\n• Security headers (CSP, HSTS, X-Frame-Options)\n• Regular dependency updates' },
        { t:'Third-party data processors', b:'We use the following sub-processors who may process your data:\n\n┌─────────────────────────────────────\n│ Supabase Inc.\n│ Role: Database & authentication\n│ Data: All personal data\n│ Location: AWS (us-east-1)\n│ DPA: Yes (GDPR compliant)\n├─────────────────────────────────────\n│ Anthropic, PBC\n│ Role: AI food scanning & insights\n│ Data: Food images only (no personal info)\n│ Location: USA\n│ DPA: Yes\n└─────────────────────────────────────' },
        { t:'Regulatory compliance', b:'MacroTrack is committed to complying with applicable data protection regulations:\n\n• GDPR (EU General Data Protection Regulation)\n• DPDP Act 2023 (India Digital Personal Data Protection Act)\n• CCPA (California Consumer Privacy Act)\n\nFor regulatory inquiries or to exercise your rights under these laws, contact:\ndpo@macrotrack.app' },
        { t:'Contact', b:'Data Protection:\ndpo@macrotrack.app\n\nPrivacy questions:\nprivacy@macrotrack.app\n\nData export/deletion:\ndata@macrotrack.app\n\nGeneral support:\nsupport@macrotrack.app\n\nAll emails receive a response within 72 hours.' },
      ]
    }
  }

  if (view === 'legal') {
    const page = LEGAL[legalPage]
    return (
      <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:60}}>
        <div style={{padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0'}}>
          <BackBtn label={page.title}/>
        </div>
        <div style={{padding:'0 20px 40px'}}>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:20}}>Last updated: {page.updated}</div>
          <div style={{background:'var(--primary-bg)',borderRadius:16,padding:'14px 16px',border:'1.5px solid #c7d2fe',marginBottom:20}}>
            <p style={{fontSize:13,color:'var(--primary)',lineHeight:1.7}}>{page.intro}</p>
          </div>
          {page.sections.map((s,i) => (
            <div key={i} style={{marginBottom:20,background:'var(--card)',borderRadius:16,padding:'16px',border:'1.5px solid var(--border)'}}>
              <div style={{fontWeight:700,color:'var(--text)',fontSize:14,marginBottom:8}}>{s.t}</div>
              <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.8,whiteSpace:'pre-line'}}>{s.b}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── EDIT PROFILE ───────────────────────────────────────────
  if (view === 'edit') return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:100}}>
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0'}}>
        <BackBtn/>
      </div>
      <div style={{padding:'0 20px'}}>
        <MsgBanner/>
        <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:17,marginBottom:4}}>Personal details</div>
          <div>
            <L text="Profile photo"/>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:60,height:60,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#fff',flexShrink:0}}>
                {photoUrl ? <img src={photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (form.name?form.name[0].toUpperCase():'?')}
              </div>
              <div style={{flex:1}}>
                <button onClick={()=>fileRef.current?.click()} className="btn btn-ghost" style={{fontSize:13,padding:'9px 14px',fontWeight:600,width:'auto'}}>
                  {photoUrl?'Change photo':'Upload photo'}
                </button>
                {photoUrl && <button onClick={()=>setPhotoUrl(null)} style={{background:'none',border:'none',color:'#ef4444',fontSize:12,cursor:'pointer',marginLeft:10}}>Remove</button>}
                <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>JPG or PNG, max 5MB</div>
              </div>
            </div>
          </div>
          <div><L text="Full name"/><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your full name"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <L text="Date of birth"/>
              <input type="date" value={form.dob} onChange={e=>{const d=e.target.value;setForm(p=>({...p,dob:d,age:calcAge(d)}))}}/>
            </div>
            <div><L text="Age (auto)"/><input value={form.age} readOnly style={{opacity:0.55,cursor:'not-allowed'}} placeholder="Auto"/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><L text="Height (cm)"/><input type="text" inputMode="decimal" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))} placeholder="175"/></div>
            <div><L text="Phone"/><input type="text" inputMode="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210"/></div>
          </div>
          <div><L text="Email address"/><input value={userEmail} readOnly style={{opacity:0.55,cursor:'not-allowed'}}/></div>
          <div>
            <L text="Gender"/>
            <div style={{display:'flex',gap:8}}>
              {['male','female','other'].map(g=>(
                <button key={g} onClick={()=>setForm(p=>({...p,gender:g}))}
                  style={{flex:1,padding:'11px',borderRadius:12,border:'2px solid '+(form.gender===g?'var(--primary)':'var(--border)'),background:form.gender===g?'var(--primary-bg)':'transparent',color:form.gender===g?'var(--primary)':'var(--muted)',fontWeight:700,fontSize:13,cursor:'pointer',textTransform:'capitalize',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" style={{padding:'15px',fontWeight:700,fontSize:15}} onClick={saveProfile} disabled={saving}>
            {saving?'Saving…':'Save profile'}
          </button>
        </div>

        <div className="card">
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>⚖️ Quick weight log</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Current</div>
              <div style={{fontSize:24,fontWeight:800}}>{latest?latest.weight_kg:'—'}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kg</span></div>
            </div>
            <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Goal</div>
              <div style={{fontSize:24,fontWeight:800}}>{form.weight_goal}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kg</span></div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <input type="text" inputMode="decimal" placeholder="e.g. 75.5 kg" value={weightVal} onChange={e=>setWeightVal(e.target.value)} style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&logWeight()}/>
            <button className="btn btn-primary" onClick={logWeight} style={{flexShrink:0,padding:'12px 20px',fontWeight:700,width:'auto'}}>Log</button>
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  // ── GOALS ─────────────────────────────────────────────────
  if (view === 'goals') return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:100}}>
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0'}}>
        <BackBtn/>
      </div>
      <div style={{padding:'0 20px'}}>
        <MsgBanner/>
        <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:17}}>🎯 Goals & targets</div>
          <div>
            <L text="My main goal"/>
            <div style={{display:'flex',gap:8}}>
              {[{key:'lose',label:'Lose fat',icon:'📉',color:'#10b981',bg:'#d1fae5'},{key:'maintain',label:'Maintain',icon:'⚖️',color:'#f59e0b',bg:'#fef3c7'},{key:'gain',label:'Build muscle',icon:'💪',color:'#3b82f6',bg:'#dbeafe'}].map(g=>(
                <button key={g.key} onClick={()=>setForm(p=>({...p,goal:g.key}))}
                  style={{flex:1,padding:'14px 6px',borderRadius:16,border:'2px solid '+(form.goal===g.key?g.color:'var(--border)'),background:form.goal===g.key?g.bg:'var(--card)',cursor:'pointer',textAlign:'center',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
                  <div style={{fontSize:22,marginBottom:6}}>{g.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:form.goal===g.key?g.color:'var(--muted)'}}>{g.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              {l:'Calories (kcal)',k:'cal_target',m:'numeric'},
              {l:'Protein (g)',k:'protein_target',m:'numeric'},
              {l:'Carbs (g)',k:'carb_target',m:'numeric'},
              {l:'Fat (g)',k:'fat_target',m:'numeric'},
              {l:'Fiber (g)',k:'fiber_target',m:'numeric'},
              {l:'Goal weight (kg)',k:'weight_goal',m:'decimal'},
              {l:'Water goal (ml)',k:'water_goal',m:'numeric'},
            ].map(f=>(
              <div key={f.k}><L text={f.l}/><input type="text" inputMode={f.m} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>
            ))}
          </div>
          <div style={{background:'var(--primary-bg)',borderRadius:12,padding:'12px 14px',border:'1.5px solid #c7d2fe',fontSize:12,color:'var(--primary)',lineHeight:1.6}}>
            💡 Not sure about your targets? Use the <strong>Calorie Calculator</strong> in Tools to get exact numbers based on your body and activity level.
          </div>
          <button className="btn btn-primary" style={{padding:'15px',fontWeight:700,fontSize:15}} onClick={saveProfile} disabled={saving}>
            {saving?'Saving…':'Save goals'}
          </button>
        </div>

        <div className="card">
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📊 Current plan</div>
          {[
            {l:'Calories',v:form.cal_target,u:'kcal',c:'#6366f1'},
            {l:'Protein',v:form.protein_target,u:'g',c:'#3b82f6'},
            {l:'Carbohydrates',v:form.carb_target,u:'g',c:'#f59e0b'},
            {l:'Fat',v:form.fat_target,u:'g',c:'#ef4444'},
            {l:'Fiber',v:form.fiber_target,u:'g',c:'#10b981'},
            {l:'Water',v:form.water_goal,u:'ml',c:'#0ea5e9'},
          ].map((m,i,arr)=>(
            <div key={m.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:m.c}}/>
                <span style={{fontSize:14}}>{m.l}</span>
              </div>
              <span style={{fontWeight:700,color:m.c}}>{m.v} <span style={{fontSize:12,fontWeight:400,color:'var(--muted)'}}>{m.u}</span></span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  // ── SECURITY ───────────────────────────────────────────────
  if (view === 'security') return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:100}}>
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0'}}>
        <BackBtn/>
      </div>
      <div style={{padding:'0 20px'}}>
        <MsgBanner/>
        <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:17}}>📧 Change email</div>
          <div style={{padding:'10px 14px',borderRadius:12,background:'var(--card2)',fontSize:13,color:'var(--muted)'}}>
            Current: <strong style={{color:'var(--text)'}}>{userEmail}</strong>
          </div>
          <div><L text="New email address"/><input type="email" placeholder="new@email.com" value={secForm.newEmail} onChange={e=>setSecForm(p=>({...p,newEmail:e.target.value}))}/></div>
          <button className="btn btn-primary" style={{padding:'14px',fontWeight:700}} onClick={changeEmail}>Update email</button>
        </div>

        <div className="card" style={{display:'flex',flexDirection:'column',gap:14,marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:17}}>🔑 Change password</div>
          <div><L text="New password"/><input type="password" placeholder="Minimum 6 characters" value={secForm.newPassword} onChange={e=>setSecForm(p=>({...p,newPassword:e.target.value}))}/></div>
          <div><L text="Confirm new password"/><input type="password" placeholder="Repeat your new password" value={secForm.confirmPassword} onChange={e=>setSecForm(p=>({...p,confirmPassword:e.target.value}))}/></div>
          <button className="btn btn-primary" style={{padding:'14px',fontWeight:700}} onClick={changePassword}>Update password</button>
          <button className="btn btn-ghost" style={{padding:'13px',fontSize:13,fontWeight:600}}
            onClick={async()=>{const{data:{user}}=await supabase.auth.getUser();if(user?.email){await supabase.auth.resetPasswordForEmail(user.email);showMsg('Reset link sent to your email!')}}}>
            Send password reset link via email
          </button>
        </div>

        <div className="card" style={{border:'1.5px solid #fecaca'}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:'#dc2626'}}>⚠️ Danger zone</div>
          <p style={{fontSize:13,color:'var(--muted)',marginBottom:16,lineHeight:1.7}}>
            Permanently delete your MacroTrack account and all associated data. This action <strong>cannot be undone</strong>. All food logs, weight history, and profile data will be permanently removed.
          </p>
          <button style={{width:'100%',padding:'14px',borderRadius:14,background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontWeight:700,fontSize:14,cursor:'pointer',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}
            onClick={async()=>{if(confirm('This will permanently delete your account and all data. Are you sure?')){await supabase.auth.signOut();router.replace('/auth')}}}>
            Delete my account permanently
          </button>
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  // ── NOTIFICATIONS ──────────────────────────────────────────
  if (view === 'notifications') return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:100}}>
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 0'}}>
        <BackBtn/>
      </div>
      <div style={{padding:'0 20px'}}>
        <MsgBanner/>
        <div className="card" style={{marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
            <div style={{width:48,height:48,borderRadius:16,background:notifPermission==='granted'?'#d1fae5':'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
              {notifPermission==='granted'?'✅':'🔔'}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{notifPermission==='granted'?'Notifications active':'Enable notifications'}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>
                {notifPermission==='granted'
                  ?`${reminders.filter(r=>r.enabled).length} reminder${reminders.filter(r=>r.enabled).length!==1?'s':''} active`
                  :'Allow MacroTrack to send meal reminders'}
              </div>
            </div>
          </div>
          {notifPermission!=='granted'
            ? <button className="btn btn-primary" style={{padding:'13px',fontWeight:700}} onClick={enableNotifications}>Enable notifications</button>
            : <button className="btn btn-ghost" style={{padding:'12px',fontSize:13,fontWeight:600}}
                onClick={()=>new Notification('MacroTrack 🔔',{body:'Notifications are working perfectly!'})}>
                Send test notification
              </button>
          }
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Reminder schedule</div>
          {reminders.map((r,i)=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:i<reminders.length-1?'1px solid var(--border)':'none'}}>
              <div style={{width:40,height:40,borderRadius:12,background:r.enabled?'var(--primary-bg)':'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,transition:'background 0.2s'}}>
                {r.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:r.enabled?'var(--text)':'var(--muted)'}}>{r.label}</div>
                <input type="time" value={r.time} disabled={!r.enabled}
                  onChange={e=>setReminders(p=>p.map(x=>x.id===r.id?{...x,time:e.target.value}:x))}
                  style={{fontSize:12,color:r.enabled?'var(--primary)':'var(--muted)',fontWeight:700,background:'none',border:'none',padding:0,marginTop:2,outline:'none',width:'auto'}}/>
              </div>
              <button onClick={()=>setReminders(p=>p.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}
                style={{width:48,height:28,borderRadius:99,background:r.enabled?'var(--primary)':'var(--border)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0,WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
                <div style={{position:'absolute',top:4,left:r.enabled?26:4,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{padding:'15px',fontWeight:700,fontSize:15}} onClick={saveReminders}>
          💾 Save reminders
        </button>
        <div style={{background:'#fef3c7',borderRadius:14,padding:'12px 14px',border:'1.5px solid #fde68a',marginTop:14,fontSize:12,color:'#92400e',lineHeight:1.7}}>
          ⚠️ Reminders work while the app is open or installed as a PWA on your home screen. For best results, keep the app running in the background.
        </div>
      </div>
      <BottomNav/>
    </div>
  )

  // ── MAIN ───────────────────────────────────────────────────
  return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:100}}>
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 20px) 20px 0'}}>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.02em',marginBottom:20}}>Account</h1>

        {msg && <MsgBanner/>}

        {/* Profile card */}
        <button onClick={()=>setView('edit')}
          style={{width:'100%',background:'var(--card)',borderRadius:20,padding:'16px 18px',border:'1.5px solid var(--border)',marginBottom:24,display:'flex',alignItems:'center',gap:14,cursor:'pointer',textAlign:'left',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:56,height:56,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff'}}>
              {photoUrl ? <img src={photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (form.name?form.name[0].toUpperCase():'?')}
            </div>
            <svg style={{position:'absolute',top:-3,left:-3}} width="62" height="62" viewBox="0 0 62 62">
              <circle cx="31" cy="31" r="28" fill="none" stroke="var(--border)" strokeWidth="2.5"/>
              <circle cx="31" cy="31" r="28" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={String(2*Math.PI*28)}
                strokeDashoffset={String(2*Math.PI*28*(1-profilePct/100))}
                style={{transformOrigin:'31px 31px',transform:'rotate(-90deg)'}}/>
            </svg>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text)'}}>
              {form.name || 'Set your name'}
            </div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userEmail}</div>
            <div style={{fontSize:11,color:'var(--primary)',marginTop:4,fontWeight:600}}>
              {profilePct}% complete · tap to edit
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {/* Tools */}
        <SectionLabel text="Tools"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
          {[
            {icon:'⚖️',label:'BMI Calculator',sub:'Check your index',go:()=>router.push('/bmi')},
            {icon:'🔥',label:'Calorie Calc',sub:'Find daily needs',go:()=>router.push('/calorie-calc')},
            {icon:'📏',label:'Measurements',sub:'Body tracking',go:()=>router.push('/measurements')},
            {icon:'📤',label:'Share progress',sub:'Download card',go:()=>router.push('/share')},
          ].map(t=>(
            <button key={t.label} onClick={t.go}
              style={{background:'var(--card)',borderRadius:18,padding:'16px 14px',border:'1.5px solid var(--border)',cursor:'pointer',textAlign:'left',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
              <div style={{fontSize:26,marginBottom:8}}>{t.icon}</div>
              <div style={{fontWeight:700,fontSize:13,color:'var(--text)'}}>{t.label}</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Settings */}
        <SectionLabel text="Settings"/>
        <MenuItem icon={<TargetIcon size={20} color='var(--primary)'/>} label="Goals & targets" sub="Calories, macros, weight goal" onClick={()=>setView('goals')}/>
        <MenuItem icon={<BellIcon size={20} color='var(--primary)'/>} label="Notifications" sub={notifPermission==='granted'?`${reminders.filter(r=>r.enabled).length} reminders active`:'Set meal reminders'} onClick={()=>setView('notifications')}/>
        <MenuItem icon={<LockIcon size={20} color='var(--primary)'/>} label="Security" sub="Password, email, account" onClick={()=>setView('security')}/>

        {/* Appearance */}
        <SectionLabel text="Appearance"/>
        <div style={{display:'flex',gap:8,marginBottom:24}}>
          {[['light','☀️','Light'],['auto','⚙️','Auto'],['dark','🌙','Dark']].map(([val,icon,label])=>(
            <button key={val} onClick={()=>setTheme(val)}
              style={{flex:1,padding:'13px 8px',borderRadius:16,border:'2px solid '+(theme===val?'var(--primary)':'var(--border)'),background:theme===val?'var(--primary-bg)':'var(--card)',cursor:'pointer',textAlign:'center',transition:'all 0.15s',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
              <div style={{fontSize:22,marginBottom:5}}>{icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:theme===val?'var(--primary)':'var(--muted)'}}>{label}</div>
            </button>
          ))}
        </div>

        {/* Legal */}
        <SectionLabel text="Legal"/>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
          {[['terms','Terms & Conditions'],['privacy','Privacy Policy'],['data','Data & Privacy']].map(([key,label])=>(
            <button key={key} onClick={()=>{setLegalPage(key);setView('legal')}}
              style={{padding:'9px 16px',borderRadius:99,fontSize:13,fontWeight:500,cursor:'pointer',border:'1.5px solid var(--border)',background:'var(--card)',color:'var(--muted)',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
              {label}
            </button>
          ))}
        </div>

        {/* Log out */}
        <button onClick={async()=>{await supabase.auth.signOut();router.replace('/auth')}}
          style={{width:'100%',padding:'15px',borderRadius:16,background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontWeight:700,fontSize:15,cursor:'pointer',WebkitTapHighlightColor:'transparent', transition:'transform 0.15s ease, box-shadow 0.15s ease'}}>
          Log out
        </button>
      </div>
      <BottomNav/>
    </div>
  )
}
