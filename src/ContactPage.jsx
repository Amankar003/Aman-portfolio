/**
 * Advanced Contact Page with Interactive Chat Form
 * Similar to Buildlyst design with terminal-style chat interface
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { P } from './data.js';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'bot',
      text: `Hello! I'm Aman's AI Assistant. I'm here to help you get your project started. First, what's your name?`,
      timestamp: new Date()
    }
  ]);
  const [step, setStep] = useState(0); // 0: name, 1: email, 2: subject, 3: message
  const [submitted, setSubmitted] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const steps = [
    { field: 'name', placeholder: 'Enter your name...', question: 'What\'s your name?' },
    { field: 'email', placeholder: 'Enter your email...', question: 'What\'s your email address?' },
    { field: 'subject', placeholder: 'Enter project type...', question: 'What type of project are you interested in? (e.g., AI Agent, RAG System, ML Model)' },
    { field: 'message', placeholder: 'Tell me more...', question: 'Tell me more about your project or inquiry...' }
  ];

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    // Add user message
    const newUserMessage = {
      type: 'user',
      text: currentInput,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, newUserMessage]);

    // Process and update field
    if (step === 0) {
      setName(currentInput);
    } else if (step === 1) {
      setEmail(currentInput);
    } else if (step === 2) {
      setSubject(currentInput);
    } else if (step === 3) {
      setMessage(currentInput);
    }

    // Add bot response
    let botResponse = '';
    if (step === 0) {
      botResponse = `Nice to meet you, ${currentInput}! 👋 Now, what's your email address?`;
    } else if (step === 1) {
      botResponse = `Thanks, ${name}! ${currentInput} is noted. 📧\n\nWhat type of project are you interested in? (e.g., AI Agent, RAG System, ML Model, MLOps Pipeline)`;
    } else if (step === 2) {
      botResponse = `Interesting! ${currentInput} sounds like a great fit. 🚀\n\nTell me more about your specific requirements or what you'd like to achieve...`;
    } else if (step === 3) {
      botResponse = `Perfect! I've got all the information I need. 🎯\n\nI'll review your request and get back to you shortly. Thank you for reaching out!`;
      setTimeout(() => setSubmitted(true), 1000);
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: botResponse,
        timestamp: new Date()
      }]);
      if (step < 3) setStep(step + 1);
    }, 500);

    setCurrentInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      alert('Please fill all fields');
      return;
    }

    // Send email using EmailJS or your backend
    try {
      // For now, just log and show success
      console.log({ name, email, subject, message });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (submitted) {
    return (
      <section style={{
        minHeight: '100svh',
        background: 'linear-gradient(135deg, rgba(15, 18, 26, 0.8), rgba(20, 24, 35, 0.6))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            maxWidth: '600px'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{
            fontFamily: 'var(--display)',
            fontSize: '36px',
            fontWeight: 600,
            marginBottom: '12px'
          }}>
            Message Received!
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#c9c5bf',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Thank you for reaching out, <strong>{name}</strong>! I've received your message and will get back to you at <strong>{email}</strong> within 24 hours.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 28px',
              background: '#ffb86b',
              color: '#14100b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'var(--display)'
            }}
          >
            Back to Portfolio
          </motion.button>
        </motion.div>
      </section>
    );
  }

  return (
    <section style={{
      minHeight: '100svh',
      background: 'linear-gradient(135deg, rgba(10, 13, 19, 0.95), rgba(15, 18, 26, 0.95))',
      padding: 'clamp(40px, 5vw, 60px) clamp(20px, 5vw, 84px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(127, 214, 224, 0.1), transparent 50%), radial-gradient(circle at 80% 80%, rgba(185, 168, 255, 0.1), transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}
        >
          <h1 style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            marginBottom: '12px'
          }}>
            Let's Build Something <span style={{ color: '#ffb86b' }}>Amazing</span>
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: '#a9afb8',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Have a project in mind? Let's discuss your requirements and create something incredible together.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* Left: Chat Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div style={{
              background: 'rgba(14, 18, 26, 0.62)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '16px',
              overflow: 'hidden',
              backdropFilter: 'blur(14px)',
              display: 'flex',
              flexDirection: 'column',
              height: '600px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              {/* Terminal Header */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ff6b6b'
                }} />
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffd166'
                }} />
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#5dff9a'
                }} />
                <div style={{ flex: 1 }} />
                <span style={{
                  fontSize: '12px',
                  color: '#7fd6e0',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}>
                  Chat with Aman
                </span>
              </div>

              {/* Chat Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex',
                      justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: msg.type === 'user'
                        ? 'rgba(127, 214, 224, 0.2)'
                        : 'rgba(185, 168, 255, 0.1)',
                      border: `1px solid ${msg.type === 'user'
                        ? 'rgba(127, 214, 224, 0.4)'
                        : 'rgba(185, 168, 255, 0.3)'}`,
                      color: msg.type === 'user' ? '#7fd6e0' : '#b9a8ff',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,.08)',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={steps[step]?.placeholder || 'Type your message...'}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(127, 214, 224, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(127, 214, 224, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(127, 214, 224, 0.3)'}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(127, 214, 224, 0.2)',
                    border: '1px solid rgba(127, 214, 224, 0.4)',
                    color: '#7fd6e0',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'var(--display)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(127, 214, 224, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(127, 214, 224, 0.2)';
                  }}
                >
                  Send
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Right: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            {/* Headquarters */}
            <div>
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#7fd6e0',
                letterSpacing: '0.04em',
                marginBottom: '12px'
              }}>
                📍 Headquarters
              </p>
              <div style={{
                background: 'rgba(14, 18, 26, 0.62)',
                border: '1px solid rgba(127, 214, 224, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(14px)'
              }}>
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#f4efe9'
                }}>
                  {P.location || 'India'}
                  <br />
                  <span style={{ color: '#a9afb8', fontSize: '13px' }}>
                    Building innovative AI solutions
                  </span>
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#ffb86b',
                letterSpacing: '0.04em',
                marginBottom: '12px'
              }}>
                ✉️ Direct Inquiry
              </p>
              <motion.a
                href={`mailto:${P.email}`}
                whileHover={{ x: 4 }}
                style={{
                  display: 'block',
                  background: 'rgba(14, 18, 26, 0.62)',
                  border: '1px solid rgba(255, 184, 107, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(14px)',
                  textDecoration: 'none',
                  color: '#ffb86b',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
              >
                {P.email}
                <br />
                <span style={{ color: '#a9afb8', fontSize: '12px' }}>
                  Click to send email
                </span>
              </motion.a>
            </div>

            {/* Phone */}
            {P.phone && (
              <div>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#8be3a5',
                  letterSpacing: '0.04em',
                  marginBottom: '12px'
                }}>
                  📱 Phone Contact
                </p>
                <div style={{
                  background: 'rgba(14, 18, 26, 0.62)',
                  border: '1px solid rgba(139, 227, 165, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(14px)',
                  color: '#8be3a5',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  {P.phone}
                </div>
              </div>
            )}

            {/* Social Links */}
            <div>
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#b9a8ff',
                letterSpacing: '0.04em',
                marginBottom: '12px'
              }}>
                🌐 Socials
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {P.social?.map((link, i) => (
                  <motion.a
                    key={i}
                    href={link[1]}
                    target="_blank"
                    rel="noopener"
                    whileHover={{ scale: 1.1, y: -2 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      background: 'rgba(14, 18, 26, 0.62)',
                      border: '1px solid rgba(185, 168, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#b9a8ff',
                      textDecoration: 'none',
                      fontSize: '18px',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(14px)',
                      cursor: 'pointer',
                      title: link[0]
                    }}
                  >
                    {link[0] === 'GitHub' && '🐙'}
                    {link[0] === 'LinkedIn' && '💼'}
                    {link[0] === 'Buildlyst' && '🚀'}
                    {link[0] === 'Twitter' && '𝕏'}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Studio Info */}
            {P.studio && (
              <motion.a
                href={P.studio.url}
                target="_blank"
                rel="noopener"
                whileHover={{ y: -4 }}
                style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, rgba(127, 214, 224, 0.1), rgba(185, 168, 255, 0.1))',
                  border: '1px solid rgba(127, 214, 224, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(14px)',
                  textDecoration: 'none',
                  color: '#fff',
                  transition: 'all 0.3s ease'
                }}
              >
                <p style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#7fd6e0',
                  letterSpacing: '0.04em',
                  marginBottom: '8px'
                }}>
                  🏢 {P.studio.name}
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#c9c5bf',
                  lineHeight: '1.5'
                }}>
                  {P.studio.line}
                </p>
              </motion.a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
