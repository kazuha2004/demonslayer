"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Footer.module.css";

gsap.registerPlugin(ScrollTrigger);

function FlowerDivider() {
  return (
    <svg className={styles.flower} viewBox="0 0 40 40" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="20" cy="20" r="3" />
        <path d="M20 17C15 9 18 5 20 3c2 2 5 6 0 14Zm3 3c8-5 12-2 14 0-2 2-6 5-14 0Zm-3 3c5 8 2 12 0 14-2-2-5-6 0-14Zm-3-3C9 25 5 22 3 20c2-2 6-5 14 0Z" />
        <path d="M20 17C15 14 13 10 13 7m10 13c3-5 7-7 10-7m-13 10c5 3 7 7 7 10m-10-10c-3 5-7 7-10 7" />
      </g>
    </svg>
  );
}

function SocialIcon({ name }: { name: "YouTube" | "X" | "Instagram" | "Discord" }) {
  if (name === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    );
  }
  if (name === "X") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.7 5.6 22H2.4l7.3-8.4L1.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
      </svg>
    );
  }
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.7" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19.7 5.1A18.8 18.8 0 0 0 15 3.7l-.6 1.2a17 17 0 0 0-4.8 0L9 3.7a18.7 18.7 0 0 0-4.7 1.4C1.3 9.5.5 13.7.9 17.8a19 19 0 0 0 5.8 2.9l1.2-2a12 12 0 0 1-1.9-.9l.5-.4a13.6 13.6 0 0 0 11 0l.5.4-1.9.9 1.2 2a19 19 0 0 0 5.8-2.9c.5-4.8-.8-8.9-3.4-12.7ZM8.7 14.8c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  );
}

export default function Footer() {
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const dawnRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
    observer.observe(footer);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const backdropSelector = '.section-backdrop-image[data-section-background="footer"]';
    let context: ReturnType<typeof gsap.context> | undefined;
    let viewportMode = "";

    const setupAnimation = () => {
      const compactViewport = window.matchMedia(
        "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
      ).matches;
      const compactLandscape = window.matchMedia(
        "(max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
      ).matches;
      const nextViewportMode = `${compactViewport}:${compactLandscape}`;
      if (nextViewportMode === viewportMode) return;
      viewportMode = nextViewportMode;
      context?.revert();
      const backdrop = document.querySelector<HTMLImageElement>(backdropSelector);
      if (backdrop) {
        backdrop.style.translate = "";
        backdrop.style.scale = "";
        backdrop.style.objectPosition = "";
      }

      const backdropStartY = compactLandscape ? -56 : -60;
      const backdropEndY = compactLandscape ? -118 : -122;
      const dawnColor = compactViewport ? "#ff3b3b" : "#c1121f";
      context = gsap.context(() => {
        const paintBackdrop = (motion: { y: number; scale: number }) => {
          const backdrop = document.querySelector<HTMLImageElement>(backdropSelector);
          if (!backdrop) return;
          backdrop.style.translate = `0px ${motion.y}px`;
          backdrop.style.scale = `${motion.scale}`;
          backdrop.style.objectPosition = compactViewport ? "center bottom" : "";
        };

        if (reducedMotion) {
          paintBackdrop({ y: compactViewport ? backdropEndY : 0, scale: 1 });
          if (dawnRef.current) gsap.set(dawnRef.current, { color: dawnColor });
          return;
        }

        const motion = { y: compactViewport ? backdropStartY : 62, scale: 1.12 };
        paintBackdrop(motion);
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "top 42%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        timeline.to(motion, {
          y: compactViewport ? backdropEndY : 0,
          scale: 1,
          duration: 1,
          ease: "none",
          onUpdate: () => paintBackdrop(motion),
        }, 0);
        if (dawnRef.current) {
          timeline.to(dawnRef.current, { color: dawnColor, duration: 1, ease: "none" }, 0);
        }

        const reveal = gsap.timeline({
          scrollTrigger: {
            trigger: footer,
            start: "top 82%",
            once: true,
          },
        });
        reveal
          .fromTo(
            `.${styles.headline} h2`,
            { autoAlpha: 0, scale: 0.96 },
            { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out", clearProps: "transform" },
            0,
          )
          .fromTo(
            `.${styles.divider}`,
            { autoAlpha: 0, scaleX: 0.65 },
            { autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power2.out", clearProps: "transform" },
            0.1,
          )
          .fromTo(
            `.${styles.newsletter}`,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "transform" },
            0.18,
          )
          .fromTo(
            `.${styles.bottomBar}`,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5, ease: "power2.out" },
            0.28,
          );
      }, footer);
      ScrollTrigger.refresh();
    };
    setupAnimation();
    window.addEventListener("resize", setupAnimation);

    return () => {
      window.removeEventListener("resize", setupAnimation);
      observer.disconnect();
      context?.revert();
      const backdrop = document.querySelector<HTMLImageElement>('.section-backdrop-image[data-section-background="footer"]');
      if (backdrop) {
        backdrop.style.translate = "";
        backdrop.style.scale = "";
        backdrop.style.objectPosition = "";
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setSubmitted(true);
  };

  return (
    <footer ref={footerRef} className={styles.footer} data-visible={visible ? "true" : "false"}>
      <div className={styles.backgroundScrim} aria-hidden="true" />

      <div className={styles.headline}>
        <h2 id="footer-title">
          The night ends <br className={styles.mobileBreak} />
          at <span ref={dawnRef}>dawn</span>
        </h2>
        <div className={styles.divider} aria-hidden="true">
          <span />
          <FlowerDivider />
          <span />
        </div>
      </div>

      <section className={styles.newsletter} id="footer-newsletter" aria-label="Newsletter signup">
        <svg className={styles.pattern} viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="footer-asanoha-pattern" width="70" height="70" patternUnits="userSpaceOnUse">
              <path d="M35 0 35 35 5 17.5 5 52.5 35 70 65 52.5 65 17.5 35 0Zm0 35 30-17.5M35 35l30 17.5M35 35v35M35 35 5 52.5M35 35 5 17.5" />
              <path d="m5 17.5 30 17.5 30-17.5M5 52.5 35 35l30 17.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-asanoha-pattern)" />
        </svg>
        <form className={styles.newsletterInner} onSubmit={handleSubmit}>
          <label className={styles.newsletterLabel} htmlFor="footer-email">
            <span>Stay</span>
            <span>Connected</span>
          </label>
          <input
            id="footer-email"
            name="email"
            type="email"
            placeholder={submitted ? "You’re on the list." : "Enter your email address..."}
            autoComplete="email"
            required
            disabled={submitted}
            aria-label="Email address"
            onFocus={(event) => {
              if (!window.matchMedia(
                "(max-width: 767px), (max-width: 900px) and (max-height: 500px) and (orientation: landscape)",
              ).matches) return;
              const input = event.currentTarget;
              window.setTimeout(() => input.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
            }}
          />
          <button type="submit" disabled={submitted}>
            {submitted ? "Subscribed ✓" : "Subscribe"}
            {!submitted && <span aria-hidden="true">→</span>}
          </button>
          <span className={styles.success} role="status" aria-live="polite">
            {submitted ? "Thank you for subscribing." : ""}
          </span>
        </form>
      </section>

      <div className={styles.bottomBar}>
        <a className={styles.wordmark} href="#hero" aria-label="Demon Slayer, back to top">
          <strong>DEMON SLAYER</strong>
          <span>KIMETSU NO YAIBA</span>
        </a>
        <nav className={styles.footerLinks} aria-label="Footer">
          <a href="#world">About</a>
          <a href="#footer-newsletter">Contact</a>
          <a href="#footer">Privacy Policy</a>
          <a href="#footer">Terms of Service</a>
        </nav>
        <div className={styles.socials} aria-label="Social media">
          {(["YouTube", "X", "Instagram", "Discord"] as const).map((name) => (
            <a key={name} href={`https://${name === "X" ? "x" : name.toLowerCase()}.com`} target="_blank" rel="noreferrer" aria-label={name}>
              <SocialIcon name={name} />
            </a>
          ))}
        </div>
        <div className={styles.forever}>FOREVER<span aria-hidden="true" /></div>
      </div>
    </footer>
  );
}
