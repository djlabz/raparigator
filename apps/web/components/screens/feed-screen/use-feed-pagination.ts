"use client";

import { useEffect, useState } from "react";

const FEED_PAGE_SIZE = 6;
const LOAD_MORE_DELAY_MS = 900;

export function useFeedPagination<T>(items: T[], resetKey: unknown) {
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleCount(FEED_PAGE_SIZE);
  }, [resetKey]);

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
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
