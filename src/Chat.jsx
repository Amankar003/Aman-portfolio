import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { P } from './data.js';

const first = P.name.split(' ')[0];

function answer(q) {
  const s = ' ' + q.toLowerCase().replace(/[^\p{L}\p{N}+#.\s]/gu, ' ') + ' ';
  const has = (...w) => w.some(x => s.includes(x));
  const word = (...w) => w.some(x => s.includes(' ' + x + ' '));
  const miss = what => ({ text: `${first} hasn't added ${what} here yet. You can ask directly through the contact section.`, open: 'contact' });

  for (const p of P.projects) if ([p.title.toLowerCase(), ...(p.aliases || [])].some(k => s.includes(k)))
    return { text: `${p.title}: ${p.desc} Built with ${p.tags.join(', ')}.${p.live ? ' Live demo: ' + p.live : ''}${p.code ? ' Code: ' + p.code : ''}`, open: 'projects' };
  for (const g of P.skills) for (const n of g.items) { const k = n.toLowerCase(); if (k.length > 3 ? s.includes(k) : s.includes(' ' + k + ' ')) return { text: `${n} is part of ${first}'s ${g.group} skills.`, open: 'skills' }; }
  if (word('thanks', 'thank', 'thx', 'shukriya', 'dhanyavad')) return { text: "Happy to help! Anything else you'd like to know?" };
  if (word('bye', 'goodbye', 'alvida')) return { text: `Thanks for stopping by.${P.email ? ' You can reach ' + first + ' at ' + P.email + '.' : ''}` };
  if (has('more project', 'all project', 'other project', 'github', 'repo')) return { text: `More of ${first}'s work, 90+ repositories, is on GitHub: ${P.githubRepos}`, open: 'projects' };
  if (has('what do you do', 'services', 'what can you', 'offer', 'help with', 'work together')) return { text: P.services.map(s => `• ${s.title}: ${s.desc}`).join('\n'), open: 'about' };
  if (P.studio && has('buildlyst', 'agency', 'studio', 'company of'))
    return { text: `${P.studio.name}: ${P.studio.line} ${P.studio.url}`, open: 'about' };
  if (has('experience', 'job', 'intern', 'company', 'career', 'worked', 'kaam kiya', 'anubhav', 'codaris', '3fi', 'current', 'right now', 'working', 'work now', 'works at', 'work at'))
    return P.experience.length ? { text: `${first}'s experience:\n` + P.experience.map(e => `• ${e.role} at ${e.org}${e.period ? ' (' + e.period + ')' : ''}`).join('\n'), open: 'about' } : miss('work experience details');
  if (has('achievement', 'hackathon', 'sih', 'smart india', 'award', 'winner', 'finalist', 'competition'))
    return P.achievements.length ? { text: P.achievements.map(a => '• ' + a).join('\n'), open: 'about' } : miss('achievements');
  if (has('certif', 'course', 'bcg', 'accenture'))
    return P.certifications.length ? { text: P.certifications.map(c => `• ${c.title}: ${c.desc}`).join('\n'), open: 'about' } : miss('certifications');
  if (has('education', 'college', 'university', 'degree', 'study', 'studied', 'padhai', 'qualification'))
    return P.education.length ? { text: 'Education:\n' + P.education.map(e => `• ${e.role}, ${e.org} (${e.period})`).join('\n'), open: 'about' } : miss('education details');
  if (has('available', 'availability', 'freelance', 'hire', 'hiring', 'opportunit', 'open to', 'rate', 'price', 'charge') || word('kaam'))
    return P.availability ? { text: `${P.availability}${P.email ? ' The best way to start is an email: ' + P.email + '.' : ''}`, open: 'contact' } : miss('availability details');
  if (has('contact', 'email', 'mail', 'phone', 'reach', 'linkedin', 'instagram', 'social', 'connect', 'sampark', 'number')) {
    const lines = [...(P.email ? ['Email: ' + P.email] : []), ...P.social.filter(x => x[1]).map(x => `${x[0]}: ${x[1]}`)];
    return lines.length ? { text: lines.join('\n'), open: 'contact' } : miss('contact details');
  }
  if (has('skill', 'tech', 'stack', 'language', 'tool', 'know', 'expert', 'good at', 'aata', 'jaanta', 'jante'))
    return { text: P.skills.map(g => `${g.group}: ${g.items.join(', ')}`).join('\n'), open: 'skills' };
  if (has('project', 'built', 'build', 'made', 'portfolio', 'sample', 'banaya', 'banaye') || word('work', 'works'))
    return { text: `Projects by ${first}:\n` + P.projects.map(p => `• ${p.title}: ${p.desc}`).join('\n'), open: 'projects' };
  if (has('gallery', 'photo', 'image', 'design', 'poster', 'edit', 'picture'))
    return { text: `The gallery has ${P.gallery.length} pieces: ${P.gallery.map(g => g.title).join(', ')}.`, open: 'gallery' };
  if (has('where', 'location', 'city', 'live in', 'based', 'rehta', 'kahan', 'kaha') || word('from'))
    return P.location ? { text: `${first} is based in ${P.location}.` } : miss('a location');
  if (s.includes(first.toLowerCase()) || has('yourself', 'who are you', 'who r u', 'introduce', 'about you', 'about him', 'about the developer', 'owner', 'kaun ho', 'apne bare', 'tumhare bare', 'aapke bare', 'intro', 'your name', 'aapka naam', 'tera naam', 'tumhara naam', 'whose portfolio'))
    return { text: `${P.name} works as ${P.role}${P.location ? ' and is based in ' + P.location : ''}. ${P.about[0]}`, open: 'about' };
  if (word('hi', 'hello', 'hey', 'hii', 'hola', 'namaste', 'namaskar', 'yo') || has('good morning', 'good evening'))
    return { text: `Hi! I can tell you about ${first}'s skills, projects, experience, gallery or contact details. What would you like to know?` };
  return { text: `I can only answer questions about ${P.name}: skills, projects, experience, education, achievements, gallery, availability and contact details. Try one of those.` };
}

const CHIPS = ['Skills', 'Projects', 'Experience', 'Achievements', 'Contact'];

export default function Chat({ open, setOpen, onOpenPanel }) {
  const [msgs, setMsgs] = useState([]); const [val, setVal] = useState(''); const [typing, setTyping] = useState(false);
  const end = useRef(null); const input = useRef(null);
  useEffect(() => { if (open && !msgs.length) setMsgs([{ who: 'bot', text: `Hi! I'm ${first}'s assistant. Ask me about skills, projects, experience, achievements, or how to get in touch.` }]); if (open) setTimeout(() => input.current && input.current.focus(), 250); }, [open]);
  useEffect(() => { end.current && end.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing]);
  const ask = q => {
    setMsgs(m => [...m, { who: 'me', text: q }]); setTyping(true);
    const r = answer(q); setTimeout(() => { setTyping(false); setMsgs(m => [...m, { who: 'bot', ...r }]); }, 550);
  };
  return (<>
    <motion.button className="fab" onClick={() => setOpen(!open)} whileHover={{ scale: 1.08 }} whileTap={{ scale: .94 }} aria-label="Chat with the assistant" aria-expanded={open}>
      <AnimatePresence mode="wait"><motion.svg key={open ? 'x' : 'c'} width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: .18 }}>
        {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />}
      </motion.svg></AnimatePresence>
    </motion.button>
    <AnimatePresence>{open && (
      <motion.section className="chat" role="dialog" aria-label="Chat assistant" initial={{ opacity: 0, y: 24, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
        <header><div className="av"><img src={P.photo} alt="" /></div><div><b>Ask about {first}</b><small>Answers only about this portfolio</small></div></header>
        <div className="msgs" aria-live="polite">
          {msgs.map((m, i) => (
            <motion.div key={i} className={'m ' + m.who} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {m.text}{m.open ? <button className="btn sm" onClick={() => { onOpenPanel(m.open); setOpen(false); }}>Open {m.open}</button> : null}
            </motion.div>
          ))}
          {typing && <div className="m bot typing"><i /><i /><i /></div>}
          <div ref={end} />
        </div>
        <div className="chips">{CHIPS.map(c => <button key={c} type="button" onClick={() => ask(c)}>{c}</button>)}</div>
        <form onSubmit={e => { e.preventDefault(); const v = val.trim(); if (v) { setVal(''); ask(v); } }}>
          <input ref={input} value={val} onChange={e => setVal(e.target.value)} placeholder="Ask about skills, projects…" aria-label="Your question" />
          <button className="btn" type="submit">Send</button>
        </form>
      </motion.section>
    )}</AnimatePresence>
  </>);
}
