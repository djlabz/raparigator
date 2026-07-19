"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Flag, LogOut, ShieldCheck, ChevronRight, LayoutDashboard, User, ClipboardCheck } from "lucide-react";
import { useAdminSession } from "@/lib/admin-session";
import { chromeGlassDark, chromePillDark } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { AdminSearch } from "./admin-search";

interface AdminLayoutShellProps {
  children: ReactNode;
  breadcrumb?: string;
}

const navSections = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Usuários",
    items: [
      { label: "Clientes", href: "/admin/clientes", icon: User, exact: false },
      { label: "Profissionais", href: "/admin/profissionais", icon: Users, exact: false },
    ],
  },
  {
    label: "Moderação",
    items: [
      { label: "Validação de Perfis", href: "/admin/perfis", icon: ClipboardCheck, exact: false },
      { label: "Denúncias", href: "/admin/denuncias", icon: Flag, exact: false },
    ],
  },
];

export function AdminLayoutShell({ children, breadcrumb }: AdminLayoutShellProps) {
  const { isAdmin, admin, logout } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();

  // Guard: redireciona para login se não autenticado
  useEffect(() => {
    if (!isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950 md:flex sticky top-0">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800/60 px-5">
          <ShieldCheck className="h-5 w-5 text-wine-500" />
          <span className="font-display text-lg font-bold text-zinc-100">
            Sigillus{" "}
            <span className="text-xs font-semibold text-wine-400">Admin</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  if ("soon" in item && item.soon) {
                    return (
                      <div
                        key={item.href}
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        <span className="ml-auto rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Em breve
                        </span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? "bg-wine-900/40 text-wine-300 shadow-sm"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-wine-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="border-t border-zinc-800/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine-900/50 text-xs font-bold text-wine-400">
              {admin?.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-zinc-300">
                {admin?.fullName}
              </p>
              <p className="truncate text-[10px] text-zinc-600">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition-all hover:bg-zinc-800/60 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair do painel
          </button>
        </div>
      </aside>

      <div className="relative min-h-screen min-w-0 flex-1 overflow-y-auto">
        <header className={cn(chromeGlassDark, "flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6")}>
          <div className={cn(chromePillDark, "inline-flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-300")}>
            <span className="text-zinc-400">Admin</span>
            {breadcrumb ? (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-zinc-100">{breadcrumb}</span>
              </>
            ) : null}
          </div>
          <AdminSearch />
          <button
            onClick={logout}
            className={cn(chromePillDark, "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-900/60 hover:text-red-400 md:hidden")}
          >
            <LogOut className="h-3 w-3" />
            Sair
          </button>
          <p className={cn(chromePillDark, "hidden px-3 py-1.5 text-xs text-zinc-400 md:block")}>
            {admin?.email}
          </p>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
