'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const MEAL_COLORS = { Breakfast: '#f59e0b', Lunch: '#10b981', Snack: '#6366f1', Dinner: '#3b82f6' }
const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Snack: '🍎', Dinner: '🌙' }

export default function MealPlanPage() {
  const router = useRouter()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [logging, setLogging] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) setProfile(prof)
    }
    load()
  }, [])

  async function generatePlan() {
    if (!profile) return
    setLoading(true)
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: { cal: profile.cal_target, protein: profile.protein_target, carb: profile.carb_target, fat: profile.fat_target },
          profile
        })
      })
      const data = await res.json()
      if (data.result) setPlan(data.result)
    } catch { } finally { setLoading(false) }
  }

  async function logEntireMeal(meal) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLogging(meal.type)
    const today = new Date().toISOString().slice(0, 10)
    await Promise.all(meal.items.map(item =>
      supabase.from('food_logs').insert({
        user_id: user.id, logged_at: today,
        name: item.name, qty: parseFloat(item.qty) || 100, unit: 'g',
        cal: item.cal, protein: item.protein, carb: item.carb || 0, fat: item.fat || 0, fiber: 0,
        meal_type: meal.type.toLowerCase()
      })
    ))
    setLogging(null)
  }

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100dvh', maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Meal Planner</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>AI-generated plan that hits your exact macros</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Targets summary */}
        {profile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { l: 'Calories', v: profile.cal_target, u: 'kcal', c: '#6366f1' },
              { l: 'Protein', v: profile.protein_target, u: 'g', c: '#3b82f6' },
              { l: 'Carbs', v: profile.carb_target, u: 'g', c: '#f59e0b' },
              { l: 'Fat', v: profile.fat_target, u: 'g', c: '#ef4444' },
            ].map(t => (
              <div key={t.l} style={{ flexShrink: 0, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '10px 14px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.c }}>{t.v}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{t.l} ({t.u})</div>
              </div>
            ))}
          </div>
        )}

        {!plan && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Plan your perfect day</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
              AI will create a full day meal plan with breakfast, lunch, snack and dinner — perfectly matching your calorie and macro targets.
            </div>
            <button className="btn btn-primary pulse-primary" style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 700 }} onClick={generatePlan}>
              ✨ Generate my meal plan
            </button>
          </div>
        )}

        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}/>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Creating your plan…</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>AI is balancing your macros</div>
          </div>
        )}

        {plan && !loading && (
          <>
            {/* Day totals */}
            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 20, padding: '18px 20px', marginBottom: 20, color: 'white' }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>Today's plan totals</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{plan.day_total_cal}</div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>kcal</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{plan.day_total_protein}g</div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>protein</div>
                </div>
              </div>
            </div>

            {/* Meal cards */}
            {plan.meals?.map((meal, i) => {
              const color = MEAL_COLORS[meal.type] || '#6366f1'
              const icon = MEAL_ICONS[meal.type] || '🍽️'
              return (
                <div key={i} className="card" style={{ marginBottom: 16, borderTop: '3px solid ' + color }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color }}>{meal.type}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{meal.time}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color }}>{meal.total_cal} kcal</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{meal.total_protein}g protein</div>
                    </div>
                  </div>

                  {meal.items?.map((item, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: j < meal.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.qty} · {item.protein}g P · {item.carb}g C · {item.fat}g F</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{item.cal} kcal</div>
                    </div>
                  ))}

                  {meal.tip && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: color + '12', borderRadius: 10, fontSize: 12, color: color, fontWeight: 500 }}>
                      💡 {meal.tip}
                    </div>
                  )}

                  <button onClick={() => logEntireMeal(meal)} disabled={logging === meal.type}
                    style={{ width: '100%', marginTop: 14, padding: '11px', borderRadius: 12, background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: logging === meal.type ? 0.7 : 1 }}>
                    {logging === meal.type ? 'Logging…' : '+ Log this meal'}
                  </button>
                </div>
              )
            })}

            {plan.hydration_tip && (
              <div style={{ background: '#dbeafe', borderRadius: 16, padding: '14px 16px', border: '1.5px solid #93c5fd', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2563eb', marginBottom: 4 }}>💧 Hydration tip</div>
                <div style={{ fontSize: 13, color: '#1d4ed8' }}>{plan.hydration_tip}</div>
              </div>
            )}

            <button className="btn btn-ghost" style={{ width: '100%', padding: '14px', fontWeight: 700, marginBottom: 16 }} onClick={generatePlan}>
              🔄 Regenerate plan
            </button>
          </>
        )}
      </div>
      <BottomNav/>
    </div>
  )
}
