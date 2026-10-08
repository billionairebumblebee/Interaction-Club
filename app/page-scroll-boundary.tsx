"use client";

import { useEffect } from "react";

/** Older iPad Safari needs a touch fallback for CSS overscroll-behavior. */
export default function PageScrollBoundary() {
  useEffect(() => {
    if (CSS.supports("overscroll-behavior-y", "none")) return;
    let previousY: number | null = null;
    const start = (event: TouchEvent) => { previousY = event.touches.length === 1 ? event.touches[0].clientY : null; };
    const move = (event: TouchEvent) => {
      if (previousY === null || event.touches.length !== 1 || !document.querySelector(".ic-home")) return;
      const delta = event.touches[0].clientY - previousY;
      previousY = event.touches[0].clientY;
      if (!delta) return;
      // Preserve scrolling inside dialogs, textareas, and other scrollable panels.
      let element = event.target instanceof Element ? event.target : null;
      while (element && element !== document.body && element !== document.documentElement) {
        const style = getComputedStyle(element);
        if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1) {
          if (delta > 0 ? element.scrollTop > 0 : element.scrollTop + element.clientHeight < element.scrollHeight - 1) return;
        }
        element = element.parentElement;
      }
      const root = document.scrollingElement;
      if (!root) return;
      const atEdge = delta > 0 ? root.scrollTop <= 0 : root.scrollTop + root.clientHeight >= root.scrollHeight - 1;
      if (atEdge && event.cancelable) event.preventDefault();
    };
    const end = () => { previousY = null; };
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end, { passive: true });
    document.addEventListener("touchcancel", end, { passive: true });
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, []);
  return null;
}
