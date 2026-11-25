"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { characters, demons, type Character, type Demon } from "@/data/content";

export const CHARACTER_WATER_RING_SIZE = 1.65;
const textureFiles = characters.flatMap((character) => [
  character.image,
  character.depthImage,
]);
const demonTextureFiles = demons.flatMap((demon) => [
  demon.image,
  demon.depthImage,
]);
function configureTextures(textures: THREE.Texture[]) {
  textures.forEach((texture, index) => {
    texture.colorSpace = index % 2 === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  });
  return textures;
}

useLoader.preload(THREE.TextureLoader, [...textureFiles, ...demonTextureFiles]);

const vertexShader = `
  varying vec2 vUv;
  uniform sampler2D uDepth;
  uniform float uDisplace;
  uniform float uDemonStyle;
  void main() {
    vUv = uv;
    vec3 transformed = position;
    if (uDisplace > 0.5) {
      vec3 depthColor = texture2D(uDepth, uv).rgb;
      float depth = uDemonStyle > 0.5
        ? dot(depthColor, vec3(0.299, 0.587, 0.114))
        : depthColor.r;
      transformed.z += depth * 0.5;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  uniform sampler2D uDepth;
  uniform vec2 uMouse;
  uniform float uDisplace;
  uniform float uStrength;
  uniform float uDemonStyle;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec3 depthColor = texture2D(uDepth, vUv).rgb;
    float depth = uDemonStyle > 0.5
      ? dot(depthColor, vec3(0.299, 0.587, 0.114))
      : depthColor.r;
    vec2 uv = vUv;
    if (uDisplace < 0.5) {
      uv = vUv - uMouse * (depth - 0.5) * uStrength;
    }
    vec4 color = texture2D(uMap, uv);
    if (color.a < 0.02) discard;
    if (uDemonStyle > 0.5) {
      float luminance = dot(depthColor, vec3(0.299, 0.587, 0.114));
      color.rgb *= 0.94 + luminance * 0.12;
    }
    gl_FragColor = vec4(color.rgb, color.a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type FigureProps = {
  texture: THREE.Texture;
  depth: THREE.Texture;
  displacement: boolean;
  mouse: MutableRefObject<THREE.Vector2>;
  fadeFrom: number;
  fadeTo: number;
  slideFrom: number;
  slideTo: number;
  animate: boolean;
  reducedMotion: MutableRefObject<boolean>;
  demonStyle?: boolean;
  demonTilt?: MutableRefObject<THREE.Vector2>;
  geometry?: [number, number, number, number];
};

function Figure({
  texture, depth, displacement, mouse, fadeFrom, fadeTo, slideFrom, slideTo, animate, reducedMotion,
  demonStyle = false, demonTilt, geometry = [2.25, 3, displacement ? 128 : 1, displacement ? 192 : 1],
}: FigureProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const startedAt = useRef(0);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uDepth: { value: depth },
      uMouse: { value: new THREE.Vector2() },
      uDisplace: { value: displacement ? 1 : 0 },
      uStrength: { value: demonStyle ? 0.025 : 0.03 },
      uDemonStyle: { value: demonStyle ? 1 : 0 },
      uOpacity: { value: reducedMotion.current ? fadeTo : fadeFrom },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [depth, demonStyle, displacement, fadeFrom, fadeTo, reducedMotion, texture]);

  useFrame(({ clock }) => {
    material.uniforms.uMouse.value.copy(mouse.current);
    if (animate && !reducedMotion.current) {
      if (startedAt.current === 0) startedAt.current = performance.now();
      const progress = Math.min(1, (performance.now() - startedAt.current) / 350);
      material.uniforms.uOpacity.value = THREE.MathUtils.lerp(fadeFrom, fadeTo, progress);
      if (mesh.current) mesh.current.position.x = THREE.MathUtils.lerp(slideFrom, slideTo, progress);
    } else {
      material.uniforms.uOpacity.value = fadeTo;
      if (mesh.current) mesh.current.position.x = slideTo;
    }
    const time = clock.elapsedTime;
    if (mesh.current) {
      mesh.current.position.y = reducedMotion.current ? 0 : Math.sin(time * 0.7) * 0.025;
      mesh.current.rotation.z = reducedMotion.current ? 0 : Math.sin(time * 0.45) * 0.008;
      mesh.current.rotation.y = reducedMotion.current ? 0 : displacement
        ? mouse.current.x * 0.25
        : demonStyle && demonTilt
          ? demonTilt.current.y
          : Math.sin(time * 0.32) * 0.012;
      mesh.current.rotation.x = reducedMotion.current || !displacement
        ? demonStyle && demonTilt && !reducedMotion.current ? demonTilt.current.x : 0
        : -mouse.current.y * 0.25;
      if (demonStyle) {
        mesh.current.position.y = reducedMotion.current ? 0 : Math.sin(time * 0.5) * 0.032;
      }
    }
  });

  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh ref={mesh} material={material}>
      <planeGeometry args={geometry} />
    </mesh>
  );
}

function DemonScene({ demon, visible }: { demon: Demon; visible: boolean }) {
  const [image, depth] = useLoader(THREE.TextureLoader, [demon.image, demon.depthImage]);
  const mouse = useRef(new THREE.Vector2());
  const tilt = useRef(new THREE.Vector2());
  const touch = useRef(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const reducedMotion = useRef(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (!visible) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const updateMotion = () => {
      reducedMotion.current = motionPreference.matches;
      touch.current = coarsePointer.matches;
      if (reducedMotion.current) {
        gsap.killTweensOf([mouse.current, tilt.current]);
        mouse.current.set(0, 0);
        tilt.current.set(0, 0);
      }
    };
    const quickMouseX = gsap.quickTo(mouse.current, "x", { duration: 0.35, ease: "power3.out" });
    const quickMouseY = gsap.quickTo(mouse.current, "y", { duration: 0.35, ease: "power3.out" });
    const quickTiltX = gsap.quickTo(tilt.current, "x", { duration: 0.4, ease: "power3.out" });
    const quickTiltY = gsap.quickTo(tilt.current, "y", { duration: 0.4, ease: "power3.out" });
    updateMotion();
    const onMove = (event: PointerEvent) => {
      if (reducedMotion.current || touch.current) return;
      const x = THREE.MathUtils.clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
      const y = THREE.MathUtils.clamp(-(event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
      quickMouseX(x);
      quickMouseY(y);
      quickTiltX(-y * THREE.MathUtils.degToRad(3));
      quickTiltY(x * THREE.MathUtils.degToRad(4));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    motionPreference.addEventListener("change", updateMotion);
    coarsePointer.addEventListener("change", updateMotion);
    return () => {
      window.removeEventListener("pointermove", onMove);
      motionPreference.removeEventListener("change", updateMotion);
      coarsePointer.removeEventListener("change", updateMotion);
      [mouse.current, tilt.current].forEach((value) => gsap.killTweensOf(value));
    };
  }, [visible]);

  useFrame(({ clock }) => {
    if (!reducedMotion.current && touch.current) {
      tilt.current.x = Math.sin(clock.elapsedTime * 0.55) * 0.02;
      tilt.current.y = Math.sin(clock.elapsedTime * 0.4) * 0.03;
    }
  });

  useEffect(() => { configureTextures([image, depth]); }, [depth, image]);
  return (
    <Figure
      texture={image}
      depth={depth}
      displacement={false}
      mouse={mouse}
      fadeFrom={1}
      fadeTo={1}
      slideFrom={0}
      slideTo={0}
      animate={false}
      reducedMotion={reducedMotion}
      demonStyle
      demonTilt={tilt}
      geometry={[4, 4, 1, 1]}
    />
  );
}

export function DemonDepthStage({ demon, visible, onFailure }: {
  demon: Demon;
  visible: boolean;
  onFailure: () => void;
}) {
  return (
    <DemonStageBoundary onFailure={onFailure}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 34 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}><DemonScene demon={demon} visible={visible} /></Suspense>
      </Canvas>
    </DemonStageBoundary>
  );
}

class DemonStageBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function SparkEffects({
  characterId, accent, reducedMotion, flashSignal, fadeFrom, fadeTo, animate, reportFlash,
  effectVisible, mobile,
}: {
  characterId: string;
  accent: string;
  reducedMotion: MutableRefObject<boolean>;
  flashSignal: MutableRefObject<boolean>;
  fadeFrom: number;
  fadeTo: number;
  animate: boolean;
  reportFlash: boolean;
  effectVisible: MutableRefObject<boolean>;
  mobile: MutableRefObject<boolean>;
}) {
  const group = useRef<THREE.Group>(null);
  const butterflyMeshes = useRef<(THREE.Sprite | null)[]>([]);
  const lightningMaterials = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const slashMaterials = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const sparkMaterial = useRef<THREE.PointsMaterial>(null);
  const windParticles = useRef<THREE.Points>(null);
  const waterPoints = useRef<THREE.Points>(null);
  const waterMaterial = useRef<THREE.ShaderMaterial>(null);
  const flashSchedule = useRef({ nextAt: Number.NaN, until: 0 });
  const effectTime = useRef(0);
  const elapsedSinceActivation = useRef(0);
  const activationStarted = useRef(false);
  const water = characterId === "tanjiro" || characterId === "giyu";
  const isGiyu = characterId === "giyu";
  const isShinobu = characterId === "shinobu";
  const particleCount = (mobile.current ? 0.4 : 1);
  const dropletCount = Math.round((isGiyu ? 58 : 90) * particleCount);
  const butterflyCount = Math.round(22 * particleCount);
  const streamCount = isGiyu ? 3 : 4;
  const butterflyTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const glow = ctx.createRadialGradient(64, 59, 5, 64, 59, 61);
    glow.addColorStop(0, "rgba(190,126,255,.25)");
    glow.addColorStop(1, "rgba(190,126,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);
    const wing = (side: number, upper: boolean) => {
      ctx.save();
      ctx.translate(64, 63);
      ctx.scale(side, 1);
      const gradient = ctx.createLinearGradient(0, upper ? -47 : 4, 39, upper ? -3 : 36);
      gradient.addColorStop(0, "#f5d6ff");
      gradient.addColorStop(0.38, "#c05be8");
      gradient.addColorStop(1, "#6426a5");
      ctx.beginPath();
      if (upper) {
        ctx.moveTo(2, -2);
        ctx.bezierCurveTo(8, -23, 8, -48, 27, -46);
        ctx.bezierCurveTo(47, -43, 42, -13, 7, 1);
      } else {
        ctx.moveTo(5, 3);
        ctx.bezierCurveTo(18, 8, 29, 15, 27, 31);
        ctx.bezierCurveTo(25, 45, 9, 34, 3, 10);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.shadowColor = "#e8a4ff";
      ctx.shadowBlur = 9;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,230,255,.9)";
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.quadraticCurveTo(20, upper ? -16 : 17, upper ? 34 : 24, upper ? -39 : 34);
      ctx.moveTo(8, 1);
      ctx.quadraticCurveTo(18, upper ? -8 : 13, upper ? 38 : 25, upper ? -18 : 23);
      ctx.strokeStyle = "rgba(255,226,255,.72)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
    };
    wing(-1, true); wing(1, true); wing(-1, false); wing(1, false);
    ctx.strokeStyle = "#fff0ff";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(64, 25); ctx.lineTo(64, 77);
    ctx.moveTo(63, 30); ctx.quadraticCurveTo(53, 14, 49, 13);
    ctx.moveTo(65, 30); ctx.quadraticCurveTo(75, 14, 79, 13);
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  const butterflyMistTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const mist = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    mist.addColorStop(0, "rgba(201,157,255,.2)");
    mist.addColorStop(1, "rgba(151,91,224,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);
  const points = useMemo(() => {
    const positions = new Float32Array(84 * 3);
    for (let i = 0; i < 84; i += 1) {
      const angle = (i / 84) * Math.PI * 2;
      const radius = 0.65 + ((i * 13) % 35) / 100;
      let x = Math.cos(angle) * radius;
      let y = Math.sin(angle * 2.4) * 0.9;
      if (y > 0.12 && Math.abs(x) < 0.82) {
        x = Math.sign(x || (i % 2 ? 1 : -1)) * 0.84;
        y = 0.12;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (i % 7) * 0.09 - 0.25;
    }
    return positions;
  }, []);
  const dropletData = useMemo(() => Array.from({ length: dropletCount }, (_, index) => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.72 + Math.random() * 0.75,
    speed: 0.42 + Math.random() * (isGiyu ? 0.6 : 1.05),
    life: Math.random() * 2.2,
    duration: 1.1 + Math.random() * 1.7,
    size: 0.012 + Math.random() * (isGiyu ? 0.026 : 0.04),
    depth: index % 3 === 0 ? -0.48 : 0.56,
  })), [dropletCount, isGiyu]);
  const dropletPositions = useMemo(() => new Float32Array(dropletCount * 3), [dropletCount]);
  const dropletSizes = useMemo(() => new Float32Array(dropletCount), [dropletCount]);
  const dropletAlphas = useMemo(() => new Float32Array(dropletCount), [dropletCount]);
  const dropletColors = useMemo(() => {
    const colors = new Float32Array(dropletCount * 3);
    const palette = isGiyu ? ["#b5fff8", "#54d8e2", accent] : ["#f1fbff", "#61c9f5", "#145ab8", accent];
    for (let i = 0; i < dropletCount; i += 1) {
      const color = new THREE.Color(palette[i % palette.length]);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    return colors;
  }, [accent, dropletCount, isGiyu]);
  const streams = useMemo(() => Array.from({ length: streamCount }, (_, index) => {
    const segments = 144;
    const positions = new Float32Array((segments + 1) * 2 * 3);
    const colors = new Float32Array((segments + 1) * 2 * 3);
    const palette = isGiyu ? ["#46cbd4", "#c5fff9", "#6ce9ec"] : ["#104eae", "#32bdec", "#f0fbff"];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const color = new THREE.Color(palette[Math.floor(t * (palette.length - 1))]);
      for (let edge = 0; edge < 2; edge += 1) {
        colors.set([color.r, color.g, color.b], (i * 2 + edge) * 3);
      }
    }
    return {
      positions,
      colors,
      baseColors: new Float32Array(colors),
      segments,
      phase: index * 1.57,
      width: (isGiyu ? 0.035 : 0.052) + (index % 2) * 0.02,
    };
  }), [isGiyu, streamCount]);
  const windBasePositions = useMemo(() => {
    const count = Math.round(70 * particleCount);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.7 + ((i * 13) % 40) / 100;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 1.4;
      positions[i * 3 + 2] = (i % 5) * 0.12 - 0.2;
    }
    return positions;
  }, [particleCount]);
  const bolts = useMemo(() => Array.from({ length: 3 }, (_, index) => {
    const jitter = () => (Math.random() - 0.5) * 0.22;
    return {
      position: [-0.8 + index * 0.8, 0.2 - index * 0.5, 0.8] as [number, number, number],
      vertices: new Float32Array([
        0, 0.45, 0, jitter(), 0.14, 0, jitter(), 0.02, 0, jitter(), -0.15, 0, -0.04, -0.34, 0,
      ]),
    };
  }), []);

  useFrame(({ clock }, delta) => {
    if (!effectVisible.current) return;
    effectTime.current += delta;
    if (!activationStarted.current) {
      activationStarted.current = true;
      elapsedSinceActivation.current = 0;
    } else {
      elapsedSinceActivation.current += delta;
    }
    const time = effectTime.current;
    let layerOpacity = 1;
    if (animate && !reducedMotion.current) {
      const progress = Math.min(1, elapsedSinceActivation.current / 0.6);
      layerOpacity = THREE.MathUtils.lerp(fadeFrom, fadeTo, progress);
      if (group.current && fadeTo > fadeFrom) {
        group.current.scale.setScalar(THREE.MathUtils.lerp(0.8, 1, progress));
      }
    } else if (animate) {
      layerOpacity = fadeTo;
    }
    const isZenitsu = characterId === "zenitsu";
    if (group.current) {
      group.current.rotation.z = reducedMotion.current || water ? 0 : time * (isShinobu ? 0.05 : 0.12);
      group.current.position.y = reducedMotion.current ? 0 : Math.sin(time * 0.5) * (isGiyu ? 0.018 : 0.035);
    }

    if (isShinobu) {
      butterflyMeshes.current.forEach((mesh, index) => {
        if (!mesh) return;
        const phase = index * 2.399;
        const orbit = time * (0.18 + (index % 4) * 0.018) + phase;
        let x = Math.cos(orbit) * (0.98 + (index % 5) * 0.09);
        let y = -0.46 + Math.sin(orbit * 1.15) * 0.76;
        if (y > 0.12 && Math.abs(x) < 0.82) x = Math.sign(x || (index % 2 ? 1 : -1)) * 0.84;
        mesh.position.set(x, Math.min(y, 0.12) + (reducedMotion.current ? 0 : Math.sin(time * 2 + phase) * 0.035), index % 3 === 0 ? -0.42 : 0.5);
        const base = 0.12 + (index % 4) * 0.025;
        const flap = reducedMotion.current ? 1 : 0.625 + 0.375 * Math.sin(time * (6 + index % 4) * Math.PI * 2 + phase);
        mesh.scale.set(base * 1.7 * flap, base * 1.7, 1);
      });
    }
    if (characterId === "inosuke" && windParticles.current) {
      const attribute = windParticles.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const positions = attribute.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i += 1) {
        const angle = (i / (positions.length / 3)) * Math.PI * 2 + (reducedMotion.current ? 0 : time * 0.22);
        const radius = 0.75 + ((i * 13) % 40) / 100;
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius * 1.4 + (reducedMotion.current ? 0 : Math.sin(time + i) * 0.035);
        if (y > 0.12 && Math.abs(x) < 0.82) {
          x = Math.sign(x || (i % 2 ? 1 : -1)) * 0.84;
          y = 0.12;
        }
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = (i % 5) * 0.12 - 0.2;
      }
      attribute.needsUpdate = true;
    }
    if (water) {
      if (waterMaterial.current) waterMaterial.current.uniforms.uOpacity.value = layerOpacity;
      const spin = reducedMotion.current ? 0 : time * (isGiyu ? 0.72 : 0.78);
      streams.forEach((stream, streamIndex) => {
        for (let i = 0; i <= stream.segments; i += 1) {
          const t = (i / stream.segments) * Math.PI * 2;
          const progress = i / stream.segments;
          const angle = t + spin + stream.phase;
          const wobble = reducedMotion.current ? 0 : Math.sin(t * 3 + time * 1.6 + stream.phase) * 0.075
            + Math.sin(t * 7 - time * 0.8) * 0.025;
          const rx = 1.38 + streamIndex * 0.035;
          const ry = 0.91 + streamIndex * 0.035;
          let x = Math.cos(angle) * rx;
          let y = -0.43 + Math.sin(angle) * ry;
          const tiltAngle = 12 * Math.PI / 180;
          const tiltedX = x * Math.cos(tiltAngle) - (y + 0.43) * Math.sin(tiltAngle);
          const tiltedY = x * Math.sin(tiltAngle) + (y + 0.43) * Math.cos(tiltAngle) - 0.43;
          x = tiltedX;
          y = tiltedY;
          if (y > 0.12 && Math.abs(x) < 0.78) y = 0.12;
          const z = (streamIndex % 2 ? 0.4 : -0.44) + Math.sin(angle * 2 + time) * 0.08;
          const width = stream.width * (0.55 + 0.45 * Math.sin(t * 4 + time * 1.2 + stream.phase) ** 2);
          const offsetX = Math.sin(angle) * width;
          const offsetY = Math.cos(angle) * width;
          const base = i * 2 * 3;
          stream.positions[base] = x - offsetX;
          stream.positions[base + 1] = y - offsetY + wobble;
          stream.positions[base + 2] = z;
          stream.positions[base + 3] = x + offsetX;
          stream.positions[base + 4] = y + offsetY + wobble + Math.sin(angle) * 0.006;
          stream.positions[base + 5] = z + 0.004;
          let shimmerDistance = Math.abs(progress - ((time * (isGiyu ? 0.11 : 0.14) + streamIndex * 0.23) % 1));
          shimmerDistance = Math.min(shimmerDistance, 1 - shimmerDistance);
          const shimmer = Math.max(0, 1 - shimmerDistance * 18) * 0.52;
          for (let edge = 0; edge < 2; edge += 1) {
            const colorOffset = (i * 2 + edge) * 3;
            for (let channel = 0; channel < 3; channel += 1) {
              const baseColor = stream.baseColors[colorOffset + channel];
              stream.colors[colorOffset + channel] = baseColor + (1 - baseColor) * shimmer;
            }
          }
        }
        const geometry = (group.current?.children.find((child) => child.name === `water-band-${streamIndex}`) as THREE.Mesh | undefined)?.geometry;
        const attr = geometry?.getAttribute("position") as THREE.BufferAttribute | undefined;
        if (attr) {
          attr.needsUpdate = true;
        }
        const colorAttr = geometry?.getAttribute("color") as THREE.BufferAttribute | undefined;
        if (colorAttr) colorAttr.needsUpdate = true;
      });
      dropletData.forEach((drop, index) => {
        const age = (drop.life + (reducedMotion.current ? 0 : time * drop.speed)) % drop.duration;
        const p = age / drop.duration;
        const burst = animate && !reducedMotion.current && elapsedSinceActivation.current < 0.6
          ? (1 - elapsedSinceActivation.current / 0.6) * (index % 3 === 0 ? 0.55 : 0)
          : 0;
        const angle = drop.angle + (reducedMotion.current ? 0 : time * (isGiyu ? 0.18 : 0.3));
        const radius = drop.radius + p * (0.45 + burst);
        const idx = index * 3;
        let dropX = Math.cos(angle) * radius;
        let dropY = -0.43 + Math.sin(angle) * radius * 0.7 - p * p * (isGiyu ? 0.2 : 0.34) + burst * Math.sin(angle) * 0.4;
        if (dropY > 0.12 && Math.abs(dropX) < 0.76) dropY = 0.12;
        dropletPositions[idx] = dropX;
        dropletPositions[idx + 1] = dropY;
        dropletPositions[idx + 2] = drop.depth;
        dropletSizes[index] = drop.size * (p < 0.14 ? p / 0.14 : Math.max(0, 1 - p) * 0.9 + 0.12);
        dropletAlphas[index] = Math.sin(Math.PI * p) * (1 - p * 0.55) + burst * 0.6;
      });
      if (waterPoints.current) {
        (waterPoints.current.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
        (waterPoints.current.geometry.getAttribute("size") as THREE.BufferAttribute).needsUpdate = true;
        (waterPoints.current.geometry.getAttribute("alpha") as THREE.BufferAttribute).needsUpdate = true;
      }
    }

    let flashing = false;
    if (isZenitsu && !reducedMotion.current) {
      const schedule = flashSchedule.current;
      if (Number.isNaN(schedule.nextAt)) schedule.nextAt = time + 0.6 + Math.random() * 0.8;
      if (time >= schedule.nextAt) {
        schedule.until = time + 0.05 + Math.random() * 0.09;
        schedule.nextAt = time + 0.55 + Math.random() * 1.35;
      }
      flashing = time < schedule.until;
    }
    flashSignal.current = reportFlash && flashing;
    lightningMaterials.current.forEach((material) => {
      if (material) material.userData.characterDynamicOpacity = flashing ? 0.62 : 0.045;
    });
    slashMaterials.current.forEach((material, index) => {
      if (material) {
        material.userData.characterDynamicOpacity = reducedMotion.current
          ? 0.12
          : 0.04 + (0.13 * (0.5 + 0.5 * Math.sin(time * 2.4 + index * 1.8)));
      }
    });
    if (sparkMaterial.current) {
      sparkMaterial.current.userData.characterDynamicOpacity = isZenitsu
        ? (flashing ? 0.68 : 0.16)
        : isGiyu ? 0.19 : 0.42;
    }
    if (group.current) {
      group.current.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if (material.userData.characterBaseOpacity === undefined) {
            material.userData.characterBaseOpacity = material.opacity;
          }
          const baseOpacity = material.userData.characterDynamicOpacity
            ?? material.userData.characterBaseOpacity;
          material.opacity = baseOpacity * layerOpacity;
        });
      });
    }
  });

  useEffect(() => () => {
    butterflyTexture?.dispose();
    butterflyMistTexture?.dispose();
  }, [butterflyMistTexture, butterflyTexture]);

  return (
    <group ref={group}>
      {isShinobu ? (
        <>
          {butterflyMistTexture && Array.from({ length: 5 }, (_, index) => (
            <sprite key={`butterfly-mist-${index}`}
              position={[Math.cos(index * 1.26) * 0.9, -0.5 + Math.sin(index * 1.26) * 0.5, index % 2 ? -0.55 : 0.3]}
              scale={[0.8, 0.42, 1]}>
              <spriteMaterial map={butterflyMistTexture} color={accent} transparent opacity={0.28}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          ))}
          {butterflyTexture && Array.from({ length: butterflyCount }, (_, index) => (
            <sprite key={`butterfly-${index}`} ref={(sprite) => { butterflyMeshes.current[index] = sprite; }}
              position={[0, -0.4, index % 3 === 0 ? -0.42 : 0.5]} scale={[0.24, 0.24, 1]}>
              <spriteMaterial map={butterflyTexture} color="#f2d5ff" transparent opacity={0.92}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          ))}
          <points position={[0, -0.35, 0.35]}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[points, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#dcbcff" size={0.016} transparent opacity={0.25}
              sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </>
      ) : characterId === "zenitsu" ? (
        <points position={[0, 0, -0.65]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[points, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={sparkMaterial}
            color={accent}
            size={0.045}
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ) : null}
      {water && (
        <>
          {streams.map((stream, index) => (
            <mesh key={`water-stream-${index}`} name={`water-band-${index}`} position={[0, 0, 0]}
              frustumCulled={false}
              renderOrder={index % 2 ? 5 : -1}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[stream.positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[stream.colors, 3]} />
                <bufferAttribute attach="index" args={[new Uint16Array(Array.from({ length: stream.segments }, (_, i) =>
                  [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2]).flat()), 1]} />
              </bufferGeometry>
              <meshBasicMaterial vertexColors transparent opacity={isGiyu ? 0.31 : 0.46}
                blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <points ref={waterPoints} renderOrder={6} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dropletPositions, 3]} />
              <bufferAttribute attach="attributes-size" args={[dropletSizes, 1]} />
              <bufferAttribute attach="attributes-alpha" args={[dropletAlphas, 1]} />
              <bufferAttribute attach="attributes-color" args={[dropletColors, 3]} />
            </bufferGeometry>
            <shaderMaterial ref={waterMaterial} uniforms={{ uOpacity: { value: 1 } }} transparent depthWrite={false}
              blending={THREE.AdditiveBlending} vertexColors
              vertexShader={`attribute float size; attribute float alpha; attribute vec3 color; varying float vAlpha; varying vec3 vColor; void main(){vAlpha=alpha;vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*1200.0/-mv.z;gl_Position=projectionMatrix*mv;}`}
              fragmentShader={`uniform float uOpacity; varying float vAlpha; varying vec3 vColor; void main(){vec2 p=gl_PointCoord-vec2(.5);float d=length(p);if(d>.5)discard;float a=smoothstep(.5,.05,d)*vAlpha*uOpacity;gl_FragColor=vec4(vColor,a);}`} />
          </points>
          {Array.from({ length: isGiyu ? 2 : 4 }, (_, i) => (
            <mesh key={`splash-tip-${i}`} position={[Math.cos(i * 2.1) * 1.18, -0.42 + Math.sin(i * 2.1) * 0.8, 0.62]}
              rotation={[0, 0, i * 1.57 + 0.35]}>
              <torusGeometry args={[0.07 + (i % 2) * 0.025, 0.009, 5, 22, Math.PI * 1.45]} />
              <meshBasicMaterial color="#eafaff" transparent opacity={isGiyu ? 0.22 : 0.34}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
        </>
      )}
      {characterId === "zenitsu" && bolts.map((bolt, index) => (
        <lineSegments key={`bolt-${index}`} position={bolt.position}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[bolt.vertices, 3]}
            />
            <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 1, 2, 2, 3, 3, 4]), 1]} />
          </bufferGeometry>
          <lineBasicMaterial
            ref={(material) => { lightningMaterials.current[index] = material; }}
            color={accent}
            transparent
            opacity={0.055}
          />
        </lineSegments>
      ))}
      {characterId === "inosuke" && (
        <points ref={windParticles} position={[0, 0, 0.35]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[windBasePositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={accent}
            size={0.026}
            transparent
            opacity={0.2}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
      {characterId === "inosuke" && Array.from({ length: 3 }, (_, index) => (
        <lineSegments key={`wind-slash-${index}`} position={[
          -0.82 + index * 0.78,
          -0.55 + (index % 2) * 0.42,
          index === 1 ? 0.58 : -0.36,
        ]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([-0.13, -0.035, 0, 0.13, 0.035, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            ref={(material) => { slashMaterials.current[index] = material; }}
            color={accent}
            transparent
            opacity={0.12}
          />
        </lineSegments>
      ))}
    </group>
  );
}

function Scene({ character, displacement }: {
  character: Character;
  displacement: boolean;
}) {
  const loadedTextures = useLoader(THREE.TextureLoader, textureFiles);
  const loaded = useMemo(() => configureTextures(loadedTextures), [loadedTextures]);
  const mouse = useRef(new THREE.Vector2());
  const targetMouse = useRef(new THREE.Vector2());
  const touch = useRef(typeof window !== "undefined" && (
    window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window
  ));
  const reducedMotion = useRef(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const currentIndex = characters.findIndex((item) => item.id === character.id);
  const currentImage = loaded[currentIndex * 2];
  const currentDepth = loaded[currentIndex * 2 + 1];

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreferences = () => {
      touch.current = coarsePointer.matches || "ontouchstart" in window;
      reducedMotion.current = motionPreference.matches;
    };
    updatePreferences();
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") touch.current = true;
      targetMouse.current.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        -(event.clientY / window.innerHeight - 0.5) * 2,
      );
    };
    coarsePointer.addEventListener("change", updatePreferences);
    motionPreference.addEventListener("change", updatePreferences);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      coarsePointer.removeEventListener("change", updatePreferences);
      motionPreference.removeEventListener("change", updatePreferences);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useFrame(({ clock }) => {
    if (touch.current && !reducedMotion.current) {
      targetMouse.current.set(Math.sin(clock.elapsedTime * 0.22) * 0.35, Math.cos(clock.elapsedTime * 0.18) * 0.22);
    }
    mouse.current.lerp(targetMouse.current, 0.06);
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <Figure
        key={character.id}
        texture={currentImage}
        depth={currentDepth}
        displacement={displacement}
        mouse={mouse}
        fadeFrom={1}
        fadeTo={1}
        slideFrom={0}
        slideTo={0}
        animate={false}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

export default function CharacterStage({
  character,
  displacement = false,
}: {
  character: Character;
  displacement?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 28 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <Suspense fallback={null}>
        <Scene character={character} displacement={displacement} />
      </Suspense>
    </Canvas>
  );
}
