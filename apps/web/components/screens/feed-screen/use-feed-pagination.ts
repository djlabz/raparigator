"use client";

import { useEffect, useRef, useState } from "react";

const FEED_PAGE_SIZE = 6;
const LOAD_MORE_DELAY_MS = 900;

export function useFeedPagination<T>(items: T[], resetKey: unknown) {
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimerRef = useRef<number | null>(null);

  const cancelPendingLoad = () => {
    if (loadMoreTimerRef.current !== null) {
      window.clearTimeout(loadMoreTimerRef.current);
      loadMoreTimerRef.current = null;
    }
  };

  useEffect(() => {
    cancelPendingLoad();
    setVisibleCount(FEED_PAGE_SIZE);
    setLoadingMore(false);
  }, [resetKey]);

  useEffect(() => cancelPendingLoad, []);

  const loadMore = () => {
    cancelPendingLoad();
    setLoadingMore(true);
    loadMoreTimerRef.current = window.setTimeout(() => {
      loadMoreTimerRef.current = null;
      setVisibleCount((value) => value + FEED_PAGE_SIZE);
      setLoadingMore(false);
    }, LOAD_MORE_DELAY_MS);
  };

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    loadingMore,
    loadMore,
  };
}
