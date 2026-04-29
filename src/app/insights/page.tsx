'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weekData, setWeekData] = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof) setProfile(prof)

    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }

    const { data: logs } = await supabase.from('food_logs').select('*').eq('user_id', user.id).gte('logged_at', days[0]).lte('logged_at', days[6])

    const grouped = days.map(date => {
      const dayLogs = (logs || []).filter(l => l.logged_at === date)
      return {
        date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        cal: dayLogs.reduce((s, l) => s + l.cal, 0),
        protein: dayLogs.reduce((s, l) => s + l.protein, 0),
        carb: dayLogs.reduce((s, l) => s + l.carb, 0),
        fat: dayLogs.reduce((s, l) => s + l.fat, 0),
        logged: dayLogs.length > 0
      }
    })
    setWeekData(grouped)
    if (prof) generateInsights(grouped, prof)
  }

  async function generateInsights(weeklyLogs, prof) {
    setLoading(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyLogs,
          targets: { cal: prof.cal_target, protein: prof.protein_target, carb: prof.carb_target, fat: prof.fat_target },
          profile: prof
        })
      })
      const data = await res.json()
      if (data.result) setInsights(data.result)
    } catch { } finally { setLoading(false) }
  }

  const maxCal = Math.max(...weekData.map(d => d.cal), 1)

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100dvh', maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 12px) 20px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Nutrition Insights</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Your weekly AI-powered analysis</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Weekly bar chart */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>This week's calories</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
            {weekData.map((d, i) => {
              const h = d.cal > 0 ? Math.max(8, (d.cal / maxCal) * 84) : 4
              const target = profile?.cal_target || 1700
              const over = d.cal > target
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: over ? '#ef4444' : 'var(--muted)', fontWeight: 600 }}>
                    {d.cal > 0 ? (d.cal >= 1000 ? (d.cal/1000).toFixed(1)+'k' : Math.round(d.cal)) : ''}
                  </div>
                  <div style={{ width: '100%', height: h, background: !d.logged ? 'var(--border)' : over ? '#ef4444' : 'var(--primary)', borderRadius: 6, transition: 'height 0.6s ease', minHeight: 4 }}/>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>{d.date.split(' ')[0]}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {[{c:'var(--primary)',l:'On track'},{c:'#ef4444',l:'Over goal'},{c:'var(--border)',l:'No log'}].map(x=>(
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }}/>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {loading && (
          <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: '32px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}/>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>AI is analysing your week…</p>
          </div>
        )}

        {insights && !loading && (
          <>
            {/* Score card */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', borderRadius: 20, padding: '20px', marginBottom: 16, color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Weekly nutrition score</div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>{insights.score}<span style={{ fontSize: 16, fontWeight: 400 }}>/100</span></div>
                </div>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {insights.score >= 80 ? '🏆' : insights.score >= 60 ? '💪' : '📈'}
                </div>
              </div>
              <div style={{ fontSize: 14, opacity: 0.9, fontWeight: 500 }}>{insights.headline}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(insights.calories_avg)}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>avg kcal/day</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(insights.protein_avg)}g</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>avg protein/day</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{insights.consistency}%</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>consistency</div>
                </div>
              </div>
            </div>

            {/* Insight cards */}
            {insights.insights?.map((ins, i) => (
              <div key={i} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{ins.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{ins.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{ins.body}</div>
                  </div>
                </div>
              </div>
            ))}

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700, marginTop: 4 }} onClick={() => generateInsights(weekData, profile)}>
              🔄 Refresh analysis
            </button>
          </>
        )}

        {!loading && !insights && weekData.some(d => d.logged) && (
          <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 700 }} onClick={() => generateInsights(weekData, profile)}>
            ✨ Generate AI insights
          </button>
        )}

        {!loading && !insights && !weekData.some(d => d.logged) && (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No data yet</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Start logging food to get AI-powered insights</div>
            <button className="btn btn-primary" onClick={() => router.push('/log')}>Log your first meal</button>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
