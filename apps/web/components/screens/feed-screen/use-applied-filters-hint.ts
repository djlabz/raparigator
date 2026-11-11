"use client";

import { useEffect, useRef, useState } from "react";

const APPLIED_HINT_VISIBLE_MS = 1800;

export function useAppliedFiltersHint(fingerprint: string, active: boolean): boolean {
  const [showAppliedHint, setShowAppliedHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);
  const fingerprintRef = useRef("");

  useEffect(() => {
    if (!active) {
      fingerprintRef.current = fingerprint;
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      const hideId = window.setTimeout(() => {
        setShowAppliedHint(false);
      }, 0);
      return () => {
        window.clearTimeout(hideId);
      };
    }

    if (!fingerprintRef.current) {
      fingerprintRef.current = fingerprint;
      return;
    }

    if (fingerprintRef.current === fingerprint) {
      return;
    }

    fingerprintRef.current = fingerprint;

    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current);
    }

    const showId = window.setTimeout(() => {
      setShowAppliedHint(true);
      hintTimerRef.current = window.setTimeout(() => {
        setShowAppliedHint(false);
        hintTimerRef.current = null;
      }, APPLIED_HINT_VISIBLE_MS);
    }, 0);

    return () => {
      window.clearTimeout(showId);
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, [active, fingerprint]);

  return showAppliedHint;
}
