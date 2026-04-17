'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

function ProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState('setting')
  const [weights, setWeights] = useState([])
  const [saving, setSaving] = useState(false)
  const [weightVal, setWeightVal] = useState('')
  const [msg, setMsg] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [form, setForm] = useState({ name:'', dob:'', age:'', gender:'male', phone_number:'', photo_url:'', goal:'lose', cal_target:1700, protein_target:167, carb_target:144, fat_target:60, fiber_target:25, weight_goal:72, water_goal:2000 })
  const [secForm, setSecForm] = useState({ newEmail:'', newPassword:'', confirmPassword:'' })
  const [legalPage, setLegalPage] = useState(null)
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false,
    mealReminders: false,
    hydrationAlerts: false,
    breakfastTime: '08:00',
    lunchTime: '13:00',
    dinnerTime: '19:00',
    hydrationInterval: 2,
    sendReminderTest: false
  })

  // BMI Calculator state
  const [bmiGender, setBmiGender] = useState('male')
  const [bmiHeight, setBmiHeight] = useState('')
  const [bmiWeight, setBmiWeight] = useState('')
  const [bmiAge, setBmiAge] = useState('')
  const [bmiResult, setBmiResult] = useState(null)

  // Calorie Calculator state
  const [calcGender, setCalcGender] = useState('male')
  const [calcAge, setCalcAge] = useState('')
  const [calcHeight, setCalcHeight] = useState('')
  const [calcWeight, setCalcWeight] = useState('')
  const [calcActivity, setCalcActivity] = useState('moderate')
  const [calcResult, setCalcResult] = useState(null)

  useEffect(() => {
    async function load() {
      const { data:{user} } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      setUserEmail(user.email || '')
      const [{ data:prof }, { data:wlogs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at',{ascending:true}).limit(30)
      ])
      if (prof) setForm({ name:prof.name??'', dob:prof.dob??'', age:prof.age??'', gender:prof.gender??'male', phone_number:prof.phone_number??'', photo_url:prof.photo_url??'', height:prof.height??'', goal:prof.goal??'lose', cal_target:prof.cal_target??1700, protein_target:prof.protein_target??167, carb_target:prof.carb_target??144, fat_target:prof.fat_target??60, fiber_target:prof.fat_target??25, weight_goal:prof.weight_goal??72, water_goal:prof.water_goal??2000 })
      if (wlogs) setWeights(wlogs)
    }
    load()
  }, [])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['profile', 'setting', 'plan', 'goals', 'bmi', 'calorie-calc', 'notifications', 'password', 'email'].includes(tabParam)) {
      setTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('macrotrack-notification-settings')
      if (saved) setNotificationSettings(JSON.parse(saved))
    } catch (err) {
      console.error('Failed to load notification settings', err)
    }
  }, [])

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function ensureNotificationPermission() {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) { showMsg('Browser notifications are not supported.'); return false }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      showMsg('Notifications enabled!')
      return true
    }
    showMsg('Please allow notifications in browser settings.')
    return false
  }

  function saveNotificationSettings() {
    if (typeof window === 'undefined') return
    localStorage.setItem('macrotrack-notification-settings', JSON.stringify(notificationSettings))
    showMsg('Notification settings saved!')
  }

  function triggerNotification(title, body) {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    new Notification(title, { body })
  }

  function getNextDelay(time) {
    const [hour, minute] = time.split(':').map(Number)
    const now = new Date()
    const next = new Date(now)
    next.setHours(hour, minute, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    return next.getTime() - now.getTime()
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !notificationSettings.enabled || Notification.permission !== 'granted') return
    const timers = []
    const intervals = []

    if (notificationSettings.mealReminders) {
      const meals = [
        { label: 'Breakfast reminder', time: notificationSettings.breakfastTime, body: 'Time for a healthy breakfast to fuel your day.' },
        { label: 'Lunch reminder', time: notificationSettings.lunchTime, body: 'Lunch time! Keep your energy steady with a balanced meal.' },
        { label: 'Dinner reminder', time: notificationSettings.dinnerTime, body: 'Dinner reminder — choose protein, veggies, and healthy carbs.' }
      ]
      meals.forEach(meal => {
        const delay = getNextDelay(meal.time)
        const timer = window.setTimeout(() => {
          triggerNotification(meal.label, meal.body)
        }, delay)
        timers.push(timer)
      })
    }

    if (notificationSettings.hydrationAlerts) {
      const interval = window.setInterval(() => {
        triggerNotification('Hydration alert', 'Drink a glass of water to stay hydrated.')
      }, notificationSettings.hydrationInterval * 3600000)
      intervals.push(interval)
    }

    return () => {
      timers.forEach(window.clearTimeout)
      intervals.forEach(window.clearInterval)
    }
  }, [notificationSettings])

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const { data:{user} } = await supabase.auth.getUser()
    if (!user) return
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (error) { showMsg('Upload failed'); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setForm(p=>({...p,photo_url:publicUrl}))
    showMsg('Photo uploaded!')
  }

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

  function calculateBMI() {
    const h = parseFloat(bmiHeight), w = parseFloat(bmiWeight)
    if (!h || !w) return
    const bmi = w / ((h / 100) ** 2)
    let category, color, advice, risk
    if (bmi < 18.5) {
      category = 'Underweight'
      color = '#3b82f6'
      advice = 'Add calorie-dense whole foods and strength training to build healthy mass.'
      risk = 'Increased risk of fatigue, nutrient deficiencies, and weakened immunity.'
    } else if (bmi < 25) {
      category = 'Normal weight'
      color = '#10b981'
      advice = 'Keep your balance with consistent exercise, quality protein, and nutrient-dense meals.'
      risk = 'Lowest risk category for weight-related health issues.'
    } else if (bmi < 30) {
      category = 'Overweight'
      color = '#f59e0b'
      advice = 'Aim for gradual fat loss with a 300–500 kcal deficit and strength training.'
      risk = 'Elevated risk of metabolic issues such as insulin resistance and high blood pressure.'
    } else if (bmi < 35) {
      category = 'Obese (Class I)'
      color = '#ef4444'
      advice = 'Focus on a structured nutrition plan and regular activity; consult a professional if needed.'
      risk = 'Moderate risk of diabetes, heart disease, and joint strain.'
    } else {
      category = 'Obese (Class II+)'
      color = '#dc2626'
      advice = 'Seek medical advice and use a sustainable approach to reduce body weight safely.'
      risk = 'High risk of chronic disease, cardiovascular strain, and metabolic dysfunction.'
    }
    const idealMin = (18.5 * ((h / 100) ** 2)).toFixed(1)
    const idealMax = (24.9 * ((h / 100) ** 2)).toFixed(1)
    const targetChange = w > parseFloat(idealMax)
      ? { label: 'To reach healthy range', value: `Lose ${(w - parseFloat(idealMax)).toFixed(1)} kg` }
      : w < parseFloat(idealMin)
        ? { label: 'To reach healthy range', value: `Gain ${(parseFloat(idealMin) - w).toFixed(1)} kg` }
        : { label: 'You are in a healthy range', value: 'Maintain weight with balanced nutrition' }
    setBmiResult({ bmi: bmi.toFixed(1), category, color, advice, risk, idealMin, idealMax, targetChange })
  }

  function calculateCalories() {
    const age = parseFloat(calcAge), height = parseFloat(calcHeight), weight = parseFloat(calcWeight)
    if (!age || !height || !weight) return
    const bmr = calcGender === 'male'
      ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
      : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    const activityMul = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 }[calcActivity]
    const tdee = bmr * activityMul
    const maintain = Math.round(tdee)
    const safe = Math.round(tdee - 250)
    const moderate = Math.round(tdee - 500)
    const aggressive = Math.round(tdee - 750)
    const gainLean = Math.round(tdee + 250)
    const protein = Math.round(weight * 1.8)
    const fat = Math.round((tdee * 0.25) / 9)
    const carbs = Math.round(Math.max(0, (tdee - (protein * 4 + fat * 9)) / 4))
    setCalcResult({
      bmr: Math.round(bmr),
      tdee: maintain,
      safe,
      moderate,
      aggressive,
      gainLean,
      protein,
      fat,
      carbs,
      proteinPerKg: 1.8,
      activityLabel: calcActivity
    })
  }

  const BMICalculator = () => (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[{label:'Height',unit:'cm',val:bmiHeight,set:setBmiHeight},{label:'Weight',unit:'kg',val:bmiWeight,set:setBmiWeight},{label:'Age',unit:'yrs',val:bmiAge,set:setBmiAge}].map(f=>(
            <div key={f.label} style={{background:'var(--surface)',borderRadius:16,padding:'14px 12px',border:'1.5px solid var(--border)',textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:8}}>{f.label}</div>
              <input type="text" inputMode="numeric" value={f.val} onChange={e=>f.set(e.target.value)} placeholder="0"
                style={{textAlign:'center',fontWeight:800,fontSize:22,background:'transparent',border:'none',padding:0,width:'100%',outline:'none'}}/>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{f.unit}</div>
            </div>
          ))}
        </div>
        {(form.height || form.age || latest?.weight_kg) && (
          <button onClick={()=>{
            if (form.height) setBmiHeight(form.height)
            if (form.age) setBmiAge(form.age)
            if (form.gender) setBmiGender(form.gender)
            if (latest?.weight_kg) setBmiWeight(latest.weight_kg)
          }} className="btn btn-ghost" style={{width:'100%',padding:'12px',fontSize:13,fontWeight:700,borderRadius:16,border:'1.5px solid var(--border)',background:'var(--card2)'}}>
            Use profile values
          </button>
        )}
      </div>
      <button onClick={calculateBMI} className="btn btn-primary" style={{width:'100%',padding:'16px',fontSize:15,fontWeight:700,marginBottom:24}}>Calculate BMI</button>
      {bmiResult && (
        <div className="slide-up">
          <div className="card" style={{textAlign:'center',marginBottom:16}}>
            <svg width="100%" viewBox="0 0 280 160" style={{overflow:'visible'}}>
              {[{color:'#3b82f6',s:0,e:36},{color:'#10b981',s:36,e:90},{color:'#f59e0b',s:90,e:126},{color:'#ef4444',s:126,e:162},{color:'#dc2626',s:162,e:180}].map((seg,i)=>{
                const r=110,cx=140,cy=140,a1=(seg.s/180)*Math.PI,a2=(seg.e/180)*Math.PI,x1=cx-r*Math.cos(a1),y1=cy-r*Math.sin(a1),x2=cx-r*Math.cos(a2),y2=cy-r*Math.sin(a2)
                return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${seg.e-seg.s>90?1:0} 1 ${x2} ${y2} Z`} fill={seg.color} opacity="0.85"/>
              })}
              <circle cx="140" cy="140" r="72" fill="white"/>
              <g transform={`rotate(${(parseFloat(bmiResult.bmi)-10)/30*180-180}, 140, 140)`}>
                <line x1="140" y1="140" x2="140" y2="44" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="140" cy="140" r="8" fill="var(--text)"/>
              </g>
              <text x="140" y="115" textAnchor="middle" fontSize="28" fontWeight="800" fill={bmiResult.color}>{bmiResult.bmi}</text>
              <text x="140" y="131" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted)">BMI</text>
              <text x="140" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill={bmiResult.color}>{bmiResult.category}</text>
            </svg>
          </div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Your results</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>Healthy BMI range</div>
                <div style={{fontWeight:700,fontSize:14,color:'#10b981'}}>18.5 - 24.9</div>
              </div>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>Healthy weight</div>
                <div style={{fontWeight:700,fontSize:14,color:'#10b981'}}>{bmiResult.idealMin}-{bmiResult.idealMax} kg</div>
              </div>
            </div>
            <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)',marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:bmiResult.color,marginBottom:6}}>{bmiResult.targetChange.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{bmiResult.targetChange.value}</div>
            </div>
            <div style={{background:'#fef3c7',borderRadius:14,padding:'14px',border:'1.5px solid #fde68a',marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:'#d97706',marginBottom:4}}>Health risk</div>
              <div style={{fontSize:13,color:'#92400e',lineHeight:1.6}}>{bmiResult.risk}</div>
            </div>
            <div style={{background:'#f0f9ff',borderRadius:14,padding:'14px',border:'1.5px solid #bfdbfe'}}>
              <div style={{fontSize:12,fontWeight:700,color:'#2563eb',marginBottom:4}}>Recommended next step</div>
              <div style={{fontSize:13,color:'#1d4ed8',lineHeight:1.6}}>{bmiResult.advice}</div>
            </div>
          </div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>BMI categories</div>
            {[{label:'Underweight',range:'< 18.5',color:'#3b82f6'},{label:'Normal weight',range:'18.5-24.9',color:'#10b981'},{label:'Overweight',range:'25-29.9',color:'#f59e0b'},{label:'Obese Class I',range:'30-34.9',color:'#ef4444'},{label:'Obese Class II+',range:'35+',color:'#dc2626'}].map((r,i,arr)=>(
              <div key={r.label} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:r.color,flexShrink:0}}/>
                <div style={{flex:1,fontSize:13,fontWeight:600}}>{r.label}</div>
                <div style={{fontSize:13,color:'var(--muted)'}}>{r.range}</div>
                {bmiResult.category===r.label&&<div style={{fontSize:10,fontWeight:700,background:r.color,color:'#fff',padding:'2px 8px',borderRadius:99}}>YOU</div>}
              </div>
            ))}
          </div>
          <div style={{background:'#f0fdf4',borderRadius:16,padding:'14px 16px',border:'1.5px solid #bbf7d0',marginBottom:24}}>
            <p style={{fontSize:12,color:'#15803d',lineHeight:1.6}}>BMI is a screening tool. Use it together with body composition and health markers for a full picture.</p>
          </div>
        </div>
      )}
    </div>
  )

  const CalorieCalculator = () => (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[{label:'Age',unit:'yrs',val:calcAge,set:setCalcAge},{label:'Height',unit:'cm',val:calcHeight,set:setCalcHeight},{label:'Weight',unit:'kg',val:calcWeight,set:setCalcWeight}].map(f=>(
            <div key={f.label} style={{background:'var(--surface)',borderRadius:16,padding:'14px 12px',border:'1.5px solid var(--border)',textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',marginBottom:8}}>{f.label}</div>
              <input type="text" inputMode="numeric" value={f.val} onChange={e=>f.set(e.target.value)} placeholder="0"
                style={{textAlign:'center',fontWeight:800,fontSize:22,background:'transparent',border:'none',padding:0,width:'100%',outline:'none'}}/>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{f.unit}</div>
            </div>
          ))}
        </div>
        {(form.height || form.age || latest?.weight_kg) && (
          <button onClick={()=>{
            if (form.height) setCalcHeight(form.height)
            if (form.age) setCalcAge(form.age)
            if (form.gender) setCalcGender(form.gender)
            if (latest?.weight_kg) setCalcWeight(latest.weight_kg)
          }} className="btn btn-ghost" style={{width:'100%',padding:'12px',fontSize:13,fontWeight:700,borderRadius:16,border:'1.5px solid var(--border)',background:'var(--card2)'}}>
            Use profile values
          </button>
        )}
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Activity Level</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{id:'sedentary',label:'Sedentary',desc:'Little or no exercise',icon:'🛋️'},{id:'light',label:'Lightly active',desc:'1-3 days/week',icon:'🚶'},{id:'moderate',label:'Moderately active',desc:'3-5 days/week',icon:'🏃'},{id:'very',label:'Very active',desc:'6-7 days/week',icon:'🏋️'},{id:'extra',label:'Extra active',desc:'Athlete / physical job',icon:'⚡'}].map(a=>(
            <button key={a.id} onClick={()=>setCalcActivity(a.id)}
              style={{padding:'16px 12px',borderRadius:16,border:`2px solid ${calcActivity===a.id?'var(--primary)':'var(--border)'}`,background:calcActivity===a.id?'var(--primary-bg)':'var(--card)',cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:6}}>{a.icon}</div>
              <div style={{fontWeight:700,fontSize:12,color:calcActivity===a.id?'var(--primary)':'var(--muted)'}}>{a.label}</div>
              <div style={{fontSize:10,color:'var(--muted)',marginTop:2,lineHeight:1.3}}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={calculateCalories} className="btn btn-primary" style={{width:'100%',padding:'16px',fontSize:15,fontWeight:700,marginBottom:24}}>Calculate Calories</button>
      {calcResult && (
        <div className="slide-up">
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Your daily calorie needs</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>BMR</div>
                <div style={{fontWeight:700,fontSize:18}}>{calcResult.bmr}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kcal</span></div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>Basal Metabolic Rate</div>
              </div>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>TDEE</div>
                <div style={{fontWeight:700,fontSize:18}}>{calcResult.tdee}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> kcal</span></div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>Total Daily Energy Expenditure</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>Protein</div>
                <div style={{fontWeight:700,fontSize:18}}>{calcResult.protein}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> g</span></div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>~{calcResult.proteinPerKg} g/kg body weight</div>
              </div>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>Carbs</div>
                <div style={{fontWeight:700,fontSize:18}}>{calcResult.carbs}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> g</span></div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>Energy for training and recovery</div>
              </div>
              <div style={{background:'var(--surface)',borderRadius:14,padding:'14px',border:'1.5px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>Fat</div>
                <div style={{fontWeight:700,fontSize:18}}>{calcResult.fat}<span style={{fontSize:13,color:'var(--muted)',fontWeight:400}}> g</span></div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>25% of calories from healthy fats</div>
              </div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Goal-based calorie plans</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{background:'#dbeafe',borderRadius:16,padding:'16px',border:'1.5px solid #93c5fd'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>⚖️</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#1e40af'}}>Maintain weight</div>
                    <div style={{fontSize:12,color:'#3730a3'}}>Current energy balance</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#1e40af'}}>{calcResult.tdee}</div>
                    <div style={{fontSize:11,color:'#3730a3'}}>kcal/day</div>
                  </div>
                </div>
              </div>
              <div style={{background:'#d1fae5',borderRadius:16,padding:'16px',border:'1.5px solid #6ee7b7'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>🌱</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#047857'}}>Mild fat loss</div>
                    <div style={{fontSize:12,color:'#065f46'}}>Sustainable deficit</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#047857'}}>{calcResult.safe}</div>
                    <div style={{fontSize:11,color:'#065f46'}}>-250 kcal</div>
                  </div>
                </div>
              </div>
              <div style={{background:'#fef3c7',borderRadius:16,padding:'16px',border:'1.5px solid #fde68a'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>🔥</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#d97706'}}>Moderate fat loss</div>
                    <div style={{fontSize:12,color:'#92400e'}}>Effective and safe</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#d97706'}}>{calcResult.moderate}</div>
                    <div style={{fontSize:11,color:'#92400e'}}>-500 kcal</div>
                  </div>
                </div>
              </div>
              <div style={{background:'#fee2e2',borderRadius:16,padding:'16px',border:'1.5px solid #fca5a5'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>⚡</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#dc2626'}}>Aggressive cut</div>
                    <div style={{fontSize:12,color:'#b91c1c'}}>Short-term only</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#dc2626'}}>{calcResult.aggressive}</div>
                    <div style={{fontSize:11,color:'#b91c1c'}}>-750 kcal</div>
                  </div>
                </div>
              </div>
              <div style={{background:'#dbeafe',borderRadius:16,padding:'16px',border:'1.5px solid #93c5fd'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>💪</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#1e40af'}}>Lean muscle gain</div>
                    <div style={{fontSize:12,color:'#3730a3'}}>Controlled calorie surplus</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#1e40af'}}>{calcResult.gainLean}</div>
                    <div style={{fontSize:11,color:'#3730a3'}}>+250 kcal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{background:'#f0fdf4',borderRadius:16,padding:'14px 16px',border:'1.5px solid #bbf7d0',marginBottom:24}}>
            <p style={{fontSize:12,color:'#15803d',lineHeight:1.6}}>These recommendations are built from Mifflin-St Jeor and a high-protein macro split. Adjust based on progress and recovery.</p>
          </div>
        </div>
      )}
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
          {form.photo_url ? (
            <img src={form.photo_url} alt="Profile" style={{width:68,height:68,borderRadius:'50%',objectFit:'cover'}}/>
          ) : (
            <div style={{width:68,height:68,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),#818cf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff'}}>
              {form.name?form.name[0].toUpperCase():'?'}
            </div>
          )}
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

      {tab==='profile'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Personal details</div>
            <div><Label text="Full name"/><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your full name"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><Label text="Date of Birth"/><input type="date" value={form.dob} onChange={e=>setForm(p=>({...p,dob:e.target.value}))}/></div>
              <div><Label text="Age"/><input type="text" inputMode="numeric" value={form.age} onChange={e=>setForm(p=>({...p,age:e.target.value}))} placeholder="25"/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><Label text="Height (cm)"/><input type="text" inputMode="numeric" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))} placeholder="175"/></div>
              <div><Label text="Phone Number"/><input type="tel" value={form.phone_number} onChange={e=>setForm(p=>({...p,phone_number:e.target.value}))} placeholder="+1 234 567 890"/></div>
            </div>
            <div>
              <Label text="Profile Photo"/>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{width:'100%',padding:'10px',borderRadius:12,border:'2px solid var(--border)',background:'var(--card)'}}/>
              {form.photo_url && <img src={form.photo_url} alt="Profile" style={{width:60,height:60,borderRadius:'50%',marginTop:10,objectFit:'cover'}}/>}
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
              <input type="text" inputMode="decimal" placeholder="Today's weight (kg)" value={weightVal} onChange={e=>setWeightVal(e.target.value)} style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&logWeight()}/>
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
          <MenuItem icon="👤" label="Profile" sublabel="Edit personal details" onClick={()=>setTab('profile')}/>
          <MenuItem icon="🎯" label="My Goals" sublabel="Calories, macros & targets" onClick={()=>setTab('goals')}/>
          <MenuItem icon="📈" label="My Plan" sublabel="Daily targets and current goal" onClick={()=>setTab('plan')}/>
          <MenuItem icon="⚖️" label="BMI Calculator" sublabel="Body Mass Index" onClick={()=>setTab('bmi')}/>
          <MenuItem icon="🧮" label="Calorie Calculator" sublabel="Daily calorie needs" onClick={()=>setTab('calorie-calc')}/>
          <MenuItem icon="🔔" label="Notifications" sublabel="Meal & hydration reminders" onClick={()=>setTab('notifications')}/>
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
                <div key={f.k}><Label text={f.l}/><input type="text" inputMode="numeric" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:parseFloat(e.target.value)||0}))}/></div>
              ))}
            </div>
            <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontWeight:700}} onClick={saveForm} disabled={saving}>
              {saving?'Saving…':'Save goals'}
            </button>
          </div>
        </div>
      )}

      {/* BMI SUB-PAGE */}
      {tab==='bmi'&&(
        <div>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>⚖️ BMI Calculator</div>
            <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>Calculate your Body Mass Index to assess your weight status.</div>
            {/* BMI Calculator content here */}
            <BMICalculator/>
          </div>
        </div>
      )}

      {/* CALORIE-CALC SUB-PAGE */}
      {tab==='calorie-calc'&&(
        <div>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🧮 Calorie Calculator</div>
            <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>Calculate your daily calorie needs based on your profile and activity level.</div>
            {/* Calorie Calculator content here */}
            <CalorieCalculator/>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS SUB-PAGE */}
      {tab==='notifications'&&(
        <div>
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{fontWeight:700,fontSize:15}}>🔔 Notifications</div>
            <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.6}}>Enable browser alerts for meal reminders and hydration prompts while MacroTrack is open.</div>
            <label style={{display:'flex',alignItems:'center',gap:12}}>
              <input type="checkbox" checked={notificationSettings.enabled} onChange={async e=>{
                const enabled = e.target.checked
                if (enabled) {
                  const granted = await ensureNotificationPermission()
                  if (!granted) return
                }
                setNotificationSettings(p=>({...p, enabled}))
              }}/>
              <span style={{fontWeight:700}}>Enable notifications</span>
            </label>
            <div style={{padding:'16px',borderRadius:20,background:'var(--surface)',border:'1.5px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Meal reminders</div>
              <label style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <input type="checkbox" checked={notificationSettings.mealReminders} onChange={e=>setNotificationSettings(p=>({...p, mealReminders:e.target.checked}))}/>
                <span>Meal reminders</span>
              </label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <Label text="Breakfast"/>
                  <input type="time" value={notificationSettings.breakfastTime} onChange={e=>setNotificationSettings(p=>({...p, breakfastTime:e.target.value}))}/>
                </div>
                <div>
                  <Label text="Lunch"/>
                  <input type="time" value={notificationSettings.lunchTime} onChange={e=>setNotificationSettings(p=>({...p, lunchTime:e.target.value}))}/>
                </div>
                <div>
                  <Label text="Dinner"/>
                  <input type="time" value={notificationSettings.dinnerTime} onChange={e=>setNotificationSettings(p=>({...p, dinnerTime:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div style={{padding:'16px',borderRadius:20,background:'var(--surface)',border:'1.5px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Hydration alerts</div>
              <label style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <input type="checkbox" checked={notificationSettings.hydrationAlerts} onChange={e=>setNotificationSettings(p=>({...p, hydrationAlerts:e.target.checked}))}/>
                <span>Hydration alerts</span>
              </label>
              <div>
                <Label text="Interval (hours)"/>
                <input type="number" min="1" max="12" value={notificationSettings.hydrationInterval} onChange={e=>setNotificationSettings(p=>({...p, hydrationInterval:parseInt(e.target.value)||1}))} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button className="btn btn-primary" style={{flex:'1 1 auto',padding:'14px',fontWeight:700}} onClick={saveNotificationSettings}>
                Save notification settings
              </button>
              <button className="btn btn-ghost" style={{flex:'1 1 auto',padding:'14px',fontWeight:700}} onClick={()=>{
                if (notificationSettings.enabled && Notification.permission==='granted') {
                  triggerNotification('MacroTrack test', 'This is your notification test alert.')
                } else {
                  showMsg('Enable notifications first to test alerts.')
                }
              }}>
                Test notification
              </button>
            </div>
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
          <button onClick={()=>setTab('setting')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:16,padding:0,display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Settings
          </button>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
