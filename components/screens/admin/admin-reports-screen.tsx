"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Flag,
  Search,
  Clock,
  Eye,
  CheckCircle2,
  Archive,
  AlertTriangle,
  User,
  Users,
  X,
} from "lucide-react";
import { AdminLayoutShell } from "./admin-layout-shell";
import { getReports, startReview, resolveReport } from "@/lib/admin-service";
import type { Report, ReportStatus, ReportType } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(t: ReportType): string {
  switch (t) {
    case "fake_profile": return "Perfil Falso";
    case "scam": return "Golpe / Fraude";
    case "harassment": return "Assédio";
    case "inappropriate_content": return "Conteúdo Inapropriado";
    case "other": return "Outro";
  }
}

function typeBadge(t: ReportType) {
  const map: Record<ReportType, string> = {
    fake_profile: "border-violet-800/60 bg-violet-900/30 text-violet-400",
    scam: "border-orange-800/60 bg-orange-900/30 text-orange-400",
    harassment: "border-red-800/60 bg-red-900/30 text-red-400",
    inappropriate_content: "border-yellow-800/60 bg-yellow-900/30 text-yellow-400",
    other: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
  };
  return map[t];
}

function statusBadge(s: ReportStatus) {
  switch (s) {
    case "pending":
      return { label: "Pendente", cls: "border-amber-800/60 bg-amber-900/30 text-amber-400", icon: Clock };
    case "under_review":
      return { label: "Em análise", cls: "border-blue-800/60 bg-blue-900/30 text-blue-400", icon: Eye };
    case "resolved":
      return { label: "Resolvida", cls: "border-emerald-800/60 bg-emerald-900/30 text-emerald-400", icon: CheckCircle2 };
    case "dismissed":
      return { label: "Arquivada", cls: "border-zinc-700 bg-zinc-800/40 text-zinc-500", icon: Archive };
  }
}

function roleIcon(role: "cliente" | "profissional") {
  return role === "cliente"
    ? <User className="h-3 w-3" />
    : <Users className="h-3 w-3" />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days}d`;
}

// ── Tipos de tab ─────────────────────────────────────────────────────────────

type TabFilter = "all" | ReportStatus;

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Em análise", value: "under_review" },
  { label: "Resolvidas", value: "resolved" },
  { label: "Arquivadas", value: "dismissed" },
];

// ── Modal de resolução ────────────────────────────────────────────────────────

interface ResolveModalProps {
  report: Report;
  onClose: () => void;
  onResolve: (resolution: "resolved" | "dismissed", note: string) => Promise<void>;
}

function ResolveModal({ report, onClose, onResolve }: ResolveModalProps) {
  const [choice, setChoice] = useState<"resolved" | "dismissed">("resolved");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setLoading(true);
    await onResolve(choice, note.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-zinc-100">Encerrar denúncia</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-600 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-400">
          Denúncia de <span className="font-medium text-zinc-200">{report.reporterName}</span> contra{" "}
          <span className="font-medium text-zinc-200">{report.reportedName}</span>
        </p>

        {/* Escolha */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setChoice("resolved")}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
              choice === "resolved"
                ? "border-emerald-700 bg-emerald-900/40 text-emerald-300"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
            Resolver
          </button>
          <button
            onClick={() => setChoice("dismissed")}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
              choice === "dismissed"
                ? "border-zinc-600 bg-zinc-800 text-zinc-300"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Archive className="mx-auto mb-1 h-4 w-4" />
            Arquivar
          </button>
        </div>

        {/* Nota */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            choice === "resolved"
              ? "Ex: Conta suspensa após confirmação de assédio…"
              : "Ex: Sem evidências suficientes para ação."
          }
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!note.trim() || loading}
            className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-white disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screen principal ──────────────────────────────────────────────────────────

export function AdminReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [resolveTarget, setResolveTarget] = useState<Report | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getReports();
    setReports(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const counts: Record<TabFilter, number> = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    under_review: reports.filter((r) => r.status === "under_review").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  const filtered = reports.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.reporterName.toLowerCase().includes(q) ||
      r.reportedName.toLowerCase().includes(q) ||
      typeLabel(r.type).toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const handleStartReview = async (id: string) => {
    setActionId(id);
    await startReview(id);
    await load();
    setActionId(null);
  };

  const handleResolve = async (resolution: "resolved" | "dismissed", note: string) => {
    if (!resolveTarget) return;
    setActionId(resolveTarget.id);
    await resolveReport(resolveTarget.id, resolution, note);
    setResolveTarget(null);
    await load();
    setActionId(null);
  };

  return (
    <AdminLayoutShell breadcrumb="Denúncias">
      {/* Resolve modal */}
      {resolveTarget && (
        <ResolveModal
          report={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolve={handleResolve}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Denúncias</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {counts.pending} pendente{counts.pending !== 1 ? "s" : ""} ·{" "}
            {counts.under_review} em análise
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            placeholder="Denunciante, denunciado ou tipo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition-all focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab.value
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.value ? "bg-wine-700 text-white" : "bg-zinc-800 text-zinc-500"}`}>
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-wine-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 py-20 text-center">
          <Flag className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-500">Nenhuma denúncia encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const badge = statusBadge(report.status);
            return (
              <div
                key={report.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800">
                      <AlertTriangle className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      {/* Type badge */}
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${typeBadge(report.type)}`}>
                        {typeLabel(report.type)}
                      </span>
                      <p className="mt-1.5 text-xs text-zinc-500">
                        {timeAgo(report.createdAt)}
                        {report.updatedAt && ` · Atualizado ${timeAgo(report.updatedAt)}`}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${badge.cls}`}>
                    <badge.icon className="h-3 w-3" />
                    {badge.label}
                  </span>
                </div>

                {/* Denunciante → Denunciado */}
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/60 bg-zinc-950/30 px-5 py-3 text-sm">
                  <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                    {roleIcon(report.reporterRole)}
                    <span className="font-medium text-zinc-300">{report.reporterName}</span>
                    <span className="text-zinc-600">({report.reporterRole})</span>
                  </div>
                  <span className="text-zinc-600">denunciou</span>
                  <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                    {roleIcon(report.reportedRole)}
                    <span className="font-medium text-zinc-300">{report.reportedName}</span>
                    <span className="text-zinc-600">({report.reportedRole})</span>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed text-zinc-400">{report.description}</p>
                </div>

                {/* Resolution (if exists) */}
                {report.resolution && (
                  <div className="mx-5 mb-4 rounded-xl border border-emerald-900/40 bg-emerald-950/30 px-4 py-3">
                    <p className="mb-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      Resolução
                    </p>
                    <p className="text-sm text-emerald-300">{report.resolution}</p>
                  </div>
                )}

                {/* Actions */}
                {(report.status === "pending" || report.status === "under_review") && (
                  <div className="flex gap-2 border-t border-zinc-800/60 px-5 py-3">
                    {report.status === "pending" && (
                      <button
                        onClick={() => handleStartReview(report.id)}
                        disabled={actionId === report.id}
                        className="flex items-center gap-1.5 rounded-lg border border-blue-800/60 bg-blue-900/20 px-4 py-2 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-900/40 disabled:opacity-60"
                      >
                        {actionId === report.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-blue-600 border-t-transparent" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        Iniciar análise
                      </button>
                    )}
                    <button
                      onClick={() => setResolveTarget(report)}
                      disabled={actionId === report.id}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Encerrar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayoutShell>
  );
}
