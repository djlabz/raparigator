"use client";

import { Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionDividerVariant = "premium" | "standard";

interface FeedSectionDividerProps {
  variant: SectionDividerVariant;
  className?: string;
}

export function FeedSectionDivider({ variant, className }: FeedSectionDividerProps) {
  if (variant === "premium") {
    return (
      <div className={cn("flex items-center gap-3 py-4 select-none", className)}>
        <Star
          size={22}
          className="shrink-0 fill-[#FFDF00] text-[#FFDF00] drop-shadow-[0_0_6px_rgba(255,223,0,0.7)]"
        />
        <span className="shrink-0 bg-linear-to-r from-[#B38728] via-[#DAA520] to-[#a88222] bg-clip-text font-display text-2xl font-semibold tracking-wide text-transparent">
          Modelos Premium
        </span>
        <span
          className="h-px flex-1 rounded-full"
          style={{
            background: "linear-gradient(to right, rgba(218, 165, 32, 0.4), transparent)",
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("mt-6 flex items-center gap-3 py-4 select-none", className)}>
      <Flame size={20} className="shrink-0 text-wine-700" />
      <span className="shrink-0 text-xl font-semibold text-wine-700">
        Descubra outras Modelos
      </span>
      <span
        className="h-px flex-1 rounded-full"
        style={{
          background: "linear-gradient(to right, rgba(182, 0, 49, 0.3), transparent)",
        }}
      />
    </div>
  );
}
