"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
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
          className="menu-trigger"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
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
            priority
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

      <div id="mobile-navigation" className={`mobile-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-links">
          {links.map((link) => (
            <a href={link.href} key={link.key} tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>
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
