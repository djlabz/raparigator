"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface DesktopNavProps {
  items: NavigationItem[];
}

export function DesktopNav({ items }: DesktopNavProps) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Navegação principal" className="sticky top-16 z-20 hidden border-b border-zinc-200 bg-white/90 backdrop-blur md:block">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active ? "bg-wine-700 text-white shadow-sm" : "text-zinc-700 hover:bg-zinc-100"
              )}
              style={active ? { color: "#fff" } : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
