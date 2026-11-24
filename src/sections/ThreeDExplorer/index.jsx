import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Box, Layers, ScanLine, Play, Pause } from 'lucide-react';
import { MODULE_TYPES, MODULE_INFO } from '../../services/qr/moduleClassifier';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const CYAN = '#22B8CF';

const TYPE_COLORS = {
  [MODULE_TYPES.FINDER]: '#FF6B6B',
  [MODULE_TYPES.SEPARATOR]: '#FFA94D',
  [MODULE_TYPES.TIMING_H]: '#51CF66',
  [MODULE_TYPES.TIMING_V]: '#51CF66',
  [MODULE_TYPES.ALIGNMENT]: '#339AF0',
  [MODULE_TYPES.FORMAT_INFO]: '#CC5DE8',
  [MODULE_TYPES.VERSION_INFO]: '#F06595',
  [MODULE_TYPES.DATA]: CYAN,
  [MODULE_TYPES.DARK_MODULE]: '#845EF7',
};

const REGION_BUTTONS = [
  { key: null, label: 'All Regions', color: CYAN },
  { key: MODULE_TYPES.FINDER, label: 'Finder', color: TYPE_COLORS[MODULE_TYPES.FINDER] },
  { key: 'TIMING', label: 'Timing', color: TYPE_COLORS[MODULE_TYPES.TIMING_H] },
  { key: MODULE_TYPES.ALIGNMENT, label: 'Alignment', color: TYPE_COLORS[MODULE_TYPES.ALIGNMENT] },
  { key: MODULE_TYPES.FORMAT_INFO, label: 'Format', color: TYPE_COLORS[MODULE_TYPES.FORMAT_INFO] },
  { key: MODULE_TYPES.DATA, label: 'Data & EC', color: TYPE_COLORS[MODULE_TYPES.DATA] },
];

const VIEW_MODES = [
  { key: 'skyline', label: 'Skyline' },
  { key: 'blocks', label: 'Blocks' },
  { key: 'flat', label: 'Flat' },
];

// "Skyline" mode: every structural part of the code gets its own building height.
const SKYLINE_HEIGHTS = {
  [MODULE_TYPES.FINDER]: 3.2,
  [MODULE_TYPES.ALIGNMENT]: 2.0,
  [MODULE_TYPES.FORMAT_INFO]: 1.5,
  [MODULE_TYPES.VERSION_INFO]: 1.5,
  [MODULE_TYPES.DARK_MODULE]: 1.5,
  [MODULE_TYPES.TIMING_H]: 1.1,
  [MODULE_TYPES.TIMING_V]: 1.1,
};

const FOV = 50;
const MAX_HOVER_MODULES = 100; // raycasting thousands of instances gets expensive
const MAX_AUTO_SCANNER = 85;

// Reused objects so the animation loop never allocates
const _obj = new THREE.Object3D();
const _col = new THREE.Color();
const WHITE = new THREE.Color('#ffffff');

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function matchesRegion(type, region) {
  if (!region) return true;
  if (region === 'TIMING') return type === MODULE_TYPES.TIMING_H || type === MODULE_TYPES.TIMING_V;
  return type === region;
}

// Deterministic pseudo-random 0..1 so the data "city" looks the same every render
function hash(row, col) {
  const s = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function baseHeight(type, row, col, mode) {
  if (mode === 'flat') return 0.15;
  if (mode === 'blocks') return 0.6;
  return SKYLINE_HEIGHTS[type] ?? 0.35 + hash(row, col) * 0.8;
}

const beamZ = (time, offset) => Math.sin(time * 0.45) * (offset + 1);

/* ------------------------------------------------------------------ */
/*  Camera                                                            */
/* ------------------------------------------------------------------ */

function CameraRig({ viewMode, moduleCount, resetKey }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);

  useEffect(() => {
    if (viewMode === 'flat') {
      const half = moduleCount / 2 + 2;
      const dist = half / Math.tan((FOV / 2) * (Math.PI / 180));
      camera.position.set(0, dist, 0.01);
    } else {
      const d = Math.max(moduleCount * 0.9, 15);
      camera.position.set(d * 0.65, d * 0.45, d * 0.65);
    }
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [viewMode, moduleCount, resetKey, camera, controls]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  The QR itself: animated towers with glowing caps                  */
/* ------------------------------------------------------------------ */

function QRField({ matrix, moduleCount, classificationMap, highlightedRegion, viewMode, scanner, hoverable, onHover }) {
  const bodyRef = useRef();
  const capRef = useRef();
  const hoveredRef = useRef(-1);
  const anim = useRef({ t: 0, settled: false });
  const offset = moduleCount / 2;

  const modules = useMemo(() => {
    const list = [];
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (matrix[row][col] === 1) {
          const x = col - offset + 0.5;
          const z = row - offset + 0.5;
          // Rise from the centre outward
          const delay = (Math.hypot(x, z) / (moduleCount * 0.75)) * 1.2;
          list.push({ row, col, x, z, delay, type: classificationMap[row][col] });
        }
      }
    }
    return list;
  }, [matrix, moduleCount, classificationMap, offset]);

  const n = modules.length;

  // Per-instance animated values (current + target)
  const state = useMemo(
    () => ({
      h: new Float32Array(n),
      d: new Float32Array(n).fill(1),
      th: new Float32Array(n),
      td: new Float32Array(n),
      base: modules.map((m) => new THREE.Color(TYPE_COLORS[m.type] || CYAN)),
    }),
    [modules, n]
  );

  // Replay the intro whenever a new code arrives
  useEffect(() => {
    anim.current.t = prefersReducedMotion() ? 10 : 0;
    anim.current.settled = false;
    hoveredRef.current = -1;
  }, [modules]);

  // Targets: where every module wants to be
  useEffect(() => {
    modules.forEach((m, i) => {
      const match = matchesRegion(m.type, highlightedRegion);
      const h = baseHeight(m.type, m.row, m.col, viewMode);
      state.th[i] = match ? h * (highlightedRegion ? 1.25 : 1) : 0.1;
      state.td[i] = match ? 1 : 0.12;
    });
    anim.current.settled = false;
  }, [modules, state, highlightedRegion, viewMode]);

  useEffect(() => {
    anim.current.settled = false;
  }, [scanner]);

  // Generous bounding sphere so hover raycasts never get culled by a stale one
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), moduleCount);
    }
  }, [n, moduleCount]);

  useFrame(({ clock }, dt) => {
    const body = bodyRef.current;
    const cap = capRef.current;
    if (!body || !cap || n === 0) return;

    const a = anim.current;
    const delta = Math.min(dt, 0.05);
    a.t += delta;
    if (a.settled && !scanner) return;

    const k = 1 - Math.exp(-delta * 9);
    const bz = scanner ? beamZ(clock.elapsedTime, offset) : 0;
    const hov = hoveredRef.current;
    let moving = false;

    for (let i = 0; i < n; i++) {
      const m = modules[i];

      // ease toward targets
      const dh = state.th[i] - state.h[i];
      const dd = state.td[i] - state.d[i];
      if (Math.abs(dh) > 0.002 || Math.abs(dd) > 0.002) {
        state.h[i] += dh * k;
        state.d[i] += dd * k;
        moving = true;
      } else {
        state.h[i] = state.th[i];
        state.d[i] = state.td[i];
      }

      // staggered intro
      let p = (a.t - m.delay) / 0.9;
      if (p < 1) moving = true;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      const intro = 1 - Math.pow(1 - p, 3);

      // scanner wave + hover lift
      let glow = 0;
      if (scanner) {
        const dz = m.z - bz;
        glow = Math.exp(-(dz * dz) / 6);
      }
      const hv = i === hov ? 1 : 0;

      const h = Math.max(0.01, (state.h[i] + glow * 0.6 + hv * 0.5) * intro);

      _obj.position.set(m.x, h / 2, m.z);
      _obj.scale.set(0.88, h, 0.88);
      _obj.updateMatrix();
      body.setMatrixAt(i, _obj.matrix);

      _obj.position.set(m.x, h + 0.035, m.z);
      _obj.scale.set(0.74, 0.07, 0.74);
      _obj.updateMatrix();
      cap.setMatrixAt(i, _obj.matrix);

      // dark tinted body, bright LED-like cap
      _col.copy(state.base[i]).multiplyScalar(state.d[i] * 0.8);
      body.setColorAt(i, _col);

      _col
        .copy(state.base[i])
        .lerp(WHITE, Math.min(1, 0.3 + glow * 0.5 + hv * 0.4))
        .multiplyScalar(state.d[i]);
      cap.setColorAt(i, _col);
    }

    body.instanceMatrix.needsUpdate = true;
    cap.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (cap.instanceColor) cap.instanceColor.needsUpdate = true;

    if (!moving && !scanner) a.settled = true;
  });

  const handleMove = (e) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id == null || id === hoveredRef.current) return;
    hoveredRef.current = id;
    anim.current.settled = false;
    const m = modules[id];
    if (m) onHover?.({ row: m.row, col: m.col, type: m.type });
  };

  const handleOut = () => {
    if (hoveredRef.current === -1) return;
    hoveredRef.current = -1;
    anim.current.settled = false;
    onHover?.(null);
  };

  if (n === 0) return null;

  return (
    <>
      <instancedMesh
        key={`body-${n}`}
        ref={bodyRef}
        args={[undefined, undefined, n]}
        frustumCulled={false}
        castShadow
        receiveShadow
        onPointerMove={hoverable ? handleMove : undefined}
        onPointerOut={hoverable ? handleOut : undefined}
      >
        <boxGeometry args={[1, 1, 1]} />
        {/* No vertexColors: instance colours work on their own */}
        <meshStandardMaterial roughness={0.35} metalness={0.05} />
      </instancedMesh>

      <instancedMesh key={`cap-${n}`} ref={capRef} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function LightModuleGrid({ matrix, moduleCount, classificationMap, highlightedRegion }) {
  const meshRef = useRef();

  const lightModules = useMemo(() => {
    const modules = [];
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (matrix[row][col] === 0) modules.push({ row, col, type: classificationMap[row][col] });
      }
    }
    return modules;
  }, [matrix, moduleCount, classificationMap]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const offset = moduleCount / 2;

    lightModules.forEach((mod, i) => {
      _obj.position.set(mod.col - offset + 0.5, 0.01, mod.row - offset + 0.5);
      _obj.scale.set(0.88, 0.02, 0.88);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);

      const match = matchesRegion(mod.type, highlightedRegion);
      _col.set(match ? '#25254a' : '#121226');
      mesh.setColorAt(i, _col);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [lightModules, highlightedRegion, moduleCount]);

  if (lightModules.length === 0) return null;

  return (
    <instancedMesh key={lightModules.length} ref={meshRef} args={[undefined, undefined, lightModules.length]} frustumCulled={false} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Atmosphere                                                        */
/* ------------------------------------------------------------------ */

function BasePlate({ moduleCount }) {
  const size = moduleCount + 2;
  const frame = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(size, 0.12, size)),
    [size]
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0f0f26" roughness={0.9} />
      </mesh>
      <lineSegments geometry={frame} position={[0, -0.08, 0]}>
        <lineBasicMaterial color={CYAN} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

// A glowing curtain that sweeps across the code like a real scanner
function Scanner({ moduleCount }) {
  const ref = useRef();
  const offset = moduleCount / 2;

  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(34,184,207,0)');
    grad.addColorStop(1, 'rgba(34,184,207,0.6)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.z = beamZ(clock.elapsedTime, offset);
  });

  const width = moduleCount + 2;
  return (
    <group ref={ref}>
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[width, 5]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[width, 0.06, 0.12]} />
        <meshBasicMaterial color="#b6f6ff" toneMapped={false} />
      </mesh>
    </group>
  );
}

// Radar-style rings that expand outward from the plate
function PingRings({ radius }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((ring, i) => {
      const p = (clock.elapsedTime * 0.18 + i / 3) % 1;
      ring.scale.setScalar(0.45 + p * 1.3);
      ring.material.opacity = (1 - p) * (1 - p) * 0.5;
    });
  });
  return (
    <group ref={group} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[radius - 0.15, radius, 128]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// Slowly rising dust motes
function Motes({ moduleCount }) {
  const ref = useRef();
  const count = 140;
  const ceiling = 9;

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    const span = moduleCount * 1.3;
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * span;
      a[i * 3 + 1] = Math.random() * ceiling;
      a[i * 3 + 2] = (Math.random() - 0.5) * span;
    }
    return a;
  }, [moduleCount]);

  useFrame((_, dt) => {
    const attr = ref.current?.geometry.attributes.position;
    if (!attr) return;
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1;
      attr.array[idx] += Math.min(dt, 0.05) * 0.4;
      if (attr.array[idx] > ceiling) attr.array[idx] = 0;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#8cf0ff"
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function Starfield({ radius }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const n = 500;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = radius * (0.9 + Math.random() * 0.4);
      const s = Math.sqrt(1 - u * u);
      a[i * 3] = r * s * Math.cos(th);
      a[i * 3 + 1] = Math.abs(r * u) * 0.9 + 2;
      a[i * 3 + 2] = r * s * Math.sin(th);
    }
    return a;
  }, [radius]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.6} sizeAttenuation={false} color="#b8c4ff" transparent opacity={0.7} fog={false} toneMapped={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                             */
/* ------------------------------------------------------------------ */

function Scene({ qrData, classificationMap, highlightedRegion, viewMode, resetKey, scanner, spin, onUserOrbit, onHover }) {
  const { moduleCount } = qrData;
  const half = moduleCount / 2 + 2;

  return (
    <>
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#0a0a1a', moduleCount * 1.4, moduleCount * 4.5]} />

      <CameraRig viewMode={viewMode} moduleCount={moduleCount} resetKey={resetKey} />

      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#7dd3fc', '#1e1b4b', 0.5]} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={1}
        shadow-camera-far={moduleCount * 3}
      />
      {/* violet rim light from behind */}
      <directionalLight position={[-12, 8, -10]} intensity={0.6} color="#845EF7" />

      <Starfield radius={Math.max(150, moduleCount * 5)} />
      <PingRings radius={moduleCount * 0.8} />
      <Motes moduleCount={moduleCount} />

      <group>
        <QRField
          matrix={qrData.matrix}
          moduleCount={moduleCount}
          classificationMap={classificationMap}
          highlightedRegion={highlightedRegion}
          viewMode={viewMode}
          scanner={scanner}
          hoverable={moduleCount <= MAX_HOVER_MODULES}
          onHover={onHover}
        />
        <LightModuleGrid
          matrix={qrData.matrix}
          moduleCount={moduleCount}
          classificationMap={classificationMap}
          highlightedRegion={highlightedRegion}
        />
        <BasePlate moduleCount={moduleCount} />
        {scanner && <Scanner moduleCount={moduleCount} />}
      </group>

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5}
        maxDistance={Math.max(80, moduleCount * 3)}
        maxPolarAngle={Math.PI / 2 - 0.02}
        autoRotate={spin && viewMode !== 'flat'}
        autoRotateSpeed={0.7}
        onStart={onUserOrbit}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  UI                                                                */
/* ------------------------------------------------------------------ */

function Pill({ active, color = CYAN, onClick, dot, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={!!active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 14px',
        borderRadius: 999,
        border: active ? `1px solid ${color}` : '1px solid var(--color-border)',
        background: active ? `color-mix(in srgb, ${color} 16%, transparent)` : 'var(--color-bg-card)',
        color: active ? color : 'var(--color-text-secondary)',
        boxShadow: active ? `0 0 16px color-mix(in srgb, ${color} 40%, transparent)` : 'none',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s',
      }}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dot,
            boxShadow: `0 0 8px ${dot}`,
            opacity: active ? 1 : 0.7,
          }}
        />
      )}
      {children}
    </button>
  );
}

const hudChip = {
  display: 'inline-flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  padding: '6px 12px',
  borderRadius: 999,
  background: 'rgba(10,10,26,0.62)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#d6dcff',
  fontSize: '0.75rem',
};

export default function ThreeDExplorer({ qrData, classificationMap }) {
  const [highlightedRegion, setHighlightedRegion] = useState(null);
  const [viewMode, setViewMode] = useState('skyline');
  const [resetKey, setResetKey] = useState(0);
  const [spin, setSpin] = useState(() => !prefersReducedMotion());
  const [scannerPref, setScannerPref] = useState(null); // null = automatic
  const [hovered, setHovered] = useState(null);
  const webglOk = useMemo(() => hasWebGL(), []);

  const moduleCount = qrData?.moduleCount ?? 0;
  const scanner = scannerPref ?? (!prefersReducedMotion() && moduleCount <= MAX_AUTO_SCANNER);

  useEffect(() => setHovered(null), [qrData]);

  const darkCount = useMemo(() => {
    if (!qrData) return 0;
    let c = 0;
    for (const row of qrData.matrix) for (const v of row) if (v === 1) c++;
    return c;
  }, [qrData]);

  const regionInfo = useMemo(() => {
    if (!highlightedRegion) return null;
    if (highlightedRegion === 'TIMING') return MODULE_INFO[MODULE_TYPES.TIMING_H];
    return MODULE_INFO[highlightedRegion];
  }, [highlightedRegion]);

  if (!qrData || !classificationMap) {
    return (
      <section id="3d-explorer" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">
            <span className="text-gradient-cyan">Explore</span> in Three Dimensions
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 20, fontSize: '1rem' }}>
            <Box size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            Generate a QR code to view it in 3D.
          </p>
        </div>
      </section>
    );
  }

  if (!webglOk) {
    return (
      <section id="3d-explorer" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">3D Explorer</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 20 }}>
            3D visualization requires WebGL support. Your browser may not support it.
          </p>
        </div>
      </section>
    );
  }

  const camDist = Math.max(moduleCount * 0.9, 15);
  const hoverable = moduleCount <= MAX_HOVER_MODULES;
  const hoveredColor = hovered ? TYPE_COLORS[hovered.type] || CYAN : CYAN;

  return (
    <section id="3d-explorer" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="section-container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
          <h2 className="section-title">
            <span className="text-gradient-cyan">Explore</span> in Three Dimensions
          </h2>
          <p className="section-description" style={{ marginBottom: 32 }}>
            Your QR code, rebuilt as a city. Finder patterns become towers, data becomes the skyline, and a scanner sweeps
            across it. Filter a region to make it rise above the rest.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="glass-panel glow-cyan" style={{ padding: 4, borderRadius: 16, overflow: 'hidden' }}>
            <div
              style={{
                position: 'relative',
                height: 'clamp(380px, 56vh, 640px)',
                borderRadius: 14,
                overflow: 'hidden',
                background: '#0a0a1a',
              }}
            >
              <Canvas
                flat
                shadows
                dpr={[1, 2]}
                camera={{
                  position: [camDist * 0.65, camDist * 0.45, camDist * 0.65],
                  fov: FOV,
                  near: 0.1,
                  far: 2000,
                }}
                gl={{ antialias: true, alpha: false }}
                style={{ background: '#0a0a1a' }}
              >
                <Suspense fallback={null}>
                  <Scene
                    qrData={qrData}
                    classificationMap={classificationMap}
                    highlightedRegion={highlightedRegion}
                    viewMode={viewMode}
                    resetKey={resetKey}
                    scanner={scanner}
                    spin={spin}
                    onUserOrbit={() => setSpin(false)}
                    onHover={setHovered}
                  />
                </Suspense>
              </Canvas>

              {/* HUD: module inspector */}
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, pointerEvents: 'none' }}>
                <div style={hudChip}>
                  {hovered ? (
                    <>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: hoveredColor,
                          boxShadow: `0 0 10px ${hoveredColor}`,
                        }}
                      />
                      <strong style={{ color: hoveredColor }}>{MODULE_INFO[hovered.type]?.name ?? 'Module'}</strong>
                      <span style={{ opacity: 0.7 }}>row {hovered.row}</span>
                      <span style={{ opacity: 0.7 }}>column {hovered.col}</span>
                    </>
                  ) : (
                    <span style={{ opacity: 0.75 }}>
                      Drag to orbit, scroll to zoom{hoverable ? ', hover a block to inspect it' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* HUD: code stats */}
              <div style={{ position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none' }}>
                <div style={hudChip}>
                  <span>Version {qrData.version}</span>
                  <span style={{ opacity: 0.7 }}>
                    {moduleCount} × {moduleCount} modules
                  </span>
                  <span style={{ opacity: 0.7 }}>{darkCount} dark</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            className="explorer-controls"
          >
            {/* Region filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {REGION_BUTTONS.map((btn) => {
                if (btn.key === MODULE_TYPES.VERSION_INFO && qrData.version < 7) return null;
                if (btn.key === MODULE_TYPES.ALIGNMENT && qrData.version < 2) return null;
                const active = highlightedRegion === btn.key;
                return (
                  <Pill
                    key={btn.label}
                    active={active}
                    color={btn.color}
                    dot={btn.key ? btn.color : null}
                    onClick={() => setHighlightedRegion(active ? null : btn.key)}
                  >
                    {btn.label}
                  </Pill>
                );
              })}
            </div>

            {/* View controls */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
                <Layers size={14} />
              </span>
              {VIEW_MODES.map((m) => (
                <Pill key={m.key} active={viewMode === m.key} onClick={() => setViewMode(m.key)}>
                  {m.label}
                </Pill>
              ))}
              <Pill active={scanner} onClick={() => setScannerPref(!scanner)} title="Toggle the scanner sweep">
                <ScanLine size={14} />
                Scanner
              </Pill>
              <Pill
                active={spin && viewMode !== 'flat'}
                onClick={() => setSpin((s) => !s)}
                title="Toggle auto-rotate"
              >
                {spin ? <Pause size={14} /> : <Play size={14} />}
                Rotate
              </Pill>
              <Pill
                onClick={() => {
                  setResetKey((k) => k + 1);
                  setSpin(true);
                }}
                title="Reset the camera"
              >
                <RotateCcw size={14} />
                Reset
              </Pill>
            </div>
          </div>

          {/* Region info */}
          {regionInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{ marginTop: 16, padding: 16, borderLeft: `3px solid ${regionInfo.color}` }}
            >
              <h4 style={{ color: regionInfo.color, fontWeight: 700, marginBottom: 4 }}>{regionInfo.name}</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {regionInfo.description}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .explorer-controls {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </section>
  );
}

