/**
 * Game Engine - Core gameplay logic for the 3D portfolio world
 * Manages zones, interactions, progression, and gameplay mechanics
 */

import * as THREE from 'three';
import { ZONES, ZONE_CONFIG, createProgressionSystem, ZONE_QUESTS } from './zones.js';
import {
  createSkillStone, createProjectTerminal, createTrophy, createCharacterPod,
  createMediaFrame, createMilestone, createSkillNode, createHologram,
  createParticleEmitter, createHUDElement, createPortal, createBadge
} from './interactiveObjects.js';
import { createMaterials, createPortalMaterial, createEnergyBeamMaterial } from './materials.js';

export class GameEngine {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Materials
    this.materials = createMaterials();
    
    // Game state
    this.progression = createProgressionSystem();
    this.zones = new Map();
    this.activeZone = null;
    this.interactiveObjects = new Map();
    this.particles = [];
    this.hudElements = [];
    
    // Player state
    this.player = {
      position: new THREE.Vector3(0, 3, -100),
      velocity: new THREE.Vector3(),
      speed: 0.15,
      rotationSpeed: 0.003,
      canMove: true,
      inZone: null,
      nearbyObjects: []
    };

    // Input handling
    this.keys = {};
    this.mouse = { x: 0, y: 0, isMoving: false };
    this.raycaster = new THREE.Raycaster();
    
    // Animation
    this.clock = new THREE.Clock();
    
    // Initialize zones
    this.initializeZones();
  }

  /**
   * Initialize all zones and their interactive elements
   */
  initializeZones() {
    Object.entries(ZONE_CONFIG).forEach(([key, config]) => {
      const zone = {
        ...config,
        group: new THREE.Group(),
        objects: [],
        completed: false,
        progress: 0
      };
      zone.group.position.copy(new THREE.Vector3(config.position.x, config.position.y, config.position.z));
      this.scene.add(zone.group);
      this.zones.set(config.id, zone);
    });
  }

  /**
   * Populate a zone with interactive objects based on its theme
   */
  populateZone(zoneId, profileData) {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    switch (zoneId) {
      case ZONES.ABOUT:
        this.populateAboutZone(zone, profileData);
        break;
      case ZONES.SKILLS:
        this.populateSkillsZone(zone, profileData);
        break;
      case ZONES.PROJECTS:
        this.populateProjectsZone(zone, profileData);
        break;
      case ZONES.EXPERIENCE:
        this.populateExperienceZone(zone, profileData);
        break;
      case ZONES.GALLERY:
        this.populateGalleryZone(zone, profileData);
        break;
    }
  }

  /**
   * About Zone: Character inspection, biographical discovery
   */
  populateAboutZone(zone, data) {
    // Create central character pod
    const podConfig = createCharacterPod(data.photo, {
      name: data.name,
      role: data.role,
      tagline: data.tagline
    });
    
    // Platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 0.8, 40),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#1a1a2e'), metalness: 0.8, roughness: 0.4 })
    );
    platform.position.y = -2;
    platform.castShadow = true;
    zone.group.add(platform);

    // Character info pod (placeholder - would be more complex in production)
    const podMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.5, 4),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffb86b'),
        metalness: 0.6,
        roughness: 0.2,
        emissive: new THREE.Color('#ffb86b'),
        emissiveIntensity: 0.2
      })
    );
    podMesh.position.y = 3;
    podMesh.castShadow = true;
    zone.group.add(podMesh);

    // Info text holos around the pod
    const bioFacts = [
      { text: data.name, angle: 0 },
      { text: data.role, angle: Math.PI * 0.5 },
      { text: 'AI/ML Engineer', angle: Math.PI },
      { text: 'Problem Solver', angle: Math.PI * 1.5 }
    ];

    bioFacts.forEach(fact => {
      const holo = this.createTextHologram(fact.text, 3.5, fact.angle);
      holo.userData.zoneId = ZONES.ABOUT;
      zone.group.add(holo);
    });

    // Floating photo frames
    const photos = data.gallery || [];
    photos.slice(0, 3).forEach((photo, i) => {
      const framePos = new THREE.Vector3(
        Math.cos(i * Math.PI * 0.7) * 6,
        2 + i * 0.5,
        Math.sin(i * Math.PI * 0.7) * 6
      );
      const frame = this.createPhotoFrame(photo.image, framePos);
      frame.userData.zoneId = ZONES.ABOUT;
      zone.group.add(frame);
    });

    zone.objects.push(...zone.group.children);
  }

  /**
   * Skills Zone: Ability tree, skill stones, proficiency system
   */
  populateSkillsZone(zone, data) {
    // Central tree structure (visual representation)
    const treeBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2, 2, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8b6f47'), roughness: 0.7 })
    );
    treeBase.position.y = -1;
    zone.group.add(treeBase);

    const trunkHeight = 12;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, trunkHeight, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#6b5d47'), roughness: 0.8 })
    );
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    zone.group.add(trunk);

    // Skill domains (branches)
    const skillGroups = data.skills || [];
    skillGroups.forEach((group, groupIdx) => {
      const branchCount = 8;
      const angleStep = (Math.PI * 2) / skillGroups.length;
      const baseAngle = angleStep * groupIdx;

      for (let i = 0; i < Math.min(branchCount, group.items.length); i++) {
        const skillName = group.items[i];
        const angle = baseAngle + (i * angleStep * 0.3);
        const distance = 5 + (i * 1.5);
        const height = 8 + (i * 0.8);

        const skillPos = new THREE.Vector3(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );

        // Create skill node
        const node = this.createSkillNode(skillName, group.group, skillPos);
        zone.group.add(node);

        // Skill stone collectible near the node
        if (i < 2) {
          const stonePos = skillPos.clone().add(new THREE.Vector3(
            Math.random() * 3 - 1.5,
            1.5,
            Math.random() * 3 - 1.5
          ));
          const stone = this.createSkillStone(stonePos, group.group);
          stone.userData.zoneId = ZONES.SKILLS;
          zone.group.add(stone);
        }
      }
    });

    zone.objects.push(...zone.group.children);
  }

  /**
   * Projects Zone: Interactive project terminals
   */
  populateProjectsZone(zone, data) {
    const projects = data.projects || [];
    const layout = this.calculateCircularLayout(projects.length, 30);

    projects.forEach((project, idx) => {
      const pos = layout[idx];
      const terminal = this.createProjectTerminal(project, new THREE.Vector3(pos.x, 2, pos.z), idx);
      terminal.userData.zoneId = ZONES.PROJECTS;
      zone.group.add(terminal);
    });

    // Central control hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 1, 40),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1a1a2e'),
        metalness: 0.9,
        roughness: 0.3,
        emissive: new THREE.Color('#7fd6e0'),
        emissiveIntensity: 0.1
      })
    );
    hub.position.y = -0.5;
    hub.castShadow = true;
    zone.group.add(hub);

    zone.objects.push(...zone.group.children);
  }

  /**
   * Experience Zone: Career timeline with milestones
   */
  populateExperienceZone(zone, data) {
    const experience = data.experience || [];
    const pathLength = experience.length;

    // Timeline path
    for (let i = 0; i < pathLength; i++) {
      const t = i / (pathLength - 1);
      const yPos = t * 15;
      const xPos = Math.cos(t * Math.PI * 2) * 8;

      const milestone = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color('#8be3a5'),
          emissive: new THREE.Color('#8be3a5'),
          emissiveIntensity: 0.3,
          metalness: 0.4,
          roughness: 0.6
        })
      );
      milestone.position.set(xPos, yPos, 0);
      milestone.castShadow = true;
      milestone.userData.zoneId = ZONES.EXPERIENCE;
      milestone.userData.experienceData = experience[i];
      zone.group.add(milestone);
    }

    // Connection line
    const linePoints = [];
    for (let i = 0; i < pathLength; i++) {
      const t = i / (pathLength - 1);
      linePoints.push(new THREE.Vector3(Math.cos(t * Math.PI * 2) * 8, t * 15, 0));
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: new THREE.Color('#8be3a5'), linewidth: 3 })
    );
    zone.group.add(line);

    zone.objects.push(...zone.group.children);
  }

  /**
   * Gallery Zone: Photo frames and achievements
   */
  populateGalleryZone(zone, data) {
    // Photo gallery
    const photos = data.gallery || [];
    const photoLayout = this.calculateCircularLayout(Math.min(photos.length, 5), 15);

    photos.slice(0, 5).forEach((photo, idx) => {
      const pos = photoLayout[idx];
      const frame = this.createPhotoFrame(photo.image, new THREE.Vector3(pos.x, 2, pos.z));
      frame.userData.zoneId = ZONES.GALLERY;
      zone.group.add(frame);
    });

    // Achievement display wall
    const achievements = [
      'SIH Finalist 2023',
      'SIH Finalist 2025',
      '15+ National Hackathons',
      '90+ GitHub Repositories',
      'Master Technologist',
      'Project Virtuoso',
      'Career Architect'
    ];

    const wallStart = new THREE.Vector3(-12, 0, 10);
    achievements.forEach((achievement, idx) => {
      const badge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ffd700'),
          metalness: 0.9,
          roughness: 0.2,
          emissive: new THREE.Color('#ffd700'),
          emissiveIntensity: 0.4
        })
      );
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      badge.position.copy(wallStart).add(new THREE.Vector3(col * 3, row * 3, 0));
      badge.castShadow = true;
      zone.group.add(badge);
    });

    zone.objects.push(...zone.group.children);
  }

  /**
   * Helper: Create text hologram
   */
  createTextHologram(text, radius, angle) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#7fd6e0';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      emissive: new THREE.Color('#7fd6e0'),
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), material);
    mesh.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
    mesh.lookAt(0, 0, 0);
    return mesh;
  }

  /**
   * Helper: Create photo frame
   */
  createPhotoFrame(imageUri, position) {
    const geometry = new THREE.BoxGeometry(3, 4, 0.2);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a2a3e'),
      metalness: 0.7,
      roughness: 0.3
    });
    const frame = new THREE.Mesh(geometry, material);
    frame.position.copy(position);
    frame.castShadow = true;
    frame.userData.imageUri = imageUri;
    return frame;
  }

  /**
   * Helper: Create skill node
   */
  createSkillNode(skillName, category, position) {
    const geometry = new THREE.IcosahedronGeometry(0.6, 2);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#7fd6e0'),
      emissive: new THREE.Color('#7fd6e0'),
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.4
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.userData.skillName = skillName;
    mesh.userData.category = category;
    return mesh;
  }

  /**
   * Helper: Create project terminal
   */
  createProjectTerminal(project, position, index) {
    const geometry = new THREE.BoxGeometry(3, 4, 0.3);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1a2e'),
      emissive: new THREE.Color('#b9a8ff'),
      emissiveIntensity: 0.2,
      metalness: 0.8,
      roughness: 0.3
    });
    const terminal = new THREE.Mesh(geometry, material);
    terminal.position.copy(position);
    terminal.castShadow = true;
    terminal.userData.project = project;
    terminal.userData.index = index;
    terminal.userData.interactable = true;
    return terminal;
  }

  /**
   * Helper: Create skill stone collectible
   */
  createSkillStone(position, category) {
    const geometry = new THREE.OctahedronGeometry(0.5, 3);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#7fd6e0'),
      emissive: new THREE.Color('#7fd6e0'),
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.3
    });
    const stone = new THREE.Mesh(geometry, material);
    stone.position.copy(position);
    stone.castShadow = true;
    stone.userData.type = 'skill-stone';
    stone.userData.category = category;
    stone.userData.collected = false;
    return stone;
  }

  /**
   * Helper: Calculate circular layout positions
   */
  calculateCircularLayout(count, radius) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
      });
    }
    return positions;
  }

  /**
   * Update game state and render
   */
  update(deltaTime) {
    this.handleInput(deltaTime);
    this.updatePlayer(deltaTime);
    this.updateParticles(deltaTime);
    this.checkInteractions();
    this.updateHUD();
  }

  /**
   * Handle keyboard and mouse input
   */
  handleInput(deltaTime) {
    const moveDir = new THREE.Vector3();
    if (this.keys['w'] || this.keys['W']) moveDir.z -= 1;
    if (this.keys['s'] || this.keys['S']) moveDir.z += 1;
    if (this.keys['a'] || this.keys['A']) moveDir.x -= 1;
    if (this.keys['d'] || this.keys['D']) moveDir.x += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(this.player.speed);
      this.player.velocity.copy(moveDir);
    } else {
      this.player.velocity.multiplyScalar(0.9);
    }
  }

  /**
   * Update player position
   */
  updatePlayer(deltaTime) {
    this.player.position.add(this.player.velocity);
    this.camera.position.lerp(this.player.position, 0.1);
  }

  /**
   * Update particle systems
   */
  updateParticles(deltaTime) {
    this.particles.forEach(particle => {
      if (particle.alive) {
        particle.update(deltaTime);
      }
    });
  }

  /**
   * Check for player-object interactions
   */
  checkInteractions() {
    this.player.nearbyObjects = [];
    this.zones.forEach(zone => {
      zone.objects.forEach(obj => {
        if (obj.userData.interactable) {
          const distance = this.player.position.distanceTo(obj.getWorldPosition(new THREE.Vector3()));
          if (distance < 25) {
            this.player.nearbyObjects.push({ object: obj, distance });
          }
        }
      });
    });
  }

  /**
   * Update HUD display
   */
  updateHUD() {
    // Updates HUD elements based on game state
    // This will be connected to the React UI layer
  }

  /**
   * Emit particles on interaction
   */
  emitParticles(position, color = '#7fd6e0', count = 16) {
    // Create particle burst effect
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.1;
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color) })
      );
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.2 + Math.random() * 0.1,
        Math.sin(angle) * speed
      );
      particle.userData.lifetime = 1;
      particle.userData.alive = true;
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }

  /**
   * Handle zone entry/exit
   */
  handleZoneTransition() {
    this.zones.forEach((zone, zoneId) => {
      const distance = this.player.position.distanceTo(zone.group.position);
      if (distance < zone.radius) {
        if (this.activeZone !== zoneId) {
          this.activeZone = zoneId;
          this.progression.visitZone(zoneId);
          this.onZoneEntered?.(zone);
        }
      }
    });
  }

  /**
   * Get game state for UI
   */
  getGameState() {
    return {
      progression: this.progression,
      activeZone: this.activeZone,
      playerPosition: this.player.position,
      nearbyObjects: this.player.nearbyObjects,
      zonesVisited: Array.from(this.progression.visitedZones),
      explorationPercent: this.progression.explorationPercent
    };
  }
}
