'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function BMIPage() {
  const router = useRouter()
  const [gender, setGender] = useState('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [result, setResult] = useState(null)

  const calculate = useCallback(() => {
    const h = parseFloat(height), w = parseFloat(weight)
    if (!h || !w) return
    const bmi = w / ((h / 100) ** 2)
    let category, color, advice
    if (bmi < 18.5) { category = 'Underweight'; color = '#3b82f6'; advice = 'Focus on nutrient-dense foods and strength training to gain healthy weight.' }
    else if (bmi < 25) { category = 'Normal weight'; color = '#10b981'; advice = 'Maintain your current lifestyle with balanced nutrition and regular exercise.' }
    else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; advice = 'A calorie deficit of 300-500 kcal/day with regular exercise can help.' }
    else if (bmi < 35) { category = 'Obese (Class I)'; color = '#ef4444'; advice = 'Consult a healthcare provider. A structured diet and exercise plan can help.' }
    else { category = 'Obese (Class II+)'; color = '#dc2626'; advice = 'Please consult a doctor. Medical supervision is recommended.' }
    const idealMin = (18.5 * ((h / 100) ** 2)).toFixed(1)
    const idealMax = (24.9 * ((h / 100) ** 2)).toFixed(1)
    const toLose = w > parseFloat(idealMax) ? (w - parseFloat(idealMax)).toFixed(1) : null
    const toGain = w < parseFloat(idealMin) ? (parseFloat(idealMin) - w).toFixed(1) : null
    setResult({ bmi: bmi.toFixed(1), category, color, advice, idealMin, idealMax, toLose, toGain })
  }, [height, weight])

  const needleAngle = result ? Math.min(180, Math.max(0, ((parseFloat(result.bmi) - 10) / 30) * 180)) : 0

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100dvh', maxWidth: 430, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 24px' }}>
        <button onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>BMI Calculator</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Body Mass Index</p>
        </div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Gender</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ id: 'male', icon: '♂', label: 'Male' }, { id: 'female', icon: '♀', label: 'Female' }].map(g => (
              <button key={g.id} onClick={() => setGender(g.id)}
                style={{ flex: 1, padding: '20px', borderRadius: 20, border: '2px solid ' + (gender === g.id ? 'var(--primary)' : 'var(--border)'), background: gender === g.id ? 'var(--primary-bg)' : 'var(--card)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 6, color: gender === g.id ? 'var(--primary)' : 'var(--muted)' }}>{g.icon}</div>
                <div style={{ fontWeight: 700, color: gender === g.id ? 'var(--primary)' : 'var(--muted)' }}>{g.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 12px', border: '1.5px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Height</div>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="0" inputMode="decimal"
              style={{ textAlign: 'center', fontWeight: 800, fontSize: 22, background: 'transparent', border: 'none', padding: 0, width: '100%', outline: 'none', color: 'var(--text)' }}/>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>cm</div>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 12px', border: '1.5px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Weight</div>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0" inputMode="decimal"
              style={{ textAlign: 'center', fontWeight: 800, fontSize: 22, background: 'transparent', border: 'none', padding: 0, width: '100%', outline: 'none', color: 'var(--text)' }}/>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>kg</div>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 12px', border: '1.5px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Age</div>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="0" inputMode="numeric"
              style={{ textAlign: 'center', fontWeight: 800, fontSize: 22, background: 'transparent', border: 'none', padding: 0, width: '100%', outline: 'none', color: 'var(--text)' }}/>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>yrs</div>
          </div>
        </div>

        <button onClick={calculate} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 700, marginBottom: 24 }}>Calculate BMI</button>

        {result && (
          <div className="slide-up">
            <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
              <svg width="100%" viewBox="0 0 280 160" style={{ overflow: 'visible' }}>
                {[{ color: '#3b82f6', s: 0, e: 36 }, { color: '#10b981', s: 36, e: 90 }, { color: '#f59e0b', s: 90, e: 126 }, { color: '#ef4444', s: 126, e: 162 }, { color: '#dc2626', s: 162, e: 180 }].map((seg, i) => {
                  const r = 110, cx = 140, cy = 140
                  const a1 = (seg.s / 180) * Math.PI, a2 = (seg.e / 180) * Math.PI
                  const x1 = cx - r * Math.cos(a1), y1 = cy - r * Math.sin(a1)
                  const x2 = cx - r * Math.cos(a2), y2 = cy - r * Math.sin(a2)
                  return <path key={i} d={'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + (seg.e - seg.s > 90 ? 1 : 0) + ' 1 ' + x2 + ' ' + y2 + ' Z'} fill={seg.color} opacity="0.85"/>
                })}
                <circle cx="140" cy="140" r="72" fill="white"/>
                <g transform={'rotate(' + (needleAngle - 180) + ', 140, 140)'}>
                  <line x1="140" y1="140" x2="140" y2="44" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="140" cy="140" r="8" fill="var(--text)"/>
                </g>
                <text x="140" y="115" textAnchor="middle" fontSize="28" fontWeight="800" fill={result.color}>{result.bmi}</text>
                <text x="140" y="131" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted)">BMI</text>
                <text x="140" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill={result.color}>{result.category}</text>
              </svg>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Your results</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Ideal weight</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>{result.idealMin}-{result.idealMax} kg</div>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{result.toLose ? 'To lose' : result.toGain ? 'To gain' : 'Status'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: result.toLose ? '#ef4444' : result.toGain ? '#3b82f6' : '#10b981' }}>
                    {result.toLose ? result.toLose + ' kg' : result.toGain ? result.toGain + ' kg' : 'Healthy'}
                  </div>
                </div>
              </div>
              <div style={{ background: '#fef3c7', borderRadius: 14, padding: '14px', border: '1.5px solid #fde68a' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>Advice</div>
                <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{result.advice}</div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>BMI chart</div>
              {[{ label: 'Underweight', range: '< 18.5', color: '#3b82f6' }, { label: 'Normal weight', range: '18.5-24.9', color: '#10b981' }, { label: 'Overweight', range: '25-29.9', color: '#f59e0b' }, { label: 'Obese Class I', range: '30-34.9', color: '#ef4444' }, { label: 'Obese Class II+', range: '35+', color: '#dc2626' }].map((r, i, arr) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.range}</div>
                  {result.category === r.label && <div style={{ fontSize: 10, fontWeight: 700, background: r.color, color: '#fff', padding: '2px 8px', borderRadius: 99 }}>YOU</div>}
                </div>
              ))}
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '14px 16px', border: '1.5px solid #bbf7d0', marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>BMI is a screening tool, not a diagnostic measure. Consult a healthcare professional for a complete assessment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
