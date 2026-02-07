'use client';

import React, { useRef, useMemo, Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, invalidate } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/AppContext';

/* ══════════════════════════════════════════════════
   Хук для паузы при скрытии вкладки
   + IntersectionObserver для паузы при прокрутке
   ══════════════════════════════════════════════════ */

const useVisibility = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Page Visibility API
    const onVisChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisChange);

    // Intersection Observer — pause when scrolled away
    const el = containerRef.current;
    if (!el) return () => document.removeEventListener('visibilitychange', onVisChange);

    const io = new IntersectionObserver(
      ([e]) => setVisible(prev => !document.hidden && e.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      io.disconnect();
    };
  }, [containerRef]);

  return visible;
};

/* ══════════════════════════════════════════════════════════
   Chrome Iridescent Shader
   Встроенный bloom + fresnel glow, без постобработки,
   чтобы canvas оставался полностью прозрачным
   ══════════════════════════════════════════════════════════ */

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vFresnel;

  void main() {
    vUv = uv;
    vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
    vNormal      = normalize(normalMatrix * normal);
    vViewDir     = normalize(-mvPos.xyz);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;

    float NdotV = max(dot(vNormal, vViewDir), 0.0);
    vFresnel = pow(1.0 - NdotV, 3.0);

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uBaseColor;
  uniform vec3  uDeepColor;
  uniform vec3  uAccent;
  uniform vec3  uSpecColor;
  uniform float uIsDark;

  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying vec3  vWorldNormal;
  varying vec3  vWorldPos;
  varying vec2  vUv;
  varying float vFresnel;

  /* ── HSL → RGB ── */
  vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    float h6 = h * 6.0;
    if      (h6 < 1.0) rgb = vec3(c, x, 0);
    else if (h6 < 2.0) rgb = vec3(x, c, 0);
    else if (h6 < 3.0) rgb = vec3(0, c, x);
    else if (h6 < 4.0) rgb = vec3(0, x, c);
    else if (h6 < 5.0) rgb = vec3(x, 0, c);
    else                rgb = vec3(c, 0, x);
    return rgb + m;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float fresnel = vFresnel;

    /* ── Thin-film iridescence ── */
    float NdotV = dot(V, N) * 0.5 + 0.5;
    float hue = fract(NdotV * 2.0 + vWorldPos.y * 0.15 + uTime * 0.035);
    vec3 iri = hsl2rgb(hue, 0.65, 0.5);

    /* ── Base — deep chrome ── */
    float yGrad = smoothstep(-1.0, 1.0, vWorldNormal.y);
    vec3 base = mix(uDeepColor, uBaseColor, yGrad);

    /* ── Environment fake reflection ── */
    vec3 R = reflect(-V, N);
    float envY = R.y * 0.5 + 0.5;
    vec3 envColor = mix(
      uDeepColor * 0.6,
      uSpecColor * 0.8,
      smoothstep(0.3, 0.8, envY)
    );
    base = mix(base, envColor, 0.35);

    /* ── Specular (three virtual lights) ── */
    float spec1 = pow(max(dot(R, normalize(vec3(1.0, 1.0, 0.8))), 0.0),  64.0);
    float spec2 = pow(max(dot(R, normalize(vec3(-0.6, 0.9, -0.3))), 0.0), 96.0);
    float spec3 = pow(max(dot(R, normalize(vec3(0.0, -0.5, 1.0))), 0.0), 40.0);

    /* ── Compose ── */
    vec3 color = base;

    // Iridescent layer — stronger at glancing angles
    color = mix(color, iri, fresnel * 0.6);

    // Specular highlights
    color += uSpecColor * spec1 * 0.7;
    color += vec3(1.0, 0.95, 1.0) * spec2 * 0.5;
    color += uAccent * spec3 * 0.2;

    // Accent rim glow
    float rim = smoothstep(0.2, 0.9, fresnel);
    color += uAccent * rim * 0.18;

    // Subtle blue edge glow
    color += uSpecColor * fresnel * 0.35;

    // Animated caustic shimmer
    float caustic = sin(vWorldPos.x * 5.0 + uTime * 1.5)
                  * cos(vWorldPos.y * 4.0 + uTime * 1.1)
                  * sin(vWorldPos.z * 3.0 + uTime * 0.8);
    color += caustic * 0.04 * (1.0 + fresnel);

    // Built-in bloom simulation: brighten highlights
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float bloomMask = smoothstep(0.55, 1.2, luma);
    color += color * bloomMask * 0.3;

    // Alpha: opaque center, slightly glow at edges
    float alpha = 0.95;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ══════════════════════════════════════════════════
   TorusKnot — главная фигура
   ══════════════════════════════════════════════════ */

const KnotShape = ({ isDark }: { isDark: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();
  // Accumulated time — only ticks when frame actually renders (no jump after tab switch)
  const accTime = useRef(0);
  const autoAngle = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime:      { value: 0 },
      uIsDark:    { value: isDark ? 1.0 : 0.0 },
      uBaseColor: { value: new THREE.Color(isDark ? '#1a1a2e' : '#c5c8d8') },
      uDeepColor: { value: new THREE.Color(isDark ? '#08081a' : '#9a9db0') },
      uAccent:    { value: new THREE.Color('#B5FF6D') },
      uSpecColor: { value: new THREE.Color(isDark ? '#7788ee' : '#5566cc') },
    }),
    [isDark],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Clamp delta to avoid huge jumps after tab switch (max ~2 frames at 60fps)
    const dt = Math.min(delta, 0.05);

    accTime.current += dt;
    autoAngle.current += dt * 0.1;  // slow auto-rotate

    const g = groupRef.current;
    // Smooth mouse follow — purely lerp-based, no absolute target
    const targetRx = pointer.y * 0.2;
    const targetRy = pointer.x * 0.3 + autoAngle.current;

    g.rotation.x += (targetRx - g.rotation.x) * 0.02;
    g.rotation.y += (targetRy - g.rotation.y) * 0.02;
    g.rotation.z = Math.sin(accTime.current * 0.12) * 0.06;

    if (matRef.current) matRef.current.uniforms.uTime.value = accTime.current;
  });

  return (
    <group ref={groupRef} scale={0.72}>
      <Float speed={1.0} rotationIntensity={0.12} floatIntensity={0.2}>
        {/* Main shape — optimized geometry */}
        <mesh>
          <torusKnotGeometry args={[1, 0.38, 200, 40, 2, 3]} />
          <shaderMaterial
            ref={matRef}
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            side={THREE.DoubleSide}
            depthWrite
          />
        </mesh>

        {/* Soft back-glow halo */}
        <mesh scale={1.02}>
          <torusKnotGeometry args={[1, 0.4, 80, 24, 2, 3]} />
          <shaderMaterial
            uniforms={{
              uColor: { value: new THREE.Color(isDark ? '#4455cc' : '#6677dd') },
            }}
            vertexShader={`
              varying vec3 vNormal;
              varying vec3 vViewDir;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vViewDir = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
              }
            `}
            fragmentShader={`
              uniform vec3 uColor;
              varying vec3 vNormal;
              varying vec3 vViewDir;
              void main() {
                float f = pow(1.0 - abs(dot(normalize(vViewDir), normalize(vNormal))), 5.0);
                gl_FragColor = vec4(uColor, f * 0.25);
              }
            `}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* Thin accent orbit rings — lower segments */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.0, 0.005, 8, 64]} />
          <meshBasicMaterial
            color="#B5FF6D"
            transparent
            opacity={isDark ? 0.1 : 0.06}
          />
        </mesh>
        <mesh rotation={[1.2, 0.5, 0]}>
          <torusGeometry args={[2.15, 0.004, 8, 64]} />
          <meshBasicMaterial
            color={isDark ? '#7788ee' : '#5566cc'}
            transparent
            opacity={0.06}
          />
        </mesh>
      </Float>
    </group>
  );
};

/* ══════════════════════════════════════════════════
   Dust particles — мелкие, ненавязчивые
   ══════════════════════════════════════════════════ */

const Dust = ({ isDark }: { isDark: boolean }) => {
  const ref = useRef<THREE.Points>(null);
  const count = 30;
  const accTime = useRef(0);

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3]     = (Math.random() - 0.5) * 6;
      a[i * 3 + 1] = (Math.random() - 0.5) * 6;
      a[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return a;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    accTime.current += dt;
    const p = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] += Math.sin(accTime.current * 0.25 + i) * 0.0006;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={isDark ? '#7788ee' : '#5566bb'}
        size={0.015}
        transparent
        opacity={0.2}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/* ══════════════════════════════════════════════════
   Exported component
   ══════════════════════════════════════════════════ */

export const HolographicScene = ({ className = '' }: { className?: string }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [ready, setReady] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useVisibility(containerRef);

  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(0x000000, 0);
    gl.toneMapping = THREE.NoToneMapping;
    setReady(true);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`relative aspect-square max-w-lg mx-auto overflow-visible ${className}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {/* Мягкое свечение за объектом — сливается с фоном страницы */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '-15%',
          background: isDark
            ? 'radial-gradient(ellipse at 50% 50%, rgba(80,100,220,0.06) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(80,90,180,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Loading */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-24 h-24 rounded-full border border-(--border) opacity-15 animate-pulse" />
        </div>
      )}

      {/* Canvas расширен на 30% за пределы контейнера чтобы объект не обрезался */}
      <div
        className="absolute pointer-events-auto"
        style={{ inset: '-15%', overflow: 'visible' }}
      >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        style={{
          background: 'transparent',
          overflow: 'visible',
          width: '100%',
          height: '100%',
        }}
        onCreated={onCreated}
      >
        <Suspense fallback={null}>
          {/* Освещение — мягкое, подобранное под палитру */}
          <ambientLight intensity={isDark ? 0.25 : 0.4} />
          <directionalLight
            position={[5, 4, 5]}
            intensity={isDark ? 1.5 : 1.1}
            color={isDark ? '#aabbff' : '#8899cc'}
          />
          <directionalLight
            position={[-3, -2, 3]}
            intensity={0.35}
            color="#cc77aa"
          />
          <pointLight
            position={[0, 2, 3]}
            intensity={isDark ? 0.4 : 0.2}
            color="#B5FF6D"
            distance={8}
          />

          <KnotShape isDark={isDark} />
          <Dust isDark={isDark} />
        </Suspense>
      </Canvas>
      </div>
    </motion.div>
  );
};
