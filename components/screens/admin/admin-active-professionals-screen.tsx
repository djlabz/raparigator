"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  Eye,
  ShieldX,
  ShieldCheck,
  X,
  Users,
  Crown,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import {
  getActiveProfessionals,
  suspendProfessional,
  reinstateProfessional,
} from "@/lib/admin-service";
import type { ProfessionalAd } from "@/lib/types";

type FilterTier = "all" | "premium" | "normal";

interface SuspendModal {
  profile: ProfessionalAd;
  reason: string;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function AdminActiveProfessionalsScreen() {
  const { admin } = useAdminSession();
  const [profiles, setProfiles] = useState<ProfessionalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<FilterTier>("all");
  const [suspendModal, setSuspendModal] = useState<SuspendModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getActiveProfessionals();
    setProfiles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSuspend = async () => {
    if (!admin || !suspendModal || !suspendModal.reason.trim()) return;
    setActionLoading(suspendModal.profile.id);
    await suspendProfessional(suspendModal.profile.id, admin.id, suspendModal.reason.trim());
    await load();
    setActionLoading(null);
    setSuspendModal(null);
    showToast(`${suspendModal.profile.artisticName} foi suspenso(a).`, "error");
  };

  const handleReinstate = async (profile: ProfessionalAd) => {
    if (!admin) return;
    setActionLoading(profile.id);
    await reinstateProfessional(profile.id, admin.id);
    await load();
    setActionLoading(null);
    showToast(`${profile.artisticName} foi reativado(a).`, "success");
  };

  const filtered = profiles.filter((p) => {
    const matchTier = tierFilter === "all" || p.adTier === tierFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.artisticName.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchTier && matchSearch;
  });

  const counts = {
    all: profiles.length,
    premium: profiles.filter((p) => p.adTier === "premium").length,
    normal: profiles.filter((p) => p.adTier === "normal").length,
    suspended: profiles.filter((p) => p.isSuspended).length,
  };

  return (
    <AdminLayoutShell breadcrumb="Profissionais">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl ${
            toast.type === "success"
              ? "border-emerald-800/60 bg-emerald-900/80 text-emerald-300"
              : "border-red-800/60 bg-red-900/80 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Profissionais Aprovados</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {counts.all} no total · {counts.premium} premium · {counts.suspended} suspensos
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            placeholder="Nome, categoria ou cidade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition-all focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Tier filter */}
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
        {(["all", "premium", "normal"] as FilterTier[]).map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tierFilter === t
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "premium" && <Crown className="h-3 w-3 text-wine-400" />}
            {t === "all" ? "Todos" : t === "premium" ? "Premium" : "Normal"}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tierFilter === t ? "bg-wine-700 text-white" : "bg-zinc-800 text-zinc-500"}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 py-20 text-center">
          <Users className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-500">Nenhum perfil encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((profile) => (
            <div
              key={profile.id}
              className={`group overflow-hidden rounded-2xl border bg-zinc-900/60 transition-all hover:shadow-lg hover:shadow-black/40 ${
                profile.isSuspended ? "border-red-900/60" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Imagem */}
              <div className="relative h-44 bg-zinc-800">
                {profile.images[0] && (
                  <Image
                    src={profile.images[0]}
                    alt={profile.artisticName}
                    fill
                    className={`object-cover object-top transition-transform duration-500 group-hover:scale-105 ${profile.isSuspended ? "grayscale" : ""}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />

                {/* Tier badge */}
                {profile.adTier === "premium" && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-wine-700/60 bg-wine-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wine-400">
                    <Crown className="h-2.5 w-2.5" />
                    Premium
                  </div>
                )}

                {/* Suspended overlay */}
                {profile.isSuspended && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-950/60">
                    <div className="flex items-center gap-2 rounded-full border border-red-700/60 bg-red-950/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
                      <ShieldX className="h-3.5 w-3.5" /> Suspenso
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{profile.artisticName}</p>
                    <p className="text-xs text-zinc-500">{profile.category}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-zinc-300">
                    R$ {profile.startingPrice.toLocaleString("pt-BR")}
                    <span className="text-xs font-normal text-zinc-600">/h</span>
                  </p>
                </div>

                {/* Metrics */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.city}, {profile.state}
                  </span>
                  {profile.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {profile.rating.toFixed(1)}
                      <span className="text-zinc-600">({profile.reviewsCount})</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViews(profile.profileViews)} views
                  </span>
                </div>

                {/* Suspension reason */}
                {profile.isSuspended && profile.rejectionReason && (
                  <p className="mt-3 line-clamp-2 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                    {profile.rejectionReason}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {profile.isSuspended ? (
                    <button
                      onClick={() => handleReinstate(profile)}
                      disabled={actionLoading === profile.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-900/20 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-900/40 disabled:opacity-60"
                    >
                      {actionLoading === profile.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      Reativar
                    </button>
                  ) : (
                    <button
                      onClick={() => setSuspendModal({ profile, reason: "" })}
                      disabled={actionLoading === profile.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/20 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-900/30 disabled:opacity-60"
                    >
                      <ShieldX className="h-3.5 w-3.5" />
                      Suspender
                    </button>
                  )}
                  <Link
                    href={`/admin/perfis/${profile.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de suspensão */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldX className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold text-zinc-100">Suspender profissional</h2>
              </div>
              <button
                onClick={() => setSuspendModal(null)}
                className="rounded-lg p-1 text-zinc-600 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-1 text-sm font-medium text-zinc-300">{suspendModal.profile.artisticName}</p>
            <p className="mb-4 text-sm text-zinc-500">
              O perfil continuará existindo mas ficará invisível no feed e buscas.
            </p>

            <textarea
              value={suspendModal.reason}
              onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
              placeholder="Ex: Violação dos termos de uso da plataforma…"
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-red-700/60"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setSuspendModal(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendModal.reason.trim() || actionLoading !== null}
                className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ShieldX className="h-4 w-4" />
                )}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
