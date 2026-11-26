"use client";

import { useEffect, useRef } from "react";
import styles from "./SakuraPetals.module.css";

type Petal = {
  x: number;
  y: number;
  depth: number;
  angle: number;
  phase: number;
  fallSpeed: number;
  drift: number;
  spin: number;
  size: number;
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function createPetal(width: number, height: number, visible = false): Petal {
  const depth = randomBetween(0, 600);
  return {
    x: randomBetween(-width * 0.05, width * 1.05),
    y: visible ? randomBetween(0, height) : randomBetween(-32, -8),
    depth,
    angle: randomBetween(0, Math.PI * 2),
    phase: randomBetween(0, Math.PI * 2),
    fallSpeed: randomBetween(0.8, 1.8),
    drift: randomBetween(-0.45, 0.45),
    spin: randomBetween(-0.025, 0.025),
    size: randomBetween(5, 10),
  };
}

export const MOBILE_PETAL_COUNT = 8;

export default function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let previousFrameTime = 0;
    let previousScrollY = window.scrollY;
    let previousScrollTime = performance.now();
    let wind = 0;
    let targetWind = 0;
    let isVisible = document.visibilityState === "visible";
    let mobile = window.matchMedia("(max-width: 700px)").matches;
    let narrowViewport = window.matchMedia(
      "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
    ).matches;
    let petals: Petal[] = [];
    const footer = document.querySelector("footer");
    const isFooterVisible = () => {
      if (!footer) return false;
      const bounds = footer.getBoundingClientRect();
      return bounds.top < window.innerHeight && bounds.bottom > 0;
    };
    let footerVisible = isFooterVisible();
    const footerObserver = footer ? new IntersectionObserver(([entry]) => {
      footerVisible = entry.isIntersecting;
    }) : null;
    if (footer && footerObserver) footerObserver.observe(footer);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      footerVisible = isFooterVisible();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      mobile = window.matchMedia("(max-width: 700px)").matches;
      narrowViewport = window.matchMedia(
        "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
      ).matches;
      const count = mobile ? MOBILE_PETAL_COUNT : Math.min(42, Math.max(22, Math.round(width / 34)));
      petals = Array.from({ length: count }, () => createPetal(width, height, true));
    };

    const drawPetal = (petal: Petal, delta: number) => {
      const perspective = 300 / (petal.depth + 300);
      const size = petal.size * (0.45 + perspective * 0.75);
      const sway = Math.sin(petal.phase) * size * 0.45;
      const alpha = 0.35 + perspective * 0.5;

      context.save();
      context.globalAlpha = alpha;
      context.translate(petal.x + sway, petal.y);
      context.rotate(petal.angle);
      context.scale(Math.sin(petal.phase) * 0.45 + 0.7, 1);
      context.beginPath();
      context.moveTo(0, -size);
      context.bezierCurveTo(size * 0.85, -size * 0.35, size * 0.75, size * 0.65, 0, size);
      context.bezierCurveTo(-size * 0.75, size * 0.65, -size * 0.85, -size * 0.35, 0, -size);
      context.fillStyle = perspective > 0.65 ? "#f2b0c1" : "#df829d";
      context.fill();
      context.strokeStyle = "rgba(255, 220, 228, 0.72)";
      context.lineWidth = Math.max(0.45, size * 0.07);
      context.stroke();
      context.beginPath();
      context.moveTo(0, -size * 0.55);
      context.lineTo(0, size * 0.65);
      context.strokeStyle = "rgba(255, 235, 238, 0.58)";
      context.lineWidth = Math.max(0.35, size * 0.045);
      context.stroke();
      context.restore();

      petal.phase += (0.025 + perspective * 0.02) * delta;
      petal.angle += petal.spin * delta + wind * 0.00015;
      petal.x += (petal.drift + wind * 0.012) * delta * perspective;
      petal.y += petal.fallSpeed * delta * (0.55 + perspective);
    };

    const render = (time: number) => {
      frame = 0;
      if (!isVisible) return;

      const delta = previousFrameTime ? Math.min((time - previousFrameTime) / 16.67, 2.5) : 1;
      previousFrameTime = time;
      wind += (targetWind - wind) * 0.08;
      targetWind *= 0.96;
      context.clearRect(0, 0, width, height);

      const activePetalCount = footerVisible && narrowViewport ? Math.min(8, petals.length) : petals.length;
      for (let index = 0; index < activePetalCount; index += 1) {
        const petal = petals[index];
        const footerPetalLimit = height * 0.72;
        if (footerVisible && petal.y >= footerPetalLimit - 20) {
          petals[index] = createPetal(width, height);
          continue;
        }
        drawPetal(petal, delta);
        const lowerLimit = footerVisible ? footerPetalLimit : height + 24;
        if (petal.y > lowerLimit || petal.x < -36 || petal.x > width + 36) {
          petals[index] = createPetal(width, height);
        }
      }

      frame = requestAnimationFrame(render);
    };

    const onScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(12, now - previousScrollTime);
      const velocity = (window.scrollY - previousScrollY) / elapsed;
      previousScrollY = window.scrollY;
      previousScrollTime = now;
      footerVisible = isFooterVisible();
      targetWind = Math.max(-42, Math.min(42, velocity * 90));
    };

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible && !frame) {
        previousFrameTime = 0;
        frame = requestAnimationFrame(render);
      } else if (!isVisible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    resize();
    frame = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      footerObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.layer} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
