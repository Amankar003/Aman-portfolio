import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { P, SECTIONS } from './data.js';
import { Magnet, BlurText, Marquee, Reveal } from './fx.jsx';
import Hero from './Hero.jsx';
import Game from './Game.jsx';
import GameContainer from './GameContainer.jsx';
import PanelHost from './Panels.jsx';
import Chat from './Chat.jsx';
import { WhatIDo, Work, Experience, Toolbox } from './Sections.jsx';
import {
  AboutSection,
  SkillsSection,
  ProjectsSection,
  ExperienceSection,
  GallerySection
} from './SectionLayout.jsx';
import { ContactPage } from './ContactPage.jsx';

class Boundary extends React.Component {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e) { console.error('UI error:', e); }
  componentDidUpdate(prev) { if (this.state.err && prev.reset !== this.props.reset) this.setState({ err: false }); }
  render() { return this.state.err ? (this.props.fallback ?? null) : this.props.children; }
}

function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 1500); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>{show && (
      <motion.div className="splash" key="s" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: .6 }}>
        <motion.div className="mono" initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>AK</motion.div>
        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>{P.name} · {P.role}</motion.span>
        <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
      </motion.div>
    )}</AnimatePresence>
  );
}

function Navbar({ onOpen, onJourney }) {
  const [solid, setSolid] = useState(false), [menu, setMenu] = useState(false);
  useEffect(() => { const f = () => setSolid(scrollY > 30); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f); }, []);
  const go = fn => () => { setMenu(false); fn(); };
  const jump = id => () => { setMenu(false); const el = document.getElementById(id); el && el.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <motion.nav className={'nav' + (solid ? ' solid' : '')} initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .7, delay: 1.2, ease: [.22, 1, .36, 1] }}>
      <a className="brand" href="#home" onClick={() => setMenu(false)}><img src={P.photo} alt="" /><span>{P.name}</span></a>
      <div className={'links' + (menu ? ' open' : '')}>
        <a href="#home" onClick={() => setMenu(false)}>Home</a>
        <button onClick={go(onJourney)}>Journey</button>
        <button onClick={jump('services')}>What I do</button>
        <button onClick={jump('work')}>Work</button>
        <button onClick={jump('experience')}>Experience</button>
        <button onClick={jump('toolbox')}>Skills</button>
        <button onClick={go(() => onOpen('gallery'))}>Gallery</button>
      </div>
      <div className="nav-r">
        <Magnet strength={.25}><button className="btn sm" onClick={() => onOpen('contact')}>Let's Talk</button></Magnet>
        <button className="burger" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu}><i /><i /></button>
      </div>
    </motion.nav>
  );
}

function End({ onOpen }) {
  return (
    <section className="end" id="end">
      <div className="end-in">
        <Reveal><span className="kicker">Thanks for visiting</span></Reveal>
        <h2><BlurText text="Let's build something intelligent." delay={.08} /></h2>
        <Reveal delay={.2}><p>{P.studio ? `Also check out ${P.studio.name}, ${P.studio.line.split('.')[0].replace('My ', 'my ')}.` : ''}</p></Reveal>
        <Reveal delay={.3} className="cta">
          <Magnet><button className="btn" onClick={() => onOpen('contact')}>Start a conversation</button></Magnet>
          {P.studio && <Magnet><a className="btn ghost" href={P.studio.url} target="_blank" rel="noopener">Visit {P.studio.name} ↗</a></Magnet>}
          <Magnet><a className="btn ghost" href={P.githubRepos} target="_blank" rel="noopener">More projects on GitHub ↗</a></Magnet>
        </Reveal>
        <div className="end-links">{P.social.filter(s => s[1]).map(s => <a key={s[0]} href={s[1]} target="_blank" rel="noopener">{s[0]} ↗</a>)}<button onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button></div>
      </div>
      <Marquee items={P.marquee} speed={46} />
      <footer>© {new Date().getFullYear()} {P.name}. Built with React, Three.js and a lot of coffee.</footer>
    </section>
  );
}

export default function App() {
  const [panel, setPanel] = useState(null), [chat, setChat] = useState(false), [gameMode, setGameMode] = useState(false);
  const { scrollYProgress } = useScroll(); const sx = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const open = id => { setChat(false); setPanel(id); };
  const journey = () => setGameMode(true);
  const exitGameMode = () => setGameMode(false);
  
  if (gameMode) {
    return <GameContainer profileData={P} onExit={exitGameMode} />;
  }
  
  return (<>
    <Splash />
    <motion.div className="progress" style={{ scaleX: sx }} />
    <Navbar onOpen={open} onJourney={journey} />
    <Hero onOpen={open} onStart={journey} />
    <Game paused={!!panel} onDock={open} onOpen={open} />
    <AboutSection />
    <SkillsSection />
    <ProjectsSection />
    <ExperienceSection />
    <GallerySection />
    <ContactPage />
    <Boundary reset={panel} fallback={<div className="panel-bg" onClick={() => setPanel(null)}><div className="sheet" style={{ padding: 30 }}><p>Something went wrong while opening this section. Please close and try again.</p><button className="btn" onClick={() => setPanel(null)}>Close</button></div></div>}><PanelHost id={panel} onClose={() => setPanel(null)} /></Boundary>
    <Chat open={chat} setOpen={setChat} onOpenPanel={open} />
  </>);
}
