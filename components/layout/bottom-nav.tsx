"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/feed", label: "Feed" },
  { href: "/chat", label: "Chat" },
  { href: "/checkout", label: "Contratar" },
  { href: "/profissional/dashboard", label: "Painel" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 p-2 backdrop-blur" aria-label="Navegacao principal">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("flex h-12 items-center justify-center rounded-xl text-sm font-semibold", active ? "bg-wine-700 text-white!" : "text-black hover:bg-zinc-100")}
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
