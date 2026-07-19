"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedSectionTitleVariant = "premium" | "standard";

interface FeedSectionTitleProps {
  variant: FeedSectionTitleVariant;
  size?: "md" | "sm" | "lg";
  className?: string;
  adaptiveIcon?: boolean;
}

const PREMIUM_LABEL = "Modelos Premium";
const STANDARD_LABEL = "Outras modelos";
const ICON_SLOT_PX = 26;

export function FeedSectionTitle({
  variant,
  size = "md",
  className,
  adaptiveIcon = false,
}: FeedSectionTitleProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [showIcon, setShowIcon] = useState(true);

  useLayoutEffect(() => {
    if (!adaptiveIcon) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    let frame = 0;

    const measure = () => {
      const label = root.querySelector("[data-title-label]") as HTMLElement | null;
      if (!label) {
        return;
      }

      const available = root.clientWidth;
      if (available <= 0) {
        return;
      }

      const next = label.scrollWidth + ICON_SLOT_PX <= available;
      setShowIcon((prev) => (prev === next ? prev : next));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [adaptiveIcon, variant, size]);

  const iconVisible = !adaptiveIcon || showIcon;
  const iconSize = size === "lg" ? 26 : size === "sm" ? 20 : 22;
  const premiumTextClass =
    size === "lg" ? "text-2xl md:text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  const standardTextClass =
    size === "lg" ? "text-xl md:text-2xl" : size === "sm" ? "text-xl" : "text-xl";

  if (variant === "premium") {
    return (
      <span
        ref={rootRef}
        className={cn(
          "inline-flex max-w-full min-w-0 items-center gap-1.5 select-none",
          className
        )}
      >
        {iconVisible ? (
          <Star size={iconSize} className="shrink-0 fill-[#C9A227] text-[#C9A227]" />
        ) : null}
        <span
          data-title-label
          className={cn(
            "whitespace-nowrap font-display font-semibold tracking-wide text-[#8B6914]",
            premiumTextClass
          )}
        >
          {PREMIUM_LABEL}
        </span>
      </span>
    );
  }

  return (
    <span
      ref={rootRef}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1.5 select-none",
        className
      )}
    >
      {iconVisible ? (
        <Flame size={size === "lg" ? 22 : iconSize} className="shrink-0 text-wine-800" />
      ) : null}
      <span
        data-title-label
        className={cn("whitespace-nowrap font-semibold text-wine-800", standardTextClass)}
      >
        {STANDARD_LABEL}
      </span>
    </span>
  );
}
