"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  items: NavigationItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-zinc-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden" aria-label="Navegação principal">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("flex h-12 min-w-0 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors", active ? "bg-wine-700 text-white shadow-sm" : "text-zinc-700 hover:bg-zinc-100")}
                style={active ? { color: "#fff" } : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
