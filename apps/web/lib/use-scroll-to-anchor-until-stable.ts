import { useEffect } from "react";

const SCROLL_SETTLE_TIMEOUT_MS = 2000;
const SCROLL_STABLE_MS = 250;

export function useScrollToAnchorUntilStable(returnScroll: number | null, anchorId: string | null) {
  useEffect(() => {
    if (returnScroll === null && !anchorId) {
      return;
    }

    let frame = 0;
    let cancelled = false;
    let settledAt: number | null = null;
    const deadline = performance.now() + SCROLL_SETTLE_TIMEOUT_MS;

    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };

    const resolveTarget = () => {
      if (returnScroll !== null) {
        return returnScroll;
      }
      const element = anchorId ? document.getElementById(anchorId) : null;
      if (!element) {
        return null;
      }
      const scrollMargin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      return element.getBoundingClientRect().top + window.scrollY - scrollMargin;
    };

    const step = () => {
      if (cancelled) {
        return;
      }

      const desired = resolveTarget();
      const now = performance.now();

      if (desired === null) {
        if (now > deadline) {
          cancel();
          return;
        }
        frame = requestAnimationFrame(step);
        return;
      }

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.max(0, Math.min(desired, maxScroll));
      window.scrollTo({ top: target, behavior: "instant" });

      const settled = Math.abs(window.scrollY - target) <= 1;
      settledAt = settled ? (settledAt ?? now) : null;

      if ((settledAt !== null && now - settledAt > SCROLL_STABLE_MS) || now > deadline) {
        cancel();
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);

    return () => {
      cancel();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [anchorId, returnScroll]);
}
