"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useId, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { getChatSnapshot, getChatUnreadCount, subscribeChatUnread } from "@/lib/chat-service";

interface BottomNavProps {
  items: NavigationItem[];
}

function getNavIcon(label: string, href: string, active: boolean, unreadCount: number = 0) {
  const iconClassName = active ? "text-white" : "text-zinc-700";

  if (label === "Feed" || href === "/feed") {
    return (
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h14v-9.5" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (label === "Painel" || href.includes("dashboard")) {
    return (
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11.5v1a2 2 0 0 0 2 2h2l5 4v-4h3a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }

  if (label === "Acompanhamento" || href.includes("acompanhamento")) {
    return (
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );
  }

  if (label === "Conta" || href === "/conta") {
    return (
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  return (
    <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const id = useId();
  const [activeTab, setActiveTab] = useState(pathname);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

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
      <div className="pointer-events-auto relative w-max rounded-full border border-white/40 bg-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-3xl backdrop-saturate-200 supports-backdrop-filter:bg-white/20">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/50 via-white/10 to-transparent mix-blend-overlay" />
        <ul className="relative flex items-center justify-center gap-2 px-2 py-2">
          {items.map((item) => {
            const active = activeTab.startsWith(item.href);
            return (
              <li key={item.href} className="relative flex h-12 w-14 items-center justify-center">
                {active && (
                  <motion.div
                    layoutId={`active-nav-pill-${id}`}
                    className="absolute inset-0 rounded-full bg-wine-700/90 shadow-[0_4px_20px_rgba(159,18,57,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8
                    }}
                  />
                )}
                <Link
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setActiveTab(item.href)}
                  className={cn(
                    "relative z-10 flex h-full w-full items-center justify-center rounded-full transition-colors duration-200",
                    active
                      ? "text-white"
                      : "text-zinc-600 active:bg-white/30 active:scale-95"
                  )}
                >
                  {getNavIcon(item.label, item.href, active, unreadCount)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
