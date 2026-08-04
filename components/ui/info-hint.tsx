"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoHintProps = {
  id: string;
  label: string;
  children: React.ReactNode;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  className?: string;
  align?: "start" | "center" | "end";
};

export function InfoHint({
  id,
  label,
  children,
  openId,
  onOpenChange,
  className,
  align = "start",
}: InfoHintProps) {
  const open = openId === id;
  const panelDomId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(null);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOpenChange(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        data-testid={`info-hint-trigger-${id}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelDomId}
        onClick={() => onOpenChange(open ? null : id)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelDomId}
            role="dialog"
            data-testid={`info-hint-panel-${id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 2 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
            className={cn(
              "absolute z-40 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs leading-relaxed text-zinc-600 shadow-lg",
              align === "end" && "right-0",
              align === "center" && "left-1/2 -translate-x-1/2",
              align === "start" && "left-0",
            )}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
