import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { P, SECTIONS } from './data.js';
import { BlurText, Reveal, SpotlightCard, TiltedCard, Magnet } from './fx.jsx';
import { Services, ProjectCards, GithubFeed, MoreOnGithub, Timeline, SkillGroups } from './Content.jsx';

function About() {
  const facts = [...(P.location ? [['Based in', P.location]] : []), ...P.facts];
  return (<>
    <div className="about">
      <Reveal><TiltedCard className="photo"><img src={P.aboutPhoto || P.photo} alt={P.name} /></TiltedCard></Reveal>
      <div>
        <Reveal><div className="role">{P.role}</div></Reveal>
        {P.about.map((p, i) => <BlurText key={i} as="p" text={p} delay={.02} startDelay={i * .3} />)}
        {facts.length ? <dl className="facts">{facts.map((f, i) => <Reveal key={i} delay={i * .05}><div><dt>{f[0]}</dt><dd>{f[1]}</dd></div></Reveal>)}</dl> : null}
      </div>
    </div>
    {P.studio && <Reveal><SpotlightCard as="a" className="studio" href={P.studio.url} target="_blank" rel="noopener"><span className="n">Studio</span><h4>{P.studio.name}</h4><p>{P.studio.line}</p><em>{P.studio.url.replace('https://', '')} ↗</em></SpotlightCard></Reveal>}
    <h3>What I do</h3><Services />
    {P.experience.length ? <><h3>Experience</h3><Timeline items={P.experience} /></> : null}
    {P.education.length ? <><h3>Education</h3><Timeline items={P.education} /></> : null}
    {(P.achievements || []).length ? <><h3>Achievements</h3><ul className="bul">{P.achievements.map((a, i) => <Reveal as="li" key={i} delay={i * .06}>{a}</Reveal>)}</ul></> : null}
    {(P.certifications || []).length ? <><h3>Certifications</h3><ul className="bul">{P.certifications.map((c, i) => <Reveal as="li" key={i} delay={i * .06}><b>{c.title}</b><br /><span className="note">{c.desc}</span></Reveal>)}</ul></> : null}
  </>);
}

function Skills() { return <SkillGroups />; }

function Projects() {
  return (<>
    <ProjectCards />
    <div style={{ height: 30 }} /><GithubFeed limit={9} /><div style={{ height: 24 }} /><MoreOnGithub />
  </>);
}

function Gallery({ onZoom }) {
  return (
    <div className="grid">{P.gallery.map((g, i) => (
      <Reveal key={i} delay={i * .06}>
        <TiltedCard className="tile" max={9}><button onClick={() => onZoom(i)} aria-label={'Open ' + g.title}>
          <img src={g.image} alt={g.title} /><span>{g.title}</span></button></TiltedCard>
      </Reveal>
    ))}</div>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const soc = P.social.filter(s => s[1]);
  const copy = async () => { try { await navigator.clipboard.writeText(P.email); } catch (e) { /* ignore */ } setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (<>
    <h3 className="big"><BlurText text="Let's build something intelligent together." delay={.05} /></h3>
    {P.email ? <Reveal className="mailrow"><a href={'mailto:' + P.email}>{P.email}</a><Magnet strength={.25}><button className="btn ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button></Magnet></Reveal> : null}
    <div className="rows">{soc.map((s, i) => (
      <Reveal key={i} delay={i * .06}><SpotlightCard as="a" className="row" href={s[1]} target="_blank" rel="noopener"><b>{s[0]}</b><span>{s[1].replace('https://', '')} ↗</span></SpotlightCard></Reveal>
    ))}</div>
    {P.email ? <><h3>Send a message</h3>
      <form className="cform" onSubmit={e => { e.preventDefault(); const f = e.target; location.href = `mailto:${P.email}?subject=${encodeURIComponent('Hello from your portfolio')}&body=${encodeURIComponent(f.m.value + '\n\n' + f.n.value)}`; }}>
        <input name="n" placeholder="Your name" required aria-label="Your name" />
        <textarea name="m" placeholder="What are you building?" required aria-label="Message" />
        <Magnet strength={.2}><button className="btn" type="submit">Send by email</button></Magnet>
      </form></> : null}
    <h3>Ways we can work together</h3>
    <div className="chips2">{['RAG chatbots', 'AI agents', 'ML models', 'Data pipelines', 'API development', 'Deployment'].map(t => <span key={t} className="chip2">{t}</span>)}</div>
    {P.availability ? <p style={{ marginTop: 16 }}>{P.availability}</p> : null}
  </>);
}

export default function PanelHost({ id, onClose }) {
  const [shown, setShown] = useState(id); const [zoom, setZoom] = useState(null);
  useEffect(() => { if (id) setShown(id); }, [id]);
  useEffect(() => {
    if (!id) return; const k = e => { if (e.key === 'Escape') { if (zoom !== null) setZoom(null); else onClose(); } };
    addEventListener('keydown', k); document.body.classList.add('lock'); return () => { removeEventListener('keydown', k); document.body.classList.remove('lock'); };
  }, [id, zoom, onClose]);
  const sec = SECTIONS.find(s => s.id === shown) || SECTIONS[0];
  const body = { about: <About />, skills: <Skills />, projects: <Projects />, gallery: <Gallery onZoom={setZoom} />, contact: <Contact /> }[shown];
  return (<>
    <AnimatePresence>
      {id && (
        <motion.div key="bg" className="panel-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }} onClick={onClose}>
          <motion.div className="sheet" style={{ '--acc': sec.color }} role="dialog" aria-modal="true" aria-label={sec.board}
            initial={{ y: 70, opacity: 0, scale: .96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: .98 }} transition={{ type: 'spring', stiffness: 240, damping: 28 }} onClick={e => e.stopPropagation()}>
            <header><h2><i />{sec.board}</h2><button className="x" onClick={onClose} aria-label="Close">✕</button></header>
            <div className="sheet-body" key={shown}>{body}</div>
          </motion.div>
          <AnimatePresence>
            {zoom !== null && (
              <motion.div className="lightbox" key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { e.stopPropagation(); setZoom(null); }}>
                <motion.img initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} src={P.gallery[zoom].image} alt={P.gallery[zoom].title} />
                <span>{P.gallery[zoom].title}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  </>);
}
