"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Users,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { useAdminSession } from "@/lib/admin-session";
import {
  getAllProfiles,
  approveProfile,
} from "@/lib/admin-service";
import type { ProfessionalAd, VerificationStatus } from "@/lib/types";

type TabStatus = "pending_review" | "published" | "rejected";

const TABS: { label: string; status: TabStatus; icon: React.ElementType }[] = [
  { label: "Pendentes", status: "pending_review", icon: Clock },
  { label: "Aprovados", status: "published", icon: CheckCircle2 },
  { label: "Recusados", status: "rejected", icon: XCircle },
];

function StatusBadge({ status }: { status: VerificationStatus | undefined }) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-800/60 bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
        <Clock className="h-2.5 w-2.5" />
        Em análise
      </span>
    );
  }
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Aprovado
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-800/60 bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
        <XCircle className="h-2.5 w-2.5" />
        Recusado
      </span>
    );
  }
  return null;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminProfilesScreen() {
  const { admin } = useAdminSession();
  const [activeTab, setActiveTab] = useState<TabStatus>("pending_review");
  const [profiles, setProfiles] = useState<ProfessionalAd[]>([]);
  const [counts, setCounts] = useState({ pending_review: 0, published: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [pending, published, rejected] = await Promise.all([
      getAllProfiles("pending_review"),
      getAllProfiles("published"),
      getAllProfiles("rejected"),
    ]);
    setCounts({
      pending_review: pending.length,
      published: published.length,
      rejected: rejected.length,
    });
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    const data = await getAllProfiles(activeTab);
    setProfiles(data);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    void (async () => { await loadAll(); })();
  }, [loadAll]);

  useEffect(() => {
    void (async () => { await loadTab(); })();
  }, [loadTab]);

  const handleQuickApprove = async (id: string) => {
    if (!admin) return;
    setApprovingId(id);
    await approveProfile(id, admin.id, "Aprovado via ação rápida no painel.");
    await Promise.all([loadAll(), loadTab()]);
    setApprovingId(null);
  };

  const filtered = profiles.filter((p) =>
    p.artisticName.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayoutShell breadcrumb="Perfis Profissionais">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Pendentes", value: counts.pending_review, color: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/40" },
          { label: "Aprovados", value: counts.published, color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/40" },
          { label: "Recusados", value: counts.rejected, color: "text-red-400", bg: "bg-red-900/20 border-red-800/40" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {stat.label}
            </p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.status;
            return (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-wine-700 text-white" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {counts[tab.status]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            placeholder="Buscar por nome ou cidade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition-all focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 py-20 text-center">
          <Users className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-500">Nenhum perfil encontrado</p>
          <p className="mt-1 text-xs text-zinc-600">
            {search ? "Tente outro nome ou cidade." : "Esta fila está vazia."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((profile) => (
            <div
              key={profile.id}
              className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40"
            >
              {/* Imagem */}
              <div className="relative h-44 bg-zinc-800">
                {profile.images[0] && (
                  <Image
                    src={profile.images[0]}
                    alt={profile.artisticName}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <StatusBadge status={profile.verificationStatus} />
                </div>
                {profile.adTier === "premium" && (
                  <div className="absolute right-3 top-3 rounded-full border border-wine-700/60 bg-wine-900/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wine-400">
                    Premium
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

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.city}, {profile.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(profile.submittedAt)}
                  </span>
                </div>

                {/* Rejection reason preview */}
                {profile.verificationStatus === "rejected" && profile.rejectionReason && (
                  <p className="mt-3 line-clamp-2 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                    {profile.rejectionReason}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {profile.verificationStatus === "pending_review" && (
                    <button
                      onClick={() => handleQuickApprove(profile.id)}
                      disabled={approvingId === profile.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-900/20 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-900/40 disabled:cursor-wait disabled:opacity-60"
                    >
                      {approvingId === profile.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Aprovar
                    </button>
                  )}
                  <Link
                    href={`/admin/perfis/${profile.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60"
                  >
                    Ver detalhes
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayoutShell>
  );
}
