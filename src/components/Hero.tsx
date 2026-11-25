"use client";

import Image from "next/image";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HankoSeal from "@/components/HankoSeal";

gsap.registerPlugin(ScrollTrigger);

const ParticleLayer = lazy(() => import("@/components/HeroParticles"));

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const tanjiroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLSpanElement>(null);
  const [loaderExited, setLoaderExited] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    const reveal = () => setLoaderExited(true);
    if (document.documentElement.dataset.loaderExited === "true") reveal();
    window.addEventListener("site-loader:exited", reveal);

    const hero = heroRef.current;
    let observer: IntersectionObserver | undefined;
    if (hero) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setParticlesReady(true);
            observer?.disconnect();
          }
        },
        { rootMargin: "100px" },
      );
      observer.observe(hero);
    }

    return () => {
      window.removeEventListener("site-loader:exited", reveal);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const tanjiro = tanjiroRef.current;
    const title = heroTitleRef.current;
    if (!hero || !tanjiro || !title) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

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
    window.addEventListener("pointermove", onPointerMove, { passive: true });

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

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
      context.revert();
    };
  }, []);

  return (
    <div className="cinematic-hero" ref={heroRef} role="region" aria-labelledby="hero-title">
      <div className="hero-shade" aria-hidden="true" />
      <Suspense fallback={null}>{particlesReady && <ParticleLayer />}</Suspense>

      <div className="hero-tanjiro" ref={tanjiroRef} aria-hidden="true">
        <Image
          src="/ui/hero-tanjiro.png"
          alt=""
          fill
          priority
          sizes="(max-width: 700px) 180vw, 90vw"
        />
      </div>
      <div className="hero-main-content">
        <div className="hero-title-block">
          <h1 className="hero-image-heading" id="hero-title">
            <span className={`hero-title-mask${loaderExited ? " is-revealed" : ""}`}>
              <span className="hero-title-art" ref={heroTitleRef}>
                <Image src="/ui/hero-title.png" alt="" width={640} height={360} priority />
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
