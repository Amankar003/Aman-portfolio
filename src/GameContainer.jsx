import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GameHUD } from './GameHUD.jsx';
import { ZONE_CONFIG } from './zones.js';

export default function GameContainer({ profileData, onExit }) {
  const [showConstruction, setShowConstruction] = useState(true);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  // Player state
  const playerRef = useRef({
    position: new THREE.Vector3(0, 3, -100),
    velocity: new THREE.Vector3(),
    speed: 0.25,
    direction: new THREE.Vector3()
  });

  const inputRef = useRef({
    keys: {},
    mouse: { x: 0, y: 0 },
    lastAngle: 0
  });

  const zoneObjectsRef = useRef(new Map());
  const zonesVisitedRef = useRef(new Set());
  const explorationRef = useRef(0);
  const animationFrameRef = useRef(null);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    cameraRef.current = camera;
    camera.position.copy(playerRef.current.position);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // Scene setup
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.Fog(0x0a0d14, 500, 2000);

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffb26a, 2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x8fb0d8, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.4);
    scene.add(hemiLight);

    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1a1a2e),
      metalness: 0.4,
      roughness: 0.6
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create zones as interactive areas
    const zones = Object.values(ZONE_CONFIG);
    zones.forEach((zoneConfig) => {
      const zoneGroup = new THREE.Group();
      zoneGroup.position.set(
        zoneConfig.position.x,
        zoneConfig.position.y,
        zoneConfig.position.z
      );

      // Create zone marker (cylinder with glow)
      const markerGeometry = new THREE.CylinderGeometry(
        zoneConfig.radius * 0.8,
        zoneConfig.radius,
        1,
        32
      );
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(zoneConfig.color),
        emissive: new THREE.Color(zoneConfig.color),
        emissiveIntensity: 0.2,
        metalness: 0.6,
        roughness: 0.4
      });
      const zoneMesh = new THREE.Mesh(markerGeometry, markerMaterial);
      zoneMesh.castShadow = true;
      zoneMesh.userData = {
        type: 'zone',
        zoneId: zoneConfig.id,
        zoneName: zoneConfig.name,
        zoneColor: zoneConfig.color,
        radius: zoneConfig.radius
      };
      zoneGroup.add(zoneMesh);

      // Add zone label pole
      const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 16);
      const poleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(zoneConfig.color),
        emissive: new THREE.Color(zoneConfig.color),
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 8;
      pole.castShadow = true;
      zoneGroup.add(pole);

      // Add floating particles around zone
      const particleCount = 20;
      const particles = new THREE.Group();
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = zoneConfig.radius * 1.5;
        const particleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(zoneConfig.color),
          emissive: new THREE.Color(zoneConfig.color),
          emissiveIntensity: 0.6,
          metalness: 0.5,
          roughness: 0.3
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.x = Math.cos(angle) * distance;
        particle.position.y = 3 + Math.sin(i * 0.5) * 2;
        particle.position.z = Math.sin(angle) * distance;
        particle.scale.set(0.6, 0.6, 0.6);
        particle.userData = {
          angle,
          distance,
          speed: 0.002 + Math.random() * 0.005
        };
        particles.add(particle);
      }
      zoneGroup.add(particles);

      // Add some cubes for visual interest
      for (let i = 0; i < 3; i++) {
        const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
        const cubeMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(zoneConfig.color),
          metalness: 0.7,
          roughness: 0.3
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.x = (Math.random() - 0.5) * zoneConfig.radius * 1.5;
        cube.position.z = (Math.random() - 0.5) * zoneConfig.radius * 1.5;
        cube.castShadow = true;
        cube.userData = { type: 'decoration' };
        zoneGroup.add(cube);
      }

      scene.add(zoneGroup);
      zoneObjectsRef.current.set(zoneConfig.id, zoneGroup);
    });

    // Input handling
    const handleKeyDown = (e) => {
      inputRef.current.keys[e.key.toLowerCase()] = true;

      // ESC to exit
      if (e.key === 'Escape') {
        onExit();
      }
    };

    const handleKeyUp = (e) => {
      inputRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e) => {
      inputRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      inputRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const clock = new THREE.Clock();
    let lastTime = 0;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const deltaTime = Math.min(clock.getDelta(), 0.016); // Cap at 60fps
      const elapsedTime = clock.getElapsedTime();

      // Player movement
      const moveDir = new THREE.Vector3();
      if (inputRef.current.keys['w']) moveDir.z -= 1;
      if (inputRef.current.keys['s']) moveDir.z += 1;
      if (inputRef.current.keys['a']) moveDir.x -= 1;
      if (inputRef.current.keys['d']) moveDir.x += 1;

      if (moveDir.length() > 0) {
        moveDir.normalize().multiplyScalar(playerRef.current.speed);
        playerRef.current.velocity.lerp(moveDir, 0.2);
      } else {
        playerRef.current.velocity.multiplyScalar(0.95);
      }

      playerRef.current.position.add(playerRef.current.velocity);

      // Camera follows player
      camera.position.lerp(playerRef.current.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0.1);
      camera.lookAt(
        playerRef.current.position.x,
        playerRef.current.position.y + 1.5,
        playerRef.current.position.z - 5
      );

      // Mouse look for camera rotation (optional enhancement)
      const target = new THREE.Vector3();
      target.x = playerRef.current.position.x + inputRef.current.mouse.x * 10;
      target.z = playerRef.current.position.z + inputRef.current.mouse.y * 10;
      target.y = playerRef.current.position.y + 1.5;

      // Animate zone particles
      zoneObjectsRef.current.forEach((zoneGroup) => {
        const particles = zoneGroup.children[1];
        if (particles && particles.children) {
          particles.children.forEach((particle) => {
            if (particle.userData.angle !== undefined) {
              particle.userData.angle += particle.userData.speed;
              const distance = particle.userData.distance;
              particle.position.x = Math.cos(particle.userData.angle) * distance;
              particle.position.z = Math.sin(particle.userData.angle) * distance;
              particle.position.y = 3 + Math.sin(particle.userData.angle * 2) * 2;
              particle.rotation.x += 0.01;
              particle.rotation.y += 0.01;
            }
          });
        }
      });

      // Check zone collisions
      let inZone = false;
      zoneObjectsRef.current.forEach((zoneGroup, zoneId) => {
        const distToZone = playerRef.current.position.distanceTo(zoneGroup.position);
        const zoneData = ZONE_CONFIG[zoneId];
        if (distToZone < zoneData.radius + 5) {
          if (!zonesVisitedRef.current.has(zoneId)) {
            zonesVisitedRef.current.add(zoneId);
            explorationRef.current = Math.round(
              (zonesVisitedRef.current.size / Object.keys(ZONE_CONFIG).length) * 100
            );
          }
          inZone = true;
        }
      });

      // Render
      renderer.render(scene, camera);

      // Update game state
      setGameState({
        explorationPercent: explorationRef.current,
        zonesVisited: Array.from(zonesVisitedRef.current),
        playerPosition: playerRef.current.position.clone(),
        nearbyObjects: []
      });
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [profileData, onExit]);

  const handleZoneSelect = (zoneId) => {
    setSelectedZone(zoneId);
  };

  // Show construction card instead of full game
  if (showConstruction) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0d14'
        }}
      >
        <div
          style={{
            background: 'rgba(16, 21, 29, 0.95)',
            border: '2px solid #ffb86b',
            borderRadius: '24px',
            padding: '48px 64px',
            textAlign: 'center',
            maxWidth: '500px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}
        >
          <h2
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffb86b',
              marginBottom: '16px'
            }}
          >
            🚧 Under Construction
          </h2>
          <p
            style={{
              fontFamily: "'Manrope', system-ui, sans-serif",
              fontSize: '16px',
              color: '#a9afb8',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}
          >
            The 3D interactive portfolio experience is being built. Stay tuned for updates!
          </p>
          <button
            onClick={onExit}
            style={{
              background: '#ffb86b',
              color: '#0a0d14',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ffc485';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffb86b';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0d14'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      <GameHUD gameState={gameState} onZoneSelect={handleZoneSelect} />

      {/* Exit button */}
      <button
        onClick={onExit}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '12px 20px',
          background: 'rgba(255, 184, 107, 0.9)',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          fontFamily: 'var(--display)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 184, 107, 1)';
          e.target.style.transform = 'translateX(-50%) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 184, 107, 0.9)';
          e.target.style.transform = 'translateX(-50%) scale(1)';
        }}
      >
        ← Exit Experience (ESC)
      </button>

      {/* Controls info */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(10, 10, 20, 0.8)',
          border: '1px solid #7fd6e0',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#7fd6e0',
          fontSize: '12px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          maxWidth: '400px',
          fontFamily: 'var(--display)'
        }}
      >
        <strong>Controls:</strong> WASD to move • Mouse to look around • ESC to exit
      </div>

      <style>{`
        body, html {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
