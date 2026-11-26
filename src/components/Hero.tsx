"use client";

import Image from "next/image";
import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HankoSeal from "@/components/HankoSeal";

gsap.registerPlugin(ScrollTrigger);

function EmptyParticleLayer() {
  return null;
}

const loadParticleLayer = (): Promise<{ default: ComponentType }> =>
  import("@/components/HeroParticles").catch((error: unknown) => {
    console.warn("Hero particle layer failed to load; continuing without it.", error);
    return { default: EmptyParticleLayer };
  });

const ParticleLayer = lazy(loadParticleLayer);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const tanjiroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLSpanElement>(null);
  const [loaderExited, setLoaderExited] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    const reveal = () => setLoaderExited(true);
    if (document.documentElement.dataset.loaderIntroStarted === "true") reveal();
    window.addEventListener("site-loader:intro-started", reveal);

    return () => {
      window.removeEventListener("site-loader:intro-started", reveal);
    };
  }, []);

  useEffect(() => {
    if (!loaderExited) return;
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setParticlesReady(entry.isIntersecting);
      },
      { rootMargin: "200px" },
    );
    observer.observe(hero);
    return () => {
      observer.disconnect();
    };
  }, [loaderExited]);

  useEffect(() => {
    if (!loaderExited) return;
    let cleanup: () => void = () => {};
    const timer = window.setTimeout(() => {
      const hero = heroRef.current;
      const tanjiro = tanjiroRef.current;
      const title = heroTitleRef.current;
      if (!hero || !tanjiro || !title) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;
      const compactLayout = window.matchMedia(
        "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
      ).matches;
      const canUseParallax = !compactLayout && window.matchMedia("(pointer: fine)").matches;

      let frame = 0;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        targetX = (event.clientX / window.innerWidth - 0.5) * 28;
        targetY = (event.clientY / window.innerHeight - 0.5) * 20;
        if (!frame) frame = requestAnimationFrame(updateParallax);
      };
      const updateParallax = () => {
        currentX += (targetX - currentX) * 0.055;
        currentY += (targetY - currentY) * 0.055;
        tanjiro.style.setProperty("--tanjiro-parallax-x", `${-currentX * 1.5}px`);
        tanjiro.style.setProperty("--tanjiro-parallax-y", `${-currentY * 1.5}px`);
        title.style.setProperty("--hero-title-x", `${-currentX * 0.45}px`);
        title.style.setProperty("--hero-title-y", `${-currentY * 0.45}px`);
        title.style.setProperty("--hero-title-rotate-x", `${currentY * 0.09}deg`);
        title.style.setProperty("--hero-title-rotate-y", `${-currentX * 0.09}deg`);
        if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.08) {
          frame = requestAnimationFrame(updateParallax);
        } else {
          frame = 0;
        }
      };
      if (canUseParallax) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
      }

      const context = gsap.context(() => {
        const isSmallScreen = window.matchMedia("(max-width: 700px)").matches;
        gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: isSmallScreen ? "+=35%" : "+=50%",
            scrub: 0.8,
          },
        })
          .to(".hero-tanjiro", { yPercent: 8, autoAlpha: 0.35, ease: "none" }, 0)
          .to(".hero-main-content", { y: -48, autoAlpha: 0, ease: "none" }, 0);
      }, hero);

      cleanup = () => {
        if (canUseParallax) {
          window.removeEventListener("pointermove", onPointerMove);
        }
        if (frame) cancelAnimationFrame(frame);
        context.revert();
      };
    }, 1700);

    return () => {
      window.clearTimeout(timer);
      cleanup();
    };
  }, [loaderExited]);

  return (
    <div className={`cinematic-hero${loaderExited ? " is-intro-ready" : ""}`} ref={heroRef} role="region" aria-labelledby="hero-title">
      <div className="hero-shade" aria-hidden="true" />
      <Suspense fallback={null}>{particlesReady && <ParticleLayer />}</Suspense>

      <div className="hero-tanjiro" ref={tanjiroRef} aria-hidden="true">
        <Image
          src="/ui/hero-tanjiro.png"
          alt=""
          data-loader-asset="hero-character"
          fill
          priority
          sizes="(max-width: 900px) and (max-height: 500px) and (orientation: landscape) 52vh, (max-width: 767px) 124vw, 90vw"
        />
      </div>
      <div className="hero-main-content">
        <div className="hero-title-block">
          <h1 className="hero-image-heading" id="hero-title">
            <span className={`hero-title-mask${loaderExited ? " is-revealed" : ""}`}>
              <span className="hero-title-art" ref={heroTitleRef}>
                <Image
                  src="/ui/hero-title.png"
                  alt=""
                  width={640}
                  height={360}
                  priority
                  data-loader-asset="hero-title"
                />
              </span>
            </span>
            <span className="visually-hidden">Demon Slayer: Kimetsu no Yaiba</span>
          </h1>
        </div>
      </div>

      <div className="hero-japanese-left" role="img" aria-label="Kamado Tanjiro" lang="ja">
        <span>竈門</span><span>炭治郎</span>
      </div>
      <div className="hero-seal"><HankoSeal label="滅" /></div>
      <span className="hero-japanese-right" lang="ja">それでも、前を向く</span>

      <a className="hero-scroll-cue" href="#characters" aria-label="Scroll to explore characters">
        <span>Scroll</span>
        <span className="hero-scroll-line" aria-hidden="true" />
        <span className="hero-scroll-dot" aria-hidden="true" />
      </a>
    </div>
  );
}
