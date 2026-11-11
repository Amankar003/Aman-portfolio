import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { P, SECTIONS, IMG } from './data.js';
import { createWorld } from './world.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const Ico = ({ d, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const I = {
  auto: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  sound: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></>,
  skip: <path d="M12 5v14M6 13l6 6 6-6" />,
  ring: <circle cx="12" cy="12" r="7" />
};

function Radar({ hud, map, size }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !map || !hud) return; const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = size * dpr; c.height = size * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr);
    const R = size / 2, k = (R - 8) / 170, cs = Math.cos(hud.psi), sn = Math.sin(hud.psi);
    const T = (wx, wz) => { const dx = wx - hud.x, dz = wz - hud.z; return [R + (dx * cs + dz * sn) * k, R + (-dx * sn + dz * cs) * k]; };
    x.clearRect(0, 0, size, size);
    x.save(); x.beginPath(); x.arc(R, R, R - 2, 0, 7); x.clip();
    const g = x.createRadialGradient(R, R, 0, R, R, R); g.addColorStop(0, 'rgba(24,34,48,.92)'); g.addColorStop(1, 'rgba(10,14,20,.92)'); x.fillStyle = g; x.fillRect(0, 0, size, size);
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1; [.33, .66, 1].forEach(f => { x.beginPath(); x.arc(R, R, (R - 6) * f, 0, 7); x.stroke(); });
    x.beginPath(); x.moveTo(R, 4); x.lineTo(R, size - 4); x.moveTo(4, R); x.lineTo(size - 4, R); x.stroke();
    x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 7; x.strokeStyle = 'rgba(255,255,255,.1)'; x.beginPath(); map.path.forEach((p, i) => { const [a, b] = T(p[0], p[1]); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.stroke();
    x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,255,255,.45)'; x.stroke();
    (map.rings || []).forEach((r, i) => { if (hud.ringsTaken && hud.ringsTaken[i]) return; const [a, b] = T(r[0], r[1]); x.beginPath(); x.arc(a, b, 3, 0, 7); x.strokeStyle = '#ffd27a'; x.lineWidth = 1.6; x.stroke(); });
    map.cps.forEach((c, i) => {
      let [a, b] = T(c.x, c.z); const dx = a - R, dy = b - R, d = Math.hypot(dx, dy), lim = R - 10;
      const out = d > lim; if (out) { a = R + dx / d * lim; b = R + dy / d * lim; }
      x.beginPath(); x.arc(a, b, out ? 4 : 6, 0, 7); x.fillStyle = hud.visited[i] ? c.color : 'rgba(0,0,0,.4)'; x.strokeStyle = c.color; x.lineWidth = 2; x.fill(); x.stroke();
      if (hud.next === c.id) { x.beginPath(); x.arc(a, b, (out ? 4 : 6) + 4 + 2 * Math.sin(performance.now() / 220), 0, 7); x.strokeStyle = c.color + '99'; x.lineWidth = 1.5; x.stroke(); }
    });
    x.restore();
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(R, R - 8); x.lineTo(R + 5.5, R + 6); x.lineTo(R, R + 3); x.lineTo(R - 5.5, R + 6); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1.5; x.beginPath(); x.arc(R, R, R - 1.5, 0, 7); x.stroke();
  }, [hud, map, size]);
  return <canvas ref={ref} className="radar" style={{ width: size, height: size }} aria-hidden />;
}

function Gauge({ speed, boosting }) {
  const r = 52, L = 2 * Math.PI * r * (240 / 360), frac = Math.min(1, speed * 3.6 / 220);
  return (
    <svg className="gauge" viewBox="0 0 128 128" aria-hidden>
      <g transform="rotate(150 64 64)">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${L} 999`} />
        <circle cx="64" cy="64" r={r} fill="none" stroke={boosting ? '#ffd27a' : 'url(#gg)'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${Math.max(.01, L * frac)} 999`} style={{ filter: boosting ? 'drop-shadow(0 0 8px #ffb86b)' : 'none', transition: 'stroke-dasharray .12s' }} />
      </g>
      <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stopColor="#7fd6e0" /><stop offset="1" stopColor="#ffb86b" /></linearGradient></defs>
    </svg>
  );
}

export default function Game({ paused, onDock, onOpen }) {
  const canvasRef = useRef(null), wrapRef = useRef(null), worldRef = useRef(null), visRef = useRef(false), dockRef = useRef(onDock);
  dockRef.current = onDock;
  const [hud, setHud] = useState(null), [ready, setReady] = useState(false), [err, setErr] = useState(false), [sound, setSound] = useState(false), [map, setMap] = useState(null);
  const [started, setStarted] = useState(false), [toasts, setToasts] = useState([]), [dismissed, setDismissed] = useState(false), [finalStats, setFinalStats] = useState(null);
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const small = typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches;

  useEffect(() => {
    let dead = false, w = null;
    (async () => {
      try {
        w = await createWorld(canvasRef.current, {
          sections: SECTIONS, profile: P, images: IMG, reduce,
          onDock: id => dockRef.current(id), onHud: setHud,
          onEvent: e => { setToasts(t => [...t.slice(-2), e]); setTimeout(() => setToasts(t => t.filter(x => x.id !== e.id)), 2600); }
        });
        if (dead) { w.dispose(); return; }
        worldRef.current = w; w.setActive(visRef.current); w.setPaused(true); setMap(w.getMap()); setReady(true);
        const ro = new ResizeObserver(() => w.resize()); ro.observe(canvasRef.current); w._ro = ro; window.__world = w;
      } catch (e) { console.error('World failed:', e); if (!dead) setErr(true); }
    })();
    return () => { dead = true; if (w) { w._ro && w._ro.disconnect(); w.dispose(); } };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { visRef.current = e.intersectionRatio > .4; worldRef.current && worldRef.current.setActive(visRef.current); }, { threshold: [0, .2, .4, .6] });
    io.observe(wrapRef.current); return () => io.disconnect();
  }, []);
  useEffect(() => { worldRef.current && worldRef.current.setPaused(paused || !started); }, [paused, started, ready]);
  useEffect(() => { if (hud && hud.done && !finalStats) setFinalStats({ rings: hud.rings, total: hud.ringsTotal, time: hud.playTime }); }, [hud, finalStats]);

  const hold = (prop, val) => ({
    onPointerDown: e => { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); worldRef.current && worldRef.current.touch({ [prop]: val }); },
    onPointerUp: () => worldRef.current && worldRef.current.touch({ [prop]: 0 }),
    onPointerCancel: () => worldRef.current && worldRef.current.touch({ [prop]: 0 })
  });
  const W = () => worldRef.current;
  const toggleSound = () => { const v = !sound; setSound(v); W() && W().setSound(v); };
  const skip = () => { const el = document.getElementById('services'); el && el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  const begin = manual => { setStarted(true); if (W()) { manual ? W().takeWheel() : W().setAuto(true); } };
  const replay = () => { W() && W().restart(); setDismissed(false); setFinalStats(null); setToasts([]); };
  const nextSec = hud && hud.next ? SECTIONS.find(s => s.id === hud.next) : null;
  const showDone = ready && hud && hud.done && !paused && !dismissed && started;
  const doneCount = hud ? hud.visited.filter(Boolean).length : 0;

  return (
    <section className={'game' + (hud && hud.night ? ' night' : '')} id="journey" ref={wrapRef}>
      <canvas ref={canvasRef} className="game-canvas" aria-label="Interactive boat journey through the portfolio" />
      <div className="game-vignette" />
      {hud && hud.boosting && started && <div className="speedlines" />}
      {!ready && !err && <div className="game-loading"><div className="spinner" /><span>Building the city…</span></div>}
      {err && (
        <div className="game-loading"><div className="err-card"><h3>The 3D journey isn't supported here</h3><p>Your browser couldn't start WebGL. You can still explore everything:</p>
          <div className="err-btns">{SECTIONS.map(s => <button key={s.id} className="btn ghost" onClick={() => onOpen(s.id)}>{s.label}</button>)}</div></div></div>
      )}

      <AnimatePresence>
        {ready && !started && (
          <motion.div className="g-start" key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: .5 }}>
            <motion.div className="g-start-card" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .15, type: 'spring', stiffness: 140, damping: 18 }}>
              <span className="kicker">Interactive portfolio</span>
              <h2>The Journey</h2>
              <p>Sail through a flooded city and dock at five glowing checkpoints to explore my work. Collect boost rings on the way.</p>
              <div className="g-steps">
                <div><i>1</i><span>{touch ? 'Hold GAS and steer with ◀ ▶' : <>Drive with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows</>}</span></div>
                <div><i>2</i><span>{touch ? 'Tap BOOST for a burst of speed' : <>Hold <kbd>Shift</kbd> to boost, <kbd>T</kbd> for night</>}</span></div>
                <div><i>3</i><span>Stop inside a glowing ring to open that section</span></div>
              </div>
              <div className="g-start-btns">
                <button className="btn" onClick={() => begin(true)}>Take the wheel</button>
                <button className="btn ghost" onClick={() => begin(false)}>Autopilot tour</button>
                <button className="btn ghost" onClick={skip}>Skip ↓</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {ready && hud && started && (<>
        <motion.div className="g-obj" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="obj-top"><span className="obj-k">Objective</span><span className="obj-p">{doneCount}/{SECTIONS.length}</span></div>
          {nextSec ? <div className="obj-t">Dock at <b style={{ color: nextSec.color }}>{nextSec.label}</b></div> : <div className="obj-t">All checkpoints reached</div>}
          <div className="obj-bar"><i style={{ width: doneCount / SECTIONS.length * 100 + '%' }} /></div>
          {nextSec && <div className="obj-d"><svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: `rotate(${hud.bearing}rad)` }}><path d="M12 3l7 17-7-4-7 4z" fill={nextSec.color} /></svg>{Math.round(hud.dist)} m ahead</div>}
        </motion.div>

        <div className="g-tools">
          <button className={'g-ic' + (hud.auto ? ' on' : '')} onClick={() => W().toggleAuto()} title="Autopilot (P)" aria-pressed={hud.auto}><Ico d={I.auto} /><span>Auto</span></button>
          <button className={'g-ic' + (hud.night ? ' on' : '')} onClick={() => W().toggleNight()} title="Day / night (T)" aria-pressed={!!hud.night}><Ico d={hud.night ? I.moon : I.sun} /><span>{hud.night ? 'Night' : 'Dusk'}</span></button>
          <button className={'g-ic' + (sound ? ' on' : '')} onClick={toggleSound} title="Sound" aria-pressed={sound}><Ico d={sound ? I.sound : I.mute} /><span>Sound</span></button>
          <button className="g-ic" onClick={skip} title="Skip the journey"><Ico d={I.skip} /><span>Skip</span></button>
        </div>
        <Radar hud={hud} map={map} size={small ? 96 : 138} />

        <div className="g-dash">
          <div className="speedo"><Gauge speed={hud.speed} boosting={hud.boosting} /><div className="spd"><b>{Math.round(hud.speed * 3.6)}</b><span>km/h</span></div></div>
          <div className="dash-r">
            <div className={'boostbar' + (hud.boosting ? ' hot' : '')}>{Array.from({ length: 10 }).map((_, i) => <i key={i} className={hud.boostT / 2 * 10 > i ? 'on' : ''} />)}</div>
            <div className="ringc"><Ico d={I.ring} size={15} /><b>{hud.rings}</b><span>/ {hud.ringsTotal} rings</span></div>
            <div className="timec">{fmt(hud.playTime)}</div>
          </div>
        </div>

        <div className="g-steps-nav">
          {SECTIONS.map((s, i) => <div key={s.id} className={'step' + (hud.visited[i] ? ' done' : hud.next === s.id ? ' next' : '')} style={{ '--c': s.color }}><i>{hud.visited[i] ? '✓' : i + 1}</i><span>{s.label}</span></div>)}
        </div>
        {!touch && <div className="g-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive <em /> <kbd>Shift</kbd> boost <em /> <kbd>P</kbd> autopilot <em /> <kbd>T</kbd> night</div>}

        <div className="g-toasts"><AnimatePresence>{toasts.map(t => (
          <motion.div key={t.id} className="toast" style={{ '--c': t.color }} initial={{ opacity: 0, y: -16, scale: .92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
            <i /><div><b>{t.text}</b><span>{t.sub}</span></div>
          </motion.div>))}</AnimatePresence></div>

        <AnimatePresence>{hud.dock && (
          <motion.div className="g-dock" key={hud.dock.id} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ '--c': hud.dock.color }}>
            <svg width="72" height="72" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="5" /><circle cx="32" cy="32" r="27" fill="none" stroke={hud.dock.color} strokeWidth="5" strokeLinecap="round" strokeDasharray={170} strokeDashoffset={170 * (1 - hud.dock.prog)} transform="rotate(-90 32 32)" /></svg>
            <span>Docking at <b>{hud.dock.label}</b></span><em>Hold position</em>
          </motion.div>)}
        </AnimatePresence>

        {touch && (<>
          <div className="t-left"><button {...hold('tSteer', -1)} aria-label="Steer left">◀</button><button {...hold('tSteer', 1)} aria-label="Steer right">▶</button></div>
          <div className="t-right"><button className="boost-b" {...hold('tBoost', 1)}>BOOST</button><button className="gas" {...hold('tThrottle', 1)}>GAS</button></div>
        </>)}
      </>)}

      <AnimatePresence>{showDone && (
        <motion.div className="g-done" key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="g-done-card" initial={{ y: 40, scale: .95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
            <span className="kicker">Journey complete</span>
            <h2>You explored it all</h2>
            <div className="done-stats">
              <div><b>{SECTIONS.length}/{SECTIONS.length}</b><span>Checkpoints</span></div>
              <div><b>{finalStats ? finalStats.rings : hud.rings}/{hud.ringsTotal}</b><span>Rings</span></div>
              <div><b>{fmt(finalStats ? finalStats.time : hud.playTime)}</b><span>Time</span></div>
            </div>
            <div className="g-start-btns">
              <button className="btn" onClick={() => { setDismissed(true); onOpen('contact'); }}>Let's talk</button>
              <button className="btn ghost" onClick={replay}>Replay</button>
              <button className="btn ghost" onClick={() => { setDismissed(true); skip(); }}>Continue ↓</button>
            </div>
          </motion.div>
        </motion.div>)}
      </AnimatePresence>
    </section>
  );
}
