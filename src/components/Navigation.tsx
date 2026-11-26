"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import Checker from "@/components/Checker";
import styles from "./Navigation.module.css";

const links = [
  { key: "#world", href: "#world", label: "World", jp: "世界", observedIds: ["world", "hero"] },
  { key: "#characters", href: "#characters", label: "Characters", jp: "剣士", observedIds: ["characters"] },
  { key: "#blade", href: "#blade", label: "Blade", jp: "日輪刀", observedIds: ["blade"] },
  { key: "#demons", href: "#demons", label: "Demons", jp: "鬼", observedIds: ["demons"] },
];

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menuOpen);
    document.body.classList.toggle("menu-open", menuOpen);
    if (menuOpen) {
      wasOpenRef.current = true;
      window.dispatchEvent(new Event("site-loader:pause"));
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      window.dispatchEvent(new Event("site-loader:resume"));
      triggerRef.current?.focus();
    }
    return () => {
      document.documentElement.classList.remove("menu-open");
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        overlay.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const sections = links
      .map((link) => ({
        link,
        section: link.observedIds
          .map((id) => document.getElementById(id))
          .find((element): element is HTMLElement => element !== null) ?? null,
      }))
      .filter((item): item is { link: (typeof links)[number]; section: HTMLElement } => item.section !== null);
    const activeSections = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeSections.add(entry.target as HTMLElement);
          else activeSections.delete(entry.target as HTMLElement);
        });
        const current = [...activeSections].sort(
          (left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top,
        )[0];
        setActiveLink(current ? sections.find(({ section }) => section === current)?.link.key ?? "" : "");
      },
      { rootMargin: "-18% 0px -65% 0px" },
    );

    sections.forEach(({ section }) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const handleMobileAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setMenuOpen(false);
    const target = document.getElementById(href.replace(/^#/, ""));
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.dispatchEvent(new CustomEvent("webmart:lenis-scroll-to", { detail: { top, smooth: true } }));
  };

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="#world" aria-label="Demon Slayer home" onClick={closeMenu}>
          <Image className="brand-logo" src="/ui/title-logo.png" alt="" width={56} height={56} priority />
        </Link>
        <span className="brand-divider" aria-hidden="true" />
        <span className="brand-japanese" lang="ja">鬼滅の刃</span>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link, index) => (
            <a
              className={`nav-link${activeLink === link.key ? " is-active" : ""}`}
              href={link.href}
              key={link.key}
              data-cursor
              aria-current={activeLink === link.key ? "location" : undefined}
            >
              <span className="nav-link-label">{link.label}</span>
              <span className="sr-only"> {link.jp} {String(index + 1).padStart(2, "0")}</span>
            </a>
          ))}
        </nav>
        <a className="search-link" href="#archive" aria-label="Search the archive" data-cursor>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m12.5 12.5 4 4" />
          </svg>
        </a>
        <button
          ref={triggerRef}
          className="menu-trigger"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{menuOpen ? "CLOSE" : "MENU"}</span>
          <span className="menu-icon" aria-hidden="true"><i /><i /></span>
        </button>
      </header>

      <div className={styles.branches} aria-hidden="true">
        <div className={`${styles.branchFrame} ${styles.branchFrameLeft}`}>
          <Image
            className={styles.branchArtwork}
            src="/backgrounds/cherry.png"
            alt=""
            width={2172}
            height={724}
            sizes="(max-width: 700px) 90vw, 45vw"
          />
        </div>
        <div className={`${styles.branchFrame} ${styles.branchFrameRight}`}>
          <Image
            className={styles.branchArtwork}
            src="/backgrounds/cherry.png"
            alt=""
            width={2172}
            height={724}
            sizes="(max-width: 700px) 90vw, 45vw"
          />
        </div>
      </div>

      <div
        id="mobile-navigation"
        ref={overlayRef}
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <button
          ref={closeButtonRef}
          className="mobile-menu-close"
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={closeMenu}
        >
          CLOSE ×
        </button>
        <div className="mobile-menu-links">
          {links.map((link) => (
            <a
              href={link.href}
              key={link.key}
              tabIndex={menuOpen ? 0 : -1}
              onClick={(event) => handleMobileAnchorClick(event, link.href)}
            >
              {link.label}<span>{link.jp}</span>
            </a>
          ))}
        </div>
        <span className="mobile-menu-side" aria-hidden="true">鬼殺隊 · 記録</span>
        <Checker />
      </div>
    </>
  );
}
