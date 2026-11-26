"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import gsap from "gsap";
import SectionLabel from "@/components/SectionLabel";
import HankoSeal from "@/components/HankoSeal";
import { bladeSectionCopy, blades, giyuBlade, giyuEnabled, type Blade } from "@/data/content";
import styles from "./BladeExperience.module.css";

const bladeOptions = giyuEnabled ? [...blades, giyuBlade] : blades;
export const MOBILE_BLADE_EMBER_COUNT = 25;
export const MOBILE_BLADE_BUTTERFLY_COUNT = 9;

function PropertyIcon({ kind }: { kind: Blade["properties"][number]["icon"] }) {
  return (
    <span className={styles.propertyIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        {kind === "drop" ? (
          <path d="M12 3.5S6.2 10.1 6.2 14.4a5.8 5.8 0 0 0 11.6 0C17.8 10.1 12 3.5 12 3.5Z" />
        ) : kind === "swirl" ? (
          <path d="M18.5 8.5a7 7 0 1 0 1 6.2M18.5 8.5V4m0 4.5H14M8 15.5a3.6 3.6 0 1 0 .4-4.9" />
        ) : (
          <path d="m12 2.8 2.2 6.1 6.1 3.1-6.1 3.1-2.2 6.1-2.2-6.1-6.1-3.1 6.1-3.1L12 2.8Z" />
        )}
      </svg>
    </span>
  );
}

function SpiritCanvas({ blade }: { blade: Blade }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = canvas.parentElement;
    const context = canvas.getContext("2d", { alpha: true });
    if (!scene || !context) return;
    const drawingContext: CanvasRenderingContext2D = context;

    let visible = false;
    let frame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const particles: { x: number; y: number; radius: number; speed: number; drift: number; phase: number }[] = [];
    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isMobile = window.innerWidth < 768;
      const amount = blade.id === "butterfly"
        ? (isMobile ? MOBILE_BLADE_BUTTERFLY_COUNT : 22)
        : (isMobile ? MOBILE_BLADE_EMBER_COUNT : 60);
      particles.length = 0;
      for (let i = 0; i < amount; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.7 + Math.random() * 1.6,
          speed: 0.12 + Math.random() * 0.36,
          drift: (Math.random() - 0.5) * 0.42,
          phase: Math.random() * Math.PI * 2,
        });
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
      if (visible && reducedMotion) draw(0, true);
    }, { threshold: 0.08 });
    observer.observe(scene);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scene);

    function draw(time: number, staticFrame = false) {
      if (!visible && !staticFrame) {
        frame = 0;
        return;
      }
      const targetFps = window.innerWidth < 768 ? 25 : 60;
      if (!staticFrame && time - lastFrame < 1000 / targetFps) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;
      drawingContext.clearRect(0, 0, width, height);
      drawingContext.globalCompositeOperation = "lighter";
      const tint = blade.accentColor;
      const phase = time / 1000;

      if (blade.id === "butterfly") {
        particles.forEach((particle) => {
          const x = particle.x + Math.sin(phase * 0.35 + particle.phase) * 14;
          const y = (particle.y - phase * 7 * particle.speed + height) % height;
          const size = 2.2 + particle.radius * 1.15;
          drawingContext.save();
          drawingContext.translate(x, y);
          drawingContext.rotate(Math.sin(phase + particle.phase) * 0.25);
          drawingContext.globalAlpha = 0.48;
          drawingContext.fillStyle = tint;
          drawingContext.strokeStyle = "#e7d5ff";
          drawingContext.lineWidth = 0.55;
          drawingContext.beginPath();
          drawingContext.ellipse(-size * 0.56, -size * 0.2, size * 0.62, size * 0.42, -0.35, 0, Math.PI * 2);
          drawingContext.ellipse(size * 0.56, -size * 0.2, size * 0.62, size * 0.42, 0.35, 0, Math.PI * 2);
          drawingContext.ellipse(-size * 0.43, size * 0.35, size * 0.42, size * 0.28, 0.35, 0, Math.PI * 2);
          drawingContext.ellipse(size * 0.43, size * 0.35, size * 0.42, size * 0.28, -0.35, 0, Math.PI * 2);
          drawingContext.fill();
          drawingContext.stroke();
          drawingContext.beginPath();
          drawingContext.moveTo(0, -size * 0.55);
          drawingContext.lineTo(0, size * 0.55);
          drawingContext.moveTo(0, -size * 0.38);
          drawingContext.quadraticCurveTo(-size * 0.35, -size * 0.8, -size * 0.5, -size * 0.62);
          drawingContext.moveTo(0, -size * 0.38);
          drawingContext.quadraticCurveTo(size * 0.35, -size * 0.8, size * 0.5, -size * 0.62);
          drawingContext.stroke();
          drawingContext.restore();
        });
      } else {
        particles.forEach((particle, i) => {
          const x = particle.x + Math.sin(phase * 0.25 + particle.phase) * 12 + (blade.id === "beast" ? particle.drift * phase * 3 : 0);
          const y = (particle.y - phase * particle.speed * (blade.id === "thunder" ? 11 : 7) + height) % height;
          const flicker = blade.id === "thunder" ? 0.2 + Math.abs(Math.sin(phase * 5 + i)) * 0.55 : 0.22;
          drawingContext.globalAlpha = flicker;
          drawingContext.fillStyle = blade.id === "beast" ? "#aaa99f" : tint;
          if (blade.id === "water") {
            drawingContext.beginPath();
            drawingContext.ellipse(x, y, particle.radius * 0.65, particle.radius * 1.5, 0.15, 0, Math.PI * 2);
            drawingContext.fill();
          } else {
            drawingContext.beginPath();
            drawingContext.arc(x, y, particle.radius, 0, Math.PI * 2);
            drawingContext.fill();
          }
        });
      }
      drawingContext.globalAlpha = 1;
      drawingContext.globalCompositeOperation = "source-over";
      if (blade.id === "thunder" && !staticFrame && Math.sin(phase * 2.4) > 0.995) {
        drawingContext.fillStyle = `${tint}0b`;
        drawingContext.fillRect(0, 0, width, height);
      }
      if (!staticFrame && visible) frame = requestAnimationFrame(draw);
      else frame = 0;
    }

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      drawingContext.clearRect(0, 0, width, height);
    };
  }, [blade]);

  return (
    <div className={styles.spiritField}>
      <canvas className={styles.spiritCanvas} ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

export default function BladeExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const kanjiRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const sectionActive = useRef(false);
  const calloutMotion = useRef<{
    labels: Record<string, { left: string; top: string }>;
    lines: Record<string, string>;
    markers: Record<string, string>;
  } | null>(null);
  const blade = bladeOptions[activeIndex];
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const changeTo = useCallback((index: number) => {
    const next = (index + bladeOptions.length) % bladeOptions.length;
    if (next === activeRef.current) return;
    const old = activeRef.current;
    const section = sectionRef.current;
    if (section) {
      calloutMotion.current = {
        labels: Object.fromEntries(Array.from(section.querySelectorAll<HTMLElement>("[data-callout-label]")).map((item) => [
          item.dataset.calloutLabel ?? "",
          { left: item.style.left, top: item.style.top },
        ])),
        lines: Object.fromEntries(Array.from(section.querySelectorAll<SVGPathElement>("[data-callout-line]")).map((item) => [
          item.dataset.calloutLine ?? "",
          item.getAttribute("d") ?? "",
        ])),
        markers: Object.fromEntries(Array.from(section.querySelectorAll<SVGPathElement>("[data-callout-marker]")).map((item) => [
          item.dataset.calloutMarker ?? "",
          item.getAttribute("d") ?? "",
        ])),
      };
    }
    activeRef.current = next;
    setActiveIndex(next);
    const nextBlade = bladeOptions[next];
    const incoming = sectionRef.current?.querySelector<HTMLElement>(`[data-blade-index="${next}"]`);
    const outgoing = sectionRef.current?.querySelector<HTMLElement>(`[data-blade-index="${old}"]`);
    const flash = flashRef.current;
    const root = sectionRef.current;
    gsap.killTweensOf([incoming, outgoing, flash, root]);
    if (root) gsap.to(root, {
      "--accent": nextBlade.accentColor,
      "--glow": nextBlade.glow,
      duration: reducedMotion() ? 0 : 0.45,
      ease: "power2.inOut",
      overwrite: true,
    });
    if (reducedMotion()) {
      if (incoming) gsap.set(incoming, { autoAlpha: 1, scale: 1 });
      if (outgoing) gsap.set(outgoing, { autoAlpha: 0, scale: 1 });
      if (flash) gsap.set(flash, { autoAlpha: 0 });
      return;
    }
    if (incoming) gsap.fromTo(incoming, { autoAlpha: 0, scale: 0.94 }, {
      autoAlpha: 1, scale: 1, duration: 0.52, ease: "power2.out", overwrite: true,
    });
    if (outgoing) gsap.to(outgoing, {
      autoAlpha: 0, scale: 1.025, duration: 0.42, ease: "power2.inOut", overwrite: true,
    });
    if (flash) gsap.fromTo(flash, { autoAlpha: 0 }, {
      autoAlpha: 0.2, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out", overwrite: true,
    });
  }, []);

  useEffect(() => {
    if (!sectionActive.current || reducedMotion()) return;
    const callouts = sectionRef.current?.querySelectorAll<HTMLElement>("[data-callout]");
    if (!callouts?.length) return;
    gsap.killTweensOf(callouts);
    const motion = calloutMotion.current;
    const labels = sectionRef.current?.querySelectorAll<HTMLElement>("[data-callout-label]");
    labels?.forEach((label) => {
      const id = label.dataset.calloutLabel ?? "";
      const from = motion?.labels[id];
      if (!from) return;
      const left = label.style.left;
      const top = label.style.top;
      gsap.fromTo(label, { left: from.left, top: from.top, autoAlpha: 0.72, y: 0 }, {
        left, top, autoAlpha: 1, y: 0, duration: 0.46, ease: "power2.inOut", overwrite: true,
      });
    });
    sectionRef.current?.querySelectorAll<SVGPathElement>("[data-callout-line]").forEach((line) => {
      const from = motion?.lines[line.dataset.calloutLine ?? ""];
      const to = line.getAttribute("d");
      if (from && to) gsap.fromTo(line, { attr: { d: from } }, {
        attr: { d: to }, duration: 0.46, ease: "power2.inOut", overwrite: true,
      });
    });
    sectionRef.current?.querySelectorAll<SVGPathElement>("[data-callout-marker]").forEach((marker) => {
      const from = motion?.markers[marker.dataset.calloutMarker ?? ""];
      const to = marker.getAttribute("d");
      if (from && to) gsap.fromTo(marker, { attr: { d: from } }, {
        attr: { d: to }, duration: 0.46, ease: "power2.inOut", overwrite: true,
      });
    });
    calloutMotion.current = null;
    return () => {
      gsap.killTweensOf(callouts);
      labels?.forEach((label) => gsap.killTweensOf(label));
      sectionRef.current?.querySelectorAll("[data-callout-line], [data-callout-marker]").forEach((line) => gsap.killTweensOf(line));
    };
  }, [activeIndex]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let floatTween: gsap.core.Tween | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      const isActive = entry.isIntersecting && entry.intersectionRatio >= 0.22;
      if (isActive && !sectionActive.current && !reducedMotion()) {
        const callouts = section.querySelectorAll<HTMLElement>("[data-callout]");
        gsap.fromTo(callouts, { autoAlpha: 0, y: 7 }, {
          autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.07, ease: "power2.out", overwrite: true,
        });
        const drawnLines = section.querySelectorAll<SVGPathElement>("[data-draw-line]");
        gsap.fromTo(drawnLines, { strokeDashoffset: 100 }, {
          strokeDashoffset: 0, duration: 0.72, stagger: 0.15, ease: "power2.out", overwrite: true,
        });
        const diamonds = section.querySelectorAll<SVGPathElement>("[data-callout-marker]");
        gsap.fromTo(diamonds, { scale: 0, transformOrigin: "center" }, {
          scale: 1, duration: 0.32, stagger: 0.15, ease: "back.out(1.7)", overwrite: true,
        });
      }
      sectionActive.current = isActive;
      if (floatTween) isActive ? floatTween.resume() : floatTween.pause();
    }, { threshold: [0, 0.22, 0.5] });
    observer.observe(section);
    const onKey = (event: KeyboardEvent) => {
      if (!sectionActive.current || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        changeTo(activeRef.current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeTo(activeRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);

    const tilt = tiltRef.current;
    const floating = floatRef.current;
    const kanji = kanjiRef.current;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const moveX = finePointer && tilt ? gsap.quickTo(tilt, "rotationY", { duration: 0.65, ease: "power3.out" }) : null;
    const moveY = finePointer && tilt ? gsap.quickTo(tilt, "rotationX", { duration: 0.65, ease: "power3.out" }) : null;
    const kanjiX = finePointer && kanji ? gsap.quickTo(kanji, "x", { duration: 0.8, ease: "power2.out" }) : null;
    const kanjiY = finePointer && kanji ? gsap.quickTo(kanji, "y", { duration: 0.8, ease: "power2.out" }) : null;
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer || !sectionActive.current || event.pointerType === "touch" || !tilt) return;
      const rect = section.getBoundingClientRect();
      moveX?.(((event.clientX - rect.left) / rect.width - 0.5) * 3.2);
      moveY?.((0.5 - (event.clientY - rect.top) / rect.height) * 2.2);
      kanjiX?.(((event.clientX - rect.left) / rect.width - 0.5) * -10);
      kanjiY?.((0.5 - (event.clientY - rect.top) / rect.height) * 10);
    };
    const onPointerLeave = () => {
      moveX?.(0);
      moveY?.(0);
      kanjiX?.(0);
      kanjiY?.(0);
    };
    if (finePointer) {
      section.addEventListener("pointermove", onPointerMove);
      section.addEventListener("pointerleave", onPointerLeave);
    }
    if (floating && !reducedMotion()) {
      if (window.matchMedia("(pointer: coarse)").matches) {
        floatTween = gsap.to(floating, { y: -7, duration: 3.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      } else {
        floatTween = gsap.to(floating, { y: -5, duration: 4.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
      if (!sectionActive.current) floatTween.pause();
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      floatTween?.kill();
      sectionActive.current = false;
      gsap.killTweensOf(Array.from(section.querySelectorAll(
        "[data-blade-index], [data-callout], [data-callout-line], [data-callout-marker], [data-draw-line]",
      )));
      gsap.killTweensOf([tilt, floating, kanji]);
      if (flashRef.current) gsap.killTweensOf(flashRef.current);
    };
  }, [changeTo]);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) changeTo(activeRef.current + (dx < 0 ? 1 : -1));
    touchStart.current = null;
  };

  return (
    <div
      className={styles.experience}
      ref={sectionRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.giantKanji} ref={kanjiRef} aria-hidden="true">刀</div>
      <Image className={styles.cloudTop} src="/ui/cloud-gold.png" alt="" width={560} height={260} aria-hidden="true" />
      <Image className={styles.cloudSide} src="/ui/cloud-gold.png" alt="" width={480} height={240} aria-hidden="true" />
      <div className={styles.inner}>
        <aside className={styles.left}>
          <SectionLabel number={bladeSectionCopy.sectionNumber} title={bladeSectionCopy.sectionLabel} />
          <h1 className={styles.title} id="blades-title">
            {bladeSectionCopy.titleFirst}<br />
            <span>{bladeSectionCopy.titleSecond}</span>
          </h1>
          <div className={styles.titleUnderline} aria-hidden="true">
            <svg viewBox="0 0 240 18" preserveAspectRatio="none">            <path data-draw-line pathLength="100" d="M2 12C63 4 128 3 237 8" /></svg>
          </div>
          <p className={styles.subtitle}>{bladeSectionCopy.subtitle}</p>
          <p className={styles.description}>{bladeSectionCopy.description}</p>
          <div className={styles.swatches} aria-label="Choose a breathing style">
            {bladeOptions.map((option, index) => (
              <button
                className={`${styles.swatch}${index === activeIndex ? ` ${styles.swatchActive}` : ""}`}
                key={option.id}
                type="button"
                style={{ "--swatch": option.accentColor } as CSSProperties}
                onClick={() => changeTo(index)}
                aria-label={`Show ${option.label} Nichirin blade`}
                aria-pressed={index === activeIndex}
                title={option.label}
              >
                <span />
              </button>
            ))}
          </div>
          <div className={styles.activeMeta} key={blade.id}>
            <div><span>{bladeSectionCopy.breathingLabel}</span><strong>{blade.breathing}</strong></div>
            <div><span>{bladeSectionCopy.usersLabel}</span><strong>{blade.users.join(" · ")}</strong></div>
            <HankoSeal label={bladeSectionCopy.leftSeal} />
          </div>
        </aside>

        <div className={styles.center}>
          <SpiritCanvas blade={blade} />
          <div className={styles.artTilt} ref={tiltRef}>
            <div className={styles.artFloat} ref={floatRef}>
              {bladeOptions.map((option, index) => (
                <div
                  className={`${styles.bladeLayer}${index === activeIndex ? ` ${styles.bladeLayerActive}` : ""}`}
                  data-blade-index={index}
                  key={option.id}
                  aria-hidden={index !== activeIndex}
                  style={{ filter: option.filter }}
                >
                  <Image src={option.image} alt={index === activeIndex ? `${option.label} Nichirin sword` : ""} fill sizes="(max-width: 767px) 92vw, 48vw" />
                  <span className={styles.bladeGlow} style={{ backgroundColor: option.accentColor }} aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
          <svg className={styles.calloutLines} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            {blade.callouts.map((callout) => {
              const endX = callout.x + (callout.side === "left" ? -14 : 14);
              const endY = callout.y - 7;
              return (
                <g key={`${blade.id}-${callout.id}`} data-callout>
                  <path data-callout-line={callout.id} data-draw-line pathLength="100" d={`M ${callout.x * 10} ${callout.y * 10} L ${endX * 10} ${endY * 10}`} />
                  <path data-callout-marker={callout.id} className={styles.calloutDiamond} d={`M ${callout.x * 10} ${callout.y * 10 - 5} l 5 5 -5 5 -5 -5 z`} />
                </g>
              );
            })}
          </svg>
          <div className={styles.callouts}>
            {blade.callouts.map((callout) => {
              const endX = callout.x + (callout.side === "left" ? -14 : 14);
              const endY = callout.y - 7;
              return (
                <div
                  className={`${styles.callout} ${callout.side === "left" ? styles.calloutLeft : styles.calloutRight}`}
                  data-callout
                  key={callout.id}
                  data-callout-label={callout.id}
                  style={{ left: `${endX}%`, top: `${endY}%` }}
                >
                  <span>{callout.label}</span><strong>{callout.value}</strong>
                </div>
              );
            })}
          </div>
          <div className={styles.imageFlash} ref={flashRef} aria-hidden="true" />
        </div>

        <aside className={styles.right}>
          <div className={styles.japanese} lang="ja">
            <span>{bladeSectionCopy.rightTitle}</span>
            <i aria-hidden="true" />
            <small>{bladeSectionCopy.rightPhrase}</small>
            <HankoSeal label={bladeSectionCopy.rightSeal} />
          </div>
          <div className={styles.properties} key={`${blade.id}-properties`}>
            <h2>{bladeSectionCopy.propertiesTitle}</h2>
            <p className={styles.rightDescription}>{blade.description}</p>
            <div className={styles.propertyRows}>
              {blade.properties.map((property) => (
                <div className={styles.propertyRow} key={`${blade.id}-${property.label}`}>
                  <PropertyIcon kind={property.icon} />
                  <div><span>{property.label}</span><strong>{property.value}</strong></div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.controls}>
            <span className={styles.counter}><b>{String(activeIndex + 1).padStart(2, "0")}</b><i>/</i>{String(bladeOptions.length).padStart(2, "0")}</span>
            <div className={styles.arrows}>
              <button type="button" onClick={() => changeTo(activeRef.current - 1)} aria-label="Previous Nichirin blade">←</button>
              <button type="button" onClick={() => changeTo(activeRef.current + 1)} aria-label="Next Nichirin blade">→</button>
            </div>
          </div>
        </aside>
      </div>
      <div className={styles.scrollHint} aria-hidden="true">
        <i className={styles.scrollVertical}><b /></i>
        <div className={styles.scrollLabel}>
          <i /><span>{bladeSectionCopy.scroll}</span><i />
        </div>
        <em />
      </div>
    </div>
  );
}
