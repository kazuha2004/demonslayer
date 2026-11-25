"use client";

import { useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import Checker from "@/components/Checker";
import SlashWipe from "@/components/SlashWipe";

const KEY_IMAGES = ["/backgrounds/hero-bg.png", "/ui/hero-tanjiro.png", "/ui/title-logo.png"];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [wipeActive, setWipeActive] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let completed = 0;
    let cancelled = false;
    const taskCount = KEY_IMAGES.length + 1;

    const markComplete = () => {
      if (cancelled) return;
      completed += 1;
      setProgress(Math.round((completed / taskCount) * 100));
    };

    KEY_IMAGES.forEach((source) => {
      const image = new Image();
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        markComplete();
      };
      image.onload = settle;
      image.onerror = settle;
      image.src = source;
      if (image.complete && image.naturalWidth > 0) settle();
    });

    document.fonts.ready.then(markComplete);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (progress !== 100) return;
    const timeout = window.setTimeout(() => setWipeActive(true), 280);
    return () => window.clearTimeout(timeout);
  }, [progress]);

  const finishWipe = useCallback(() => {
    const announceExit = () => {
      document.documentElement.dataset.loaderExited = "true";
      window.dispatchEvent(new Event("site-loader:exited"));
    };
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      announceExit();
      return;
    }
    if (typeof document !== "undefined") {
      gsap.to(".loading-screen", {
        autoAlpha: 0,
        duration: 0.24,
        onComplete: () => {
          setVisible(false);
          announceExit();
        },
      });
    }
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className="loading-screen" role="status" aria-live="polite" aria-label={`Now loading ${progress}%`}>
        <div className="loading-content">
          <div className="loading-mark" aria-hidden="true">
            鬼殺隊
          </div>
          <div className="loading-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="loading-reading">
            <span>Now Loading</span>
            <strong>{String(progress).padStart(2, "0")}%</strong>
          </div>
        </div>
        <Checker className="loading-checker" />
      </div>
      <SlashWipe active={wipeActive} onComplete={finishWipe} />
    </>
  );
}
