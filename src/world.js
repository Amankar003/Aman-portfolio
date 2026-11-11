import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const mergeBufferGeometries = (g) => BufferGeometryUtils.mergeBufferGeometries(g);

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const sm = v => v * v * (3 - 2 * v);
const col = h => new THREE.Color(h).convertSRGBToLinear();
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------- shared GLSL ---------------- */
const SKYG = `
uniform float uN;
float hash3(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
vec3 skyCol(vec3 d, vec3 sun, float disc){
  float y = max(d.y, 0.0);
  vec3 horizon = mix(vec3(1.0,0.46,0.20), vec3(0.09,0.13,0.30), uN);
  vec3 mid = mix(vec3(0.20,0.34,0.62), vec3(0.025,0.045,0.13), uN);
  vec3 zenith = mix(vec3(0.025,0.08,0.24), vec3(0.004,0.008,0.03), uN);
  vec3 c = mix(horizon, mid, smoothstep(0.0,0.30,y));
  c = mix(c, zenith, smoothstep(0.22,0.95,y));
  float sd = max(dot(d,sun),0.0);
  vec3 gl = mix(vec3(1.0,0.42,0.16), vec3(0.35,0.5,1.0), uN);
  c += gl*pow(sd,5.0)*mix(0.75,0.22,uN);
  c += mix(vec3(1.0,0.72,0.38), vec3(0.6,0.75,1.0), uN)*pow(sd,60.0)*1.6;
  c += disc*mix(vec3(1.0,0.92,0.78), vec3(0.8,0.88,1.0), uN)*smoothstep(0.9991,0.9996,sd)*mix(16.0,6.0,uN);
  float st = step(0.9984, hash3(floor(d*320.0)))*uN*smoothstep(0.04,0.28,d.y)*disc;
  c += vec3(2.4,2.4,3.0)*st;
  return c;
}`;
const FIN = `
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
vec3 finish(vec3 c, float f){ if(f<0.5) return c; c = aces(c*uExp*1.35); return pow(c, vec3(1.0/2.2)); }`;

const WAVES = [[1, .2, .045, .34, .9], [.5, 1, .07, .2, 1.1], [-.6, .8, .11, .11, 1.5], [.9, -.4, .19, .055, 2.0]]
  .map(([x, z, k, a, s]) => { const l = Math.hypot(x, z); return [x / l, z / l, k, a, s]; });
function waveH(x, z, t) {
  let h = 0, gx = 0, gz = 0;
  for (const [dx, dz, k, a, s] of WAVES) { const ph = k * (dx * x + dz * z) + s * t, c = Math.cos(ph); h += a * Math.sin(ph); gx += a * k * c * dx; gz += a * k * c * dz; }
  return { h, gx, gz };
}
const f5 = n => n.toFixed(5);
const WGLSL = WAVES.map(w => `{ vec2 d=vec2(${f5(w[0])},${f5(w[1])}); float ph=${f5(w[2])}*dot(d,p)+${f5(w[4])}*uTime; h+=${f5(w[3])}*sin(ph); g+=${f5(w[3] * w[2])}*cos(ph)*d; }`).join('\n');

/* ---------------- canvas helpers ---------------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
function textTex(text, { font = '700 110px Sora, system-ui, sans-serif', color = '#fff', glow = null, pad = 36 } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = font;
  const size = parseInt(font.match(/(\d+)px/)[1]);
  const w = Math.ceil(x.measureText(text).width) + pad * 2, h = size + pad * 2;
  c.width = w; c.height = h; x.font = font; x.textBaseline = 'middle'; x.textAlign = 'center';
  if (glow) { x.shadowColor = glow; x.shadowBlur = 28; }
  x.fillStyle = color; x.fillText(text, w / 2, h / 2 + size * 0.04);
  if (glow) { x.shadowBlur = 10; x.fillText(text, w / 2, h / 2 + size * 0.04); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return { tex: t, w, h };
}
function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
  ctx.fillText(line, x, yy); return yy;
}
function beam(parent, a, b, r, mat, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
}

/* ================================================================== */
export async function createWorld(canvas, cfg) {
  const { sections, profile: P, images, onDock, onHud, onEvent, reduce } = cfg;
  const emit = e => { try { onEvent && onEvent({ ...e, id: Math.random() }); } catch (err) { /* ignore */ } };
  try { await Promise.race([document.fonts.load('700 80px Sora'), new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* ignore */ }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const isMobile = matchMedia('(max-width: 800px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  let pr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
  renderer.setPixelRatio(pr);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const EXP = 0.85;

  const scene = new THREE.Scene();
  const FOGC = new THREE.Color(0.78, 0.44, 0.27), FOGD = 0.0021;
  scene.fog = new THREE.FogExp2(FOGC, FOGD);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 3500);
  const SUN = new THREE.Vector3(-0.78, 0.2, -0.55).normalize();
  const UP = new THREE.Vector3(0, 1, 0);
  const MAXAN = renderer.capabilities.getMaxAnisotropy();

  /* ---- post-processing (HDR linear pipeline) ---- */
  let composer = null, bloom = null, finalPass = null, usePost = false;
  const finalFlag = { value: 1 };
  function setupPost(w, h) {
    try {
      const gl = renderer.getContext();
      if (!renderer.capabilities.isWebGL2 || !renderer.extensions.has('EXT_color_buffer_float')) throw new Error('no float render targets');
      const rt = new THREE.WebGLMultisampleRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, format: THREE.RGBAFormat });
      rt.samples = isMobile ? 2 : 4;
      composer = new EffectComposer(renderer, rt);
      composer.setPixelRatio(pr);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.6, 0.55, 1.7);
      composer.addPass(bloom);
      finalPass = new ShaderPass(new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uExp: { value: EXP }, uBoost: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uExp; uniform float uBoost; varying vec2 vUv; ${FIN}
          void main(){
            vec2 c = vUv-0.5; float d = dot(c,c);
            float ca = 0.0004 + uBoost*0.0022;
            vec3 col;
            col.r = texture2D(tDiffuse, vUv + c*ca).r; col.g = texture2D(tDiffuse, vUv).g; col.b = texture2D(tDiffuse, vUv - c*ca).b;
            col = finish(col, 1.0);
            col *= 1.0 - smoothstep(0.18,0.8,d*1.7)*0.5;
            float g = fract(sin(dot(vUv*vec2(1280.0,720.0)+uTime,vec2(12.9898,78.233)))*43758.5453);
            col += (g-0.5)*0.022;
            gl_FragColor = vec4(col,1.0);
          }`
      }));
      composer.addPass(finalPass);
      renderer.outputEncoding = THREE.LinearEncoding; renderer.toneMapping = THREE.NoToneMapping;
      finalFlag.value = 0; usePost = true;
    } catch (e) {
      console.warn('Post-processing disabled:', e); usePost = false; composer = null;
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = EXP;
      finalFlag.value = 1;
    }
  }

  /* ---- planar water reflection ---- */
  const reflRT = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
  const rf = { cam: new THREE.PerspectiveCamera(), texMat: new THREE.Matrix4(), plane: new THREE.Plane(), clip: new THREE.Vector4(), q: new THREE.Vector4(), n: new THREE.Vector3(0, 1, 0), wpos: new THREE.Vector3(), cpos: new THREE.Vector3(), view: new THREE.Vector3(), look: new THREE.Vector3(), tgt: new THREE.Vector3(), rot: new THREE.Matrix4() };
  function renderReflection() {
    water.updateMatrixWorld(); camera.updateMatrixWorld();
    rf.wpos.setFromMatrixPosition(water.matrixWorld); rf.cpos.setFromMatrixPosition(camera.matrixWorld);
    rf.view.subVectors(rf.wpos, rf.cpos); if (rf.view.dot(rf.n) > 0) return;
    rf.view.reflect(rf.n).negate().add(rf.wpos);
    rf.rot.extractRotation(camera.matrixWorld);
    rf.look.set(0, 0, -1).applyMatrix4(rf.rot).add(rf.cpos);
    rf.tgt.subVectors(rf.wpos, rf.look).reflect(rf.n).negate().add(rf.wpos);
    const vc = rf.cam; vc.position.copy(rf.view); vc.up.set(0, 1, 0).applyMatrix4(rf.rot).reflect(rf.n); vc.lookAt(rf.tgt);
    vc.far = camera.far; vc.updateMatrixWorld(); vc.projectionMatrix.copy(camera.projectionMatrix);
    rf.texMat.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
    rf.texMat.multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse).multiply(water.matrixWorld);
    rf.plane.setFromNormalAndCoplanarPoint(rf.n, rf.wpos).applyMatrix4(vc.matrixWorldInverse);
    rf.clip.set(rf.plane.normal.x, rf.plane.normal.y, rf.plane.normal.z, rf.plane.constant);
    const pm = vc.projectionMatrix.elements;
    rf.q.x = (Math.sign(rf.clip.x) + pm[8]) / pm[0]; rf.q.y = (Math.sign(rf.clip.y) + pm[9]) / pm[5]; rf.q.z = -1; rf.q.w = (1 + pm[10]) / pm[14];
    rf.clip.multiplyScalar(2 / rf.clip.dot(rf.q));
    pm[2] = rf.clip.x; pm[6] = rf.clip.y; pm[10] = rf.clip.z + 1 - 0.003; pm[14] = rf.clip.w;
    waterMat.uniforms.uTexMat.value.copy(rf.texMat);
    const cur = renderer.getRenderTarget(), sa = renderer.shadowMap.autoUpdate;
    water.visible = false; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(reflRT); renderer.clear(); renderer.render(scene, vc);
    renderer.setRenderTarget(cur); water.visible = true; renderer.shadowMap.autoUpdate = sa;
  }

  /* ---- sky + environment lighting ---- */
  const TOD = { value: 0 }, envN = { value: 0 };
  function skyMat(flag, nU) {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: SUN }, uFinal: flag, uExp: { value: EXP }, uN: nU },
      vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uSun; uniform float uFinal; uniform float uExp; varying vec3 vD; ${SKYG} ${FIN}
        void main(){ gl_FragColor = vec4(finish(skyCol(normalize(vD),uSun,1.0), uFinal),1.0); }`
    });
  }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 20), skyMat(finalFlag, TOD)); sky.renderOrder = -10; scene.add(sky);
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 20), skyMat({ value: 0 }, envN)));
  let cubeRT = null, cubeCam = null, pmrem = null;
  function rebuildEnv(n) {
    try {
      envN.value = n;
      if (!cubeRT) {
        const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
        cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
        cubeCam = new THREE.CubeCamera(1, 4000, cubeRT); pmrem = new THREE.PMREMGenerator(renderer);
      }
      cubeCam.update(renderer, envScene);
      const old = scene.environment; scene.environment = pmrem.fromCubemap(cubeRT.texture).texture; if (old) old.dispose();
    } catch (e) { console.warn('env map failed', e); }
  }
  rebuildEnv(0);

  const sunL = new THREE.DirectionalLight(col('#ffb26a'), 2.5);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 160 });
  sunL.shadow.camera.updateProjectionMatrix(); sunL.shadow.bias = -0.0005; sunL.shadow.normalBias = 0.03;
  scene.add(sunL, sunL.target);
  const hemi = new THREE.HemisphereLight(col('#8fb0d8'), col('#b86a3c'), 0.28); scene.add(hemi);

  /* ---- route ---- */
  const pts = []; for (let i = 0; i < 17; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.9) * 38, 0, -i * 70));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const cl = t => clamp(t, 0, 1);
  const at = t => curve.getPointAt(cl(t)), tan = t => curve.getTangentAt(cl(t));
  const rightOf = T => new THREE.Vector3().crossVectors(T, UP).normalize();
  const samples = curve.getSpacedPoints(400);
  const ROUTE_END = at(1);

  /* ---- water ---- */
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uSun: { value: SUN }, uFog: { value: FOGC }, uFogD: { value: FOGD }, uExp: { value: EXP }, uFinal: finalFlag, uN: TOD, uTexMat: { value: new THREE.Matrix4() }, tRefl: { value: null }, uUseRefl: { value: 0 } },
    vertexShader: `uniform float uTime; uniform mat4 uTexMat; varying vec3 vW; varying vec3 vN; varying vec4 vRUv;
      void main(){ vRUv = uTexMat*vec4(position,1.0); vec4 wp = modelMatrix*vec4(position,1.0); vec2 p = wp.xz; float h=0.0; vec2 g=vec2(0.0);
        ${WGLSL}
        wp.y += h; vW = wp.xyz; vN = normalize(vec3(-g.x,1.0,-g.y)); gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uCam; uniform vec3 uSun; uniform vec3 uFog; uniform float uFogD; uniform float uExp; uniform float uFinal; uniform sampler2D tRefl; uniform float uUseRefl;
      varying vec3 vW; varying vec3 vN; varying vec4 vRUv; ${SKYG} ${FIN}
      void main(){
        vec2 p = vW.xz; float dist = length(uCam - vW);
        float det = 1.0 - smoothstep(60.0, 260.0, dist);
        vec2 dn = vec2( sin(p.x*1.3+p.y*0.4+uTime*1.3)*0.5 + sin((p.x+p.y)*2.3-uTime*2.1)*0.25 + sin(p.y*4.1+p.x*0.7+uTime*2.7)*0.12,
                        cos(p.y*1.1-p.x*0.5+uTime*1.1)*0.5 + cos((p.x-p.y)*1.9+uTime*1.7)*0.25 + cos(p.x*3.7+p.y*0.9-uTime*2.3)*0.12 ) * 0.035 * det;
        vec3 n = normalize(vN + vec3(dn.x,0.0,dn.y));
        vec3 V = normalize(uCam - vW);
        float ndv = max(dot(n,V), 0.0);
        float F = 0.02 + 0.98*pow(1.0-ndv, 5.0);
        vec3 R = reflect(-V, n); R.y = max(R.y, 0.02);
        vec3 refl = skyCol(normalize(R), uSun, 0.0);
        if(uUseRefl>0.5){ vec4 ruv = vRUv; ruv.xy += (vN.xz + dn)*0.9*ruv.w*0.085; vec3 pr = texture2DProj(tRefl, ruv).rgb; refl = mix(refl, pr, 0.86); }
        vec3 deep = vec3(0.004,0.045,0.07), shallow = vec3(0.02,0.16,0.18);
        vec3 body = mix(deep, shallow, pow(ndv,2.0)*0.6) * mix(1.0,0.35,uN);
        vec3 c = mix(body, refl, clamp(F*1.15,0.0,1.0));
        vec3 H = normalize(uSun + V);
        vec3 gc = mix(vec3(1.0,0.62,0.30), vec3(0.6,0.75,1.0), uN);
        c += gc * pow(max(dot(n,H),0.0), 520.0) * 14.0 * mix(1.0,0.45,uN);
        c += mix(vec3(1.0,0.45,0.2), vec3(0.3,0.4,0.9), uN) * pow(max(dot(n,H),0.0), 40.0) * 0.18;
        float f = 1.0 - exp(-uFogD*uFogD*dist*dist);
        c = mix(c, uFog, clamp(f,0.0,1.0));
        gl_FragColor = vec4(finish(c,uFinal),1.0);
      }`
  });
  const wg = new THREE.PlaneGeometry(1800, 1800, 160, 160);
  const water = new THREE.Mesh(wg, waterMat); water.rotation.x = -Math.PI / 2; water.frustumCulled = false; scene.add(water);

  /* ---- far mountains + clouds ---- */
  const mtnTex = (seed, hz) => canvasTex(2048, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hz + 'ff'); g.addColorStop(1, hz + '00');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, h);
    let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let x = 0; x <= w; x += 8) { const y = h * (0.55 - 0.3 * Math.abs(Math.sin(x * 0.004 + seed)) - 0.14 * Math.sin(x * 0.017 + seed * 2) - r() * 0.04); c.lineTo(x, y); }
    c.lineTo(w, h); c.closePath(); c.fill();
  });
  const mtns = [[1450, 230, '#7a4a52', 3, .85], [1600, 330, '#a2605a', 9, .7]].map(([rad, ht, hz, sd, op]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, ht, 48, 1, true), new THREE.MeshBasicMaterial({ map: mtnTex(sd, hz), transparent: true, opacity: op, side: THREE.BackSide, fog: false, depthWrite: false }));
    m.position.y = ht / 2 - 10; m.renderOrder = -9; scene.add(m); return m;
  });
  const cloudTex = canvasTex(256, 128, (c, w, h) => { for (let i = 0; i < 16; i++) { const x = 40 + Math.random() * (w - 80), y = 40 + Math.random() * (h - 70), r = 18 + Math.random() * 34; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } });
  for (let i = 0; i < 34; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: .5 + Math.random() * .25, color: col(Math.random() < .5 ? '#ffb98a' : '#ffd7b8') });
    const s = new THREE.Sprite(m), p = at(Math.random());
    s.position.set(p.x + rnd(-600, 600), rnd(90, 240), p.z - rnd(0, 600)); const k = rnd(240, 560); s.scale.set(k, k * .38, 1); scene.add(s);
  }

  /* ---- buildings (merged per material) ---- */
  function winTex(glass, emissive) {
    const t = canvasTex(256, 512, (c, w, h) => {
      const cols = 6, rows = 12, cw = w / cols, rh = h / rows;
      c.fillStyle = emissive ? '#000' : (glass ? '#8aa4b6' : '#ddd6cb'); c.fillRect(0, 0, w, h);
      let seed = glass ? 7 : 3; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let ro = 0; ro < rows; ro++) for (let k = 0; k < cols; k++) {
        const lit = r() < .16, x = k * cw + 5, y = ro * rh + 6, ww = cw - 10, hh = rh - 12;
        if (emissive) { if (lit) { c.fillStyle = r() < .5 ? '#ffbf73' : '#ffd9a0'; c.fillRect(x, y, ww, hh); } }
        else { const g = c.createLinearGradient(0, y, 0, y + hh); if (glass) { g.addColorStop(0, '#2c4c66'); g.addColorStop(1, '#16293a'); } else { g.addColorStop(0, lit ? '#caa56d' : '#33414d'); g.addColorStop(1, lit ? '#e0b87a' : '#1d2832'); } c.fillStyle = g; c.fillRect(glass ? x - 3 : x, glass ? y - 2 : y, glass ? ww + 6 : ww, glass ? hh + 4 : hh); }
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const wC = winTex(false, false), wCe = winTex(false, true), wG = winTex(true, false), wGe = winTex(true, true);
  const concT = ['#d9cdb8', '#c9c6c0', '#b9b4aa', '#e3d3b6', '#a9aeb3'], glassT = ['#8fb6cc', '#7fa2b8', '#a3c0cf', '#6f93a8'];
  const bMats = [
    ...concT.map(c => new THREE.MeshStandardMaterial({ color: col(c), map: wC, emissiveMap: wCe, emissive: col('#ffb060'), emissiveIntensity: .9, roughness: .78, metalness: .02 })),
    ...glassT.map(c => new THREE.MeshStandardMaterial({ color: col(c), map: wG, emissiveMap: wGe, emissive: col('#ffb060'), emissiveIntensity: .8, roughness: .16, metalness: .75 }))
  ];
  const buckets = bMats.map(() => []);
  const colliders = [], tall = [];
  const SEC_T = [0.17, 0.36, 0.55, 0.74, 0.93];
  const SIDES = [1, -1, 1, -1, 1];
  const checkpoints = sections.map((s, i) => {
    const t = SEC_T[i], p = at(t), T = tan(t), R = rightOf(T);
    const dock = p.clone().addScaledVector(R, SIDES[i] * 11); dock.y = 0;
    const lm = p.clone().addScaledVector(R, SIDES[i] * 38); lm.y = 0;
    return { ...s, i, t, path: p, T, R, side: SIDES[i], dock, lm, radius: 11, prog: 0, cooldown: false, visited: false, color3: col(s.color) };
  });
  function free(x, z, minD) {
    for (const q of samples) if (Math.hypot(q.x - x, q.z - z) < minD) return false;
    for (const c of checkpoints) if (Math.hypot(c.lm.x - x, c.lm.z - z) < 40 || Math.hypot(c.dock.x - x, c.dock.z - z) < 30) return false;
    return true;
  }
  function addBox(w, h, d, x, y, z, mi) {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(w, d) / 13, uv.getY(i) * h / 41);
    g.translate(x, y, z); buckets[mi].push(g);
  }
  function addCyl(r, h, x, y, z, mi) {
    const g = new THREE.CylinderGeometry(r * .92, r, h, 18), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * r * 2 / 13, uv.getY(i) * h / 41);
    g.translate(x, y, z); buckets[mi].push(g);
  }
  let made = 0, tries = 0;
  while (made < 230 && tries < 6000) {
    tries++;
    const tr = Math.random() * 1.12, base = at(tr).clone(), R = rightOf(tan(tr));
    base.z -= Math.max(0, tr - 1) / 0.12 * 300;
    const side = Math.random() < .5 ? -1 : 1, off = 32 + Math.pow(Math.random(), 1.3) * 230;
    const x = base.x + R.x * side * off + rnd(-12, 12), z = base.z + R.z * side * off + rnd(-35, 35);
    const w = rnd(11, 27), d = rnd(11, 27);
    if (!free(x, z, 27 + Math.max(w, d) * .5)) continue;
    const far = off > 120, h = 24 + Math.pow(Math.random(), 1.5) * (far ? 160 : 110);
    const mi = (Math.random() * bMats.length) | 0, baseH = h * .45;
    const cyl = h > 70 && Math.random() < .3;
    addBox(w, baseH, d, x, baseH / 2 - 6, z, mi);
    const w2 = w * .74, d2 = d * .74, h2 = h - baseH; if (cyl) addCyl(Math.min(w2, d2) / 2, h2, x, baseH - 6 + h2 / 2, z, mi); else addBox(w2, h2, d2, x, baseH - 6 + h2 / 2, z, mi);
    if (h > 90) { const w3 = w2 * .6, d3 = d2 * .6, h3 = h * .16; addBox(w3, h3, d3, x, h - 6 + h3 / 2, z, mi); }
    colliders.push({ x, z, r: Math.max(w, d) * .5 * .9 });
    if (h > 60 && off < 150) tall.push({ x, z, h, w, d, side });
    made++;
  }
  bMats.forEach((m, i) => { if (buckets[i].length) { const g = mergeBufferGeometries(buckets[i]); scene.add(new THREE.Mesh(g, m)); } });

  /* neon rooftop beacons + animated LED boards on facades */
  const redLights = [];
  tall.slice(0, 60).forEach(b => { redLights.push(b.x, b.h - 6 + b.h * .16 + b.h * .14, b.z); });
  const beaconGeo = new THREE.BufferGeometry(); beaconGeo.setAttribute('position', new THREE.Float32BufferAttribute(redLights, 3));
  const dotTex = canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const beacons = new THREE.Points(beaconGeo, new THREE.PointsMaterial({ map: dotTex, size: 6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(3, .25, .2), fog: false })); scene.add(beacons);

  const ledText = `${P.name.toUpperCase()}  ◆  ${P.role.toUpperCase()}  ◆  RAG  ◆  LANGGRAPH  ◆  FASTAPI  ◆  AGENTIC AI  ◆  ${(P.studio?.name || '').toUpperCase()}  ◆  `;
  const ledTex = canvasTex(2048, 160, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#0b0f16'); g.addColorStop(1, '#141c28'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.font = '700 84px Sora, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillStyle = '#ffd9a0';
    const tw = c.measureText(ledText).width, n = Math.max(1, Math.round(w / tw)), sx = w / (tw * n);
    c.shadowColor = '#ffb060'; c.shadowBlur = 16; c.save(); c.scale(sx, 1);
    for (let k = 0; k < n; k++) c.fillText(ledText, k * tw, h / 2 + 4);
    c.restore();
  });
  ledTex.wrapS = THREE.RepeatWrapping; ledTex.repeat.set(1, 1);
  const ledMat = new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false }); ledMat.color.setScalar(1.6);
  tall.slice(0, 14).forEach((b, i) => {
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(26, 26 * 160 / 2048 * (2048 / 800)), ledMat); // wide strip
    bb.geometry.dispose(); bb.geometry = new THREE.PlaneGeometry(30, 3.6);
    const toward = new THREE.Vector3(-Math.sign(b.x) || 1, 0, 0);
    const p = samples.reduce((m, q) => Math.hypot(q.x - b.x, q.z - b.z) < Math.hypot(m.x - b.x, m.z - b.z) ? q : m, samples[0]);
    const dir = new THREE.Vector3(p.x - b.x, 0, p.z - b.z).normalize();
    bb.position.set(b.x + dir.x * (b.w * .38 + .3), 18 + (i % 4) * 7, b.z + dir.z * (b.d * .38 + .3));
    bb.lookAt(bb.position.x + dir.x, bb.position.y, bb.position.z + dir.z); scene.add(bb);
  });

  /* ---- buoys, debris, gulls ---- */
  const buoyN = 70, buoyBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(.35, .55, 1.3, 10), new THREE.MeshStandardMaterial({ color: col('#e8452c'), roughness: .5 }), buoyN);
  const buoyPos = [];
  for (let i = 0; i < buoyN; i++) { const t = (i >> 1) / (buoyN / 2 + 1), side = i % 2 ? 1 : -1, p = at(t), R = rightOf(tan(t)); buoyPos.push(new THREE.Vector3(p.x + R.x * side * 17, 0, p.z + R.z * side * 17)); }
  const buoyLightGeo = new THREE.BufferGeometry(); buoyLightGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(buoyN * 3), 3));
  const buoyLights = new THREE.Points(buoyLightGeo, new THREE.PointsMaterial({ map: dotTex, size: 1.7, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(.9, 2.2, 1.1), fog: false }));
  scene.add(buoyBody, buoyLights);
  const debrisN = 36, debris = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .8, 1), new THREE.MeshStandardMaterial({ color: col('#8a6a46'), roughness: .8 }), debrisN);
  const debrisPos = [];
  for (let i = 0; i < debrisN; i++) { const t = rnd(.03, 1), p = at(t), R = rightOf(tan(t)); debrisPos.push({ x: p.x + R.x * rnd(-45, 45), z: p.z + R.z * rnd(-45, 45), r: rnd(0, TAU), s: rnd(.8, 2) }); }
  scene.add(debris);
  const gulls = []; const gullM = new THREE.MeshBasicMaterial({ color: col('#f3ece4'), side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(); const wing = new THREE.PlaneGeometry(1.6, .45); wing.translate(.8, 0, 0);
    const l = new THREE.Mesh(wing, gullM), r = new THREE.Mesh(wing, gullM); r.scale.x = -1; g.add(l, r);
    g.userData = { l, r, t: rnd(.05, 1), rad: rnd(14, 34), sp: rnd(.35, .7), ph: rnd(0, TAU), h: rnd(14, 32) }; scene.add(g); gulls.push(g);
  }

  /* ---- checkpoint landmarks ---- */
  const loader = new THREE.TextureLoader();
  const loadTex = uri => { const t = loader.load(uri); t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXAN; return t; };
  const steel = new THREE.MeshStandardMaterial({ color: col('#4a545c'), metalness: .85, roughness: .4 });
  const darkM = new THREE.MeshStandardMaterial({ color: col('#10161d'), metalness: .8, roughness: .35 });
  const glowM = c => { const m = new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(3), toneMapped: false }); return m; };

  function makeSign(text, color) {
    const { tex, w, h } = textTex(text, { color: '#ffffff', glow: color });
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }); m.color.setScalar(2.3);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w / 20, h / 20), m); mesh.userData.mat = m; return mesh;
  }
  const beamMat = c => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uC: { value: c.clone().multiplyScalar(2.2) }, uA: { value: 1 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uC; uniform float uA; uniform float uTime; varying vec2 vUv; void main(){ float a = pow(1.0-vUv.y,1.6)*0.5*(0.85+0.15*sin(vUv.y*30.0-uTime*3.0)); gl_FragColor = vec4(uC, a*uA); }'
  });
  const ringMat = c => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    uniforms: { uC: { value: c.clone().multiplyScalar(2.4) }, uTime: { value: 0 }, uProg: { value: 0 }, uHot: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uC; uniform float uTime; uniform float uProg; uniform float uHot; varying vec2 vUv;
      void main(){
        vec2 q = vUv-0.5; float r = length(q)*2.0; float ang = atan(q.y,q.x);
        float ring = smoothstep(0.84,0.88,r)*(1.0-smoothstep(0.95,0.99,r));
        float inner = (1.0-smoothstep(0.0,0.84,r))*0.10;
        float pulse = 0.5+0.5*sin(uTime*3.0-r*14.0);
        float dash = step(0.35, fract(ang/6.2832*28.0 + uTime*0.15));
        float ring2 = smoothstep(0.66,0.68,r)*(1.0-smoothstep(0.70,0.72,r))*dash*0.5;
        float ap = (ang+3.1416)/6.2832; float prog = step(ap, uProg)*smoothstep(0.80,0.84,r)*(1.0-smoothstep(0.97,1.0,r))*1.6;
        float a = ring*(0.55+0.3*pulse+uHot) + inner*(0.6+pulse*0.8) + ring2 + prog;
        gl_FragColor = vec4(uC*(1.0+uHot), a);
      }`
  });
  const upright = new THREE.Vector3(0, 1, 0);

  checkpoints.forEach((cp, i) => {
    const g = new THREE.Group(); g.position.copy(cp.lm);
    const sign = makeSign(cp.board, cp.color);
    cp.sign = sign;
    const c3 = cp.color3;
    if (cp.id === 'about') {
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.5, 4, 40), darkM); plat.position.y = -1; g.add(plat);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(7.6, .18, 8, 64), glowM(c3)); rim.rotation.x = Math.PI / 2; rim.position.y = 1.1; g.add(rim);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(11.4, 14.6, .7), darkM); frame.position.y = 10; g.add(frame);
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 13.6), new THREE.MeshBasicMaterial({ map: loadTex(images.portrait), toneMapped: false })); photo.material.color.setScalar(1.25); photo.position.set(0, 10, .4); g.add(photo);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(11.4, .3, .8), glowM(c3)); trim.position.y = 17.4; g.add(trim);
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(10.4, .5), new THREE.MeshBasicMaterial({ color: c3.clone().multiplyScalar(2.2), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); scan.position.z = .45; g.add(scan); cp.scan = scan;
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(8.5, .08, 6, 80), glowM(c3)); orbit.position.y = 10; orbit.rotation.x = 1.2; g.add(orbit); cp.spin = [orbit];
      sign.position.set(0, 22, 0);
    }
    if (cp.id === 'skills') {
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, 14, 24), darkM); plat.position.y = 0; g.add(plat);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), new THREE.MeshBasicMaterial({ color: c3.clone().multiplyScalar(2), wireframe: true, toneMapped: false })); core.position.y = 15; g.add(core);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 16), glowM(c3)); inner.position.y = 15; g.add(inner);
      const orb = new THREE.Group(); orb.position.y = 15; g.add(orb);
      const words = P.skills.flatMap(s => s.items).filter((_, k) => k % 2 === 0).slice(0, 18);
      words.forEach((w, k) => {
        const { tex, w: tw, h: th } = textTex(w, { font: '600 64px Manrope, system-ui, sans-serif', color: '#fff', glow: cp.color, pad: 20 });
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.8, 1.8, 1.8) }));
        const phi = Math.acos(1 - 2 * (k + .5) / words.length), th2 = Math.PI * (1 + Math.sqrt(5)) * k;
        sp.position.set(9 * Math.sin(phi) * Math.cos(th2), 9 * Math.cos(phi) * .8, 9 * Math.sin(phi) * Math.sin(th2));
        sp.scale.set(tw / 40, th / 40, 1); orb.add(sp);
      });
      [0, 1].forEach(k => { const t = new THREE.Mesh(new THREE.TorusGeometry(6 + k * 2.2, .07, 6, 80), glowM(c3)); t.position.y = 15; t.rotation.set(k ? .9 : 1.9, k * .5, 0); g.add(t); (cp.spin = cp.spin || []).push(t); });
      cp.orb = orb; cp.core = core; sign.position.set(0, 29, 0);
    }
    if (cp.id === 'projects') {
      cp.screens = [];
      P.projects.slice(0, 3).forEach((p, k) => {
        const ang = (k - 1) * .5, grp = new THREE.Group(); grp.position.set(Math.sin(ang) * 14, 11 + (k === 1 ? 2 : 0), -Math.cos(ang) * 14 + 14); grp.rotation.y = ang;
        const fr = new THREE.Mesh(new THREE.BoxGeometry(10.8, 6.8, .5), darkM); grp.add(fr);
        const tex = canvasTex(1024, 640, (c, w, h) => {
          const hue = (k * 70 + 250) % 360; const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, `hsl(${hue} 60% 22%)`); gr.addColorStop(1, `hsl(${hue + 40} 70% 10%)`); c.fillStyle = gr; c.fillRect(0, 0, w, h);
          c.fillStyle = 'rgba(255,255,255,.07)'; for (let q = 0; q < 6; q++) c.fillRect(60, 380 + q * 38, w - 120 - (q % 3) * 160, 12);
          c.fillStyle = cp.color; c.fillRect(60, 56, 90, 8); c.font = '700 40px Manrope, sans-serif'; c.fillText('0' + (k + 1) + ' / PROJECT', 60, 110);
          c.fillStyle = '#fff'; c.font = '700 74px Sora, sans-serif'; wrap(c, p.title, 60, 200, w - 120, 84);
          c.font = '600 32px Manrope, sans-serif'; c.fillStyle = '#ffd9a0'; c.fillText(p.tags.slice(0, 4).join('  ·  '), 60, h - 50);
        });
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 6.375), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.material.color.setScalar(1.3); scr.position.z = .28; grp.add(scr);
        const tr = new THREE.Mesh(new THREE.BoxGeometry(10.8, .22, .6), glowM(c3)); tr.position.y = 3.5; grp.add(tr);
        g.add(grp); cp.screens.push(grp); grp.userData.base = grp.position.y;
        beam(g, new THREE.Vector3(grp.position.x, -3, grp.position.z), new THREE.Vector3(grp.position.x, 7.5, grp.position.z), .35, steel);
      });
      sign.position.set(0, 24, 8);
    }
    if (cp.id === 'gallery') {
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 6, 24), darkM); plat.position.y = -1; g.add(plat);
      const ring = new THREE.Group(); ring.position.y = 12; g.add(ring); cp.ringG = ring;
      const imgs = [images.portrait, images.cafe, images.canal, images.illus, images.studio];
      imgs.forEach((im, k) => {
        const a = k / imgs.length * TAU, f = new THREE.Group(); f.position.set(Math.sin(a) * 10, 0, Math.cos(a) * 10); f.rotation.y = a;
        const fr = new THREE.Mesh(new THREE.BoxGeometry(5.8, 7.6, .3), new THREE.MeshStandardMaterial({ color: col('#d7b27a'), metalness: .9, roughness: .3 })); f.add(fr);
        const ph = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 7), new THREE.MeshBasicMaterial({ map: loadTex(im), toneMapped: false, side: THREE.DoubleSide })); ph.material.color.setScalar(1.15); ph.position.z = .17; f.add(ph);
        const back = ph.clone(); back.rotation.y = Math.PI; back.position.z = -.17; f.add(back); ring.add(f);
      });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(10, .07, 6, 100), glowM(c3)); halo.rotation.x = Math.PI / 2; halo.position.y = 4; ring.add(halo);
      sign.position.set(0, 24, 0);
    }
    if (cp.id === 'contact') {
      const stripes = [col('#f3efe8'), col('#d9382c')];
      for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(5 - k * .5 - .45, 5 - k * .5, 5, 28), new THREE.MeshStandardMaterial({ color: stripes[k % 2], roughness: .6 })); m.position.y = -2 + k * 5 + 2.5; g.add(m); }
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, .5, 28), darkM); deck.position.y = 28.3; g.add(deck);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 3, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.6, 1.6), toneMapped: false })); lamp.position.y = 30; g.add(lamp);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.6, 20), new THREE.MeshStandardMaterial({ color: col('#d9382c') })); cap.position.y = 32.8; g.add(cap);
      const sweep = new THREE.Group(); sweep.position.y = 30; g.add(sweep); cp.sweep = sweep;
      [0, Math.PI].forEach(a => { const bm = new THREE.Mesh(new THREE.CylinderGeometry(9, .5, 70, 16, 1, true), beamMat(col('#ffd9a0'))); bm.rotation.z = -Math.PI / 2; bm.position.x = Math.cos(a) * 36; bm.rotation.y = a; bm.geometry.translate(0, 0, 0); sweep.add(bm); bm.material.uniforms.uA.value = .8; });
      sign.position.set(0, 40, 0);
    }
    sign.position.y += 0; g.add(sign);
    g.lookAt(cp.path.x, 0, cp.path.z); g.rotation.x = 0; g.rotation.z = 0;
    scene.add(g); cp.group = g;
    // dock ring + beam
    const dr = new THREE.Mesh(new THREE.PlaneGeometry(cp.radius * 2.2, cp.radius * 2.2), ringMat(c3)); dr.rotation.x = -Math.PI / 2; dr.position.set(cp.dock.x, .9, cp.dock.z); scene.add(dr); cp.ring = dr;
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(.9, 3.4, 280, 24, 1, true), beamMat(c3)); bm.position.set(cp.dock.x, 140, cp.dock.z); scene.add(bm); cp.beam = bm;
  });

  /* ---- boost rings (collectibles) ---- */
  const ringList = []; const RT = [.07, .11, .13, .26, .3, .33, .44, .48, .62, .66, .81, .85, .88];
  const ringGeo = new THREE.TorusGeometry(3.8, .26, 12, 40), ringCol = new THREE.Color(3.2, 2.0, .5);
  RT.forEach((t, i) => {
    const p = at(t), T = tan(t), R = rightOf(T), off = Math.sin(i * 1.7) * 9;
    const g = new THREE.Group(); g.position.set(p.x + R.x * off, 4.2, p.z + R.z * off);
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: ringCol, toneMapped: false })); g.add(m);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, .8, .2), transparent: true, opacity: .13, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(disc);
    g.lookAt(g.position.x + T.x, g.position.y, g.position.z + T.z); scene.add(g);
    ringList.push({ g, T, taken: false, side: 0, scale: 1, p: g.position });
  });

  /* ---- boat + rider ---- */
  const boat = new THREE.Group(); boat.rotation.order = 'YXZ';
  const navy = new THREE.MeshPhysicalMaterial({ color: col('#0b1623'), metalness: .45, roughness: .2, clearcoat: 1, clearcoatRoughness: .05 });
  const whiteM = new THREE.MeshStandardMaterial({ color: col('#e8ecef'), roughness: .35, metalness: .08 });
  const orangeM = new THREE.MeshStandardMaterial({ color: col('#ff8a3d'), roughness: .3 });
  const glassM = new THREE.MeshPhysicalMaterial({ color: col('#a6cbdc'), roughness: .04, metalness: 0, transparent: true, opacity: .3, clearcoat: 1, depthWrite: false });
  const darkB = new THREE.MeshStandardMaterial({ color: col('#1a1d22'), roughness: .55, metalness: .35 });
  const shape = new THREE.Shape();
  shape.moveTo(-1.1, -3.2); shape.lineTo(-1.15, -.5); shape.bezierCurveTo(-1.15, 1.6, -.45, 3.0, 0, 4.2); shape.bezierCurveTo(.45, 3.0, 1.15, 1.6, 1.15, -.5); shape.lineTo(1.1, -3.2); shape.closePath();
  const hullG = new THREE.ExtrudeGeometry(shape, { depth: .7, bevelEnabled: true, bevelThickness: .16, bevelSize: .14, bevelSegments: 4, curveSegments: 28 }); hullG.rotateX(-Math.PI / 2);
  boat.add(new THREE.Mesh(hullG, navy));
  const deck = new THREE.Mesh(hullG, whiteM); deck.scale.set(.9, .1, .94); deck.position.y = .8; boat.add(deck);
  const stripe = new THREE.Mesh(hullG, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.2, .3), toneMapped: false })); stripe.scale.set(1.012, .035, 1.002); stripe.position.y = .42; boat.add(stripe);
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; boat.add(m); return m; };
  add(new THREE.BoxGeometry(1.5, .55, .8), whiteM, 0, 1.15, -.55);
  add(new THREE.BoxGeometry(1.3, .12, .5), darkB, 0, 1.46, -.5);
  add(new THREE.BoxGeometry(1.46, .55, .05), glassM, 0, 1.78, -.95, .42);
  [-.73, .73].forEach(x => add(new THREE.BoxGeometry(.05, .6, .05), darkB, x, 1.76, -.95, .42));
  add(new THREE.BoxGeometry(1.2, .32, .9), darkB, 0, 1.0, .85);
  add(new THREE.BoxGeometry(1.2, .6, .14), darkB, 0, 1.45, 1.35, -.12);
  add(new THREE.BoxGeometry(.8, .8, .6), darkB, 0, .55, 3.45);
  const wheel = add(new THREE.TorusGeometry(.17, .03, 8, 20), darkB, 0, 1.58, -.28, 1.05);
  [-.55, .55].forEach(x => add(new THREE.SphereGeometry(.13, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5, 3.5), toneMapped: false }), x, .95, -3.4));
  add(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(.2, 4, .4), toneMapped: false }), .95, 1.0, -1.4);
  add(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, .2, .2), toneMapped: false }), -.95, 1.0, -1.4);
  const under = new THREE.PointLight(col('#3fe0ff'), 1.6, 16); under.position.set(0, -.2, 0); boat.add(under);
  const spot = new THREE.SpotLight(col('#fff1d6'), 0, 90, .5, .65, 1.2); spot.position.set(0, 1.3, -3.2); const spotT = new THREE.Object3D(); spotT.position.set(0, .2, -40); boat.add(spot, spotT); spot.target = spotT;

  const rider = new THREE.Group(); rider.position.set(0, 1.15, .9); boat.add(rider);
  const skin = new THREE.MeshStandardMaterial({ color: col('#a8734e'), roughness: .62 });
  const hairM = new THREE.MeshStandardMaterial({ color: col('#120d0a'), roughness: .55 });
  const shirt = new THREE.MeshStandardMaterial({ color: col('#14161a'), roughness: .88 });
  const pants = new THREE.MeshStandardMaterial({ color: col('#0f1013'), roughness: .9 });
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  [-1, 1].forEach(sx => { beam(rider, V3(sx * .13, .04, -.02), V3(sx * .14, .08, -.62), .105, pants, 10); beam(rider, V3(sx * .14, .08, -.62), V3(sx * .15, -.38, -.7), .085, pants, 10); });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.25, .2, .64, 18), shirt); torso.position.set(0, .38, -.02); torso.rotation.x = -.1; rider.add(torso);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(.26, 18, 12), shirt); shoulders.scale.set(1.3, .55, .8); shoulders.position.set(0, .68, -.05); rider.add(shoulders);
  [-1, 1].forEach(sx => { beam(rider, V3(sx * .3, .64, -.05), V3(sx * .27, .36, -.3), .07, shirt, 10); beam(rider, V3(sx * .27, .36, -.3), V3(sx * .15, .5, -.66), .058, shirt, 10); const hand = new THREE.Mesh(new THREE.SphereGeometry(.058, 10, 8), skin); hand.position.set(sx * .15, .5, -.67); rider.add(hand); });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, .14, 12), skin); neck.position.set(0, .8, -.05); rider.add(neck);
  const head = new THREE.Group(); head.position.set(0, 1.0, -.06); rider.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.17, 28, 20), skin); skull.scale.set(.88, 1.08, 1); head.add(skull);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(.182, 28, 18, 0, TAU, Math.PI * .43, Math.PI * .57), hairM); beard.scale.set(.93, 1.1, 1.04); beard.position.set(0, -.005, -.005); head.add(beard);
  const stache = new THREE.Mesh(new THREE.BoxGeometry(.13, .028, .05), hairM); stache.position.set(0, -.045, -.165); head.add(stache);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.186, 28, 16, 0, TAU, 0, Math.PI * .5), hairM); hair.scale.set(1, 1.02, 1.1); hair.position.set(0, .03, .012); head.add(hair);
  const quiff = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 14), hairM); quiff.scale.set(1.15, .62, 1.05); quiff.position.set(0, .2, -.045); quiff.rotation.x = -.25; head.add(quiff);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.026, 10, 8), skin); nose.position.set(0, -.01, -.168); head.add(nose);
  [-1, 1].forEach(sx => { const ear = new THREE.Mesh(new THREE.SphereGeometry(.036, 10, 8), skin); ear.scale.set(.5, 1, .8); ear.position.set(sx * .15, -.005, .01); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), darkB); eye.position.set(sx * .058, .03, -.158); head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.07, .014, .02), hairM); brow.position.set(sx * .058, .062, -.16); head.add(brow); });
  boat.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(boat);

  /* ---- spray / burst particles + wake ribbon ---- */
  const SPN = 220, sPos = new Float32Array(SPN * 3), sVel = new Float32Array(SPN * 3), sLife = new Float32Array(SPN);
  for (let i = 0; i < SPN; i++) sPos[i * 3 + 1] = -100;
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const spray = new THREE.Points(sGeo, new THREE.PointsMaterial({ map: dotTex, size: .5, transparent: true, opacity: .55, depthWrite: false, color: col('#ffe9d2') })); spray.frustumCulled = false; scene.add(spray);
  let sHead = 0, sAcc = 0;
  const BN = 70, bPos = new Float32Array(BN * 3), bVel = new Float32Array(BN * 3), bLife = new Float32Array(BN);
  for (let i = 0; i < BN; i++) bPos[i * 3 + 1] = -100;
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const burst = new THREE.Points(bGeo, new THREE.PointsMaterial({ map: dotTex, size: 1.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(3, 2, .6), fog: false })); burst.frustumCulled = false; scene.add(burst);
  let bHead = 0;
  function emitBurst(p, n = 28, c) { if (c) burst.material.color.copy(c); for (let k = 0; k < n; k++) { const i = bHead; bHead = (bHead + 1) % BN; bPos[i * 3] = p.x; bPos[i * 3 + 1] = p.y; bPos[i * 3 + 2] = p.z; const a = rnd(0, TAU), u = rnd(-1, 1), s = rnd(6, 16); bVel[i * 3] = Math.cos(a) * Math.sqrt(1 - u * u) * s; bVel[i * 3 + 1] = u * s; bVel[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - u * u) * s; bLife[i] = rnd(.5, 1); } }

  const WN = 56, wakePts = []; for (let i = 0; i < WN; i++) wakePts.push({ x: 0, z: 0, fx: 0, fz: 0, a: 0 });
  const wakeGeo = new THREE.BufferGeometry(); const wPos = new Float32Array(WN * 2 * 3), wAl = new Float32Array(WN * 2), wUv = new Float32Array(WN * 2 * 2);
  const wIdx = []; for (let i = 0; i < WN - 1; i++) { const a = i * 2; wIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  wakeGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3)); wakeGeo.setAttribute('alpha', new THREE.BufferAttribute(wAl, 1)); wakeGeo.setAttribute('uv', new THREE.BufferAttribute(wUv, 2)); wakeGeo.setIndex(wIdx);
  const wakeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uTime: { value: 0 }, uC: { value: new THREE.Color(1.5, 1.2, 1.0) } },
    vertexShader: 'attribute float alpha; varying float vA; varying vec2 vUv; void main(){ vA=alpha; vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uC; uniform float uTime; varying float vA; varying vec2 vUv; void main(){ float e = 1.0-abs(vUv.x*2.0-1.0); float n = 0.7+0.3*sin(vUv.y*60.0-uTime*6.0); gl_FragColor = vec4(uC, vA*smoothstep(0.0,0.5,e)*n); }' });
  const wake = new THREE.Mesh(wakeGeo, wakeMat); wake.frustumCulled = false; scene.add(wake);
  let wakeAcc = 0;

  /* ---- audio ---- */
  const audio = { ctx: null, on: false };
  function audioInit() {
    if (audio.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = new AC(); audio.ctx = c;
    const osc = c.createOscillator(); osc.type = 'sawtooth'; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; const eg = c.createGain(); eg.gain.value = 0; osc.connect(lp).connect(eg).connect(c.destination); osc.start();
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = c.createBufferSource(); ns.buffer = buf; ns.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; const ng = c.createGain(); ng.gain.value = 0; ns.connect(bp).connect(ng).connect(c.destination); ns.start();
    audio.osc = osc; audio.eg = eg; audio.ng = ng; audio.lp = lp;
  }
  function blip(f = 880, dur = .18, type = 'sine', vol = .12) {
    if (!audio.on || !audio.ctx) return; const c = audio.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; o.frequency.exponentialRampToValueAtTime(f * 1.6, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + dur); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }

  /* ---- time of day ---- */
  const dayC = { sun: col('#ffb26a'), moon: col('#7f9cff'), hs: col('#8fb0d8'), hg: col('#b86a3c'), hs2: col('#4a63a8'), hg2: col('#15203a') };
  const dayEmis = bMats.map(m => m.emissiveIntensity);
  function applyTod(n) {
    TOD.value = n;
    FOGC.setRGB(lerp(.78, .04, n), lerp(.44, .06, n), lerp(.27, .13, n)); scene.fog.density = lerp(.0021, .0028, n); waterMat.uniforms.uFogD.value = scene.fog.density;
    sunL.color.copy(dayC.sun).lerp(dayC.moon, n); sunL.intensity = lerp(2.5, .5, n);
    hemi.color.copy(dayC.hs).lerp(dayC.hs2, n); hemi.groundColor.copy(dayC.hg).lerp(dayC.hg2, n); hemi.intensity = lerp(.28, .22, n);
    bMats.forEach((m, i) => { m.emissiveIntensity = lerp(dayEmis[i], 3.2, n); m.envMapIntensity = lerp(1, .35, n); });
    spot.intensity = 9 * n; under.intensity = lerp(1.6, 3.2, n);
    mtns.forEach((m, i) => { m.material.opacity = lerp(i ? .7 : .85, .35, n); });
    bloom && (bloom.threshold = lerp(1.7, 1.15, n));
  }

  /* ================== game state ================== */
  const S = {
    x: samples[4].x, z: samples[4].z, psi: 0, vx: 0, vz: 0, yawRate: 0, speed: 0, boost: 0, shake: 0,
    steer: 0, throttle: 0, rings: 0, auto: true, paused: true, active: false, todCur: 0, todTgt: 0, playTime: 0, began: false, lastBump: 0, introT: 0, camYaw: 0, orbit: 0, userTook: false, bump: 0, time: 0
  };
  { const T0 = tan(.02); S.psi = Math.atan2(T0.x, -T0.z); S.camYaw = S.psi; const p0 = at(.02); S.x = p0.x; S.z = p0.z; }
  const input = { up: 0, down: 0, left: 0, right: 0, boost: 0, tSteer: 0, tThrottle: 0, tBrake: 0, tBoost: 0 };
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  const fwdOf = a => new THREE.Vector3(Math.sin(a), 0, -Math.cos(a));

  function typing() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); }
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ShiftLeft: 'boost', ShiftRight: 'boost', Space: 'boost' };
  function onKey(e, v) {
    if (!S.active || S.paused || typing()) return;
    const k = KEYMAP[e.code]; if (k) { input[k] = v; e.preventDefault(); if (v) S.userTook = true, S.auto = false; }
    if (v && e.code === 'KeyP') S.auto = !S.auto;
    if (v && e.code === 'KeyE') api.dockNow();
    if (v && e.code === 'KeyT') api.toggleNight();
  }
  const kd = e => onKey(e, 1), ku = e => onKey(e, 0);
  addEventListener('keydown', kd); addEventListener('keyup', ku);

  const api = {
    setActive(v) { S.active = v; if (!v) { input.up = input.down = input.left = input.right = input.boost = 0; } },
    setPaused(v) { S.paused = v; if (!v) { input.up = input.down = input.left = input.right = input.boost = 0; if (!S.began) { S.began = true; S.introT = 0; } } },
    takeWheel() { S.userTook = true; S.auto = false; },
    setNight(v) { S.todTgt = v ? 1 : 0; }, toggleNight() { S.todTgt = S.todTgt ? 0 : 1; return !!S.todTgt; },
    restart() { checkpoints.forEach(c => { c.visited = false; c.cooldown = false; c.prog = 0; }); ringList.forEach(r => { r.taken = false; r.scale = 1; r.g.scale.setScalar(1); r.g.visible = true; r.side = 0; }); const p0 = at(.02), T0 = tan(.02); S.x = p0.x; S.z = p0.z; S.vx = S.vz = 0; S.psi = Math.atan2(T0.x, -T0.z); S.camYaw = S.psi; S.rings = 0; S.playTime = 0; S.auto = true; S.userTook = false; S.introT = 0; },
    setAuto(v) { S.auto = v; }, toggleAuto() { S.auto = !S.auto; return S.auto; },
    touch(o) { Object.assign(input, o); if (o.tSteer || o.tThrottle || o.tBoost || o.tBrake) { S.userTook = true; S.auto = false; } },
    setSound(v) { audio.on = v; if (v) { audioInit(); audio.ctx && audio.ctx.resume(); } else if (audio.eg) { audio.eg.gain.value = 0; audio.ng.gain.value = 0; } },
    dockNow() { const cp = checkpoints.find(c => Math.hypot(S.x - c.dock.x, S.z - c.dock.z) < c.radius + 6); if (cp) triggerDock(cp); },
    teleport(id) { const cp = checkpoints.find(c => c.id === id); if (!cp) return; S.x = cp.dock.x - cp.T.x * 30; S.z = cp.dock.z - cp.T.z * 30; S.vx = S.vz = 0; S.psi = Math.atan2(cp.T.x, -cp.T.z); S.camYaw = S.psi; },
    getMap() { return { path: samples.filter((_, i) => i % 4 === 0).map(p => [p.x, p.z]), rings: ringList.map(r => [r.p.x, r.p.z]), cps: checkpoints.map(c => ({ id: c.id, color: c.color, x: c.dock.x, z: c.dock.z, label: c.label })) }; },
    resize,
    debug: { S, checkpoints, boat, camera },
    dispose() { cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); renderer.dispose(); }
  };

  function triggerDock(cp) {
    cp.visited = true; cp.cooldown = true; S.paused = true; S.vx *= .2; S.vz *= .2; blip(660, .3, 'triangle', .14); setTimeout(() => blip(990, .3, 'triangle', .12), 120);
    emit({ type: 'dock', text: cp.label + ' reached', sub: checkpoints.filter(c => c.visited).length + '/' + checkpoints.length + ' checkpoints', color: cp.color });
    emitBurst(new THREE.Vector3(cp.dock.x, 3, cp.dock.z), 40, cp.color3.clone().multiplyScalar(3));
    onDock && onDock(cp.id);
  }

  /* ---------------- resize ---------------- */
  let W = 1, H = 1, aspect = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight; aspect = W / H;
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(pr); composer.setSize(W, H); bloom.resolution.set(W / 2, H / 2); }
    const rs = isMobile ? .38 : .55; reflRT.setSize(Math.max(256, Math.floor(W * pr * rs)), Math.max(256, Math.floor(H * pr * rs)));
  }
  setupPost(innerWidth, innerHeight); resize();
  waterMat.uniforms.tRefl.value = reflRT.texture; waterMat.uniforms.uUseRefl.value = usePost ? 1 : 0;
  // pre-compile so first frame isn't a hitch
  try { renderer.compile(scene, camera); } catch (e) { /* ignore */ }

  /* ---------------- main loop ---------------- */
  let raf = 0, last = performance.now(), hudT = 0, fpsAcc = 0, fpsN = 0, qualityTimer = 0;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const mtx = new THREE.Matrix4(), quat = new THREE.Quaternion(), scl = new THREE.Vector3(), eul = new THREE.Euler();

  function nearestIdx() { let bi = 0, bd = 1e12; for (let i = 0; i < samples.length; i++) { const q = samples[i], d = (q.x - S.x) ** 2 + (q.z - S.z) ** 2; if (d < bd) { bd = d; bi = i; } } return { i: bi, d: Math.sqrt(bd) }; }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!S.active) { last = now; return; }
    const dt = Math.min((now - last) / 1000, .05); last = now; S.time += dt; const t = S.time;
    fpsAcc += dt; fpsN++; if (!S.paused) S.playTime += dt;
    if (S.todCur !== S.todTgt) { S.todCur = Math.abs(S.todTgt - S.todCur) < .004 ? S.todTgt : damp(S.todCur, S.todTgt, 2.2, dt); applyTod(S.todCur); if (S.todCur === S.todTgt) rebuildEnv(S.todCur); }
    if (fpsAcc > 2.5) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 30 && pr > 1) { pr = Math.max(1, pr - .25); resize(); } }

    /* ---- control ---- */
    const nx = nearestIdx(); const nextCp = checkpoints.find(c => !c.visited) || null;
    let steer = clamp((input.right - input.left) + input.tSteer, -1, 1), thr = input.up ? 1 : 0, brake = input.down || input.tBrake ? 1 : 0, boostBtn = input.boost || input.tBoost;
    if (input.tThrottle) thr = Math.max(thr, input.tThrottle);
    if (S.auto && !S.paused) {
      const lookIdx = Math.min(samples.length - 1, nx.i + 14);
      let tgt = samples[lookIdx];
      if (nextCp) { const dd = Math.hypot(nextCp.dock.x - S.x, nextCp.dock.z - S.z); if (dd < 48) tgt = nextCp.dock; }
      const want = Math.atan2(tgt.x - S.x, -(tgt.z - S.z));
      steer = clamp(angDiff(S.psi, want) * 2.4, -1, 1);
      const dd2 = nextCp ? Math.hypot(nextCp.dock.x - S.x, nextCp.dock.z - S.z) : 999;
      thr = dd2 < 26 ? .35 : .8;
      if (nx.i > samples.length - 12) thr = 0;
    }
    if (S.paused) { steer = 0; thr = 0; brake = 1; boostBtn = 0; }

    /* ---- physics ---- */
    S.boost = Math.max(0, S.boost - dt);
    const boosting = (boostBtn && S.userTook) || S.boost > 0;
    const maxSp = boosting ? 62 : 36;
    const f = fwdOf(S.psi), r = new THREE.Vector3(Math.cos(S.psi), 0, Math.sin(S.psi));
    let vF = S.vx * f.x + S.vz * f.z, vL = S.vx * r.x + S.vz * r.z;
    const accel = (boosting ? 46 : 24) * thr - (brake ? 26 : 0);
    vF += accel * dt; if (vF > maxSp) vF = lerp(vF, maxSp, 1 - Math.exp(-4 * dt));
    vF *= Math.exp(-(thr ? .18 : .5) * dt); vF = Math.max(vF, -8);
    vL *= Math.exp(-2.4 * dt);
    S.vx = f.x * vF + r.x * vL; S.vz = f.z * vF + r.z * vL;
    const spN = clamp(Math.abs(vF) / 34, 0, 1.4);
    const tYaw = -steer * 1.55 * Math.min(1, Math.abs(vF) / 9) * (vF < 0 ? -1 : 1);
    S.yawRate = damp(S.yawRate, -tYaw, 5, dt);
    S.psi += S.yawRate * dt;
    S.x += S.vx * dt; S.z += S.vz * dt; S.speed = Math.hypot(S.vx, S.vz);
    S.steer = damp(S.steer, steer, 8, dt);

    // dock assist: gentle capture when inside ring
    // collisions
    for (const c of colliders) {
      const dx = S.x - c.x, dz = S.z - c.z, rr = c.r + 2.3; if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
      const d = Math.hypot(dx, dz); if (d < rr) {
        const nxv = dx / (d || 1), nzv = dz / (d || 1); S.x = c.x + nxv * rr; S.z = c.z + nzv * rr;
        const vn = S.vx * nxv + S.vz * nzv; if (vn < 0) { S.vx -= 1.6 * vn * nxv; S.vz -= 1.6 * vn * nzv; S.shake = Math.min(1, S.shake + Math.abs(vn) / 40); S.bump = .4; blip(120, .2, 'square', .1); if (S.time - S.lastBump > 1.2) { S.lastBump = S.time; emit({ type: 'bump', text: 'Collision!', sub: 'Steer clear of buildings', color: '#ff6b6b' }); } }
      }
    }
    // soft corridor
    if (nx.d > 75) { const q = samples[nx.i], k = (nx.d - 75) * .6 * dt; S.vx += (q.x - S.x) / nx.d * k * 20; S.vz += (q.z - S.z) / nx.d * k * 20; }

    /* ---- docking ---- */
    checkpoints.forEach(c => {
      const d = Math.hypot(S.x - c.dock.x, S.z - c.dock.z);
      if (d < c.radius) {
        if (!c.cooldown && !S.paused) { c.prog += dt / .9; S.vx *= (1 - .6 * dt); S.vz *= (1 - .6 * dt); if (c.prog >= 1) { c.prog = 1; triggerDock(c); } }
      } else { c.prog = Math.max(0, c.prog - dt * 1.5); if (d > c.radius + 5) c.cooldown = false; }
      c.ring.material.uniforms.uTime.value = t; c.ring.material.uniforms.uProg.value = c.prog; c.ring.material.uniforms.uHot.value = c.prog * 1.2 + (c === nextCp ? .25 + .15 * Math.sin(t * 4) : 0);
      c.beam.material.uniforms.uTime.value = t; c.beam.material.uniforms.uA.value = c.visited ? .35 : 1;
    });

    /* ---- rings ---- */
    ringList.forEach(rg => {
      if (rg.taken) { rg.scale = Math.max(0, rg.scale - dt * 4); rg.g.scale.setScalar(rg.scale); rg.g.visible = rg.scale > .01; return; }
      const dx = S.x - rg.p.x, dz = S.z - rg.p.z, s = dx * rg.T.x + dz * rg.T.z, lat = Math.hypot(dx - s * rg.T.x, dz - s * rg.T.z);
      if (rg.side !== 0 && Math.sign(s) !== rg.side && lat < 5) { rg.taken = true; S.rings++; S.boost = 2.0; blip(1040, .22, 'sine', .14); emit({ type: 'ring', text: 'Boost ring', sub: S.rings + '/' + ringList.length, color: '#ffd27a' }); emitBurst(rg.p, 30, new THREE.Color(3, 2, .6)); }
      rg.side = Math.abs(s) < .01 ? rg.side : Math.sign(s);
      rg.g.rotation.z += dt * .8;
    });

    /* ---- boat transform ---- */
    const wv = waveH(S.x, S.z, t);
    const fF = fwdOf(S.psi), rF = new THREE.Vector3(Math.cos(S.psi), 0, Math.sin(S.psi));
    boat.position.set(S.x, wv.h * .9 + .22, S.z);
    boat.rotation.y = -S.psi;
    boat.rotation.x = Math.atan(wv.gx * fF.x + wv.gz * fF.z) * .8 + clamp(thr * .05 + (boosting ? .04 : 0), 0, .12) - brake * .03;
    boat.rotation.z = Math.atan(wv.gx * rF.x + wv.gz * rF.z) * .8 - S.steer * .32 * clamp(spN, 0, 1);
    wheel.rotation.z = -S.steer * 1.1; rider.rotation.z = S.steer * .1; head.rotation.y = -S.steer * .35;
    rider.rotation.x = -(thr ? .06 : 0) - (boosting ? .08 : 0);

    /* ---- camera ---- */
    S.introT = Math.min(1, S.introT + dt / 3.2);
    if (S.paused) {
      S.orbit += dt * .3; const rad = 11;
      tmp.set(S.x + Math.cos(S.orbit) * rad, 4.2 + Math.sin(S.orbit * .7) * .8, S.z + Math.sin(S.orbit) * rad);
      camPos.lerp(tmp, 1 - Math.exp(-3 * dt)); camTgt.set(S.x, 2.3, S.z);
    } else {
      S.camYaw += angDiff(S.camYaw, S.psi) * (1 - Math.exp(-(boosting ? 5 : 3.2) * dt));
      const cf = fwdOf(S.camYaw), back = 12.5 + spN * 3.5 + (aspect < 1 ? 5 : 0), hh = 4.7 + spN * .9;
      tmp.set(S.x - cf.x * back, hh, S.z - cf.z * back);
      const e = sm(S.introT);
      if (e < 1) { // intro: swing from a close side/rear-quarter angle
        const ia = S.camYaw - 2.2 * (1 - e) ; const idist = lerp(7.2, back, e);
        const cf2 = fwdOf(ia); tmp.set(S.x - cf2.x * idist, lerp(2.6, hh, e), S.z - cf2.z * idist);
      }
      camPos.lerp(tmp, 1 - Math.exp(-(S.introT < 1 ? 8 : 7) * dt));
      camTgt.set(S.x + cf.x * lerp(2, 8, e), lerp(1.8, 2.2, e), S.z + cf.z * lerp(2, 8, e));
    }
    S.shake = Math.max(0, S.shake - dt * 1.6);
    camera.position.copy(camPos); if (S.shake > 0) camera.position.add(tmp2.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(S.shake * .35));
    camera.position.y = Math.max(camera.position.y, 1.2);
    camera.lookAt(camTgt);
    const fov = (aspect < .8 ? 72 : 58) + spN * 12 + (boosting ? 8 : 0);
    if (Math.abs(camera.fov - fov) > .05) { camera.fov = damp(camera.fov, fov, 4, dt); camera.updateProjectionMatrix(); }

    /* ---- world animation ---- */
    sky.position.copy(camera.position); mtns.forEach(m => { m.position.x = camera.position.x; m.position.z = camera.position.z; });
    water.position.set(Math.round(camera.position.x / 11.25) * 11.25, 0, Math.round(camera.position.z / 11.25) * 11.25);
    waterMat.uniforms.uTime.value = t; waterMat.uniforms.uCam.value.copy(camera.position);
    sunL.position.copy(boat.position).addScaledVector(SUN, 70); sunL.target.position.copy(boat.position);
    ledTex.offset.x = (t * .035) % 1;
    beacons.material.opacity = .55 + .45 * (Math.sin(t * 3) > 0 ? 1 : 0);
    buoyLights.material.opacity = .5 + .5 * (Math.sin(t * 2.2) > 0 ? 1 : 0);
    const bl = buoyLightGeo.attributes.position;
    for (let i = 0; i < buoyN; i++) {
      const p = buoyPos[i], w = waveH(p.x, p.z, t); eul.set(Math.atan(w.gz) * .6, 0, -Math.atan(w.gx) * .6);
      quat.setFromEuler(eul); mtx.compose(tmp.set(p.x, w.h * .9 + .35, p.z), quat, scl.set(1, 1, 1)); buoyBody.setMatrixAt(i, mtx); bl.setXYZ(i, p.x, w.h * .9 + 1.25, p.z);
    }
    buoyBody.instanceMatrix.needsUpdate = true; bl.needsUpdate = true;
    for (let i = 0; i < debrisN; i++) { const d = debrisPos[i], w = waveH(d.x, d.z, t); eul.set(Math.atan(w.gz), d.r + t * .05, -Math.atan(w.gx)); quat.setFromEuler(eul); mtx.compose(tmp.set(d.x, w.h * .9 + .2, d.z), quat, scl.set(d.s, d.s, d.s)); debris.setMatrixAt(i, mtx); }
    debris.instanceMatrix.needsUpdate = true;
    gulls.forEach(g => {
      const u = g.userData, a = t * u.sp + u.ph, c = at(u.t);
      const gx = c.x + Math.cos(a) * u.rad * 2.2, gz = c.z + Math.sin(a) * u.rad * 2.2;
      g.position.set(gx, u.h + Math.sin(a * 2) * 2, gz); g.rotation.y = -a; const fl = Math.sin(t * 9 + u.ph) * .7; u.l.rotation.z = fl; u.r.rotation.z = -fl;
    });
    checkpoints.forEach(c => {
      c.sign.userData.mat.color.setScalar(2 + .5 * Math.sin(t * 2 + c.i));
      c.sign.position.y += Math.sin(t * 1.3 + c.i) * .004;
      if (c.scan) c.scan.position.y = 10 + Math.sin(t * 1.6) * 6.5;
      if (c.spin) c.spin.forEach((m, k) => { m.rotation.z += dt * (.5 + k * .3); m.rotation.y += dt * .15; });
      if (c.orb) { c.orb.rotation.y += dt * .35; c.core.rotation.y += dt * .4; c.core.rotation.x += dt * .2; }
      if (c.ringG) c.ringG.rotation.y += dt * .22;
      if (c.sweep) c.sweep.rotation.y += dt * .9;
      if (c.screens) c.screens.forEach((s, k) => { s.position.y = s.userData.base + Math.sin(t * 1.1 + k * 1.6) * .35; });
    });

    /* spray + wake */
    sAcc += (10 + S.speed * 3.2) * dt;
    const sternX = S.x - fF.x * 3.3, sternZ = S.z - fF.z * 3.3;
    while (sAcc >= 1) { sAcc--; const i = sHead; sHead = (sHead + 1) % SPN; sPos[i * 3] = sternX + rnd(-.6, .6); sPos[i * 3 + 1] = boat.position.y + .5; sPos[i * 3 + 2] = sternZ + rnd(-.6, .6); const k = 2 + Math.random() * 4; sVel[i * 3] = -fF.x * k + rnd(-1.5, 1.5) + rF.x * rnd(-2, 2); sVel[i * 3 + 1] = 1.2 + Math.random() * 3 + S.speed * .05; sVel[i * 3 + 2] = -fF.z * k + rnd(-1.5, 1.5) + rF.z * rnd(-2, 2); sLife[i] = .8 + Math.random() * .6; }
    for (let i = 0; i < SPN; i++) { if (sLife[i] <= 0) { sPos[i * 3 + 1] = -100; continue; } sLife[i] -= dt; sVel[i * 3 + 1] -= 8 * dt; sPos[i * 3] += sVel[i * 3] * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt; if (sPos[i * 3 + 1] < .05) sLife[i] = 0; }
    sGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < BN; i++) { if (bLife[i] <= 0) { bPos[i * 3 + 1] = -100; continue; } bLife[i] -= dt; bVel[i * 3 + 1] -= 6 * dt; bPos[i * 3] += bVel[i * 3] * dt; bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt; bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt; }
    bGeo.attributes.position.needsUpdate = true;
    wakeAcc += S.speed * dt;
    if (wakeAcc > .9) { wakeAcc = 0; wakePts.pop(); wakePts.unshift({ x: sternX, z: sternZ, fx: fF.x, fz: fF.z, a: clamp(S.speed / 22, 0, 1) }); }
    else { wakePts[0].x = sternX; wakePts[0].z = sternZ; wakePts[0].fx = fF.x; wakePts[0].fz = fF.z; wakePts[0].a = Math.max(wakePts[0].a, clamp(S.speed / 22, 0, 1)); }
    for (let i = 0; i < WN; i++) {
      const p = wakePts[i], k = i / (WN - 1), wd = .9 + k * 5.5, nxv = -p.fz, nzv = p.fx, y = waveH(p.x, p.z, t).h * .9 + .08;
      wPos.set([p.x + nxv * wd, y, p.z + nzv * wd, p.x - nxv * wd, y, p.z - nzv * wd], i * 6);
      wAl[i * 2] = wAl[i * 2 + 1] = p.a * (1 - k) * (1 - k) * .55; wUv.set([0, i * .12, 1, i * .12], i * 4);
    }
    wakeGeo.attributes.position.needsUpdate = true; wakeGeo.attributes.alpha.needsUpdate = true; wakeGeo.attributes.uv.needsUpdate = true; wakeMat.uniforms.uTime.value = t;

    /* audio */
    if (audio.on && audio.ctx && audio.eg) { const sp = clamp(S.speed / 40, 0, 1.4); audio.osc.frequency.value = 52 + sp * 70 + thr * 10; audio.lp.frequency.value = 300 + sp * 700; audio.eg.gain.value = S.paused ? 0.01 : .03 + sp * .05; audio.ng.gain.value = S.paused ? 0 : sp * .06; }

    if (usePost) { finalPass.uniforms.uTime.value = t; finalPass.uniforms.uBoost.value = damp(finalPass.uniforms.uBoost.value, boosting ? 1 : 0, 5, dt); bloom.strength = .6 + (boosting ? .25 : 0); }

    /* HUD */
    hudT += dt;
    if (hudT > .066 && onHud) {
      hudT = 0; let bearing = 0, dist = 0;
      if (nextCp) { bearing = angDiff(S.psi, Math.atan2(nextCp.dock.x - S.x, -(nextCp.dock.z - S.z))); dist = Math.hypot(nextCp.dock.x - S.x, nextCp.dock.z - S.z); }
      const dk = checkpoints.find(c => c.prog > 0 && !c.cooldown);
      onHud({ speed: S.speed, boosting, boostT: S.boost, rings: S.rings, ringsTotal: ringList.length, auto: S.auto, bearing, dist, next: nextCp ? nextCp.id : null, nextLabel: nextCp ? nextCp.label : null,
        visited: checkpoints.map(c => c.visited), dock: dk ? { id: dk.id, label: dk.label, prog: dk.prog, color: dk.color } : null,
        x: S.x, z: S.z, psi: S.psi, intro: S.introT, done: checkpoints.every(c => c.visited), night: S.todTgt, playTime: S.playTime, ringsTaken: ringList.map(r => r.taken) });
    }
    camera.updateMatrixWorld();
    if (usePost) { renderReflection(); composer.render(dt); } else renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  // initial placement so first visible frame is right
  camPos.set(S.x - fwdOf(S.psi).x * 7, 2.6, S.z - fwdOf(S.psi).z * 7);
  return api;
}
