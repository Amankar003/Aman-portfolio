import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useInView, animate, AnimatePresence } from 'framer-motion';

/* React-Bits style animation primitives (framer-motion based) */

export function BlurText({ text, className = '', delay = 0.07, as = 'span', style, startDelay = 0 }) {
  const ref = useRef(null); const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const words = text.split(' ');
  return React.createElement(as, { ref, className, style: { display: 'inline-flex', flexWrap: 'wrap', columnGap: '0.28em', ...style } },
    words.map((w, i) => (
      <span key={i} className="bt" style={{ opacity: inView ? undefined : 0, animation: inView ? `blurIn .8s cubic-bezier(.22,1,.36,1) ${(startDelay + i * delay).toFixed(2)}s both` : 'none' }}>{w}</span>
    )));
}

export function SplitText({ text, className = '', delay = .035, style, startDelay = 0 }) {
  const ref = useRef(null); const inView = useInView(ref, { once: true });
  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '.08em', ...style }} aria-label={text}>
      {[...text].map((c, i) => (
        <motion.span key={i} aria-hidden style={{ display: 'inline-block', whiteSpace: 'pre' }}
          initial={{ y: '110%', rotate: 6, opacity: 0 }} animate={inView ? { y: '0%', rotate: 0, opacity: 1 } : undefined}
          transition={{ type: 'spring', stiffness: 140, damping: 16, delay: startDelay + i * delay }}>{c}</motion.span>
      ))}
    </span>
  );
}

export const ShinyText = ({ children, className = '' }) => <span className={'shiny ' + className}>{children}</span>;

export function Magnet({ children, strength = .35, className = '' }) {
  const ref = useRef(null); const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 14 }), sy = useSpring(y, { stiffness: 220, damping: 14 });
  return (
    <motion.div ref={ref} className={className} style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={e => { const r = ref.current.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * strength); y.set((e.clientY - r.top - r.height / 2) * strength); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}>{children}</motion.div>
  );
}

export function TiltedCard({ children, className = '', max = 11, scale = 1.03, style }) {
  const ref = useRef(null); const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 16 }), sry = useSpring(ry, { stiffness: 160, damping: 16 });
  const [hover, setHover] = useState(false);
  return (
    <motion.div ref={ref} className={'tilt ' + className} style={{ rotateX: srx, rotateY: sry, transformPerspective: 900, ...style }} animate={{ scale: hover ? scale : 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      onMouseEnter={() => setHover(true)}
      onMouseMove={e => { const r = ref.current.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; ry.set(px * max * 2); rx.set(-py * max * 2); ref.current.style.setProperty('--sx', (px + .5) * 100 + '%'); ref.current.style.setProperty('--sy', (py + .5) * 100 + '%'); }}
      onMouseLeave={() => { setHover(false); rx.set(0); ry.set(0); }}>
      {children}<span className="tilt-shine" />
    </motion.div>
  );
}

export function SpotlightCard({ children, className = '', color = 'rgba(255,184,107,.18)', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  return (
    <Tag ref={ref} className={'spot ' + className} {...rest} style={{ '--spot': color, ...(rest.style || {}) }}
      onMouseMove={e => { const r = ref.current.getBoundingClientRect(); ref.current.style.setProperty('--mx', e.clientX - r.left + 'px'); ref.current.style.setProperty('--my', e.clientY - r.top + 'px'); }}>
      {children}
    </Tag>
  );
}

export function CountUp({ to, suffix = '', duration = 1.8 }) {
  const ref = useRef(null); const inView = useInView(ref, { once: true }); const [v, setV] = useState(0);
  useEffect(() => { if (!inView) return; const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: n => setV(Math.round(n)) }); return () => c.stop(); }, [inView, to, duration]);
  return <span ref={ref}>{v}{suffix}</span>;
}

export function Marquee({ items, speed = 38 }) {
  const row = [...items, ...items];
  return (
    <div className="marquee"><div className="marquee-track" style={{ animationDuration: speed + 's' }}>
      {row.concat(row).map((t, i) => <span key={i}>{t}<i>◆</i></span>)}
    </div></div>
  );
}

export function Reveal({ children, delay = 0, y = 28, className = '', as = 'div', ...rest }) {
  const M = motion[as] || motion.div;
  return <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-6% 0px' }} transition={{ duration: .65, delay, ease: [.22, 1, .36, 1] }} {...rest}>{children}</M>;
}

export function RotatingText({ words, interval = 2300 }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n + 1) % words.length), interval); return () => clearInterval(t); }, [words, interval]);
  return (
    <span className="rot"><AnimatePresence mode="wait">
      <motion.span key={words[i]} initial={{ y: '90%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-90%', opacity: 0 }} transition={{ duration: .42, ease: 'easeOut' }}>{words[i]}</motion.span>
    </AnimatePresence></span>
  );
}

export function Terminal({ lines, speed = 22 }) {
  const [n, setN] = useState(0); const [c, setC] = useState(0);
  const ref = useRef(null); const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return; if (n >= lines.length) { const t = setTimeout(() => { setN(0); setC(0); }, 3200); return () => clearTimeout(t); }
    if (c < lines[n].t.length) { const t = setTimeout(() => setC(c + 1), speed); return () => clearTimeout(t); }
    const t = setTimeout(() => { setN(n + 1); setC(0); }, lines[n].pause ?? 380); return () => clearTimeout(t);
  }, [inView, n, c, lines, speed]);
  return (
    <div ref={ref} className="term">
      <div className="term-bar"><i /><i /><i /><span>pipeline.py</span></div>
      <pre>{lines.slice(0, n).map((l, i) => <div key={i} className={l.cls}>{l.t}</div>)}{n < lines.length && <div className={lines[n].cls}>{lines[n].t.slice(0, c)}<b className="caret" /></div>}</pre>
    </div>
  );
}

export function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <motion.i style={{ background: '#ff8a3d' }} animate={{ x: [0, 90, -40, 0], y: [0, 40, -30, 0], scale: [1, 1.2, .95, 1] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.i style={{ background: '#6a5cff', left: '55%', top: '10%' }} animate={{ x: [0, -80, 50, 0], y: [0, 60, -20, 0], scale: [1, .9, 1.25, 1] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.i style={{ background: '#1fc7d4', left: '30%', top: '60%' }} animate={{ x: [0, 60, -60, 0], y: [0, -40, 30, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}
