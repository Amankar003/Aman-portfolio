/**
 * Section-based layout components for organized portfolio sections
 * Each section has its own visual theme and interactive elements
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { P } from './data.js';

/**
 * Container for organized sections
 */
export function SectionContainer({ children, bgColor = 'var(--bg)', minHeight = '100svh' }) {
  return (
    <section
      style={{
        background: bgColor,
        minHeight,
        padding: '80px clamp(20px, 5vw, 84px)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

/**
 * Section header with title and description
 */
export function SectionHeader({ title, subtitle, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{
        marginBottom: '60px',
        textAlign: 'center'
      }}
    >
      {icon && <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>}
      <h2
        style={{
          fontFamily: 'var(--display)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          marginBottom: '12px'
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: '#a9afb8',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Card component with hover effects
 */
export function Card({ children, onClick, style = {} }) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(255,184,107,.15)' }}
      onClick={onClick}
      style={{
        background: 'rgba(14, 18, 26, 0.62)',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: '20px',
        padding: '24px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * About Section with profile info
 */
export function AboutSection() {
  return (
    <SectionContainer bgColor='linear-gradient(135deg, rgba(15, 18, 26, 0.8), rgba(20, 24, 35, 0.6))'>
      <SectionHeader title="About Me" subtitle="Learn about my journey and expertise" icon="👤" />
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <img
              src={P.photo}
              alt={P.name}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: '50% 18%',
                border: '4px solid #ffb86b',
                marginBottom: '24px'
              }}
            />
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{P.name}</h2>
            <p style={{ color: '#ffb86b', fontSize: '18px', fontWeight: 600 }}>{P.role}</p>
            
            <div style={{ margin: '32px 0', padding: '24px', background: 'rgba(255, 184, 107, 0.05)', borderRadius: '16px' }}>
              <p style={{ color: '#c9c5bf', lineHeight: '1.8', marginBottom: '16px' }}>
                {P.tagline}
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {P.facts?.map((fact, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '16px', background: 'rgba(127, 214, 224, 0.05)', borderRadius: '12px' }}>
                  <p style={{ color: '#ffb86b', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{fact[0]}</p>
                  <p style={{ color: '#f4efe9', fontSize: '14px', lineHeight: '1.5' }}>{fact[1]}</p>
                </div>
              ))}
            </div>
            
            <div style={{ marginBottom: '32px', textAlign: 'left' }}>
              <h4 style={{ color: '#7fd6e0', fontSize: '18px', marginBottom: '16px' }}>Professional Background</h4>
              {P.about?.map((paragraph, i) => (
                <p key={i} style={{ color: '#c9c5bf', marginBottom: '16px', lineHeight: '1.7' }}>
                  {paragraph}
                </p>
              ))}
            </div>
            
            <div style={{ padding: '24px', background: 'rgba(185, 168, 255, 0.05)', borderRadius: '16px' }}>
              <p style={{ color: '#c9c5bf', lineHeight: '1.6' }}>
                I'm passionate about building intelligent systems that solve real-world problems. 
                With experience in AI/ML engineering, RAG systems, and multi-agent workflows, 
                I focus on delivering production-ready solutions that drive business value.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </SectionContainer>
  );
}

/**
 * Skills Section
 */
export function SkillsSection() {
  return (
    <SectionContainer bgColor='linear-gradient(135deg, rgba(20, 24, 35, 0.6), rgba(15, 18, 26, 0.8))'>
      <SectionHeader title="Skills & Expertise" subtitle="Technologies and methodologies I work with daily" icon="⚡" />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {P.skills?.map((group, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <Card>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600, color: '#7fd6e0' }}>
                {group.group}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {group.items?.map((skill, j) => (
                  <motion.span
                    key={j}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      background: 'rgba(127, 214, 224, 0.1)',
                      border: '1px solid rgba(127, 214, 224, 0.3)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#7fd6e0',
                      fontWeight: 500
                    }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}

/**
 * Projects Section
 */
export function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <SectionContainer bgColor='linear-gradient(135deg, rgba(15, 18, 26, 0.8), rgba(20, 24, 35, 0.6))'>
      <SectionHeader title="Featured Projects" subtitle="AI/ML systems and applications I've built" icon="🚀" />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {P.projects?.slice(0, 6).map((project, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <Card
              onClick={() => setSelectedProject(project)}
              style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#b9a8ff' }}>
                {project.title}
              </h3>
              <p style={{ color: '#ffb86b', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                {project.kind}
              </p>
              <p style={{ color: '#c9c5bf', lineHeight: '1.6', marginBottom: '16px', flex: 1 }}>
                {project.desc}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {project.tags?.slice(0, 3).map((tag, j) => (
                  <span
                    key={j}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      background: 'rgba(185, 168, 255, 0.15)',
                      color: '#b9a8ff',
                      borderRadius: '4px',
                      border: '1px solid rgba(185, 168, 255, 0.3)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {project.code && (
                <a
                  href={project.code}
                  target="_blank"
                  rel="noopener"
                  style={{
                    marginTop: '12px',
                    color: '#b9a8ff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  View on GitHub →
                </a>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal for selected project */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedProject(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(14, 18, 26, 0.95)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              backdropFilter: 'blur(14px)'
            }}
          >
            <h2 style={{ marginBottom: '8px' }}>{selectedProject.title}</h2>
            <p style={{ color: '#ffb86b', marginBottom: '16px', fontWeight: 600 }}>{selectedProject.kind}</p>
            <p style={{ color: '#c9c5bf', lineHeight: '1.7', marginBottom: '16px' }}>{selectedProject.desc}</p>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '8px' }}>Highlights:</h4>
              <ul style={{ color: '#c9c5bf', paddingLeft: '20px' }}>
                {selectedProject.points?.map((point, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {selectedProject.tags?.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(185, 168, 255, 0.15)',
                    color: '#b9a8ff',
                    borderRadius: '20px',
                    fontSize: '12px',
                    border: '1px solid rgba(185, 168, 255, 0.3)'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            {selectedProject.code && (
              <a
                href={selectedProject.code}
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#b9a8ff',
                  color: '#14100b',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  marginRight: '8px'
                }}
              >
                View Code
              </a>
            )}
            <button
              onClick={() => setSelectedProject(null)}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </SectionContainer>
  );
}

/**
 * Experience Section
 */
export function ExperienceSection() {
  return (
    <SectionContainer bgColor='linear-gradient(135deg, rgba(20, 24, 35, 0.6), rgba(15, 18, 26, 0.8))'>
      <SectionHeader title="Professional Experience" subtitle="My career journey and roles" icon="📈" />
      
      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {P.experience?.map((exp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <Card style={{ borderLeft: '4px solid #ffb86b' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                {exp.role}
              </h3>
              <p style={{ color: '#ffb86b', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                {exp.org}
              </p>
              {exp.period && (
                <p style={{ color: '#a9afb8', fontSize: '13px', marginBottom: '12px' }}>
                  {exp.period}
                </p>
              )}
              {exp.points && (
                <ul style={{ color: '#c9c5bf', paddingLeft: '20px' }}>
                  {exp.points.map((point, j) => (
                    <li key={j} style={{ marginBottom: '8px', lineHeight: '1.6' }}>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}

/**
 * Gallery Section
 */
export function GallerySection() {
  const [fullscreenImage, setFullscreenImage] = useState(null);

  return (
    <SectionContainer bgColor='linear-gradient(135deg, rgba(15, 18, 26, 0.8), rgba(20, 24, 35, 0.6))'>
      <SectionHeader title="Gallery & Achievements" subtitle="Moments and milestones" icon="📸" />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '60px' }}>
        {P.gallery?.map((photo, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFullscreenImage(photo.image)}
            style={{
              cursor: 'pointer',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '4/3',
              background: 'rgba(127, 214, 224, 0.1)',
              border: '1px solid rgba(127, 214, 224, 0.2)'
            }}
          >
            <img
              src={photo.image}
              alt={photo.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
            />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {P.achievements?.map((achievement, i) => (
          <Card key={i}>
            <p style={{ color: '#ffd700', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              🏆 Achievement
            </p>
            <p style={{ lineHeight: '1.6' }}>{achievement}</p>
          </Card>
        ))}
      </div>

      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            src={fullscreenImage}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          />
        </motion.div>
      )}
    </SectionContainer>
  );
}

/**
 * Contact Section
 */
export function ContactSection() {
  return (
    <SectionContainer bgColor='linear-gradient(135deg, rgba(20, 24, 35, 0.6), rgba(15, 18, 26, 0.8))'>
      <SectionHeader title="Let's Connect" subtitle="Reach out for collaboration or inquiries" icon="💬" />
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Card style={{ textAlign: 'center' }}>
          {P.email && (
            <motion.a
              href={`mailto:${P.email}`}
              whileHover={{ scale: 1.05 }}
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: '#ffb86b',
                color: '#14100b',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                marginBottom: '24px'
              }}
            >
              Send Email
            </motion.a>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginTop: '24px' }}>
            {P.social?.map((link, i) => (
              <motion.a
                key={i}
                href={link[1]}
                target="_blank"
                rel="noopener"
                whileHover={{ y: -4 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  background: 'rgba(127, 214, 224, 0.1)',
                  border: '1px solid rgba(127, 214, 224, 0.3)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#7fd6e0',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
              >
                {link[0]} ↗
              </motion.a>
            ))}
          </div>
        </Card>
      </div>
    </SectionContainer>
  );
}
