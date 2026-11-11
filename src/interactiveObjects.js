/**
 * Interactive Objects System
 * Defines all interactive elements players can examine, collect, and interact with
 */

import * as THREE from 'three';

/**
 * Skill Stones - Collectible items in Skills zone
 */
export const createSkillStone = (position, skillGroup, gemColor = '#7fd6e0') => ({
  type: 'skill-stone',
  position,
  skillGroup,
  gemColor,
  collected: false,
  geometry: new THREE.OctahedronGeometry(0.8, 3),
  material: null, // Will be assigned based on color
  scale: { x: 1, y: 1.2, z: 1 },
  animation: {
    floatSpeed: 2,
    rotationSpeed: 1.5,
    bobHeight: 1.2
  },
  particle: {
    color: gemColor,
    count: 12,
    speed: 0.8
  }
});

/**
 * Project Terminals - Interactive stations in Projects zone
 */
export const createProjectTerminal = (projectData, position, stationIndex) => ({
  type: 'project-terminal',
  projectId: projectData.title.toLowerCase().replace(/\s+/g, '-'),
  project: projectData,
  position,
  stationIndex,
  geometry: new THREE.BoxGeometry(4, 5, 0.3),
  scale: { x: 1, y: 1, z: 0.2 },
  activated: false,
  playingDemo: false,
  interaction: {
    range: 15,
    prompt: 'Press E to activate project'
  },
  display: {
    resolution: { width: 1024, height: 1280 },
    animationDuration: 2
  }
});

/**
 * Achievement Trophies - Display units for achievements
 */
export const createTrophy = (title, position, tier = 'gold') => ({
  type: 'trophy',
  title,
  position,
  tier, // 'gold', 'silver', 'bronze'
  unlocked: false,
  geometry: new THREE.ConeGeometry(0.6, 2.4, 16),
  baseGeometry: new THREE.CylinderGeometry(1, 1.2, 0.4, 16),
  materials: {
    gold: null,
    silver: null,
    bronze: null
  },
  glow: true,
  animation: {
    rotationSpeed: 0.3,
    bobHeight: 0.6
  }
});

/**
 * Character Pod - Interactive centerpiece of About zone
 */
export const createCharacterPod = (profilePhoto, bioData) => ({
  type: 'character-pod',
  position: { x: 0, y: 0, z: 0 },
  character: {
    name: bioData.name,
    role: bioData.role,
    photo: profilePhoto
  },
  geometry: new THREE.IcosahedronGeometry(3, 4),
  podGeometry: new THREE.CylinderGeometry(5, 6, 0.8, 32),
  interaction: {
    rotatable: true,
    currentRotation: 0,
    targetRotation: 0,
    sensitivity: 0.3
  },
  infoNodes: [
    { label: 'Background', angle: 0 },
    { label: 'Location', angle: Math.PI * 0.5 },
    { label: 'Studio', angle: Math.PI },
    { label: 'Interests', angle: Math.PI * 1.5 }
  ],
  particles: {
    enabled: true,
    count: 80,
    color: '#ffb86b',
    speed: 0.3
  }
});

/**
 * Media Frame - Gallery photo display
 */
export const createMediaFrame = (imageData, position, rotation = 0) => ({
  type: 'media-frame',
  image: imageData,
  position,
  rotation,
  frameSize: { width: 4, height: 6 },
  frameGeometry: new THREE.BoxGeometry(4.2, 6.2, 0.2),
  photoGeometry: new THREE.PlaneGeometry(4, 6),
  viewed: false,
  interaction: {
    range: 20,
    expandOnClick: true
  },
  animation: {
    rotationSpeed: 0.1,
    parallaxDepth: 0.3
  }
});

/**
 * Timeline Milestone - Career progression marker
 */
export const createMilestone = (role, organization, period, position) => ({
  type: 'milestone',
  role,
  organization,
  period,
  position,
  geometry: new THREE.SphereGeometry(0.8, 32, 32),
  markerGeometry: new THREE.ConeGeometry(1.5, 2, 32),
  material: null,
  content: { role, organization, period },
  interaction: {
    range: 25,
    expandOnClick: true
  },
  animation: {
    pulseSpeed: 1,
    glowIntensity: 0.5
  }
});

/**
 * Skill Tree Node - Visual representation of a skill in the ability tree
 */
export const createSkillNode = (skillName, category, proficiency = 1, position) => ({
  type: 'skill-node',
  name: skillName,
  category,
  proficiency, // 1-3 (Novice, Expert, Master)
  position,
  geometry: new THREE.IcosahedronGeometry(0.4, 2),
  maxGeometry: new THREE.IcosahedronGeometry(0.45, 2),
  material: null,
  emission: 0,
  interaction: {
    hoverableText: true,
    description: `${skillName} - Level ${proficiency}`
  },
  connections: {
    connectedTo: [],
    edgeColor: '#7fd6e0'
  }
});

/**
 * Information Hologram - Floating text panel
 */
export const createHologram = (text, position, config = {}) => ({
  type: 'hologram',
  text,
  position,
  scale: config.scale || 1,
  fontSize: config.fontSize || 24,
  maxWidth: config.maxWidth || 400,
  color: config.color || '#ffffff',
  glowColor: config.glowColor || '#7fd6e0',
  geometry: new THREE.PlaneGeometry(config.maxWidth / 100, 2),
  visible: false,
  fadeInDuration: 0.3,
  fadeOutDuration: 0.2,
  animation: {
    floatSpeed: 0.5,
    bobHeight: 0.4
  }
});

/**
 * Particle System - Visual effects for interactions
 */
export const createParticleEmitter = (position, config = {}) => ({
  type: 'particle-emitter',
  position,
  particleCount: config.particleCount || 32,
  color: config.color || '#7fd6e0',
  speed: config.speed || 1,
  lifetime: config.lifetime || 1,
  size: config.size || 0.1,
  spread: config.spread || Math.PI * 2,
  geometry: new THREE.BufferGeometry(),
  material: null,
  mesh: null,
  active: true,
  particles: []
});

/**
 * HUD Element - Screen-space UI element
 */
export const createHUDElement = (type, position, content) => ({
  type: 'hud-element',
  hudType: type, // 'minimap', 'objective', 'progress', 'hint', 'notification'
  position, // screen coordinates {x, y}
  content,
  visible: true,
  animation: {
    fadeIn: 0.3,
    fadeOut: 0.2,
    scale: 1
  },
  data: {
    zoneProgress: {},
    currentObjective: null,
    explorationPercent: 0
  }
});

/**
 * Portal/Fast Travel - Quick navigation to zones
 */
export const createPortal = (targetZone, position) => ({
  type: 'portal',
  targetZone,
  position,
  geometry: new THREE.TorusGeometry(1.5, 0.3, 8, 32),
  material: null,
  active: false,
  particles: {
    enabled: true,
    color: '#7fd6e0',
    speed: 2
  },
  animation: {
    rotationSpeed: 1.2,
    pulseSpeed: 1.5
  }
});

/**
 * Badge/Achievement Display - Wall-mounted achievement
 */
export const createBadge = (achievementData, position, size = 1) => ({
  type: 'badge',
  achievement: achievementData,
  position,
  size,
  unlocked: false,
  geometry: new THREE.CylinderGeometry(size, size, 0.1, 32),
  material: null,
  interaction: {
    hoverableText: true,
    description: achievementData.title
  },
  animation: {
    unlockEffect: 'pop', // 'pop', 'glow', 'spin'
    animationDuration: 0.8
  }
});

/**
 * Interaction Manager Helper
 */
export const createInteractionPoint = (object, callback, range = 20) => ({
  object,
  callback,
  range,
  active: true,
  lastInteractionTime: 0,
  cooldown: 0.5 // seconds between interactions
});
