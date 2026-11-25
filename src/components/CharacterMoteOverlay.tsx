"use client";

import { useEffect, useRef } from "react";

type MoteEntity = {
  id: string;
  accentColor: string;
  motePalette: string[];
};

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  period: number;
  driftPhase: number;
  driftSpeed: number;
  streakAt: number;
  streakUntil: number;
  butterfly: boolean;
  color: string;
  bornAt: number;
  lifetime: number;
};

type MoteSet = {
  motes: Mote[];
  layer: number;
  bornAt: number;
  exitingAt: number;
  exiting: boolean;
  burst: boolean;
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function rgba(color: string, alpha: number) {
  const value = color.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const number = Number.parseInt(normalized, 16);
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
}

function createMote(width: number, height: number, character: MoteEntity, layer: number, now: number, burst = false): Mote {
  const angle = Math.random() * Math.PI * 2;
  const burstSpeed = randomBetween(35, 100);
  return {
    x: burst ? width * 0.51 : randomBetween(width * 0.18, width * 0.82),
    y: burst ? height * 0.54 : randomBetween(height * 0.18, height * 0.82),
    vx: burst ? Math.cos(angle) * burstSpeed : randomBetween(-2.2, 2.2),
    vy: burst ? Math.sin(angle) * burstSpeed : randomBetween(-1.5, 0.3),
    radius: randomBetween(layer === 0 ? 1 : 1.15, layer === 0 ? 2.35 : 3),
    phase: Math.random() * Math.PI * 2,
    period: character.id === "zenitsu" ? randomBetween(850, 1500)
      : character.id === "giyu" ? randomBetween(1800, 3000)
        : randomBetween(1000, 3000),
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: randomBetween(0.00012, 0.00032),
    streakAt: now + randomBetween(1200, 5200),
    streakUntil: 0,
    butterfly: character.id === "shinobu" && Math.random() < 0.075,
    color: character.motePalette[Math.floor(Math.random() * character.motePalette.length)] ?? character.accentColor,
    bornAt: now,
    lifetime: randomBetween(12000, 26000),
  };
}

function drawButterfly(context: CanvasRenderingContext2D, mote: Mote, time: number, alpha: number) {
  const size = mote.radius * 2.4;
  context.save();
  context.translate(mote.x, mote.y);
  context.rotate(Math.sin(time * 0.002 + mote.phase) * 0.18);
  context.globalAlpha = alpha * 0.82;
  context.fillStyle = mote.color;
  context.strokeStyle = rgba("#fff4ff", 0.72);
  context.lineWidth = 0.55;
  context.beginPath();
  context.ellipse(-size * 0.55, -size * 0.2, size * 0.58, size * 0.4, -0.35, 0, Math.PI * 2);
  context.ellipse(size * 0.55, -size * 0.2, size * 0.58, size * 0.4, 0.35, 0, Math.PI * 2);
  context.ellipse(-size * 0.4, size * 0.32, size * 0.4, size * 0.27, 0.35, 0, Math.PI * 2);
  context.ellipse(size * 0.4, size * 0.32, size * 0.4, size * 0.27, -0.35, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(0, -size * 0.45);
  context.lineTo(0, size * 0.5);
  context.stroke();
  context.beginPath();
  context.moveTo(0, -size * 0.35);
  context.quadraticCurveTo(-size * 0.32, -size * 0.75, -size * 0.48, -size * 0.68);
  context.moveTo(0, -size * 0.35);
  context.quadraticCurveTo(size * 0.32, -size * 0.75, size * 0.48, -size * 0.68);
  context.stroke();
  context.restore();
}

export default function CharacterMoteOverlay({
  character,
  moteCount,
}: {
  character: MoteEntity;
  moteCount?: number;
}) {
  const backCanvas = useRef<HTMLCanvasElement>(null);
  const frontCanvas = useRef<HTMLCanvasElement>(null);
  const setsRef = useRef<MoteSet[]>([]);
  const pointer = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const back = backCanvas.current;
    const front = frontCanvas.current;
    const wrapper = back?.parentElement;
    if (!wrapper || !back || !front) return;
    const backContext = back.getContext("2d", { alpha: true });
    const frontContext = front.getContext("2d", { alpha: true });
    if (!backContext || !frontContext) return;
    const backDrawingContext: CanvasRenderingContext2D = backContext;
    const frontDrawingContext: CanvasRenderingContext2D = frontContext;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia(
      "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
    ).matches;
    const desktop = window.matchMedia("(pointer: fine)").matches && !isMobile;
    const isGiyu = character.id === "giyu";
    const amount = moteCount ?? (isMobile ? 4 : isGiyu ? 45 : 70);
    const now = performance.now();
    setsRef.current.forEach((set) => {
      if (!set.exiting) {
        set.exiting = true;
        set.exitingAt = now;
      }
    });

    let width = 0;
    let height = 0;
    let visible = false;
    let frame = 0;
    let lastFrame = 0;
    let previousTime = now;
    let initialized = false;

    const resize = () => {
      const bounds = wrapper.getBoundingClientRect();
      const nextWidth = bounds.width;
      const nextHeight = bounds.height;
      const scaleX = width ? nextWidth / width : 1;
      const scaleY = height ? nextHeight / height : 1;
      width = nextWidth;
      height = nextHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      [back, front].forEach((canvas) => {
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        const context = canvas === back ? backDrawingContext : frontDrawingContext;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      if (width && height && (scaleX !== 1 || scaleY !== 1)) {
        setsRef.current.forEach((set) => set.motes.forEach((mote) => {
          mote.x *= scaleX;
          mote.y *= scaleY;
          mote.vx *= scaleX;
          mote.vy *= scaleY;
        }));
      }

      if (!initialized && width > 0 && height > 0) {
        initialized = true;
        const moteCount = reducedMotion ? 8 : amount;
        const backCount = Math.round(moteCount * 0.6);
        const frontCount = moteCount - backCount;
        const makeSet = (count: number, layer: number, burst = false): MoteSet => ({
          motes: Array.from({ length: count }, () => createMote(width, height, character, layer, now, burst)),
          layer, bornAt: now, exitingAt: 0, exiting: false, burst,
        });
        const largeCount = reducedMotion ? 1 : 5;
        const frontLargeCount = reducedMotion ? 1 : 3;
        const back = makeSet(backCount, 0);
        const front = makeSet(frontCount, 1);
        for (let i = 0; i < largeCount; i += 1) {
          const mote = createMote(width, height, character, 0, now);
          mote.radius = randomBetween(3, 5.2);
          back.motes.push(mote);
        }
        for (let i = 0; i < frontLargeCount; i += 1) {
          const mote = createMote(width, height, character, 1, now);
          mote.radius = randomBetween(3, 5.2);
          front.motes.push(mote);
        }
        const retained = setsRef.current.filter((set) => set.exiting && now - set.exitingAt < 400);
        const burstBack = reducedMotion ? [] : [makeSet(8, 0, true)];
        const burstFront = reducedMotion ? [] : [makeSet(5, 1, true)];
        setsRef.current = [...retained, back, front, ...burstBack, ...burstFront];
      }
    };

    resize();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reducedMotion && !frame) frame = requestAnimationFrame(draw);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (visible && reducedMotion) draw(performance.now(), true);
    }, { threshold: 0.01 });
    observer.observe(wrapper);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);
    const onPointerMove = (event: PointerEvent) => {
      if (!desktop) return;
      const bounds = wrapper.getBoundingClientRect();
      pointer.current.x = event.clientX - bounds.left;
      pointer.current.y = event.clientY - bounds.top;
      pointer.current.active = pointer.current.x >= 0 && pointer.current.x <= bounds.width
        && pointer.current.y >= 0 && pointer.current.y <= bounds.height;
    };
    const onPointerOut = () => { pointer.current.active = false; };
    if (desktop) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("blur", onPointerOut);
    }

    function renderLayer(context: CanvasRenderingContext2D, layer: number, time: number, dt: number) {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      setsRef.current.forEach((set) => {
        if (set.layer !== layer) return;
        const age = time - set.bornAt;
        const fadeIn = set.burst ? 1 : reducedMotion ? 1 : clamp(age / 600, 0, 1);
        const fadeOut = set.exiting ? clamp(1 - (time - set.exitingAt) / 400, 0, 1) : 1;
        const burstFade = set.burst ? clamp(1 - age / 460, 0, 1) : 1;
        const setOpacity = fadeIn * fadeOut * burstFade;
        set.motes.forEach((mote) => {
          if (!reducedMotion && (time < mote.bornAt || time - mote.bornAt > mote.lifetime)) {
            Object.assign(mote, createMote(width, height, character, layer, time));
          }
          if (!reducedMotion) {
            const depthSpeed = (layer === 0 ? 0.55 : 1.35) * (isGiyu ? 0.58 : 1);
            const phase = time * mote.driftSpeed + mote.driftPhase;
            const orbitX = (width * 0.5 - mote.x) * 0.000012;
            const orbitY = (height * 0.56 - mote.y) * 0.000009;
            mote.vx += (Math.sin(phase) * 1.2 + orbitX * width) * dt * depthSpeed;
            mote.vy += (-0.75 + Math.cos(phase * 0.7) * 0.55 + orbitY * height) * dt * depthSpeed;
            if (pointer.current.active && desktop) {
              const dx = mote.x - pointer.current.x;
              const dy = mote.y - pointer.current.y;
              const distance = Math.hypot(dx, dy);
              if (distance < 82 && distance > 0) {
                const push = (1 - distance / 82) * 16;
                mote.vx += (dx / distance) * push * dt;
                mote.vy += (dy / distance) * push * dt;
              }
            }
            mote.vx *= Math.pow(0.985, dt * 60);
            mote.vy *= Math.pow(0.985, dt * 60);
            if (time >= mote.streakAt && mote.streakUntil < time) mote.streakUntil = time + randomBetween(180, 420);
            const streaking = time < mote.streakUntil;
            if (streaking) {
              mote.vx += Math.sign(mote.vx || 1) * 1.4 * dt * depthSpeed;
              mote.vy -= 1.8 * dt * depthSpeed;
            }
            mote.x += mote.vx * dt * depthSpeed;
            mote.y += mote.vy * dt * depthSpeed;
            if (time >= mote.streakUntil && mote.streakUntil !== 0 && time >= mote.streakAt) {
              mote.streakAt = time + randomBetween(2800, 7800);
              mote.streakUntil = 0;
            }
            if (mote.x < -8 || mote.x > width + 8 || mote.y < -8 || mote.y > height + 8) {
              const fresh = createMote(width, height, character, layer, time);
              Object.assign(mote, fresh);
            }
          }
          const twinkle = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin((time / mote.period) * Math.PI * 2 + mote.phase));
          const lifeFade = reducedMotion ? 1
            : clamp((time - mote.bornAt) / 1400, 0, 1) * clamp((mote.bornAt + mote.lifetime - time) / 1600, 0, 1);
          const alpha = twinkle * setOpacity * lifeFade * (layer === 0 ? 0.43 : 0.62) * (character.id === "inosuke" ? 0.58 : 1);
          if (mote.butterfly) {
            drawButterfly(context, mote, time, alpha);
            return;
          }
          const glowRadius = mote.radius * (layer === 0 ? 3.2 : 3.8) * (character.id === "inosuke" ? 0.76 : 1);
          const gradient = context.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, glowRadius);
          gradient.addColorStop(0, rgba("#ffffff", 0.86));
          gradient.addColorStop(0.22, rgba(mote.color, 0.72));
          gradient.addColorStop(1, rgba(mote.color, 0));
          context.globalAlpha = alpha * (mote.radius > 3 ? 0.65 : 0.82);
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(mote.x, mote.y, glowRadius, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = alpha;
          context.fillStyle = rgba("#ffffff", 0.9);
          context.beginPath();
          context.arc(mote.x, mote.y, Math.max(0.7, mote.radius * 0.48), 0, Math.PI * 2);
          context.fill();
          if (time < mote.streakUntil) {
            context.globalAlpha = alpha * 0.42;
            context.strokeStyle = mote.color;
            context.lineWidth = Math.max(0.6, mote.radius * 0.35);
            context.beginPath();
            context.moveTo(mote.x, mote.y);
            context.lineTo(mote.x - mote.vx * 0.18, mote.y - mote.vy * 0.18);
            context.stroke();
          }
        });
      });
      context.globalAlpha = 1;
      if (layer === 1) {
        context.globalCompositeOperation = "destination-in";
        const mask = context.createLinearGradient(0, 0, 0, height);
        mask.addColorStop(0, "rgba(0,0,0,0)");
        mask.addColorStop(0.4, "rgba(0,0,0,0)");
        mask.addColorStop(0.5, "rgba(0,0,0,1)");
        mask.addColorStop(1, "rgba(0,0,0,1)");
        context.fillStyle = mask;
        context.fillRect(0, 0, width, height);
      }
      context.globalCompositeOperation = "source-over";
    }

    function draw(time: number, staticFrame = false) {
      if (!visible && !staticFrame) {
        frame = 0;
        return;
      }
      const targetFps = isMobile ? 30 : 60;
      if (!staticFrame && time - lastFrame < 1000 / targetFps) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const dt = Math.min(0.04, Math.max(0, (time - previousTime) / 1000));
      previousTime = time;
      lastFrame = time;
      renderLayer(backDrawingContext, 0, time, dt);
      renderLayer(frontDrawingContext, 1, time, dt);
      setsRef.current = setsRef.current.filter((set) => !set.exiting || time - set.exitingAt < 400);
      if (!staticFrame && visible) frame = requestAnimationFrame(draw);
      else frame = 0;
    }

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (desktop) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("blur", onPointerOut);
      }
      backDrawingContext.clearRect(0, 0, width, height);
      frontDrawingContext.clearRect(0, 0, width, height);
    };
  }, [character, moteCount]);

  return (
    <div className="character-mote-overlay" aria-hidden="true">
      <canvas ref={backCanvas} className="character-mote-canvas character-mote-canvas--back" />
      <canvas ref={frontCanvas} className="character-mote-canvas character-mote-canvas--front" />
    </div>
  );
}
