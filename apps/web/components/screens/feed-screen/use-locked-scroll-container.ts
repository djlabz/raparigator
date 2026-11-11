"use client";

import { useCallback, useEffect, useRef } from "react";

const USER_SCROLL_WINDOW_MS = 180;

export function useLockedScrollContainer() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const scrollTopRef = useRef(0);
  const userScrollAllowedRef = useRef(false);
  const userScrollTimerRef = useRef(0);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return useCallback((node: HTMLDivElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node) {
      return;
    }

    const allowUserScroll = () => {
      userScrollAllowedRef.current = true;
      window.clearTimeout(userScrollTimerRef.current);
      userScrollTimerRef.current = window.setTimeout(() => {
        userScrollAllowedRef.current = false;
      }, USER_SCROLL_WINDOW_MS);
    };

    const onScroll = () => {
      if (!userScrollAllowedRef.current) {
        if (node.scrollTop !== scrollTopRef.current) {
          node.scrollTop = scrollTopRef.current;
        }
        return;
      }
      scrollTopRef.current = node.scrollTop;
    };

    node.addEventListener("wheel", allowUserScroll, { passive: true });
    node.addEventListener("touchstart", allowUserScroll, { passive: true });
    node.addEventListener("keydown", allowUserScroll);
    node.addEventListener("scroll", onScroll);

    cleanupRef.current = () => {
      window.clearTimeout(userScrollTimerRef.current);
      node.removeEventListener("wheel", allowUserScroll);
      node.removeEventListener("touchstart", allowUserScroll);
      node.removeEventListener("keydown", allowUserScroll);
      node.removeEventListener("scroll", onScroll);
    };
  }, []);
}
