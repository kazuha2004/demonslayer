"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || !cursorRef.current) return;

    const cursor = cursorRef.current;
    const moveX = gsap.quickTo(cursor, "x", { duration: 0.32, ease: "power3" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.32, ease: "power3" });
    const show = () => cursor.classList.add("is-visible");
    const hide = () => cursor.classList.remove("is-visible");
    const move = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      show();
    };
    const hover = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a, button, [data-cursor]")) {
        cursor.classList.add("is-active");
      } else {
        cursor.classList.remove("is-active");
      }
    };

    document.body.classList.add("cursor-ready");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", hover);
    window.addEventListener("pointerout", hover);
    window.addEventListener("pointerleave", hide);

    return () => {
      document.body.classList.remove("cursor-ready");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", hover);
      window.removeEventListener("pointerout", hover);
      window.removeEventListener("pointerleave", hide);
    };
  }, []);

  return <div ref={cursorRef} className="cursor-ring" aria-hidden="true" />;
}
