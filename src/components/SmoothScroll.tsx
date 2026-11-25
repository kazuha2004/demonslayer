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
    const pauseScroll = () => lenis.stop();
    const resumeScroll = () => lenis.start();

    lenis.on("scroll", updateScrollTrigger);
    window.addEventListener("webmart:lenis-scroll-to", scrollToPosition);
    window.addEventListener("site-loader:pause", pauseScroll);
    window.addEventListener("site-loader:resume", resumeScroll);
    if (
      document.documentElement.dataset.loaderActive === "true"
      || (document.querySelector(".loading-screen") && document.documentElement.dataset.loaderExited !== "true")
    ) lenis.stop();
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      window.removeEventListener("webmart:lenis-scroll-to", scrollToPosition);
      window.removeEventListener("site-loader:pause", pauseScroll);
      window.removeEventListener("site-loader:resume", resumeScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
