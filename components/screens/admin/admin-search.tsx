"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, User, Users, X } from "lucide-react";
import { globalSearch } from "@/lib/admin-service";
import type { GlobalSearchResult } from "@/lib/types";

function ResultIcon({ type }: { type: GlobalSearchResult["type"] }) {
  return type === "client" ? (
    <User className="h-4 w-4 text-blue-400" />
  ) : (
    <Users className="h-4 w-4 text-wine-400" />
  );
}

function statusLabel(status?: string): string {
  switch (status) {
    case "pending_review": return "Em análise";
    case "published": return "Aprovado";
    case "rejected": return "Recusado";
    case "active": return "Ativo";
    case "suspended": return "Suspenso";
    default: return "";
  }
}

function statusColor(status?: string): string {
  switch (status) {
    case "pending_review": return "text-amber-500";
    case "published":
    case "active": return "text-emerald-500";
    case "rejected":
    case "suspended": return "text-red-400";
    default: return "text-zinc-500";
  }
}

export function AdminSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / ⌘K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Focus input when opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      void (() => {
        setQuery("");
        setResults([]);
      })();
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const data = await globalSearch(q);
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void doSearch(query); }, 200);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const clients = results.filter((r) => r.type === "client");
  const professionals = results.filter((r) => r.type === "professional");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-sm text-zinc-500 shadow-sm transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:flex">
          Ctrl+K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60">
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar clientes, profissionais…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-zinc-600 hover:text-zinc-300">
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="py-10 text-center text-sm text-zinc-600">
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </div>
              )}

              {!loading && !query && (
                <div className="py-10 text-center text-sm text-zinc-600">
                  Digite para buscar clientes e profissionais
                </div>
              )}

              {!loading && clients.length > 0 && (
                <div className="p-2">
                  <p className="mb-1 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    Clientes
                  </p>
                  {clients.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-zinc-800"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900/40">
                        <ResultIcon type={r.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">{r.name}</p>
                        <p className="text-xs text-zinc-500">{r.subtitle}</p>
                      </div>
                      {r.status && (
                        <span className={`text-[11px] font-semibold ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {!loading && professionals.length > 0 && (
                <div className="p-2">
                  <p className="mb-1 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    Profissionais
                  </p>
                  {professionals.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-zinc-800"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine-900/40">
                        <ResultIcon type={r.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">{r.name}</p>
                        <p className="text-xs text-zinc-500">{r.subtitle}</p>
                      </div>
                      {r.status && (
                        <span className={`text-[11px] font-semibold ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 px-4 py-2 text-center text-[11px] text-zinc-700">
              Pressione Enter para navegar · ESC para fechar
            </div>
          </div>
        </div>
      )}
    </>
  );
}
