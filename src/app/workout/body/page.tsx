'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'

export default function BodyMapPage() {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const MUSCLES: Record<string, { title: string; desc: string; chips: string[]; color: string; bg: string; exercises: string }> = {
    chest: { title:'Chest', desc:'The pectoralis major is the primary pushing muscle. Essential for bench press, flyes and dips.', chips:['Pectoralis Major','Pectoralis Minor','Serratus Anterior'], color:'#e05c8a', bg:'rgba(224,92,138,0.12)', exercises:'Bench Press, Incline Press, Cable Crossover, Chest Dip, Pec Deck' },
    shoulders: { title:'Shoulders', desc:'Three heads — front, lateral and rear deltoid. Critical for pressing, raising and rotational movements.', chips:['Anterior Deltoid','Lateral Deltoid','Posterior Deltoid','Rotator Cuff'], color:'#7c6fe0', bg:'rgba(124,111,224,0.12)', exercises:'Overhead Press, Lateral Raise, Face Pull, Arnold Press, Front Raise' },
    arms: { title:'Arms', desc:'Biceps for pulling and curling, triceps for pushing and extension. Forearms for grip strength.', chips:['Biceps Brachii','Brachialis','Triceps Brachii','Brachioradialis','Forearms'], color:'#5b9ef0', bg:'rgba(91,158,240,0.12)', exercises:'Barbell Curl, Hammer Curl, Skull Crusher, Tricep Pushdown, Preacher Curl' },
    core: { title:'Core', desc:'The foundation of all movement. Abs, obliques and deep stabilizers protect the spine and transfer force.', chips:['Rectus Abdominis','Obliques','Transverse Abdominis','Erector Spinae'], color:'#2ec4a0', bg:'rgba(46,196,160,0.12)', exercises:'Plank, Hanging Leg Raise, Russian Twist, Cable Crunch, Ab Wheel' },
    legs: { title:'Legs', desc:'Largest muscles in the body. Quads, hamstrings, glutes and calves drive nearly every athletic movement.', chips:['Quadriceps','Hamstrings','Glutes','Gastrocnemius','Soleus','Hip Flexors'], color:'#f0a030', bg:'rgba(240,160,48,0.12)', exercises:'Squat, Deadlift, Hip Thrust, Leg Press, Romanian Deadlift, Calf Raise' },
    back: { title:'Back', desc:'Lats create the V-taper. Traps and rhomboids stabilize the scapula. Lower back protects the spine.', chips:['Latissimus Dorsi','Trapezius','Rhomboids','Erector Spinae','Teres Major'], color:'#e04070', bg:'rgba(224,64,112,0.12)', exercises:'Pull Up, Bent Over Row, Lat Pulldown, Deadlift, T-Bar Row, Face Pull' },
  }

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100dvh', maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', padding: 'calc(env(safe-area-inset-top,0px) + 12px) 20px 12px', borderBottom: '0.5px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card2)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Body Anatomy</h1>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Tap any muscle to explore exercises</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        {/* Anatomy iframe embed */}
        <div style={{ background: '#111', borderRadius: 20, overflow: 'hidden', marginTop: 16, marginBottom: 16 }}>
          <iframe
            ref={iframeRef}
            srcDoc={`<!DOCTYPE html><html><head><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#111;font-family:-apple-system,sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center;padding:14px}.controls{display:flex;gap:6px;margin-bottom:12px;width:100%}.btn{flex:1;padding:8px;border-radius:8px;border:1.5px solid #333;background:#1a1a1a;color:#888;font-size:12px;font-weight:600;cursor:pointer}.btn.active{background:#6366f1;border-color:#6366f1;color:#fff}.gender-row{display:flex;gap:5px;margin-bottom:12px}.gender-btn{padding:6px 14px;border-radius:99px;border:1.5px solid #333;background:#1a1a1a;color:#666;font-size:11px;font-weight:600;cursor:pointer}.gender-btn.active{background:#6366f1;border-color:#6366f1;color:#fff}.muscle-zone{cursor:pointer;transition:opacity .2s}.muscle-zone:hover{opacity:.8}.info{width:100%;background:#1a1a1a;border:1.5px solid #2a2a2a;border-radius:12px;padding:12px;margin-top:10px;min-height:70px}.info h3{font-size:14px;font-weight:700;margin-bottom:3px}.info p{font-size:11px;color:#777;line-height:1.5;margin-bottom:7px}.chips{display:flex;flex-wrap:wrap;gap:4px}.chip{padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600}.exbtn{margin-top:8px;width:100%;padding:9px;border-radius:8px;border:none;font-size:12px;font-weight:700;cursor:pointer}.legend{display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:10px}.li{display:flex;align-items:center;gap:4px;font-size:10px;color:#555}.ld{width:8px;height:8px;border-radius:50%;flex-shrink:0}</style></head><body>
<div class="controls"><button class="btn active" onclick="sv('front')">Front</button><button class="btn" onclick="sv('back')">Back</button></div>
<div class="gender-row"><button class="gender-btn active" onclick="sg('male')">♂ Male</button><button class="gender-btn" onclick="sg('female')">♀ Female</button></div>
<svg id="sf" width="220" height="440" viewBox="0 0 260 520">
<defs><radialGradient id="sk" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#e8c9a0"/><stop offset="100%" stop-color="#c9a27a"/></radialGradient></defs>
<ellipse cx="130" cy="38" rx="26" ry="32" fill="url(#sk)"/>
<rect x="119" y="68" width="22" height="22" rx="5" fill="url(#sk)"/>
<path d="M85 88 Q80 92 78 105 L75 200 Q80 210 130 210 Q180 210 185 200 L182 105 Q180 92 175 88 Z" fill="#1e1e2a"/>
<path d="M85 90 Q68 96 62 110 L55 175 Q60 180 74 178 L80 110 Q83 100 90 94 Z" fill="#1e1e2a"/>
<path d="M175 90 Q192 96 198 110 L205 175 Q200 180 186 178 L180 110 Q177 100 170 94 Z" fill="#1e1e2a"/>
<path d="M55 175 L48 235 Q52 240 65 238 L74 178 Z" fill="#18181f"/>
<path d="M205 175 L212 235 Q208 240 195 238 L186 178 Z" fill="#18181f"/>
<ellipse cx="56" cy="244" rx="10" ry="13" fill="url(#sk)"/>
<ellipse cx="204" cy="244" rx="10" ry="13" fill="url(#sk)"/>
<path d="M75 200 Q70 215 72 225 L88 225 L95 212 Q130 218 165 212 L172 225 L188 225 Q190 215 185 200 Z" fill="#22222e"/>
<path d="M88 222 L80 315 Q90 322 106 318 L115 225 Z" fill="#1e1e28"/>
<path d="M172 222 L180 315 Q170 322 154 318 L145 225 Z" fill="#1e1e28"/>
<path d="M80 315 L76 395 Q84 402 96 398 L106 318 Z" fill="#1a1a24"/>
<path d="M180 315 L184 395 Q176 402 164 398 L154 318 Z" fill="#1a1a24"/>
<ellipse cx="86" cy="408" rx="14" ry="9" fill="url(#sk)"/>
<ellipse cx="174" cy="408" rx="14" ry="9" fill="url(#sk)"/>
<g class="muscle-zone" onclick="sel('chest')"><ellipse cx="108" cy="130" rx="24" ry="20" fill="#e05c8a" opacity=".75"/><ellipse cx="152" cy="130" rx="24" ry="20" fill="#e05c8a" opacity=".75"/><line x1="108" y1="130" x2="152" y2="130" stroke="#e05c8a" stroke-width="8" opacity=".4"/><text x="130" y="134" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">CHEST</text></g>
<g class="muscle-zone" onclick="sel('shoulders')"><ellipse cx="80" cy="100" rx="18" ry="13" fill="#7c6fe0" opacity=".8"/><ellipse cx="180" cy="100" rx="18" ry="13" fill="#7c6fe0" opacity=".8"/></g>
<g class="muscle-zone" onclick="sel('arms')"><ellipse cx="63" cy="135" rx="13" ry="28" fill="#5b9ef0" opacity=".75"/><ellipse cx="197" cy="135" rx="13" ry="28" fill="#5b9ef0" opacity=".75"/><text x="48" y="139" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">BI</text><text x="212" y="139" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">BI</text></g>
<g class="muscle-zone" onclick="sel('arms')"><ellipse cx="60" cy="205" rx="10" ry="24" fill="#3a7acc" opacity=".6"/><ellipse cx="200" cy="205" rx="10" ry="24" fill="#3a7acc" opacity=".6"/></g>
<g class="muscle-zone" onclick="sel('core')"><rect x="112" y="152" width="16" height="12" rx="4" fill="#2ec4a0" opacity=".8"/><rect x="132" y="152" width="16" height="12" rx="4" fill="#2ec4a0" opacity=".8"/><rect x="112" y="167" width="16" height="12" rx="4" fill="#2ec4a0" opacity=".75"/><rect x="132" y="167" width="16" height="12" rx="4" fill="#2ec4a0" opacity=".75"/><rect x="112" y="182" width="16" height="12" rx="4" fill="#2ec4a0" opacity=".65"/><rect x="132" y="182" width="16" height="12" rx="4" fill="#2ec4a0" opacity=".65"/><line x1="130" y1="152" x2="130" y2="194" stroke="#111" stroke-width="1.5"/><text x="130" y="147" text-anchor="middle" fill="#2ec4a0" font-size="8" font-weight="700">ABS</text></g>
<g class="muscle-zone" onclick="sel('core')"><path d="M100 160 Q88 175 88 200" fill="none" stroke="#1aaa84" stroke-width="14" opacity=".45" stroke-linecap="round"/><path d="M160 160 Q172 175 172 200" fill="none" stroke="#1aaa84" stroke-width="14" opacity=".45" stroke-linecap="round"/></g>
<g class="muscle-zone" onclick="sel('legs')"><ellipse cx="94" cy="268" rx="17" ry="42" fill="#f0a030" opacity=".75"/><ellipse cx="166" cy="268" rx="17" ry="42" fill="#f0a030" opacity=".75"/><text x="94" y="272" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">QUAD</text><text x="166" y="272" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">QUAD</text></g>
<g class="muscle-zone" onclick="sel('legs')"><ellipse cx="87" cy="354" rx="11" ry="28" fill="#e07820" opacity=".65"/><ellipse cx="173" cy="354" rx="11" ry="28" fill="#e07820" opacity=".65"/></g>
<ellipse cx="122" cy="40" rx="4" ry="5" fill="#c8a078" opacity=".5"/>
<ellipse cx="138" cy="40" rx="4" ry="5" fill="#c8a078" opacity=".5"/>
<path d="M124 52 Q130 56 136 52" fill="none" stroke="#a07850" stroke-width="1.5" stroke-linecap="round"/>
<line x1="130" y1="90" x2="130" y2="198" stroke="#333" stroke-width="1" stroke-dasharray="3,3" opacity=".35"/>
<circle cx="130" cy="196" r="3" fill="#333" opacity=".4"/>
</svg>
<svg id="sb" width="220" height="440" viewBox="0 0 260 520" style="display:none">
<defs><radialGradient id="sk2" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#e0c090"/><stop offset="100%" stop-color="#c09868"/></radialGradient></defs>
<ellipse cx="130" cy="38" rx="26" ry="32" fill="url(#sk2)"/>
<rect x="119" y="68" width="22" height="22" rx="5" fill="url(#sk2)"/>
<path d="M85 88 Q80 92 78 105 L75 200 Q80 210 130 210 Q180 210 185 200 L182 105 Q180 92 175 88 Z" fill="#1e1e2a"/>
<path d="M85 90 Q68 96 62 110 L55 175 Q60 180 74 178 L80 110 Q83 100 90 94 Z" fill="#1e1e2a"/>
<path d="M175 90 Q192 96 198 110 L205 175 Q200 180 186 178 L180 110 Q177 100 170 94 Z" fill="#1e1e2a"/>
<path d="M55 175 L48 235 Q52 240 65 238 L74 178 Z" fill="#18181f"/>
<path d="M205 175 L212 235 Q208 240 195 238 L186 178 Z" fill="#18181f"/>
<ellipse cx="56" cy="244" rx="10" ry="13" fill="url(#sk2)"/>
<ellipse cx="204" cy="244" rx="10" ry="13" fill="url(#sk2)"/>
<path d="M75 200 Q70 215 72 225 L88 225 L95 212 Q130 218 165 212 L172 225 L188 225 Q190 215 185 200 Z" fill="#1a1a22"/>
<path d="M88 222 L80 315 Q90 322 106 318 L115 225 Z" fill="#18181f"/>
<path d="M172 222 L180 315 Q170 322 154 318 L145 225 Z" fill="#18181f"/>
<path d="M80 315 L76 395 Q84 402 96 398 L106 318 Z" fill="#141420"/>
<path d="M180 315 L184 395 Q176 402 164 398 L154 318 Z" fill="#141420"/>
<ellipse cx="86" cy="408" rx="14" ry="9" fill="url(#sk2)"/>
<ellipse cx="174" cy="408" rx="14" ry="9" fill="url(#sk2)"/>
<g class="muscle-zone" onclick="sel('back')"><path d="M95 88 Q130 82 165 88 L158 115 Q130 122 102 115 Z" fill="#c04060" opacity=".8"/><text x="130" y="105" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">TRAPS</text></g>
<g class="muscle-zone" onclick="sel('back')"><path d="M82 115 Q72 130 72 165 L90 175 Q100 145 108 125 Z" fill="#e04070" opacity=".75"/><path d="M178 115 Q188 130 188 165 L170 175 Q160 145 152 125 Z" fill="#e04070" opacity=".75"/><text x="76" y="148" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">LAT</text><text x="184" y="148" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">LAT</text></g>
<g class="muscle-zone" onclick="sel('back')"><rect x="108" y="118" width="44" height="38" rx="8" fill="#a03055" opacity=".7"/><text x="130" y="140" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">MID BACK</text></g>
<g class="muscle-zone" onclick="sel('back')"><ellipse cx="130" cy="180" rx="28" ry="18" fill="#c83060" opacity=".65"/><text x="130" y="184" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">LOWER BACK</text></g>
<g class="muscle-zone" onclick="sel('shoulders')"><ellipse cx="80" cy="100" rx="18" ry="13" fill="#7c6fe0" opacity=".8"/><ellipse cx="180" cy="100" rx="18" ry="13" fill="#7c6fe0" opacity=".8"/></g>
<g class="muscle-zone" onclick="sel('arms')"><ellipse cx="63" cy="135" rx="13" ry="28" fill="#4a80d0" opacity=".75"/><ellipse cx="197" cy="135" rx="13" ry="28" fill="#4a80d0" opacity=".75"/><text x="48" y="139" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">TRI</text><text x="212" y="139" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">TRI</text></g>
<g class="muscle-zone" onclick="sel('legs')"><ellipse cx="103" cy="210" rx="24" ry="18" fill="#d06010" opacity=".8"/><ellipse cx="157" cy="210" rx="24" ry="18" fill="#d06010" opacity=".8"/><text x="103" y="214" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">GLUTE</text><text x="157" y="214" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">GLUTE</text></g>
<g class="muscle-zone" onclick="sel('legs')"><ellipse cx="94" cy="268" rx="17" ry="38" fill="#e08020" opacity=".7"/><ellipse cx="166" cy="268" rx="17" ry="38" fill="#e08020" opacity=".7"/><text x="94" y="272" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">HAM</text><text x="166" y="272" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">HAM</text></g>
<g class="muscle-zone" onclick="sel('legs')"><ellipse cx="87" cy="354" rx="13" ry="30" fill="#c06818" opacity=".7"/><ellipse cx="173" cy="354" rx="13" ry="30" fill="#c06818" opacity=".7"/></g>
<line x1="130" y1="90" x2="130" y2="195" stroke="#444" stroke-width="1.5" stroke-dasharray="4,3" opacity=".45"/>
<path d="M98 112 Q92 130 96 148 Q102 148 110 140 Q114 128 110 112 Z" fill="none" stroke="#555" stroke-width="1" opacity=".4"/>
<path d="M162 112 Q168 130 164 148 Q158 148 150 140 Q146 128 150 112 Z" fill="none" stroke="#555" stroke-width="1" opacity=".4"/>
</svg>
<div class="info" id="info"><div id="ie" style="display:flex;align-items:center;gap:8px;color:#444;font-size:12px"><span style="font-size:20px">👆</span><span>Tap any muscle group</span></div><div id="ic" style="display:none"><h3 id="it"></h3><p id="id2"></p><div class="chips" id="ich"></div><button class="exbtn" id="ib" onclick="ve()"></button></div></div>
<div class="legend"><div class="li"><div class="ld" style="background:#e05c8a"></div>Chest</div><div class="li"><div class="ld" style="background:#7c6fe0"></div>Shoulders</div><div class="li"><div class="ld" style="background:#5b9ef0"></div>Arms</div><div class="li"><div class="ld" style="background:#2ec4a0"></div>Core</div><div class="li"><div class="ld" style="background:#f0a030"></div>Legs</div><div class="li"><div class="ld" style="background:#e04070"></div>Back</div></div>
<script>
const M={chest:{title:'Chest',desc:'Pectoralis major — primary pushing muscle.',chips:['Pectoralis Major','Pectoralis Minor','Serratus Anterior'],color:'#e05c8a',exs:'Bench Press, Incline Press, Cable Crossover, Chest Dip'},shoulders:{title:'Shoulders',desc:'Front, lateral and rear deltoid — pressing and raising.',chips:['Anterior Deltoid','Lateral Deltoid','Posterior Deltoid'],color:'#7c6fe0',exs:'Overhead Press, Lateral Raise, Face Pull, Arnold Press'},arms:{title:'Arms',desc:'Biceps for pulling, triceps for pushing, forearms for grip.',chips:['Biceps Brachii','Triceps Brachii','Brachialis','Forearms'],color:'#5b9ef0',exs:'Barbell Curl, Hammer Curl, Skull Crusher, Tricep Pushdown'},core:{title:'Core',desc:'Abs, obliques and deep stabilizers protect the spine.',chips:['Rectus Abdominis','Obliques','Transverse Abdominis'],color:'#2ec4a0',exs:'Plank, Hanging Leg Raise, Russian Twist, Cable Crunch'},legs:{title:'Legs',desc:'Largest muscles — quads, hams, glutes, calves.',chips:['Quadriceps','Hamstrings','Glutes','Gastrocnemius'],color:'#f0a030',exs:'Squat, Deadlift, Hip Thrust, Leg Press, Calf Raise'},back:{title:'Back',desc:'Lats, traps, rhomboids and erector spinae.',chips:['Latissimus Dorsi','Trapezius','Rhomboids','Erector Spinae'],color:'#e04070',exs:'Pull Up, Bent Over Row, Lat Pulldown, Deadlift'}};
let sm=null;
function sv(v){document.getElementById('sf').style.display=v==='front'?'block':'none';document.getElementById('sb').style.display=v==='back'?'block':'none';document.querySelectorAll('.btn').forEach((b,i)=>b.classList.toggle('active',(i===0&&v==='front')||(i===1&&v==='back')))}
function sg(g){document.querySelectorAll('.gender-btn').forEach((b,i)=>b.classList.toggle('active',(i===0&&g==='male')||(i===1&&g==='female')))}
function sel(id){sm=id;const m=M[id];document.getElementById('ie').style.display='none';document.getElementById('ic').style.display='block';document.getElementById('it').textContent=m.title;document.getElementById('it').style.color=m.color;document.getElementById('id2').textContent=m.desc;document.getElementById('ich').innerHTML=m.chips.map(c=>'<span class="chip" style="background:'+m.color+'22;color:'+m.color+';border:1px solid '+m.color+'44">'+c+'</span>').join('');const b=document.getElementById('ib');b.textContent='View '+m.title+' exercises →';b.style.background=m.color;b.style.color='#fff';b.style.borderRadius='8px'}
function ve(){if(sm&&window.parent){window.parent.postMessage({type:'muscle',muscle:sm,exercises:M[sm].exs},'*')}}
</script></body></html>`}
            style={{ width: '100%', height: 680, border: 'none', borderRadius: 20, display: 'block' }}
            title="Interactive anatomy model"
            onLoad={() => {
              window.addEventListener('message', (e) => {
                if (e.data?.type === 'muscle') {
                  const cat = e.data.muscle
                  router.push(`/workout/exercises?body=${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
                }
              })
            }}
          />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
