"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

type Ember = {
  x: number;
  y: number;
  phase: number;
  speed: number;
  size: number;
  alpha: number;
};

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float glow = 1.0 - smoothstep(0.05, 0.5, distanceFromCenter);
    gl_FragColor = vec4(1.0, 0.19, 0.075, glow * vAlpha);
  }
`;

function EmberPoints({ count, frozen }: { count: number; frozen: boolean }) {
  const viewport = useThree((state) => state.viewport);
  const { geometry, embers } = useMemo(() => {
    const points: Ember[] = [];
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const ember = {
        x: (Math.random() - 0.5) * viewport.width,
        y: (Math.random() - 0.5) * viewport.height,
        phase: Math.random() * Math.PI * 2,
        speed: 0.035 + Math.random() * 0.09,
        size: 0.035 + Math.random() * 0.055,
        alpha: 0.35 + Math.random() * 0.65,
      };
      points.push(ember);
      positions[index * 3] = ember.x;
      positions[index * 3 + 1] = ember.y;
      sizes[index] = ember.size;
      alphas[index] = ember.alpha;
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    nextGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return { geometry: nextGeometry, embers: points };
  }, [count, viewport.height, viewport.width]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }, delta) => {
    if (frozen) return;
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const values = positions.array as Float32Array;
    const elapsed = clock.getElapsedTime();
    const halfHeight = viewport.height / 2;

    embers.forEach((ember, index) => {
      ember.y += ember.speed * Math.min(delta, 0.04);
      if (ember.y > halfHeight + 0.05) ember.y = -halfHeight - 0.05;
      ember.phase += delta * (0.25 + ember.speed);
      values[index * 3] = ember.x + Math.sin(elapsed * 0.45 + ember.phase) * 0.045;
      values[index * 3 + 1] = ember.y;
      values[index * 3 + 2] = 0;
    });
    positions.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroParticles() {
  const [mobile, setMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia(
      "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
    );
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreferences = () => {
      setMobile(mobileQuery.matches);
      setReducedMotion(motionQuery.matches);
    };
    updatePreferences();
    mobileQuery.addEventListener("change", updatePreferences);
    motionQuery.addEventListener("change", updatePreferences);
    return () => {
      mobileQuery.removeEventListener("change", updatePreferences);
      motionQuery.removeEventListener("change", updatePreferences);
    };
  }, []);

  return (
    <Canvas
      className="hero-particles"
      aria-hidden="true"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 50 }}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
    >
      <EmberPoints count={mobile ? 29 : 150} frozen={reducedMotion} />
    </Canvas>
  );
}
