/**
 * Materials System - Premium materials for the 3D game world
 */

import * as THREE from 'three';

export const createMaterials = () => {
  // Utility to convert hex to THREE.Color
  const col = (hex) => new THREE.Color(hex).convertSRGBToLinear();

  return {
    // Zone materials
    zoneAbout: new THREE.MeshStandardMaterial({
      color: col('#ffb86b'),
      metalness: 0.6,
      roughness: 0.4,
      emissive: col('#ffb86b'),
      emissiveIntensity: 0.15
    }),

    zoneSkills: new THREE.MeshStandardMaterial({
      color: col('#7fd6e0'),
      metalness: 0.7,
      roughness: 0.3,
      emissive: col('#7fd6e0'),
      emissiveIntensity: 0.2
    }),

    zoneProjects: new THREE.MeshStandardMaterial({
      color: col('#b9a8ff'),
      metalness: 0.75,
      roughness: 0.25,
      emissive: col('#b9a8ff'),
      emissiveIntensity: 0.15
    }),

    zoneExperience: new THREE.MeshStandardMaterial({
      color: col('#8be3a5'),
      metalness: 0.6,
      roughness: 0.4,
      emissive: col('#8be3a5'),
      emissiveIntensity: 0.1
    }),

    zoneGallery: new THREE.MeshStandardMaterial({
      color: col('#ff8fa3'),
      metalness: 0.5,
      roughness: 0.5,
      emissive: col('#ff8fa3'),
      emissiveIntensity: 0.1
    }),

    // Special materials
    skillStone: new THREE.MeshStandardMaterial({
      color: col('#7fd6e0'),
      metalness: 0.4,
      roughness: 0.2,
      emissive: col('#7fd6e0'),
      emissiveIntensity: 0.8
    }),

    skillStoneMaster: new THREE.MeshStandardMaterial({
      color: col('#ffd700'),
      metalness: 0.3,
      roughness: 0.1,
      emissive: col('#ffd700'),
      emissiveIntensity: 1.0
    }),

    platformDark: new THREE.MeshStandardMaterial({
      color: col('#1a1a2e'),
      metalness: 0.9,
      roughness: 0.3
    }),

    platformGlow: new THREE.MeshStandardMaterial({
      color: col('#2a2a4e'),
      metalness: 0.85,
      roughness: 0.35,
      emissive: col('#7fd6e0'),
      emissiveIntensity: 0.05
    }),

    glass: new THREE.MeshStandardMaterial({
      color: col('#e3f2fd'),
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
      emissive: col('#bbdefb'),
      emissiveIntensity: 0.1
    }),

    terminal: new THREE.MeshStandardMaterial({
      color: col('#1a1a2e'),
      emissive: col('#b9a8ff'),
      emissiveIntensity: 0.3,
      metalness: 0.95,
      roughness: 0.2
    }),

    gold: new THREE.MeshStandardMaterial({
      color: col('#ffd700'),
      metalness: 0.95,
      roughness: 0.1,
      emissive: col('#ffd700'),
      emissiveIntensity: 0.4
    }),

    silver: new THREE.MeshStandardMaterial({
      color: col('#c0c0c0'),
      metalness: 0.9,
      roughness: 0.15,
      emissive: col('#d3d3d3'),
      emissiveIntensity: 0.2
    }),

    bronze: new THREE.MeshStandardMaterial({
      color: col('#cd7f32'),
      metalness: 0.85,
      roughness: 0.25,
      emissive: col('#d4af37'),
      emissiveIntensity: 0.15
    })
  };
};

/**
 * Create animated shader material for particles
 */
export const createParticleMaterial = (color) => {
  const particleColor = new THREE.Color(color).convertSRGBToLinear();
  
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: particleColor },
      uTime: { value: 0 },
      uSize: { value: 1 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      
      varying float vLife;
      
      void main() {
        vLife = (1.0 - length(position)) * 0.5;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (uSize * 10.0) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      
      varying float vLife;
      
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        
        float alpha = (1.0 - d * 2.0) * vLife;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
};

/**
 * Create holographic text material
 */
export const createHolographicMaterial = (color = '#7fd6e0') => {
  const haloColor = new THREE.Color(color).convertSRGBToLinear();
  
  return new THREE.ShaderMaterial({
    uniforms: {
      uHaloColor: { value: haloColor },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uHaloColor;
      uniform float uTime;
      
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv - 0.5;
        float dist = length(uv) * 2.0;
        
        float glow = 0.2 / dist;
        float wave = sin(uv.y * 10.0 + uTime * 3.0) * 0.5 + 0.5;
        
        vec3 color = uHaloColor * glow * wave;
        gl_FragColor = vec4(color, glow * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
};

/**
 * Create portal/vortex material
 */
export const createPortalMaterial = (color = '#7fd6e0') => {
  const portalColor = new THREE.Color(color).convertSRGBToLinear();
  
  return new THREE.ShaderMaterial({
    uniforms: {
      uPortalColor: { value: portalColor },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        vUv = uv;
        vDistance = length(position.xy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uPortalColor;
      uniform float uTime;
      
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        vec2 center = vUv - 0.5;
        float angle = atan(center.y, center.x);
        float radius = length(center);
        
        float swirl = angle + uTime * 2.0 - radius * 3.0;
        float pattern = sin(swirl) * 0.5 + 0.5;
        
        float ring = smoothstep(0.4, 0.41, radius) * (1.0 - smoothstep(0.5, 0.51, radius));
        float alpha = (pattern + ring) * (1.0 - radius * 1.2);
        
        gl_FragColor = vec4(uPortalColor, alpha * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
};

/**
 * Create outline shader for interactive objects
 */
export const createOutlineMaterial = (color = '#ffb86b', width = 1.2) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOutlineColor: { value: new THREE.Color(color).convertSRGBToLinear() },
      uOutlineWidth: { value: width }
    },
    vertexShader: `
      uniform float uOutlineWidth;
      
      void main() {
        vec4 clip = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));
        vec3 clip_normal = normalize(normalMatrix * normal);
        vec2 offset = normalize(clip.xy) * uOutlineWidth * clip.w;
        clip.xy += offset;
        gl_Position = clip;
      }
    `,
    fragmentShader: `
      uniform vec3 uOutlineColor;
      
      void main() {
        gl_FragColor = vec4(uOutlineColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
};

/**
 * Create energy beam material
 */
export const createEnergyBeamMaterial = (color = '#7fd6e0') => {
  const beamColor = new THREE.Color(color).convertSRGBToLinear();
  
  return new THREE.ShaderMaterial({
    uniforms: {
      uBeamColor: { value: beamColor },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBeamColor;
      uniform float uTime;
      
      varying vec2 vUv;
      
      void main() {
        float beam = pow(1.0 - vUv.y, 1.5) * 0.6;
        float pulse = sin(vUv.y * 20.0 - uTime * 3.0) * 0.5 + 0.5;
        
        gl_FragColor = vec4(uBeamColor, (beam + pulse * 0.3) * 0.7);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
};
