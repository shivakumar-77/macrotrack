'use client'
import { useState, useRef } from 'react'

const AMOUNTS = [100, 250, 500, 750, 1000]

export default function WaterTracker({ waterGoal = 2000 }) {
  const [totalMl, setTotalMl] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(1)
  const [logs, setLogs] = useState([])
  const startY = useRef(0)
  const ITEM_H = 52

  function onDragStart(y) { startY.current = y }
  function onDragEnd(y) {
    const diff = startY.current - y
    if (Math.abs(diff) < 10) return
    if (diff > 20) setSelectedIdx(i => Math.min(AMOUNTS.length - 1, i + 1))
    if (diff < -20) setSelectedIdx(i => Math.max(0, i - 1))
  }

  function addWater() {
    const ml = AMOUNTS[selectedIdx]
    setTotalMl(prev => Math.min(waterGoal, prev + ml))
    setLogs(prev => [{ ml, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 5))
  }

  const pct = Math.min(1, totalMl / waterGoal)
  const wc = totalMl >= waterGoal ? '#10b981' : '#3b82f6'
  const fillH = Math.round(130 * pct)
  const fillY = 140 - fillH

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Hydration</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{totalMl}ml / {waterGoal}ml</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: totalMl >= waterGoal ? '#10b981' : 'var(--muted)', background: totalMl >= waterGoal ? '#d1fae5' : 'var(--card2)', padding: '4px 10px', borderRadius: 99 }}>
          {totalMl >= waterGoal ? 'Goal reached!' : `${waterGoal - totalMl}ml to go`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Glass */}
        <div style={{ flexShrink: 0 }}>
          <svg width="60" height="160" viewBox="0 0 60 160">
            <defs><clipPath id="gc"><path d="M5 8 L2 148 Q2 152 6 152 L54 152 Q58 152 58 148 L55 8 Z" /></clipPath></defs>
            <path d="M5 8 L2 148 Q2 152 6 152 L54 152 Q58 152 58 148 L55 8 Z" fill="#f8faff" stroke="#e2e8f0" strokeWidth="1.5" />
            <g clipPath="url(#gc)">
              <rect x="2" y={fillY + 6} width="56" height={Math.max(0, fillH)} fill={wc} opacity="0.8"
                style={{ transition: 'y 0.6s cubic-bezier(0.34,1.56,0.64,1), height 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
              {totalMl > 0 && <ellipse cx="30" cy={fillY + 6} rx="28" ry="4" fill={wc} style={{ transition: 'cy 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />}
            </g>
            <path d="M10 12 L8 50" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {totalMl > 0 && <button onClick={() => { setTotalMl(0); setLogs([]) }} style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 10, cursor: 'pointer' }}>reset</button>}
        </div>

        <div style={{ flex: 1 }}>
          {/* Scroll picker */}
          <div style={{ position: 'relative', height: ITEM_H * 3, overflow: 'hidden', borderRadius: 14, background: 'var(--card2)', border: '1.5px solid var(--border)', cursor: 'ns-resize', userSelect: 'none', marginBottom: 12 }}
            onTouchStart={e => onDragStart(e.touches[0].clientY)}
            onTouchEnd={e => onDragEnd(e.changedTouches[0].clientY)}
            onMouseDown={e => onDragStart(e.clientY)}
            onMouseUp={e => onDragEnd(e.clientY)}>
            <div style={{ position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H, background: 'rgba(99,102,241,0.08)', borderTop: '1.5px solid rgba(99,102,241,0.2)', borderBottom: '1.5px solid rgba(99,102,241,0.2)', zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: '100%', transition: 'transform 0.25s ease', transform: `translateY(${(1 - selectedIdx) * ITEM_H}px)` }}>
              {AMOUNTS.map((ml, i) => {
                const d = Math.abs(i - selectedIdx)
                return (
                  <div key={ml} onClick={() => setSelectedIdx(i)}
                    style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer', opacity: d === 0 ? 1 : d === 1 ? 0.5 : 0.2, transform: `scale(${d === 0 ? 1 : 0.85})`, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: d === 0 ? 20 : 16, fontWeight: d === 0 ? 700 : 400, color: d === 0 ? 'var(--primary)' : 'var(--muted)' }}>{ml}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>ml</span>
                  </div>
                )
              })}
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom,var(--card2),transparent)', pointerEvents: 'none', zIndex: 2 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top,var(--card2),transparent)', pointerEvents: 'none', zIndex: 2 }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }} onClick={addWater}>
            + Add {AMOUNTS[selectedIdx]}ml
          </button>

          {logs.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {logs.map((l, i) => (
                <div key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 500 }}>
                  +{l.ml}ml
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: wc, width: `${pct * 100}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}
