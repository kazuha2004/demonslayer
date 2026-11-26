"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import HankoSeal from "@/components/HankoSeal";

const REQUIRED_ASSETS = [
  "/ui/moon.png",
  "/backgrounds/hero-bg.png",
];
const HERO_IMAGE_SELECTORS = [
  '[data-loader-asset="hero-character"]',
  '[data-loader-asset="hero-title"]',
];
const SESSION_KEY = "webmart:moonrise-loader-seen";
const FIRST_VISIT_MINIMUM_MS = 1800;
const MOBILE_FIRST_VISIT_MINIMUM_MS = 1400;
const REPEAT_VISIT_DURATION_MS = 800;
const SAFETY_TIMEOUT_MS = 8000;
const EXIT_DURATION_MS = 1200;
const REDUCED_MOTION_EXIT_DURATION_MS = 180;

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [moonRisen, setMoonRisen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);
  const displayedProgressRef = useRef(0);
  const exitStartedRef = useRef(false);
  const introStartedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const startHeroIntro = useCallback(() => {
    if (introStartedRef.current) return;
    introStartedRef.current = true;
    document.documentElement.dataset.loaderIntroStarted = "true";
    window.dispatchEvent(new Event("site-loader:intro-started"));
  }, []);

  const finishExit = useCallback(() => {
    if (!introStartedRef.current) startHeroIntro();
    exitStartedRef.current = true;
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
    exitTimerRef.current = null;
    safetyTimerRef.current = null;
    setVisible(false);
    document.documentElement.classList.remove("site-loading");
    document.documentElement.dataset.loaderExited = "true";
    delete document.documentElement.dataset.loaderActive;
    try {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // The loader still completes when session storage is disabled.
    }
    window.dispatchEvent(new Event("site-loader:resume"));
    window.dispatchEvent(new Event("site-loader:exited"));
  }, [startHeroIntro]);

  const beginExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    setProgress(100);
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) startHeroIntro();
    setExiting(true);
    const exitDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? REDUCED_MOTION_EXIT_DURATION_MS
      : EXIT_DURATION_MS;
    exitTimerRef.current = window.setTimeout(finishExit, exitDuration);
  }, [finishExit, startHeroIntro]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("site-loading");
    root.dataset.loaderActive = "true";
    window.dispatchEvent(new Event("site-loader:pause"));
    let riseFrame = 0;
    let settled = false;
    const clearTimers = () => {
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
      exitTimerRef.current = null;
      safetyTimerRef.current = null;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayedProgressRef.current = 100;
      setDisplayedProgress(100);
      setProgress(100);
      exitTimerRef.current = window.setTimeout(beginExit, 0);
      return () => {
        settled = true;
        clearTimers();
        root.classList.remove("site-loading");
        delete root.dataset.loaderActive;
      };
    }

    riseFrame = window.requestAnimationFrame(() => setMoonRisen(true));

    let repeatVisit = false;
    try {
      repeatVisit = window.sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      // Storage can be unavailable in private browsing; keep the first-visit timing.
    }

    const startedAt = performance.now();
    let completed = 0;
    let scheduledExit = false;
    const heroImages = HERO_IMAGE_SELECTORS.map((selector) =>
      document.querySelector<HTMLImageElement>(selector),
    );
    const totalTasks = REQUIRED_ASSETS.length + heroImages.length + 1;

    const completeTask = () => {
      if (settled || exitStartedRef.current) return;
      completed += 1;
      setProgress(Math.round((completed / totalTasks) * 100));
      if (completed !== totalTasks || scheduledExit) return;

      scheduledExit = true;
      const minMs = window.matchMedia("(max-width: 767px)").matches
        ? MOBILE_FIRST_VISIT_MINIMUM_MS
        : FIRST_VISIT_MINIMUM_MS;
      const remaining = Math.max(0, minMs - (performance.now() - startedAt));
      exitTimerRef.current = window.setTimeout(beginExit, remaining);
    };

    const trackImage = (image: HTMLImageElement) => {
      let complete = false;
      const settle = () => {
        if (complete) return;
        complete = true;
        completeTask();
      };
      image.addEventListener("load", settle, { once: true });
      image.addEventListener("error", settle, { once: true });
      if (image.complete) settle();
    };

    safetyTimerRef.current = window.setTimeout(beginExit, SAFETY_TIMEOUT_MS);
    if (repeatVisit) {
      scheduledExit = true;
      exitTimerRef.current = window.setTimeout(beginExit, REPEAT_VISIT_DURATION_MS);
    }
    REQUIRED_ASSETS.forEach((source) => {
      const image = new Image();
      image.src = source;
      trackImage(image);
    });
    heroImages.forEach((image) => {
      if (image) trackImage(image);
      else completeTask();
    });

    void document.fonts.ready.then(completeTask, completeTask);

    return () => {
      settled = true;
      window.cancelAnimationFrame(riseFrame);
      clearTimers();
      root.classList.remove("site-loading");
      delete root.dataset.loaderActive;
    };
  }, [beginExit]);

  useEffect(() => {
    const counter = { value: displayedProgressRef.current };
    const tween = gsap.to(counter, {
      value: progress,
      duration: 0.55,
      ease: "power2.out",
      onUpdate: () => {
        displayedProgressRef.current = counter.value;
        setDisplayedProgress(Math.round(counter.value));
      },
    });
    return () => {
      tween.kill();
    };
  }, [progress]);

  const skip = () => finishExit();

  if (!visible) return null;

  return (
    <>
      <div
        className={`loading-screen${moonRisen ? " is-risen" : ""}${exiting ? " is-exiting" : ""}`}
        role="status"
        aria-live="polite"
        aria-label={`Loading the archive ${displayedProgress}%`}
      >
        <div className="loading-moon-wrap" aria-hidden="true">
          <div className="loading-moon-stage">
            <img className="loading-moon" src="/ui/moon.png" alt="" />
          </div>
        </div>
        <span className="loading-kanji" aria-hidden="true" lang="ja">鬼滅の刃</span>
        <div className="loading-content font-[family-name:var(--font-mincho)]">
          <div className="loading-track" aria-hidden="true">
            <span style={{ width: `${displayedProgress}%` }} />
          </div>
          <div className="loading-reading">
            <strong>{String(displayedProgress).padStart(2, "0")}%</strong>
            <span>Now Loading</span>
          </div>
          <button className="loading-skip" type="button" onClick={skip}>
            Skip
          </button>
        </div>
        <div className="loading-hanko"><HankoSeal label="滅" /></div>
      </div>
    </>
  );
}
