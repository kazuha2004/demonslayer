"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });

    const updateScrollTrigger = () => ScrollTrigger.update();
    const raf = (time: number) => lenis.raf(time * 1000);
    const scrollToPosition = (event: Event) => {
      const top = (event as CustomEvent<number>).detail;
      if (Number.isFinite(top)) lenis.scrollTo(top, { immediate: true, force: true });
    };

    lenis.on("scroll", updateScrollTrigger);
    window.addEventListener("webmart:lenis-scroll-to", scrollToPosition);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      window.removeEventListener("webmart:lenis-scroll-to", scrollToPosition);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
