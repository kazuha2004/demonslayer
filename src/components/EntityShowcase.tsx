"use client";

import dynamic from "next/dynamic";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { demonShowcaseTheme, type Character, type Demon } from "@/data/content";
import HankoSeal from "@/components/HankoSeal";
import CharacterMoteOverlay from "@/components/CharacterMoteOverlay";
import styles from "./DemonsExperience.module.css";

const CharacterStage = dynamic(() => import("@/components/CharacterStage"), {
  ssr: false,
  loading: () => <div className="character-stage-loading" aria-hidden="true" />,
});
const DemonDepthStage = dynamic(
  () => import("@/components/CharacterStage").then((module) => module.DemonDepthStage),
  { ssr: false, loading: () => null },
);
gsap.registerPlugin(ScrollTrigger);

type Entity = Character | Demon;
type Fact = { label: string; value: string; kind: "breath" | "weapon" | "rank" };
type DisplayEntity = {
  id: string;
  name: string;
  surname: string;
  kanji: string;
  title?: string;
  facts: Fact[];
  bio: string;
  accentColor: string;
  motePalette: string[];
  pattern?: string;
  image: string;
  depthImage: string;
  faceX?: number;
  faceY?: number;
  zoom?: number;
};

function isDemon(entity: Entity): entity is Demon {
  return "art" in entity;
}

function normalize(entity: Entity): DisplayEntity {
  if (isDemon(entity)) {
    return {
      ...entity,
      facts: [
        { label: "Rank", value: entity.rank, kind: "rank" },
        { label: "Art", value: entity.art, kind: "breath" },
        { label: "Weakness", value: entity.weakness, kind: "weapon" },
      ],
    };
  }
  return {
    ...entity,
    facts: [
      { label: "Breathing", value: entity.breathing, kind: "breath" },
      { label: "Weapon", value: entity.weapon, kind: "weapon" },
      { label: "Rank", value: entity.rank, kind: "rank" },
    ],
  };
}

function PatternMark({ pattern, className = "" }: { pattern: string; className?: string }) {
  return (
    <svg className={`character-pattern character-pattern--${pattern} ${className}`} viewBox="0 0 220 220" aria-hidden="true">
      {pattern === "seigaiha" && Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) => (
          <path key={`${row}-${col}`} d="M0 24a24 24 0 0 1 48 0M6 24a18 18 0 0 1 36 0M12 24a12 12 0 0 1 24 0"
            transform={`translate(${col * 52 - 24} ${row * 42})`} />
        )),
      )}
      {pattern === "triangles" && Array.from({ length: 12 }, (_, i) =>
        <path key={i} d="M0 0 24 36 48 0" transform={`translate(${(i % 3) * 70 - 10} ${Math.floor(i / 3) * 52 - 10})`} />,
      )}
      {pattern === "claws" && [0, 1, 2, 3].map((i) =>
        <path key={i} d="M20 0C40 52 42 100 20 154" transform={`translate(${i * 48 - 30} 24) rotate(${i % 2 ? 18 : -18} 20 77)`} />,
      )}
      {pattern === "butterflies" && Array.from({ length: 6 }, (_, i) =>
        <g key={i} transform={`translate(${(i % 3) * 72 + 12} ${Math.floor(i / 3) * 100 + 26})`}>
          <path d="M24 24C3 -2 0 24 22 31M26 24C47 -2 50 24 28 31M25 25v22" />
        </g>,
      )}
    </svg>
  );
}

function RowIcon({ kind }: { kind: Fact["kind"] }) {
  return <span className="character-row-icon" aria-hidden="true">{kind === "breath" ? "息" : kind === "weapon" ? "刀" : "花"}</span>;
}

function DemonDecorations({ mobile, visible }: { mobile: boolean; visible: boolean }) {
  const petals = mobile ? demonShowcaseTheme.petalsMobile : demonShowcaseTheme.petalsDesktop;
  return (
    <div className={styles.demonDecorations} data-active={visible ? "true" : "false"} aria-hidden="true">
      <div className={styles.demonScrim} />
      <div className={styles.demonGrid} />
      <div className={`${styles.demonCloud} ${styles.demonCloudLeft}`}><Image src="/ui/cloud-gold.png" alt="" fill sizes="30vw" /></div>
      <div className={`${styles.demonCloud} ${styles.demonCloudRight}`}><Image src="/ui/cloud-gold.png" alt="" fill sizes="30vw" /></div>
      <div className={styles.demonCheckerLeft} />
      <div className={styles.demonCheckerRight} />
      <div className={styles.demonLilies}>
        {Array.from({ length: petals }, (_, index) => (
          <i key={index} style={{
            left: `${(index * 7.13 + 3) % 100}%`,
            animationDelay: `${-(index * 2.71) % 20}s`,
            animationDuration: `${18 + (index % 5) * 2.1}s`,
            "--lily-rotation": `${(index % 2 ? 1 : -1) * (18 + index * 7)}deg`,
          } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

export default function EntityShowcase({ entities, theme }: {
  entities: Entity[];
  theme: "characters" | "demons";
}) {
  const demonTheme = theme === "demons";
  const displayEntities = useMemo(() => entities.map(normalize), [entities]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previous, setPrevious] = useState<DisplayEntity | null>(null);
  const [displacement, setDisplacement] = useState(false);
  const [slash, setSlash] = useState(false);
  const [slashNonce, setSlashNonce] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [depthFailed, setDepthFailed] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [glitchNonce, setGlitchNonce] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const outgoingArtRef = useRef<HTMLDivElement>(null);
  const activeArtRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(0);
  const navigationQueueRef = useRef<number[]>([]);
  const transitionRunningRef = useRef(false);
  const transitionPlanRef = useRef<{ index: number; token: number } | null>(null);
  const transitionTokenRef = useRef(0);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrollIndexRef = useRef(0);
  const scrollStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainQueueRef = useRef<() => void>(() => {});
  const slashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const entity = displayEntities[activeIndex];
  const originalEntity = entities[activeIndex];
  const particleKind = entity.id === "tanjiro" || entity.id === "giyu" ? "water" : entity.id;

  const syncPinnedScroll = useCallback((index: number) => {
    const trigger = triggerRef.current;
    if (!trigger?.isActive) return;
    const progress = (index + 0.5) / displayEntities.length;
    const top = trigger.start + (trigger.end - trigger.start) * progress;
    scrollIndexRef.current = index;
    window.dispatchEvent(new CustomEvent("webmart:lenis-scroll-to", { detail: top }));
  }, [displayEntities.length]);

  const drainNavigationQueue = useCallback(() => {
    if (transitionRunningRef.current) return;
    const queue = navigationQueueRef.current;
    let next = queue.shift();
    while (next !== undefined && next === activeRef.current) next = queue.shift();
    if (next === undefined) return;

    const outgoing = displayEntities[activeRef.current];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const token = transitionTokenRef.current + 1;
    transitionTokenRef.current = token;

    transitionTimelineRef.current?.kill();
    transitionTimelineRef.current = null;
    gsap.killTweensOf([outgoingArtRef.current, activeArtRef.current].filter(Boolean));
    if (outgoingArtRef.current) {
      gsap.set(outgoingArtRef.current, {
        autoAlpha: 0,
        display: "none",
        visibility: "hidden",
        x: 0,
        y: 0,
        scale: 1,
        clearProps: "transform,filter",
      });
    }
    if (activeArtRef.current) {
      gsap.set(activeArtRef.current, {
        autoAlpha: 1,
        display: "block",
        visibility: "visible",
        x: 0,
        y: 0,
        scale: 1,
        clearProps: "transform,filter",
      });
    }

    transitionRunningRef.current = true;
    transitionPlanRef.current = { index: next, token };
    activeRef.current = next;
    setPrevious(reducedMotion ? null : outgoing);
    setActiveIndex(next);
    setDepthFailed(false);
    setSlash(!reducedMotion);
    setGlitch(demonTheme && !reducedMotion);
    if (slashTimer.current) clearTimeout(slashTimer.current);
    if (glitchTimer.current) clearTimeout(glitchTimer.current);
    if (!reducedMotion) {
      setSlashNonce((nonce) => nonce + 1);
      slashTimer.current = setTimeout(() => setSlash(false), 420);
      if (demonTheme) {
        setGlitchNonce((nonce) => nonce + 1);
        glitchTimer.current = setTimeout(() => setGlitch(false), demonShowcaseTheme.glitchDuration);
      }
    }
  }, [demonTheme, displayEntities, syncPinnedScroll]);

  drainQueueRef.current = drainNavigationQueue;

  const navigateTo = useCallback((index: number, syncScroll = true, source: "control" | "scroll" = "control") => {
    if (source === "control" && scrollStepTimerRef.current) {
      clearTimeout(scrollStepTimerRef.current);
      scrollStepTimerRef.current = null;
    }
    const next = (index + displayEntities.length) % displayEntities.length;
    if (syncScroll) syncPinnedScroll(next);
    const queue = navigationQueueRef.current;
    const tail = queue.length ? queue[queue.length - 1] : activeRef.current;
    if (next === tail) {
      return;
    }
    queue.push(next);
    drainQueueRef.current();
  }, [displayEntities.length, syncPinnedScroll]);

  const navigateBy = useCallback((delta: number) => {
    const queue = navigationQueueRef.current;
    const tail = queue.length ? queue[queue.length - 1] : activeRef.current;
    navigateTo(tail + delta);
  }, [navigateTo]);

  useLayoutEffect(() => {
    const plan = transitionPlanRef.current;
    if (!plan || plan.index !== activeIndex) return;

    const { token } = plan;
    const outgoing = outgoingArtRef.current;
    const incoming = activeArtRef.current;
    const bio = bioRef.current;
    const bioWords = bio ? Array.from(bio.querySelectorAll(".character-bio-word")) : [];
    let timeline: gsap.core.Timeline | null = null;

    const finish = () => {
      if (token !== transitionTokenRef.current) return;
      if (outgoing) {
        gsap.set(outgoing, {
          autoAlpha: 0,
          display: "none",
          visibility: "hidden",
          x: 0,
          y: 0,
          scale: 1,
          clearProps: "transform,filter",
        });
      }
      if (incoming) {
        gsap.set(incoming, {
          autoAlpha: 1,
          display: "block",
          visibility: "visible",
          x: 0,
          y: 0,
          scale: 1,
          clearProps: "transform,filter",
        });
      }
      if (bio) gsap.set(bio, { autoAlpha: 1, y: 0 });
      if (bioWords.length) gsap.set(bioWords, { autoAlpha: 1, y: 0 });
      if (timeline && transitionTimelineRef.current === timeline) transitionTimelineRef.current = null;
      transitionPlanRef.current = null;
      transitionRunningRef.current = false;
      setPrevious(null);
      drainQueueRef.current();
    };

    gsap.killTweensOf([outgoing, incoming, bio, ...bioWords].filter(Boolean));
    if (!incoming || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    timeline = gsap.timeline({ onComplete: finish, onInterrupt: finish });
    transitionTimelineRef.current = timeline;
    if (outgoing) {
      timeline.fromTo(outgoing,
        { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "none" },
        { autoAlpha: 0, x: -12, y: 0, scale: 0.99, filter: "blur(1px)", duration: 0.34, ease: "power2.inOut", overwrite: "auto" },
        0,
      );
    }
    timeline.fromTo(incoming,
      { autoAlpha: 0, x: 12, y: 0, scale: 0.99, filter: "blur(1px)" },
      { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "none", duration: 0.34, ease: "power2.out", overwrite: "auto" },
      0,
    );
    if (bio) {
      timeline.fromTo(bio,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.26, ease: "power2.out", overwrite: "auto" },
        0.04,
      );
    }
    if (bioWords.length) {
      timeline.fromTo(bioWords,
        { autoAlpha: 0, y: 4 },
        { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.006, ease: "power1.out", overwrite: "auto" },
        0.08,
      );
    }
  }, [activeIndex]);

  useEffect(() => () => {
    transitionTokenRef.current += 1;
    transitionTimelineRef.current?.kill();
    transitionTimelineRef.current = null;
    gsap.killTweensOf([outgoingArtRef.current, activeArtRef.current, bioRef.current]);
    if (scrollStepTimerRef.current) clearTimeout(scrollStepTimerRef.current);
    if (slashTimer.current) clearTimeout(slashTimer.current);
    if (glitchTimer.current) clearTimeout(glitchTimer.current);
  }, []);

  useEffect(() => {
    const section = sceneRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const trigger = ScrollTrigger.create({
      trigger: section,
      pin: stage,
      pinType: demonTheme ? "transform" : undefined,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const index = Math.min(displayEntities.length - 1, Math.floor(self.progress * displayEntities.length));
        if (index === scrollIndexRef.current) return;
        scrollIndexRef.current = index;
        if (scrollStepTimerRef.current) clearTimeout(scrollStepTimerRef.current);
        scrollStepTimerRef.current = setTimeout(() => {
          scrollStepTimerRef.current = null;
          navigateTo(index, false, "scroll");
        }, 80);
      },
    });
    triggerRef.current = trigger;
    return () => {
      if (scrollStepTimerRef.current) clearTimeout(scrollStepTimerRef.current);
      scrollStepTimerRef.current = null;
      if (triggerRef.current === trigger) triggerRef.current = null;
      trigger.kill(true);
    };
  }, [displayEntities.length, navigateTo]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      stage.classList.toggle("is-visible", entry.isIntersecting);
    }, { threshold: 0.01 });
    observer.observe(stage);
    const mobileQuery = window.matchMedia("(max-width: 700px)");
    const updateMobile = () => setMobile(mobileQuery.matches);
    updateMobile();
    mobileQuery.addEventListener("change", updateMobile);
    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", updateMobile);
      stage.classList.remove("is-visible");
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!visible) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateBy(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateBy(-1);
      } else if (!demonTheme && event.key.toLowerCase() === "m" && process.env.NODE_ENV !== "production") {
        setDisplacement((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demonTheme, navigateBy, visible]);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: TouchEvent) => {
    if (!touchStart.current) return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) navigateBy(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };
  const source = originalEntity;
  const stageStyle = {
    "--character-accent": entity.accentColor,
    ...(demonTheme ? {
      "--demon-ghost-color": demonShowcaseTheme.ghostColor,
      "--demon-ghost-opacity": `${Math.round(demonShowcaseTheme.ghostOpacity * 100)}%`,
      "--demon-grid-opacity": demonShowcaseTheme.gridOpacity,
      "--demon-checker": demonShowcaseTheme.checkerColor,
      "--demon-scrim-opacity": demonShowcaseTheme.backgroundScrimOpacity,
      "--demon-glitch-offset": `${demonShowcaseTheme.glitchOffset}px`,
      "--demon-glitch-duration": `${demonShowcaseTheme.glitchDuration}ms`,
    } : {}),
  } as CSSProperties;

  return (
    <div className={`characters-experience entity-showcase${demonTheme ? ` ${styles.demonExperience}` : ""}`}>
      <div className="characters-pinned-track" ref={sceneRef}>
        <div
          className={`characters-pinned-stage${demonTheme ? ` ${styles.demonStage}` : ""}`}
          ref={stageRef}
          data-active={visible ? "true" : "false"}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={stageStyle}
        >
          <div className="characters-stage-tint" />
          {demonTheme && <DemonDecorations mobile={mobile} visible={visible} />}
          {!demonTheme && previous?.pattern && <PatternMark key={`old-${previous.id}`} pattern={previous.pattern} className="character-pattern--previous" />}
          {!demonTheme && entity.pattern && <PatternMark key={`pattern-${entity.id}`} pattern={entity.pattern} />}
          {!demonTheme && <div className="character-paper-panel" aria-hidden="true" />}
          <p className="character-ghost-name" key={`ghost-${entity.id}`} aria-hidden="true">{entity.name.toUpperCase()}</p>
          <div className="character-art">
            {previous && (
              <div
                key={`outgoing-${previous.id}`}
                ref={outgoingArtRef}
                className="entity-art-layer entity-art-layer--outgoing"
                data-art-id={previous.id}
                aria-hidden="true"
              >
                {demonTheme && <span className={styles.demonAura} style={{ "--demon-aura-color": previous.accentColor } as CSSProperties} />}
                <img
                  className={`entity-art-snapshot${demonTheme ? ` ${styles.demonSnapshot}` : ""}`}
                  src={previous.image}
                  alt=""
                />
              </div>
            )}
            <div
              key={`active-${entity.id}`}
              ref={activeArtRef}
              className="entity-art-layer entity-art-layer--active"
              data-art-id={entity.id}
            >
              {demonTheme ? (
                <>
                  <span
                    className={styles.demonAura}
                    style={{ "--demon-aura-color": entity.accentColor } as CSSProperties}
                    aria-hidden="true"
                  />
                  <img
                    className={`${styles.demonFallback}${depthFailed ? ` ${styles.isFallback}` : ""}`}
                    src={entity.image}
                    alt=""
                    aria-hidden="true"
                  />
                  {!depthFailed && <DemonDepthStage key={entity.id} demon={source as Demon} visible={visible} onFailure={() => setDepthFailed(true)} />}
                  {glitch && (
                    <span key={glitchNonce} className={styles.demonGlitch} aria-hidden="true">
                      <img className={styles.demonGlitchRed} src={entity.image} alt="" />
                      <img className={styles.demonGlitchCyan} src={entity.image} alt="" />
                    </span>
                  )}
                </>
              ) : (
                <CharacterStage character={source as Character} displacement={displacement} />
              )}
            </div>
          </div>
          <CharacterMoteOverlay character={entity} />
          <div className="character-art-shadow" aria-hidden="true" />
          <div className="character-side-kanji" lang="ja">
            <span className="character-side-name">{entity.kanji}</span>
            <HankoSeal label="滅" />
          </div>
          {!demonTheme && <>
            <div className="character-cloud character-cloud--top" aria-hidden="true"><Image src="/ui/cloud-gold.png" alt="" fill sizes="24vw" /></div>
            <div className="character-cloud character-cloud--left" aria-hidden="true"><Image src="/ui/cloud-gold.png" alt="" fill sizes="14vw" /></div>
            <div className={`character-particles character-particles--${particleKind}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
          </>}
          <div className="character-profile" key={entity.id}>
            {entity.title && <span className={`character-profile-kicker${demonTheme ? ` ${styles.demonTitle}` : ""}`}>{entity.title}</span>}
            <h2 id={demonTheme ? "demons-title" : "characters-title"}>{entity.name}</h2>
            <div className="character-name-rule"><span>{demonTheme ? entity.title : entity.surname}</span></div>
            <div className="character-facts">
              {entity.facts.map((fact) => (
                <div key={fact.label}>
                  <RowIcon kind={fact.kind} />
                  <span className="character-fact-label">{fact.label}</span>
                  <span className="character-fact-colon">:</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
            <div className="character-bio-divider" />
            <p className="character-bio" ref={bioRef}>
              {entity.bio.split(/\s+/).map((word, index, words) => (
                <Fragment key={`${word}-${index}`}>
                  <span className="character-bio-word">{word}</span>
                  {index < words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </p>
            <div className="character-profile-seal"><HankoSeal label="滅" /></div>
          </div>
          <div className="character-navigation">
            <div className="character-arrows"><button type="button" onClick={() => navigateBy(-1)} aria-label={`Previous ${demonTheme ? "demon" : "character"}`}>←</button></div>
            <div className="character-thumbnails" aria-label={`Choose a ${demonTheme ? "demon" : "character"}`}>
              {displayEntities.map((item, index) => (
                <button type="button" key={item.id} onClick={() => navigateTo(index)}
                  className={index === activeIndex ? "is-active" : ""}
                  aria-label={`Show ${item.name}${item.surname ? ` ${item.surname}` : ""}`} aria-pressed={index === activeIndex}>
                  <img
                    src={item.image}
                    alt=""
                    style={demonTheme ? {
                      objectPosition: `${item.faceX}% ${item.faceY}%`,
                      transform: `scale(${item.zoom})`,
                      transformOrigin: `${item.faceX}% ${item.faceY}%`,
                    } : undefined}
                  />
                </button>
              ))}
            </div>
            <div className="character-arrows character-arrows--next"><button type="button" onClick={() => navigateBy(1)} aria-label={`Next ${demonTheme ? "demon" : "character"}`}>→</button></div>
            <div className="character-counter">
              <span className="character-counter-current">{String(activeIndex + 1).padStart(2, "0")}</span>
              <span className="character-counter-total">/ {String(displayEntities.length).padStart(2, "0")}</span>
            </div>
            <div className="character-progress" role="progressbar" aria-label={`${demonTheme ? "Demon" : "Character"} progress`}
              aria-valuemin={0} aria-valuemax={displayEntities.length} aria-valuenow={activeIndex + 1}>
              <b style={{ width: `${((activeIndex + 1) / displayEntities.length) * 100}%` }} />
            </div>
          </div>
          <div key={slashNonce} className={`character-slash-wipe${slash ? " is-active" : ""}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
