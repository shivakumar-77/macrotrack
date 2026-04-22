'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BMIPage() {
  const router = useRouter()
  const [gender, setGender] = useState('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [result, setResult] = useState(null)

  function calculate() {
    const h = parseFloat(height), w = parseFloat(weight)
    if (!h || !w) return
    const bmi = w / ((h / 100) ** 2)
    let category, color, advice
    if (bmi < 18.5) { category = 'Underweight'; color = '#3b82f6'; advice = 'Focus on nutrient-dense foods and strength training to gain healthy weight.' }
    else if (bmi < 25) { category = 'Normal weight'; color = '#10b981'; advice = 'Great! Maintain your current lifestyle with balanced nutrition and regular exercise.' }
    else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; advice = 'A calorie deficit of 300-500 kcal/day combined with regular exercise can help reach a healthy weight.' }
    else if (bmi < 35) { category = 'Obese (Class I)'; color = '#ef4444'; advice = 'Consult a healthcare provider. A structured diet and exercise plan can significantly improve your health.' }
    else { category = 'Obese (Class II+)'; color = '#dc2626'; advice = 'Please consult a doctor. Medical supervision is recommended for safe weight loss.' }
    const idealMin = (18.5 * ((h / 100) ** 2)).toFixed(1)
    const idealMax = (24.9 * ((h / 100) ** 2)).toFixed(1)
    const toLose = w > parseFloat(idealMax) ? (w - parseFloat(idealMax)).toFixed(1) : null
    const toGain = w < parseFloat(idealMin) ? (parseFloat(idealMin) - w).toFixed(1) : null
    setResult({ bmi: bmi.toFixed(1), category, color, advice, idealMin, idealMax, toLose, toGain })
  }

  const inp = {
    textAlign: 'center',
    fontWeight: 800,
    fontSize: 24,
    background: 'transparent',
    border: 'none',
    padding: 0,
    width: '100%',
    outline: 'none',
    color: 'var(--text)',
  }

  const box = {
    background: 'var(--card)',
    borderRadius: 16,
    padding: '16px 12px',
    border: '1.5px solid var(--border)',
    textAlign: 'center',
  }

  // Gauge needle angle: BMI 10=0deg, BMI 40=180deg
  const bmiVal = result ? parseFloat(result.bmi) : 0
  const angle = result ? Math.min(180, Math.max(0, ((bmiVal - 10) / 30) * 180)) : 0
  const rad = (angle - 180) * (Math.PI / 180)
  const needleLen = 65
  const cx = 140, cy = 130
  const nx = cx + needleLen * Math.cos(rad)
  const ny = cy + needleLen * Math.sin(rad)

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
        {/* Gender */}
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

        {/* Inputs — key fix: type=text + inputMode keeps keyboard open */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={box}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Height</div>
            <input type="text" inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} placeholder="170" style={inp}/>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>cm</div>
          </div>
          <div style={box}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Weight</div>
            <input type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" style={inp}/>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>kg</div>
          </div>
          <div style={box}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Age</div>
            <input type="text" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} placeholder="25" style={inp}/>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>yrs</div>
          </div>
        </div>

        <button onClick={calculate} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 700, marginBottom: 24 }}>
          Calculate BMI
        </button>

        {result && (
          <div className="slide-up">
            {/* Fixed Gauge */}
            <div className="card" style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 20 }}>
              <svg width="100%" viewBox="0 0 280 145" preserveAspectRatio="xMidYMid meet">
                {/* Arc segments */}
                {(() => {
                  const segs = [
                    { color: '#3b82f6', from: 180, to: 144 },
                    { color: '#10b981', from: 144, to: 90 },
                    { color: '#f59e0b', from: 90, to: 54 },
                    { color: '#ef4444', from: 54, to: 18 },
                    { color: '#dc2626', from: 18, to: 0 },
                  ]
                  const r = 110
                  return segs.map((seg, i) => {
                    const toRad = d => (d - 180) * Math.PI / 180
                    const x1 = 140 + r * Math.cos(toRad(seg.from))
                    const y1 = 130 + r * Math.sin(toRad(seg.from))
                    const x2 = 140 + r * Math.cos(toRad(seg.to))
                    const y2 = 130 + r * Math.sin(toRad(seg.to))
                    return (
                      <path key={i}
                        d={'M 140 130 L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 0 0 ' + x2 + ' ' + y2 + ' Z'}
                        fill={seg.color} opacity="0.9"/>
                    )
                  })
                })()}
                {/* White center circle */}
                <circle cx="140" cy="130" r="74" fill="white"/>
                {/* Needle */}
                <line x1="140" y1="130" x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke="#1e293b" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="140" cy="130" r="7" fill="#1e293b"/>
                {/* Labels */}
                <text x="25" y="135" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="700">Under</text>
                <text x="78" y="30" textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="700">Normal</text>
                <text x="165" y="22" textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight="700">Over</text>
                <text x="224" y="55" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="700">Obese</text>
                {/* BMI value */}
                <text x="140" y="108" textAnchor="middle" fontSize="26" fontWeight="800" fill={result.color}>{result.bmi}</text>
                <text x="140" y="122" textAnchor="middle" fontSize="10" fill="#94a3b8">BMI</text>
                <text x="140" y="138" textAnchor="middle" fontSize="13" fontWeight="700" fill={result.color}>{result.category}</text>
              </svg>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Your results</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Ideal weight</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#10b981' }}>{result.idealMin}–{result.idealMax} kg</div>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px', border: '1.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{result.toLose ? 'To lose' : result.toGain ? 'To gain' : 'Status'}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: result.toLose ? '#ef4444' : result.toGain ? '#3b82f6' : '#10b981' }}>
                    {result.toLose ? result.toLose + ' kg' : result.toGain ? result.toGain + ' kg' : '✓ Healthy'}
                  </div>
                </div>
              </div>
              <div style={{ background: '#fef3c7', borderRadius: 14, padding: '14px', border: '1.5px solid #fde68a' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>💡 Advice</div>
                <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{result.advice}</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>BMI chart</div>
              {[
                { label: 'Underweight', range: '< 18.5', color: '#3b82f6' },
                { label: 'Normal weight', range: '18.5–24.9', color: '#10b981' },
                { label: 'Overweight', range: '25–29.9', color: '#f59e0b' },
                { label: 'Obese Class I', range: '30–34.9', color: '#ef4444' },
                { label: 'Obese Class II+', range: '≥ 35', color: '#dc2626' },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.range}</div>
                  {result.category === r.label && <div style={{ fontSize: 10, fontWeight: 700, background: r.color, color: '#fff', padding: '3px 10px', borderRadius: 99 }}>YOU</div>}
                </div>
              ))}
            </div>

            <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '14px 16px', border: '1.5px solid #bbf7d0', marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>⚠️ BMI is a screening tool, not a diagnostic measure. It does not account for muscle mass or body composition. Consult a healthcare professional for a full assessment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
