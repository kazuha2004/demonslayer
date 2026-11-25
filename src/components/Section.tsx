"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BACKGROUND_SWITCH_POINT,
  CONTENT_DRIFT_DISTANCE,
  useSectionBackdrop,
} from "@/components/SectionBackdrop";

gsap.registerPlugin(ScrollTrigger);

type SectionProps = {
  id: string;
  first?: boolean;
  last?: boolean;
  allowVerticalMovement?: boolean;
  entryDirection?: "vertical" | "left";
  labelledBy?: string;
  children: ReactNode;
};

export default function Section({
  id,
  first = false,
  last = false,
  allowVerticalMovement = true,
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
    const context = gsap.context(() => {
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
            ...(entryDirection === "left"
              ? { x: -CONTENT_DRIFT_DISTANCE }
              : allowVerticalMovement
                ? { y: CONTENT_DRIFT_DISTANCE }
                : {}),
          },
          {
            autoAlpha: 1,
            ease: "none",
            ...(entryDirection === "left"
              ? { x: 0 }
              : allowVerticalMovement
                ? { y: 0 }
                : {}),
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top center",
              scrub: 1,
            },
          },
        );
      }

      if (!last) {
        gsap.fromTo(
          content,
          {
            autoAlpha: 1,
            ...(allowVerticalMovement ? { y: 0 } : {}),
          },
          {
            autoAlpha: 0,
            ease: "none",
            ...(allowVerticalMovement ? { y: -CONTENT_DRIFT_DISTANCE } : {}),
            scrollTrigger: {
              trigger: section,
              start: "bottom center",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      }
    }, section);

    return () => context.revert();
  }, [activateBackground, allowVerticalMovement, entryDirection, first, id, last, registerSection]);

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
