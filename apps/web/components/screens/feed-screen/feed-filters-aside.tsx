"use client";

import type { ComponentProps } from "react";
import {
  chromeBelowDesktopNavStickyMaxH,
  chromeBelowDesktopNavStickyTop,
  chromeBelowHeaderStickyMaxH,
  chromeBelowHeaderStickyTop,
} from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { FEED_SIDE_COLUMN_CLASS } from "./constants";
import { FeedFiltersContent } from "./feed-filters-content";
import { useLockedScrollContainer } from "./use-locked-scroll-container";

interface FeedFiltersAsideProps {
  hasDesktopNav: boolean;
  onClear: () => void;
  filtersContentProps: ComponentProps<typeof FeedFiltersContent>;
}

export function FeedFiltersAside({
  hasDesktopNav,
  onClear,
  filtersContentProps,
}: FeedFiltersAsideProps) {
  const setFiltersScrollNode = useLockedScrollContainer();

  return (
    <div className={cn("relative hidden lg:block", FEED_SIDE_COLUMN_CLASS)}>
      <aside
        data-feed-filters-panel
        className={cn(
          "z-10 flex h-fit w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
          FEED_SIDE_COLUMN_CLASS,
          "self-start lg:sticky",
          hasDesktopNav ? chromeBelowDesktopNavStickyTop : chromeBelowHeaderStickyTop,
          hasDesktopNav ? chromeBelowDesktopNavStickyMaxH : chromeBelowHeaderStickyMaxH,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50 p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <line x1="21" x2="14" y1="4" y2="4" />
              <line x1="10" x2="3" y1="4" y2="4" />
              <line x1="21" x2="12" y1="12" y2="12" />
              <line x1="8" x2="3" y1="12" y2="12" />
              <line x1="21" x2="16" y1="20" y2="20" />
              <line x1="12" x2="3" y1="20" y2="20" />
              <line x1="14" x2="14" y1="2" y2="6" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
            Filtros
          </h3>
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold tracking-wider text-wine-700 uppercase hover:underline"
          >
            Limpar
          </button>
        </div>

        <div
          ref={setFiltersScrollNode}
          data-feed-filters-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain overscroll-y-contain bg-white p-5 [overflow-anchor:none]"
          role="presentation"
          onMouseDown={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("button, input, label, a, [role='button']")) {
              event.preventDefault();
            }
          }}
        >
          <FeedFiltersContent {...filtersContentProps} />
        </div>
      </aside>
    </div>
  );
}
