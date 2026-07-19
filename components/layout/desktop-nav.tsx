"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { chromePill, chromePillActive } from "@/lib/chrome-styles";

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
    <nav aria-label="Navegação principal" className={cn("hidden items-center gap-1.5 overflow-visible md:flex", className)}>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("whitespace-nowrap px-4 text-sm font-semibold", active ? chromePillActive : cn(chromePill, "text-zinc-700"))}
            style={active ? { color: "#fff" } : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
