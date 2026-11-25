"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SlashWipe({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete: () => void;
}) {
  const wipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !wipeRef.current) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = gsap.timeline({ onComplete });
    timeline
      .fromTo(
        wipeRef.current,
        { clipPath: "polygon(-12% 100%, -10% 100%, 0% 0%, -2% 0%)" },
        {
          clipPath: "polygon(-10% 100%, 100% 100%, 110% 0%, 0% 0%)",
          duration: reducedMotion ? 0.01 : 0.42,
          ease: "power3.in",
        },
      )
      .to(wipeRef.current, {
        clipPath: "polygon(88% 100%, 102% 100%, 112% 0%, 98% 0%)",
        duration: reducedMotion ? 0.01 : 0.58,
        ease: "power3.inOut",
      })
      .to(wipeRef.current, {
        clipPath: "polygon(110% 100%, 112% 100%, 122% 0%, 120% 0%)",
        duration: reducedMotion ? 0.01 : 0.16,
        ease: "power3.inOut",
      });

    return () => {
      timeline.kill();
    };
  }, [active, onComplete]);

  return <div ref={wipeRef} className="slash-wipe" aria-hidden="true" />;
}
