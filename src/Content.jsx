import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { P } from './data.js';
import { Reveal, SpotlightCard, Magnet, TiltedCard, BlurText } from './fx.jsx';

const LANG = { Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', 'Jupyter Notebook': '#DA5B0B', CSS: '#563d7c' };
const nice = n => n.replace(/[-_]+/g, ' ').replace(/\s+$/, '');

const ICONS = {
  agent: <><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" /><path d="M12 7.2v4.3M12 11.5L6.3 16M12 11.5l5.7 4.5" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 15l3.5-4 3 2.5L19 7" /></>,
  cloud: <><path d="M7 18a4 4 0 0 1-.6-7.9A5.5 5.5 0 0 1 17 9.5a3.8 3.8 0 0 1 0 8.5z" /></>
};
export const Icon = ({ name }) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>;

export function Services() {
  return (
    <div className="svc">{P.services.map((s, i) => (
      <Reveal key={i} delay={i * .08}>
        <SpotlightCard className="svc-card" color="rgba(255,184,107,.18)">
          <span className="svc-ic"><Icon name={s.icon} /></span>
          <h4>{s.title}</h4><p>{s.desc}</p>
          <div className="tags">{s.tags.map(t => <span key={t}>{t}</span>)}</div>
        </SpotlightCard>
      </Reveal>
    ))}</div>
  );
}

export function ProjectCards({ limit }) {
  const list = P.projects.slice(0, limit || P.projects.length);
  return (
    <div className="cards">{list.map((p, i) => (
      <Reveal key={p.title} delay={(i % 3) * .08}>
        <SpotlightCard className="card" color="rgba(185,168,255,.2)">
          <div className="card-top"><span className="n">0{i + 1}</span><span className="kind">{p.kind}</span></div>
          <h4>{p.title}</h4><p>{p.desc}</p>
          {p.points ? <ul className="pts">{p.points.map((x, k) => <li key={k}>{x}</li>)}</ul> : null}
          <div className="tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div>
          <div className="plinks">{p.live ? <a href={p.live} target="_blank" rel="noopener">Live demo ↗</a> : null}{p.code ? <a href={p.code} target="_blank" rel="noopener">View on GitHub ↗</a> : null}</div>
        </SpotlightCard>
      </Reveal>
    ))}</div>
  );
}

export function GithubFeed({ limit = 9 }) {
  const fallback = P.moreRepos.map(([name, language]) => ({ name, language, html_url: `${P.github}/${name}`, description: '' }));
  const [repos, setRepos] = useState(fallback); const [live, setLive] = useState(false);
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const cached = sessionStorage.getItem('gh-repos');
        let data = cached ? JSON.parse(cached) : null;
        if (!data) { const r = await fetch(`https://api.github.com/users/${P.githubUser}/repos?per_page=100&sort=updated`); if (!r.ok) throw new Error('gh ' + r.status); data = await r.json(); sessionStorage.setItem('gh-repos', JSON.stringify(data.map(d => ({ name: d.name, language: d.language, html_url: d.html_url, description: d.description, fork: d.fork, pushed_at: d.pushed_at })))); data = JSON.parse(sessionStorage.getItem('gh-repos')); }
        const feat = new Set(P.projects.map(p => (p.code || '').split('/').pop().toLowerCase()));
        const list = data.filter(d => !d.fork && d.name !== P.githubUser && !d.name.includes('.github.io') && !feat.has(d.name.toLowerCase())).slice(0, limit);
        if (!dead && list.length) { setRepos(list); setLive(true); }
      } catch (e) { /* keep static fallback */ }
    })();
    return () => { dead = true; };
  }, [limit]);
  return (
    <div>
      <div className="gh-head"><h3>More from GitHub</h3>{live ? <span className="livepill"><i />Live from GitHub</span> : null}</div>
      <div className="gh-grid">{repos.slice(0, limit).map((r, i) => (
        <Reveal key={r.name} delay={(i % 3) * .06}>
          <SpotlightCard as="a" className="gh-card" href={r.html_url} target="_blank" rel="noopener" color="rgba(127,214,224,.16)">
            <b>{nice(r.name)}</b>
            <p>{r.description || (r.language ? r.language + ' repository' : 'Repository')}</p>
            <span className="gh-lang"><i style={{ background: LANG[r.language] || '#8b93a1' }} />{r.language || 'Code'}<em>↗</em></span>
          </SpotlightCard>
        </Reveal>
      ))}</div>
    </div>
  );
}

export function MoreOnGithub() {
  return (
    <Reveal>
      <SpotlightCard className="more" color="rgba(255,184,107,.2)">
        <div><h4>Want to see more?</h4><p>There are 90+ public repositories on my GitHub: ML experiments, RAG and agent projects, full-stack apps and data analysis notebooks.</p></div>
        <Magnet strength={.2}><a className="btn" href={P.githubRepos} target="_blank" rel="noopener">View more projects on GitHub ↗</a></Magnet>
      </SpotlightCard>
    </Reveal>
  );
}

export function Timeline({ items }) {
  return (
    <ul className="tl">{items.map((e, i) => (
      <Reveal as="li" key={i} delay={i * .06}>
        <b>{e.role}</b><span>{e.org}{e.period ? ' · ' + e.period : ''}</span>
        {e.points ? <ul className="pts">{e.points.map((x, k) => <li key={k}>{x}</li>)}</ul> : e.desc ? <p>{e.desc}</p> : null}
      </Reveal>
    ))}</ul>
  );
}

export function SkillGroups() {
  return P.skills.map((g, gi) => (
    <div className="grp" key={gi}>
      <Reveal as="h3" delay={gi * .05}>{g.group}</Reveal>
      <motion.div className="chips2" initial="hide" whileInView="show" viewport={{ once: true, margin: '-8% 0px' }} variants={{ show: { transition: { staggerChildren: .03 } } }}>
        {g.items.map(n => <motion.span key={n} className="chip2" whileHover={{ y: -3, scale: 1.05 }} variants={{ hide: { opacity: 0, y: 14, scale: .9 }, show: { opacity: 1, y: 0, scale: 1 } }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>{n}</motion.span>)}
      </motion.div>
    </div>
  ));
}
