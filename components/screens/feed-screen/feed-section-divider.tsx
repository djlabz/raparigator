"use client";

import { motion, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useOptionalFeedHeaderTitleMotion } from "./feed-header-title-context";
import { FeedSectionTitle, type FeedSectionTitleVariant } from "./feed-section-title";

interface FeedSectionDividerProps {
  variant: FeedSectionTitleVariant;
  className?: string;
}

export function FeedSectionDivider({ variant, className }: FeedSectionDividerProps) {
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackOpacity = useMotionValue(1);
  const opacity = motionValues?.standardDividerOpacity ?? fallbackOpacity;

  if (variant === "premium") {
    return null;
  }

  return (
    <motion.div
      style={{ opacity }}
      className={cn("mt-6 flex items-center gap-3 py-4 select-none", className)}
    >
      <FeedSectionTitle variant="standard" />
      <span
        className="h-px min-w-0 flex-1 rounded-full"
        style={{
          background: "linear-gradient(to right, rgba(182, 0, 49, 0.3), transparent)",
        }}
      />
    </motion.div>
  );
}
