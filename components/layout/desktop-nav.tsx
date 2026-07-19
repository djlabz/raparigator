"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface DesktopNavProps {
  items: NavigationItem[];
  className?: string;
}

export function DesktopNav({ items, className }: DesktopNavProps) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "ml-0 grid h-12 w-64 max-w-64 shrink-0 items-stretch gap-0 rounded-full border border-zinc-200 bg-white p-1 shadow-[0_2px_12px_rgba(15,23,42,0.08)]",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-full min-w-0 items-center justify-center rounded-full px-2.5 text-[0.9375rem] font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2",
              active
                ? "bg-wine-700/90 shadow-[0_2px_8px_rgba(182,0,49,0.28)] hover:bg-wine-800"
                : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
            )}
            style={active ? { color: "#fff" } : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
