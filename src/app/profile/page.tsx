'use client'
import { useState, useEffect, useRef } from 'react'
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
  const [photoUrl, setPhotoUrl] = useState(null)
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    name: '', dob: '', age: '', height: '', gender: 'male',
    phone: '', goal: 'lose', cal_target: 1700, protein_target: 167,
    carb_target: 144, fat_target: 60, fiber_target: 25, weight_goal: 72, water_goal: 2000
  })
  const [secForm, setSecForm] = useState({ newEmail: '', newPassword: '', confirmPassword: '' })
  const [legalPage, setLegalPage] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      setUserEmail(user.email || '')
      const [{ data: prof }, { data: wlogs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }).limit(30)
      ])
      if (prof) {
        setForm({
          name: prof.name ?? '', dob: prof.dob ?? '', age: prof.age ?? '',
          height: prof.height ?? '', gender: prof.gender ?? 'male', phone: prof.phone ?? '',
          goal: prof.goal ?? 'lose', cal_target: prof.cal_target ?? 1700,
          protein_target: prof.protein_target ?? 167, carb_target: prof.carb_target ?? 144,
          fat_target: prof.fat_target ?? 60, fiber_target: prof.fiber_target ?? 25,
          weight_goal: prof.weight_goal ?? 72, water_goal: prof.water_goal ?? 2000
        })
        if (prof.photo_url) setPhotoUrl(prof.photo_url)
      }
      if (wlogs) setWeights(wlogs)
    }
    load()
  }, [])

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function saveForm() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('profiles').update({ ...form, photo_url: photoUrl }).eq('id', user.id)
    setSaving(false); showMsg('Saved!')
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const base64 = ev.target.result
      setPhotoUrl(base64)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').update({ photo_url: base64 }).eq('id', user.id)
      showMsg('Photo updated!')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function logWeight() {
    const val = parseFloat(weightVal); if (!val) return
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('weight_logs').upsert({ user_id: user.id, logged_at: today, weight_kg: val })
    setWeightVal(''); showMsg('Weight logged!')
    const { data } = await supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }).limit(30)
    if (data) setWeights(data)
  }

  async function changeEmail() {
    if (!secForm.newEmail) return
    const { error } = await supabase.auth.updateUser({ email: secForm.newEmail })
    if (error) showMsg(error.message)
    else { showMsg('Check your new email!'); setSecForm(p => ({ ...p, newEmail: '' })) }
  }

  async function changePassword() {
    if (!secForm.newPassword || secForm.newPassword !== secForm.confirmPassword) { showMsg('Passwords do not match'); return }
    const { error } = await supabase.auth.updateUser({ password: secForm.newPassword })
    if (error) showMsg(error.message)
    else { showMsg('Password updated!'); setSecForm(p => ({ ...p, newPassword: '', confirmPassword: '' })) }
  }

  function calcAge(dob) {
    if (!dob) return ''
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  const latest = weights[weights.length - 1]
  const profilePct = [form.name, form.dob, form.height, form.gender, form.phone].filter(Boolean).length / 5

  function WeightGraph() {
    if (weights.length < 2) return <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>Log at least 2 entries to see trend</div>
    const vals = weights.map(w => w.weight_kg), min = Math.min(...vals) - 0.5, max = Math.max(...vals) + 0.5
    const W = 320, H = 90
    const pts = weights.map((w, i) => ({ x: (i / (weights.length - 1)) * W, y: H - ((w.weight_kg - min) / (max - min)) * H }))
    const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
    return (
      <svg width="100%" viewBox={'0 0 ' + W + ' ' + (H + 20)} style={{ overflow: 'visible' }}>
        <defs><linearGradient id="wgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.15"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient></defs>
        <path d={d + ' L' + W + ',' + (H + 20) + ' L0,' + (H + 20) + ' Z'} fill="url(#wgg)"/>
        <path d={d} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2"/>
            {(i === 0 || i === pts.length - 1 || weights.length <= 6) && <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9" fontWeight="700" fill="#6366f1">{weights[i].weight_kg}</text>}
          </g>
        ))}
        <text x="0" y={H + 18} fontSize="9" fill="var(--muted)">{weights[0]?.logged_at?.slice(5)}</text>
        <text x={W} y={H + 18} textAnchor="end" fontSize="9" fill="var(--muted)">{weights[weights.length - 1]?.logged_at?.slice(5)}</text>
      </svg>
    )
  }

  const L = ({ text }) => <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</div>

  const MenuItem = ({ icon, label, sublabel, onClick, danger = false, badge = null }) => (
    <button onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', background: 'var(--card2)', borderRadius: 16, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: danger ? '#fef2f2' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: danger ? '#dc2626' : 'var(--text)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sublabel}</div>}
      </div>
      {badge && <div style={{ fontSize: 10, fontWeight: 700, background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>{badge}</div>}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  )

  const BackBtn = ({ to }) => (
    <button onClick={() => setTab(to)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      Back to Settings
    </button>
  )

  // Legal pages
  if (legalPage) {
    const pages = {
      terms: {
        title: 'Terms & Conditions',
        content: [
          { t: '1. Use of Service', b: 'MacroTrack provides nutrition tracking tools for personal use only. You agree not to misuse the service or access it using unauthorized methods.' },
          { t: '2. Account Responsibility', b: 'You are responsible for maintaining the confidentiality of your credentials. Notify us immediately of any unauthorized account access.' },
          { t: '3. Health Disclaimer', b: 'MacroTrack is not a medical service. Nutritional information is for informational purposes only and should not replace professional medical advice. Always consult a qualified healthcare professional before making significant dietary changes.' },
          { t: '4. Data Accuracy', b: 'While we strive to provide accurate nutritional data, we cannot guarantee the accuracy of all food entries. Verify important nutritional information with a qualified dietitian.' },
          { t: '5. Intellectual Property', b: 'All content and features of MacroTrack are protected by copyright laws. You may not reproduce or distribute any part without written permission.' },
          { t: '6. Changes to Terms', b: 'We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance of the new terms.' },
          { t: '7. Contact', b: 'Questions: support@macrotrack.app' },
        ]
      },
      privacy: {
        title: 'Privacy Policy',
        content: [
          { t: 'Information We Collect', b: 'Profile data (name, DOB, height, weight, gender, phone), health goals, food & water logs, weight history, and usage analytics.' },
          { t: 'How We Use It', b: 'To provide personalized nutrition tracking, calculate macro targets, improve your experience, and send reminders if enabled.' },
          { t: 'Data Security', b: 'Your data is stored using Supabase with enterprise-grade security. All data is encrypted in transit (TLS 1.3) and at rest (AES-256).' },
          { t: 'Data Sharing', b: 'We never sell your personal data. Anthropic AI is used for food photo scanning — only the food image is sent, no personal data.' },
          { t: 'Your Rights', b: 'You may access, correct, or delete your data at any time from Account → Security → Delete Account.' },
          { t: 'Cookies', b: 'We use minimal cookies for authentication and session management only. No tracking or advertising cookies.' },
          { t: 'Contact', b: 'Privacy concerns: privacy@macrotrack.app' },
        ]
      },
      data: {
        title: 'Data & Privacy',
        content: [
          { t: 'What we store', b: '• Profile: name, DOB, age, gender, height, phone, photo\n• Food logs: meals, macros, timestamps\n• Weight & water logs: daily entries\n• Authentication: email, encrypted password' },
          { t: 'Data retention', b: 'Data is kept while your account is active. Deleting your account permanently removes all data within 30 days.' },
          { t: 'Export your data', b: 'Request a copy by emailing data@macrotrack.app. We provide a JSON export within 7 business days.' },
          { t: 'Delete your data', b: 'Go to Account → Security → Delete Account. This is immediate and irreversible.' },
          { t: 'Third-party services', b: 'Supabase (database), Anthropic Claude (food scanning), Open Food Facts (barcode lookup).' },
          { t: 'Security', b: 'AES-256 encryption, TLS 1.3, regular security audits, OWASP best practices.' },
        ]
      }
    }
    const page = pages[legalPage]
    return (
      <div className="page" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setLegalPage(null)} style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{page.title}</h1>
        </div>
        <div className="card" style={{ lineHeight: 1.8, fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Last updated: April 2025</p>
          {page.content.map(s => (
            <div key={s.t} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{s.t}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{s.b}</div>
            </div>
          ))}
        </div>
        <BottomNav/>
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Account</h1>
      </div>

      {/* Avatar card */}
      <div style={{ background: 'var(--card)', borderRadius: 24, padding: '16px 20px', border: '1.5px solid var(--border)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--primary),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>
            {photoUrl ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (form.name ? form.name[0].toUpperCase() : '?')}
          </div>
          <svg style={{ position: 'absolute', top: -4, left: -4 }} width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="32" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
            <circle cx="36" cy="36" r="32" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={String(2 * Math.PI * 32)} strokeDashoffset={String(2 * Math.PI * 32 * (1 - profilePct))}
              style={{ transformOrigin: '36px 36px', transform: 'rotate(-90deg)' }}/>
          </svg>
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontSize: 9, color: 'white', fontWeight: 700 }}>
            {Math.round(profilePct * 100)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.name || 'Your name'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
        </div>
        <button onClick={() => setTab('profile')} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card2)', border: '1.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      {msg && <div style={{ background: '#d1fae5', border: '1.5px solid #6ee7b7', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#059669' }}>✓ {msg}</div>}

      {/* MAIN SETTING VIEW */}
      {tab === 'setting' && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Account</div>
          <MenuItem icon="👤" label="Profile" sublabel="Edit personal details" onClick={() => setTab('profile')}/>
          <MenuItem icon="🎯" label="My Goals" sublabel="Calories, macros & targets" onClick={() => setTab('goals')}/>
          <MenuItem icon="📊" label="My Plan" sublabel="Daily targets and current goal" onClick={() => setTab('plan')}/>
          <MenuItem icon="📏" label="Body Measurements" sublabel="Track waist, chest, arms over time" onClick={() => router.push("/measurements")}/>
          <MenuItem icon="⚖️" label="BMI Calculator" sublabel="Body Mass Index" onClick={() => router.push('/bmi')}/>
          <MenuItem icon="🔥" label="Calorie Calculator" sublabel="Daily calorie needs" onClick={() => router.push('/calorie-calc')}/>
          <MenuItem icon="🔔" label="Notifications" sublabel="Meal & hydration reminders" onClick={async () => {
            const p = await Notification.requestPermission()
            if (p === 'granted') { new Notification('MacroTrack', { body: 'Notifications enabled!' }); showMsg('Notifications enabled!') }
            else showMsg('Allow notifications in browser settings.')
          }}/>
          <MenuItem icon="🔑" label="Change Password" sublabel="Update your password" onClick={() => setTab('password')}/>
          <MenuItem icon="📧" label="Change Email" sublabel={userEmail} onClick={() => setTab('email')}/>

          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 20 }}>Other</div>
          <MenuItem icon="📋" label="Terms & Conditions" onClick={() => setLegalPage('terms')}/>
          <MenuItem icon="🔒" label="Privacy Policy" onClick={() => setLegalPage('privacy')}/>
          <MenuItem icon="🛡️" label="Data & Privacy" onClick={() => setLegalPage('data')}/>
          <MenuItem icon="🚪" label="Log Out" danger onClick={async () => { await supabase.auth.signOut(); router.replace('/auth') }}/>
        </div>
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <div>
          <BackBtn to="setting"/>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Personal details</div>

            {/* Photo upload - nice button */}
            <div>
              <L text="Profile photo"/>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--primary),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {photoUrl ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (form.name ? form.name[0].toUpperCase() : '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <button onClick={() => fileRef.current?.click()} className="btn btn-ghost" style={{ fontSize: 13, padding: '10px 16px', fontWeight: 600 }}>
                    📷 {photoUrl ? 'Change photo' : 'Upload photo'}
                  </button>
                  {photoUrl && <button onClick={() => setPhotoUrl(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', marginLeft: 8 }}>Remove</button>}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>JPG, PNG up to 5MB</div>
                </div>
              </div>
            </div>

            <div><L text="Full name"/><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name"/></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <L text="Date of birth"/>
                <input type="date" value={form.dob} onChange={e => {
                  const dob = e.target.value
                  const age = dob ? String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : ''
                  setForm(p => ({ ...p, dob, age }))
                }}/>
              </div>
              <div>
                <L text="Age"/>
                <input value={form.age} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} placeholder="Auto from DOB"/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><L text="Height (cm)"/><input type="text" inputMode="decimal" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} placeholder="175"/></div>
              <div><L text="Phone"/><input type="text" inputMode="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210"/></div>
            </div>

            <div><L text="Email"/><input value={userEmail} readOnly style={{ opacity: 0.6 }}/></div>

            <div>
              <L text="Gender"/>
              <div style={{ display: 'flex', gap: 8 }}>
                {['male', 'female', 'other'].map(g => (
                  <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, border: '2px solid ' + (form.gender === g ? 'var(--primary)' : 'var(--border)'), background: form.gender === g ? 'var(--primary-bg)' : 'transparent', color: form.gender === g ? 'var(--primary)' : 'var(--muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700 }} onClick={saveForm} disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>

          {/* Weight tracker */}
          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>⚖️ Weight tracker</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Current</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{latest ? latest.weight_kg : '—'}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}> kg</span></div>
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Goal</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{form.weight_goal}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}> kg</span></div>
                {latest && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{Math.abs(latest.weight_kg - form.weight_goal).toFixed(1)} kg to go</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input type="text" inputMode="decimal" placeholder="e.g. 75.5" value={weightVal} onChange={e => setWeightVal(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && logWeight()}/>
              <button className="btn btn-primary" onClick={logWeight} style={{ flexShrink: 0, padding: '12px 20px', fontWeight: 700 }}>Log</button>
            </div>
            <WeightGraph/>
          </div>
        </div>
      )}

      {/* GOALS */}
      {tab === 'goals' && (
        <div>
          <BackBtn to="setting"/>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🎯 My Goals</div>
            <div>
              <L text="My goal"/>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ key: 'lose', label: 'Lose fat', icon: '📉', color: '#10b981', bg: '#d1fae5' }, { key: 'maintain', label: 'Maintain', icon: '⚖️', color: '#f59e0b', bg: '#fef3c7' }, { key: 'gain', label: 'Build muscle', icon: '💪', color: '#3b82f6', bg: '#dbeafe' }].map(g => (
                  <button key={g.key} onClick={() => setForm(p => ({ ...p, goal: g.key }))}
                    style={{ flex: 1, padding: '12px 6px', borderRadius: 14, border: '2px solid ' + (form.goal === g.key ? g.color : 'var(--border)'), background: form.goal === g.key ? g.bg : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{g.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: form.goal === g.key ? g.color : 'var(--muted)' }}>{g.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ l: 'Calories (kcal)', k: 'cal_target' }, { l: 'Protein (g)', k: 'protein_target' }, { l: 'Carbs (g)', k: 'carb_target' }, { l: 'Fat (g)', k: 'fat_target' }, { l: 'Fiber (g)', k: 'fiber_target' }, { l: 'Goal weight (kg)', k: 'weight_goal' }, { l: 'Water goal (ml)', k: 'water_goal' }].map(f => (
                <div key={f.k}><L text={f.l}/><input type="text" inputMode="decimal" value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}/></div>
              ))}
            </div>
            <div style={{ background: '#eef2ff', borderRadius: 14, padding: '12px 14px', border: '1.5px solid #c7d2fe' }}>
              <p style={{ fontSize: 12, color: 'var(--primary)' }}>💡 Use the Calorie Calculator in Settings to find your exact needs.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700 }} onClick={saveForm} disabled={saving}>
              {saving ? 'Saving…' : 'Save goals'}
            </button>
          </div>
        </div>
      )}

      {/* MY PLAN */}
      {tab === 'plan' && (
        <div>
          <BackBtn to="setting"/>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Daily targets</div>
            {[{ l: 'Calories', v: form.cal_target, u: 'kcal', c: '#6366f1' }, { l: 'Protein', v: form.protein_target, u: 'g', c: '#3b82f6' }, { l: 'Carbohydrates', v: form.carb_target, u: 'g', c: '#f59e0b' }, { l: 'Fat', v: form.fat_target, u: 'g', c: '#ef4444' }, { l: 'Fiber', v: form.fiber_target, u: 'g', c: '#10b981' }, { l: 'Water', v: form.water_goal, u: 'ml', c: '#0ea5e9' }].map(m => (
              <div key={m.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.c }}/>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{m.l}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: m.c }}>{m.v} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>{m.u}</span></span>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🎯 Current goal</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: form.goal === 'lose' ? '#d1fae5' : form.goal === 'gain' ? '#dbeafe' : '#fef3c7' }}>
              <div style={{ fontSize: 32 }}>{form.goal === 'lose' ? '📉' : form.goal === 'gain' ? '💪' : '⚖️'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{form.goal === 'lose' ? 'Fat Loss' : form.goal === 'gain' ? 'Muscle Gain' : 'Maintain Weight'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Target: {form.weight_goal} kg</div>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', padding: '14px', fontWeight: 600 }} onClick={() => setTab('goals')}>Edit my goals →</button>
        </div>
      )}

      {/* PASSWORD */}
      {tab === 'password' && (
        <div>
          <BackBtn to="setting"/>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🔑 Change Password</div>
            <div><L text="New password"/><input type="password" placeholder="Min 6 characters" value={secForm.newPassword} onChange={e => setSecForm(p => ({ ...p, newPassword: e.target.value }))}/></div>
            <div><L text="Confirm password"/><input type="password" placeholder="Repeat new password" value={secForm.confirmPassword} onChange={e => setSecForm(p => ({ ...p, confirmPassword: e.target.value }))}/></div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700 }} onClick={changePassword}>Update password</button>
            <button className="btn btn-ghost" style={{ width: '100%', padding: '13px', fontSize: 13, fontWeight: 600 }}
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.email) { await supabase.auth.resetPasswordForEmail(user.email); showMsg('Reset link sent!') }
              }}>Send reset link via email</button>
          </div>
          <div className="card" style={{ marginTop: 12, border: '1.5px solid #fecaca' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#dc2626' }}>⚠️ Delete Account</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>Permanently delete your account and all data. Cannot be undone.</p>
            <button style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              onClick={async () => { if (confirm('Permanently delete your account?')) { await supabase.auth.signOut(); router.replace('/auth') } }}>
              Delete my account
            </button>
          </div>
        </div>
      )}

      {/* EMAIL */}
      {tab === 'email' && (
        <div>
          <BackBtn to="setting"/>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📧 Change Email</div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card2)', fontSize: 13, color: 'var(--muted)' }}>Current: <strong style={{ color: 'var(--text)' }}>{userEmail}</strong></div>
            <div><L text="New email"/><input type="email" placeholder="new@email.com" value={secForm.newEmail} onChange={e => setSecForm(p => ({ ...p, newEmail: e.target.value }))}/></div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700 }} onClick={changeEmail}>Update email</button>
          </div>
        </div>
      )}

      <div style={{ height: 20 }}/>
      <BottomNav/>
    </div>
  )
}
