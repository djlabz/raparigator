"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  items: NavigationItem[];
}

function getNavIcon(label: string, href: string, active: boolean) {
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
      <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
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

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-70 rounded-full bg-white/70 backdrop-blur-xl border border-zinc-200/50 shadow-2xl md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="flex items-center justify-around gap-0.5 px-2 py-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex h-9 w-full items-center justify-center rounded-full transition-all duration-300",
                  active
                    ? "bg-wine-700 text-white shadow-md scale-105"
                    : "text-zinc-600 hover:bg-zinc-100/50"
                )}
                style={active ? { color: "#fff" } : undefined}
              >
                {getNavIcon(item.label, item.href, active)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
