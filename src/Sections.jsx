import React from 'react';
import { P } from './data.js';
import { Reveal, BlurText } from './fx.jsx';
import { Services, ProjectCards, GithubFeed, MoreOnGithub, Timeline, SkillGroups } from './Content.jsx';

const Head = ({ kicker, title, sub }) => (
  <div className="sec-head">
    <Reveal><span className="kicker">{kicker}</span></Reveal>
    <h2><BlurText text={title} delay={.06} /></h2>
    {sub ? <Reveal delay={.15}><p>{sub}</p></Reveal> : null}
  </div>
);

export function WhatIDo() {
  return (<section className="sec" id="services"><div className="sec-in">
    <Head kicker="What I do" title="Intelligent systems, built end to end" sub="I work across the whole stack of an AI product, from the data and the model to the API it ships behind." />
    <Services />
  </div></section>);
}
export function Work() {
  return (<section className="sec alt" id="work"><div className="sec-in">
    <Head kicker="Selected work" title="Projects I'm proud of" sub="A mix of RAG systems, multi-agent workflows, ML models and AI products. Every card links to its code on GitHub." />
    <ProjectCards limit={6} />
    <div style={{ height: 36 }} /><GithubFeed limit={9} /><div style={{ height: 28 }} /><MoreOnGithub />
  </div></section>);
}
export function Experience() {
  return (<section className="sec" id="experience"><div className="sec-in narrow">
    <Head kicker="Experience" title="Where I've been building" />
    <Timeline items={P.experience} />
    <h3 className="sub">Education</h3><Timeline items={P.education} />
    <h3 className="sub">Achievements</h3>
    <ul className="bul">{P.achievements.map((a, i) => <Reveal as="li" key={i} delay={i * .06}>{a}</Reveal>)}</ul>
  </div></section>);
}
export function Toolbox() {
  return (<section className="sec alt" id="toolbox"><div className="sec-in">
    <Head kicker="Toolbox" title="Skills I work with every day" />
    <SkillGroups />
    <h3 className="sub">Certifications</h3>
    <ul className="bul">{P.certifications.map((c, i) => <Reveal as="li" key={i} delay={i * .06}><b>{c.title}</b><br /><span className="note">{c.desc}</span></Reveal>)}</ul>
  </div></section>);
}
