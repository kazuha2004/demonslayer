"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Checker from "@/components/Checker";
import HankoSeal from "@/components/HankoSeal";

gsap.registerPlugin(ScrollTrigger);

export default function WorldSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lanternRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          end: "top 24%",
          scrub: 0.8,
        },
      });

      reveal.fromTo(
        ".world-kicker",
        { x: -16, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out" },
        0,
      );
      reveal.fromTo(
        ".world-quote-line",
        { clipPath: "inset(0 0 100% 0)", y: 14 },
        {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          duration: 0.75,
          stagger: 0.19,
          ease: "power2.out",
        },
        0.05,
      );
      reveal.fromTo(
        ".world-hope-underline",
        { strokeDashoffset: 180 },
        { strokeDashoffset: 0, duration: 0.65, ease: "power1.out" },
        0.48,
      );
      reveal.fromTo(
        ".world-washi-panel",
        { xPercent: 16, rotation: -1, autoAlpha: 0.35 },
        { xPercent: 0, rotation: 0, autoAlpha: 1, ease: "none" },
        0,
      );
      reveal.fromTo(
        [".world-japanese", ".world-hanko"],
        { autoAlpha: 0, scale: 0.94 },
        { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        0.2,
      );
    }, section);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const lantern = lanternRef.current;
    if (!lantern || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const flicker = gsap.to(lantern, {
      opacity: () => gsap.utils.random(0.6, 1),
      duration: () => gsap.utils.random(0.1, 0.4),
      ease: "sine.inOut",
      repeat: -1,
      repeatRefresh: true,
      yoyo: true,
    });

    return () => {
      flicker.kill();
    };
  }, []);

  return (
    <div
      className="world-section"
      ref={sectionRef}
      role="region"
      aria-labelledby="world-section-title"
    >
      <div className="world-vignette" aria-hidden="true" />
      <div className="world-lantern-glow" ref={lanternRef} aria-hidden="true" />

      <div className="world-quote">
        <p className="world-kicker">
          <span>01 — The World</span>
          <span className="world-kicker-rule" aria-hidden="true" />
        </p>
        <h2 id="world-section-title">
          <span className="world-quote-line"><span className="world-quote-hang">“</span>In a world</span>
          <span className="world-quote-line">where demons roam,</span>
          <span className="world-quote-line">
            <span className="world-hope-wrap">
              <em>hope</em>
              <svg
                className="world-hope-underline"
                viewBox="0 0 150 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 14C36 2 78 17 148 6" />
              </svg>
            </span>{" "}never fades.”
          </span>
        </h2>
      </div>

      <aside className="world-washi-panel" aria-label="The world of the Demon Slayer Corps">
        <div className="world-panel-seal" role="img" lang="ja" aria-label="Demon Slayer">
          鬼滅の刃
        </div>
        <p>
          Set in the Taisho era, Japan — a time of beauty and hardship. The
          world of Demon Slayer is a place where humans and demons coexist,
          where the line between good and evil blurs, and where courage is the
          only light in the darkness.
        </p>
        <span className="world-panel-divider" aria-hidden="true" />
        <p>
          Beyond the cities and mountains lie forests filled with demons, and
          a society that fights to protect its people. This is the world
          Tanjiro Kamado steps into — a world that never gives up.
        </p>
        <span className="world-panel-watermark" aria-hidden="true">滅</span>
      </aside>

      <div className="world-japanese" lang="ja" aria-label="Hope remains">
        <span>それでも、</span>
        <span>人は、立ち上がる</span>
      </div>
      <div className="world-hanko"><HankoSeal label="滅" /></div>

      <div className="world-cloud world-cloud-top" aria-hidden="true">
        <Image src="/ui/cloud-gold.png" alt="" fill sizes="20vw" />
      </div>
      <div className="world-cloud world-cloud-panel-bottom" aria-hidden="true">
        <Image src="/ui/cloud-gold.png" alt="" fill sizes="24vw" />
      </div>
      <Checker className="world-checker" />
      <div className="world-scroll-indicator" aria-hidden="true">
        <span className="world-scroll-line" />
        <i className="world-scroll-dot" />
        <span className="world-scroll-line" />
        <span className="world-scroll-label">Scroll Down</span>
      </div>
    </div>
  );
}
