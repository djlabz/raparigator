"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion } from "motion/react";
import type { NavigationItem } from "@/lib/navigation";
import {
  getDirectionBetweenTabs,
  getTabHrefForPathname,
  saveCurrentTabScroll,
  setTabDirection,
} from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import { getChatSnapshot, getChatUnreadCount, subscribeChatUnread } from "@/lib/chat-service";

interface BottomNavProps {
  items: NavigationItem[];
}

const pillTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.7,
};

function getNavIcon(label: string, href: string, active: boolean, unreadCount: number = 0) {
  const iconClassName = cn(
    "transition-colors duration-200",
    active ? "text-white" : "text-zinc-700"
  );
  const iconStyle = active ? { color: "#fff" } : undefined;

  if (label === "Feed" || href === "/feed") {
    return (
      <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h14v-9.5" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (label === "Painel" || href.includes("dashboard")) {
    return (
      <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h7v7H4z" />
        <path d="M13 4h7v4h-7z" />
        <path d="M13 10h7v10h-7z" />
        <path d="M4 13h7v7H4z" />
      </svg>
    );
  }

  if (label === "Chat" || href === "/chat") {
    return (
      <div className="relative flex items-center justify-center">
        <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    );
  }

  if (label === "Financeiro" || href.includes("financeiro")) {
    return (
      <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15V11" />
        <path d="M12 15V8" />
        <path d="M16 15v-4" />
      </svg>
    );
  }

  if (label === "Anúncios" || href.includes("anuncios")) {
    return (
      <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11.5v1a2 2 0 0 0 2 2h2l5 4v-4h3a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }

  if (label === "Acompanhamento" || href.includes("acompanhamento")) {
    return (
      <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }

  if (label === "Conta" || href === "/conta") {
    return (
      <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  return (
    <svg className={iconClassName} style={iconStyle} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(pathname);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  useEffect(() => {
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [items, router]);

  const activeHref = getTabHrefForPathname(activeTab, items);

  const updateIndicator = useCallback(() => {
    const list = listRef.current;
    const itemEl = activeHref ? itemRefs.current.get(activeHref) : null;

    if (!list || !itemEl) {
      return;
    }

    setIndicator({
      x: itemEl.offsetLeft,
      width: itemEl.offsetWidth,
      ready: true,
    });
  }, [activeHref]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateIndicator();
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [updateIndicator]);

  const hasChat = items.some((item) => item.label === "Chat" || item.href === "/chat");
  const unreadCount = useSyncExternalStore(subscribeChatUnread, getChatUnreadCount, () => 0);

  useEffect(() => {
    if (!hasChat) {
      return;
    }

    getChatSnapshot().catch(() => {
    });
  }, [hasChat, pathname]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 md:hidden"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-auto relative w-max overflow-hidden rounded-full border border-white/40 bg-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-3xl backdrop-saturate-200 supports-backdrop-filter:bg-white/20">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/50 via-white/10 to-transparent mix-blend-overlay" />
        <ul ref={listRef} className="relative flex items-center justify-center gap-2 px-2 py-2">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-2 h-12 rounded-full bg-wine-700/90 shadow-[0_4px_20px_rgba(159,18,57,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]"
            initial={false}
            animate={{
              x: indicator.x,
              width: indicator.width || 56,
            }}
            transition={indicator.ready ? pillTransition : { duration: 0 }}
            style={{
              left: 0,
              visibility: indicator.ready ? "visible" : "hidden",
            }}
          />
          {items.map((item) => {
            const active = activeHref === item.href;
            return (
              <li
                key={item.href}
                ref={(node) => {
                  if (node) {
                    itemRefs.current.set(item.href, node);
                  } else {
                    itemRefs.current.delete(item.href);
                  }
                }}
                className="relative flex h-12 w-14 items-center justify-center"
              >
                <motion.div
                  className="relative z-10 h-full w-full"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  <Link
                    href={item.href}
                    prefetch
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => {
                      if (activeHref === item.href) {
                        return;
                      }

                      saveCurrentTabScroll(pathname, items);
                      const direction = getDirectionBetweenTabs(pathname, item.href, items);
                      setTabDirection(direction);
                      setActiveTab(item.href);
                    }}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-full",
                      active ? "text-white" : "text-zinc-600"
                    )}
                    style={active ? { color: "#fff" } : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    {getNavIcon(item.label, item.href, active, unreadCount)}
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
