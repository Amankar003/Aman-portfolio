/**
 * Zone System - Defines all interactive zones in the 3D portfolio world
 * Each zone has gameplay mechanics, visual elements, and progression tracking
 */

export const ZONES = {
  ABOUT: 'about',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  EXPERIENCE: 'experience',
  GALLERY: 'gallery'
};

export const ZONE_CONFIG = {
  [ZONES.ABOUT]: {
    id: ZONES.ABOUT,
    name: 'Identity Core',
    subtitle: 'Discover who I am',
    color: '#ffb86b',
    description: 'An interactive exploration of my background, location, and professional identity.',
    position: { x: 0, y: 0, z: -80 },
    radius: 35,
    theme: 'holographic',
    mechanics: ['character-inspection', 'info-discovery'],
    completionReward: 'Profile Unlocked'
  },

  [ZONES.SKILLS]: {
    id: ZONES.SKILLS,
    name: 'Ability Tree Sanctum',
    subtitle: 'Explore my skill domains',
    color: '#7fd6e0',
    description: 'Discover interconnected skills through a branching ability tree. Collect skill stones to unlock proficiency.',
    position: { x: -65, y: 0, z: 40 },
    radius: 40,
    theme: 'crystalline',
    mechanics: ['skill-collection', 'tree-activation', 'proficiency-unlocking'],
    completionReward: 'Master Technologist'
  },

  [ZONES.PROJECTS]: {
    id: ZONES.PROJECTS,
    name: 'Mission Control',
    subtitle: 'Experience my projects',
    color: '#b9a8ff',
    description: 'Interactive project stations. Approach each terminal to witness live project demonstrations.',
    position: { x: 65, y: 0, z: 40 },
    radius: 45,
    theme: 'futuristic-control',
    mechanics: ['project-playback', 'demo-visualization', 'achievement-tracking'],
    completionReward: 'Project Virtuoso'
  },

  [ZONES.EXPERIENCE]: {
    id: ZONES.EXPERIENCE,
    name: 'Career Journey',
    subtitle: 'My professional path',
    color: '#8be3a5',
    description: 'An ascending timeline showing career progression from education through current roles.',
    position: { x: 0, y: 0, z: 140 },
    radius: 50,
    theme: 'timeline-staircase',
    mechanics: ['milestone-exploration', 'timeline-progression', 'badge-collection'],
    completionReward: 'Career Architect'
  },

  [ZONES.GALLERY]: {
    id: ZONES.GALLERY,
    name: 'Moments & Achievements',
    subtitle: 'Visual portfolio',
    color: '#ff8fa3',
    description: 'Photo gallery, trophies, certificates, and achievement displays.',
    position: { x: -35, y: 0, z: -90 },
    radius: 38,
    theme: 'exhibition-hall',
    mechanics: ['media-viewing', 'achievement-display', 'social-links'],
    completionReward: 'Portfolio Master'
  }
};

/**
 * Progression System - Track player advancement through zones
 */
export const createProgressionSystem = () => ({
  visitedZones: new Set(),
  completedInteractions: new Map(),
  collectedItems: new Map(),
  unlockedAchievements: new Set(),
  explorationPercent: 0,

  visitZone(zoneId) {
    this.visitedZones.add(zoneId);
    this.updateExplorationPercent();
  },

  completeInteraction(zoneId, interactionId) {
    if (!this.completedInteractions.has(zoneId)) {
      this.completedInteractions.set(zoneId, new Set());
    }
    this.completedInteractions.get(zoneId).add(interactionId);
  },

  collectItem(zoneId, itemId) {
    if (!this.collectedItems.has(zoneId)) {
      this.collectedItems.set(zoneId, new Set());
    }
    this.collectedItems.get(zoneId).add(itemId);
  },

  unlockAchievement(achievementId) {
    this.unlockedAchievements.add(achievementId);
  },

  updateExplorationPercent() {
    const totalZones = Object.keys(ZONE_CONFIG).length;
    this.explorationPercent = Math.round((this.visitedZones.size / totalZones) * 100);
  },

  getZoneProgress(zoneId) {
    const config = ZONE_CONFIG[zoneId];
    if (!config) return 0;
    return this.visitedZones.has(zoneId) ? 100 : 0;
  },

  isZoneVisited(zoneId) {
    return this.visitedZones.has(zoneId);
  }
});

/**
 * Zone objectives and quest system
 */
export const ZONE_QUESTS = {
  [ZONES.ABOUT]: [
    { id: 'rotate-character', title: 'Rotate the character to discover facts', target: 3 },
    { id: 'view-photos', title: 'Examine all personal photos', target: 5 }
  ],

  [ZONES.SKILLS]: [
    { id: 'collect-stones', title: 'Collect skill stones', target: 7 },
    { id: 'unlock-branches', title: 'Unlock all skill branches', target: 4 },
    { id: 'reach-mastery', title: 'Reach mastery in core AI skills', target: 1 }
  ],

  [ZONES.PROJECTS]: [
    { id: 'visit-stations', title: 'Visit all 8 project stations', target: 8 },
    { id: 'play-demos', title: 'Watch all project demos', target: 8 },
    { id: 'visit-github', title: 'Access project repositories', target: 1 }
  ],

  [ZONES.EXPERIENCE]: [
    { id: 'explore-milestones', title: 'Explore all career milestones', target: 3 },
    { id: 'collect-badges', title: 'Collect achievement badges', target: 5 },
    { id: 'read-timeline', title: 'Follow the complete career timeline', target: 1 }
  ],

  [ZONES.GALLERY]: [
    { id: 'view-all-photos', title: 'View all gallery photos', target: 5 },
    { id: 'examine-achievements', title: 'Examine all achievements', target: 7 },
    { id: 'view-certs', title: 'Review certifications', target: 2 }
  ]
};
