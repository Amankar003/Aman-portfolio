/**
 * Achievements System
 * Tracks and manages player achievements throughout the game world
 */

export const ACHIEVEMENTS = {
  // Exploration achievements
  FIRST_ZONE: {
    id: 'first-zone',
    title: 'World Explorer',
    description: 'Discover your first zone',
    icon: '🗺️',
    unlocked: false
  },
  ALL_ZONES: {
    id: 'all-zones',
    title: 'Complete Explorer',
    description: 'Discover all five zones',
    icon: '🌍',
    unlocked: false
  },

  // Zone-specific achievements
  ABOUT_COMPLETE: {
    id: 'about-complete',
    title: 'Know Thyself',
    description: 'Complete the About zone',
    icon: '🎭',
    unlocked: false
  },
  SKILLS_COMPLETE: {
    id: 'skills-complete',
    title: 'Master Technologist',
    description: 'Unlock all skill branches',
    icon: '⚡',
    unlocked: false
  },
  PROJECTS_COMPLETE: {
    id: 'projects-complete',
    title: 'Project Virtuoso',
    description: 'Experience all projects',
    icon: '🎨',
    unlocked: false
  },
  EXPERIENCE_COMPLETE: {
    id: 'experience-complete',
    title: 'Career Architect',
    description: 'Follow the complete career journey',
    icon: '📈',
    unlocked: false
  },
  GALLERY_COMPLETE: {
    id: 'gallery-complete',
    title: 'Memory Keeper',
    description: 'View all gallery items',
    icon: '📸',
    unlocked: false
  },

  // Interaction achievements
  COLLECTOR: {
    id: 'collector',
    title: 'Collector',
    description: 'Collect 10 skill stones',
    icon: '💎',
    target: 10,
    current: 0,
    unlocked: false
  },
  ARTIFACT_SEEKER: {
    id: 'artifact-seeker',
    title: 'Artifact Seeker',
    description: 'Interact with 20 objects',
    icon: '🔍',
    target: 20,
    current: 0,
    unlocked: false
  },

  // Speed achievements
  SPEEDRUNNER: {
    id: 'speedrunner',
    title: 'Speedrunner',
    description: 'Complete all zones in under 15 minutes',
    icon: '⚡',
    timeLimit: 900, // 15 minutes in seconds
    unlocked: false
  },

  // Comprehensive achievement
  PORTFOLIO_MASTER: {
    id: 'portfolio-master',
    title: 'Portfolio Master',
    description: 'Unlock all achievements',
    icon: '👑',
    unlocked: false
  }
};

export const createAchievementSystem = () => ({
  achievements: { ...ACHIEVEMENTS },
  totalUnlocked: 0,
  sessionStart: Date.now(),

  /**
   * Unlock an achievement
   */
  unlock(achievementId) {
    const achievement = this.achievements[achievementId];
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.totalUnlocked++;
      
      // Check for portfolio master achievement
      if (this.totalUnlocked === Object.keys(ACHIEVEMENTS).length) {
        this.unlock('PORTFOLIO_MASTER');
      }
      
      return true;
    }
    return false;
  },

  /**
   * Update progress on an achievement
   */
  updateProgress(achievementId, amount = 1) {
    const achievement = this.achievements[achievementId];
    if (achievement && achievement.target && !achievement.unlocked) {
      achievement.current = (achievement.current || 0) + amount;
      if (achievement.current >= achievement.target) {
        this.unlock(achievementId);
        return true;
      }
    }
    return false;
  },

  /**
   * Get all unlocked achievements
   */
  getUnlocked() {
    return Object.values(this.achievements).filter(a => a.unlocked);
  },

  /**
   * Get achievement progress percentage
   */
  getProgress() {
    return Math.round((this.totalUnlocked / Object.keys(ACHIEVEMENTS).length) * 100);
  },

  /**
   * Get session time in seconds
   */
  getSessionTime() {
    return Math.floor((Date.now() - this.sessionStart) / 1000);
  }
});

/**
 * Achievement notification helper
 */
export const createAchievementNotification = (achievement, position = 'top-right') => ({
  achievement,
  position,
  createdAt: Date.now(),
  duration: 4000,
  visible: true
});
