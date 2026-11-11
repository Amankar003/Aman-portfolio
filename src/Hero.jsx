import React from 'react';
import { motion } from 'framer-motion';
import { P } from './data.js';
import { SplitText, BlurText, ShinyText, Magnet, TiltedCard, CountUp, Marquee, Reveal, RotatingText, Terminal, Aurora } from './fx.jsx';

const LINES = [
  { t: '$ python run_agent.py --task "plan my trip"', cls: 'cmd' },
  { t: '> planner      splitting request into tasks', cls: 'dim' },
  { t: '> retriever    vector search, top_k=5   [ok]', cls: 'ok' },
  { t: '> guardrails   answer grounded in sources [ok]', cls: 'ok' },
  { t: '> response     itinerary ready', cls: 'hi' }
];

export default function Hero({ onOpen, onStart }) {
  return (
    <section className="hero" id="home" onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px"); e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px"); }}>
      <div className="hero-glow" />
      <Aurora /><div className="grid-bg" /><div className="hero-fade" />
      <div className="hero-inner">
        <div className="hero-left">
          <motion.div className="badge" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1, duration: .6 }}>
            <img src={P.photo} alt="" /><ShinyText>{P.role}</ShinyText><i className="live" />
          </motion.div>
          <h1 className="hero-name"><SplitText text={P.name} startDelay={.2} /></h1>
          <motion.p className="hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9 }}>
            I build <RotatingText words={P.rotating} /> that ship to production.
          </motion.p>
          <div className="hero-lines">
            {P.heroLines.map((l, i) => <BlurText key={i} as="p" text={l} delay={.03} startDelay={1 + i * .45} />)}
          </div>
          <motion.div className="cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: .6 }}>
            <Magnet><button className="btn" onClick={onStart}>🎮 Enter 3D Experience<span className="arr">→</span></button></Magnet>
            <Magnet><button className="btn ghost" onClick={() => onOpen('projects')}>View projects</button></Magnet>
          </motion.div>
          <motion.div className="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
            {P.stats.map((s, i) => (
              <div key={i}><b><CountUp to={s.n} suffix={s.suffix} /></b><span>{s.label}</span></div>
            ))}
          </motion.div>
        </div>
        <div className="hero-right">
          <motion.div initial={{ opacity: 0, y: 40, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: .4, duration: .9, ease: [.22, 1, .36, 1] }}>
            <TiltedCard className="portrait">
              <img src={P.photo} alt={P.name} />
              <div className="portrait-cap"><b>{P.name}</b><span>{P.role}</span></div>
            </TiltedCard>
          </motion.div>
          {['RAG', 'LangGraph', 'FastAPI'].map((t, i) => (
            <motion.span key={t} className={'float-chip c' + i} initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1, y: [0, -9, 0] }}
              transition={{ opacity: { delay: 1.2 + i * .2 }, scale: { delay: 1.2 + i * .2, type: 'spring' }, y: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * .6 } }}>{t}</motion.span>
          ))}
          <motion.div className="term-wrap" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: .8 }}>
            <Terminal lines={LINES} />
          </motion.div>
        </div>
      </div>
      <div className="hero-bottom">
        <Marquee items={P.marquee} />
        <button className="scroll-cue" onClick={onStart} aria-label="Scroll to the journey"><i /><span>Scroll to start the journey</span></button>
      </div>
    </section>
  );
}
