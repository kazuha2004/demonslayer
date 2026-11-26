"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export const BACKGROUND_FADE_DURATION = 1.2;
export const MOBILE_BACKGROUND_FADE_DURATION = 0.8;
export const MOBILE_BACKGROUND_SCALE = 1.03;
export const MOBILE_IMAGE_MAX_WIDTH = 1200;
export const BACKGROUND_SWITCH_POINT = "top center";
export const CONTENT_DRIFT_DISTANCE = 70;
export const MOBILE_CONTENT_DRIFT_DISTANCE = 30;

type SectionBackdropContextValue = {
  registerSection: (id: string) => void;
  activateBackground: (id: string) => void;
};

const SectionBackdropContext = createContext<SectionBackdropContextValue | null>(null);

export function useSectionBackdrop() {
  const context = useContext(SectionBackdropContext);
  if (!context) throw new Error("Section must be rendered inside SectionBackdrop.");
  return context;
}

export default function SectionBackdrop({ children }: { children: ReactNode }) {
  const [sectionIds, setSectionIds] = useState<string[]>(["hero"]);
  const backdropRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef("hero");
  const pendingIdRef = useRef<string | null>(null);

  const registerSection = useCallback((id: string) => {
    setSectionIds((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  const activateBackground = useCallback((id: string) => {
    const images = Array.from(
      backdropRef.current?.querySelectorAll<HTMLImageElement>(".section-backdrop-image") ?? [],
    );
    const target = images.find((image) => image.dataset.sectionBackground === id);
    if (!target || !target.complete || target.naturalWidth === 0) {
      pendingIdRef.current = id;
      return;
    }

    pendingIdRef.current = null;
    if (activeIdRef.current === id) return;
    activeIdRef.current = id;
    gsap.killTweensOf(images);

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const inactiveScale = isMobile ? MOBILE_BACKGROUND_SCALE : 1.06;
    const fadeDuration = isMobile ? MOBILE_BACKGROUND_FADE_DURATION : BACKGROUND_FADE_DURATION;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(images, { opacity: 0, scale: 1 });
      gsap.set(target, { opacity: 1 });
      return;
    }

    images.forEach((image) => {
      const active = image === target;
      gsap.to(image, {
        opacity: active ? 1 : 0,
        scale: active ? 1 : inactiveScale,
        duration: fadeDuration,
        ease: "power2.inOut",
        overwrite: isMobile ? "auto" : true,
      });
    });
  }, []);

  useEffect(() => {
    if (pendingIdRef.current) activateBackground(pendingIdRef.current);
  }, [activateBackground, sectionIds]);

  useEffect(() => {
    let active = true;
    const refresh = () => ScrollTrigger.refresh();
    const pendingImages = Array.from(document.images).filter((image) => !image.complete);
    const refreshWhenImagesReady = () => {
      if (Array.from(document.images).every((image) => image.complete)) refresh();
    };

    pendingImages.forEach((image) => {
      image.addEventListener("load", refreshWhenImagesReady);
      image.addEventListener("error", refreshWhenImagesReady);
    });
    if (pendingImages.length === 0) refresh();

    const onWindowLoad = () => refresh();
    const onOrientationChange = () => {
      window.setTimeout(refresh, 180);
    };
    window.addEventListener("load", onWindowLoad);
    window.addEventListener("orientationchange", onOrientationChange);
    void document.fonts.ready.then(() => {
      if (active) refresh();
    });

    return () => {
      active = false;
      pendingImages.forEach((image) => {
        image.removeEventListener("load", refreshWhenImagesReady);
        image.removeEventListener("error", refreshWhenImagesReady);
      });
      window.removeEventListener("load", onWindowLoad);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  return (
    <SectionBackdropContext.Provider value={{ registerSection, activateBackground }}>
      <div className="page-backdrop" ref={backdropRef} aria-hidden="true">
        {sectionIds.map((id) => (
          <Image
            className="section-backdrop-image"
            data-section-background={id}
            key={id}
            src={`/backgrounds/${id}-bg.png`}
            alt=""
            fill
            sizes="100vw"
            priority={id === "hero"}
            style={{
              opacity: activeIdRef.current === id ? 1 : 0,
              transform: `scale(${activeIdRef.current === id ? 1 : 1.06})`,
            }}
            onLoad={() => {
              if (pendingIdRef.current === id) activateBackground(id);
              ScrollTrigger.refresh();
            }}
          />
        ))}
        <div className="page-backdrop-vignette" />
      </div>
      {children}
    </SectionBackdropContext.Provider>
  );
}
