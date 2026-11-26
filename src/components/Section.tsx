"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BACKGROUND_SWITCH_POINT,
  CONTENT_DRIFT_DISTANCE,
  MOBILE_CONTENT_DRIFT_DISTANCE,
  useSectionBackdrop,
} from "@/components/SectionBackdrop";

gsap.registerPlugin(ScrollTrigger);

type SectionProps = {
  id: string;
  first?: boolean;
  last?: boolean;
  allowVerticalMovement?: boolean;
  hasSwipeArea?: boolean;
  entryDirection?: "vertical" | "left";
  labelledBy?: string;
  children: ReactNode;
};

export default function Section({
  id,
  first = false,
  last = false,
  allowVerticalMovement = true,
  hasSwipeArea = false,
  entryDirection = "vertical",
  labelledBy,
  children,
}: SectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { registerSection, activateBackground } = useSectionBackdrop();

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    registerSection(id);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        isMobile: "(max-width: 767px)",
      },
      (context) => {
        const { isMobile } = context.conditions as { isDesktop: boolean; isMobile: boolean };
        const driftDistance = isMobile ? MOBILE_CONTENT_DRIFT_DISTANCE : CONTENT_DRIFT_DISTANCE;
        const canMoveVertically = allowVerticalMovement && !(isMobile && hasSwipeArea);
        const enterStart = isMobile ? "top 92%" : "top bottom";
        const enterEnd = isMobile ? "top 38%" : "top center";
        const exitStart = isMobile ? "bottom 62%" : "bottom center";
        const exitEnd = isMobile ? "bottom 8%" : "bottom top";

        const setWillChange = (active: boolean) => {
          if (!isMobile) return;
          content.style.willChange = active ? (canMoveVertically ? "opacity, transform" : "opacity") : "auto";
        };

        const backgroundTrigger = ScrollTrigger.create({
          trigger: section,
          start: BACKGROUND_SWITCH_POINT,
          end: "bottom center",
          onEnter: () => {
            activateBackground(id);
            if (reducedMotion) gsap.set(content, { autoAlpha: 1 });
          },
          onLeave: () => {
            if (reducedMotion && !last) gsap.set(content, { autoAlpha: 0 });
          },
          onEnterBack: () => {
            activateBackground(id);
            if (reducedMotion) gsap.set(content, { autoAlpha: 1 });
          },
          onLeaveBack: () => {
            if (reducedMotion && !first) gsap.set(content, { autoAlpha: 0 });
          },
        });
        if (backgroundTrigger.isActive) activateBackground(id);

        if (reducedMotion) {
          gsap.set(content, { autoAlpha: first ? 1 : 0 });
          if (backgroundTrigger.isActive) gsap.set(content, { autoAlpha: 1 });
          return;
        }

        if (!first) {
          gsap.fromTo(
            content,
            {
              autoAlpha: 0,
              ...(entryDirection === "left" && !isMobile
                ? { x: -driftDistance }
                : canMoveVertically
                  ? { y: driftDistance }
                  : {}),
            },
            {
              autoAlpha: 1,
              ease: "none",
              ...(entryDirection === "left" && !isMobile
                ? { x: 0 }
                : canMoveVertically
                  ? { y: 0 }
                  : {}),
              scrollTrigger: {
                trigger: section,
                start: enterStart,
                end: enterEnd,
                scrub: 1,
                onToggle: ({ isActive }) => setWillChange(isActive),
              },
            },
          );
        }

        if (!last) {
          gsap.fromTo(
            content,
            {
              autoAlpha: 1,
              ...(canMoveVertically ? { y: 0 } : {}),
            },
            {
              autoAlpha: 0,
              ease: "none",
              ...(canMoveVertically ? { y: -driftDistance } : {}),
              scrollTrigger: {
                trigger: section,
                start: exitStart,
                end: exitEnd,
                scrub: 1,
                onToggle: ({ isActive }) => setWillChange(isActive),
              },
            },
          );
        }
      },
    );

    return () => {
      content.style.willChange = "";
      mm.revert();
    };
  }, [activateBackground, allowVerticalMovement, entryDirection, first, hasSwipeArea, id, last, registerSection]);

  return (
    <section
      className="page-section"
      id={id}
      ref={sectionRef}
      aria-labelledby={labelledBy}
    >
      <div
        className={`section-content${allowVerticalMovement ? "" : " section-content--static"}`}
        ref={contentRef}
      >
        {children}
      </div>
    </section>
  );
}
