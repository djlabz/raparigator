"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
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
  Globe,
  ImageOff,
  EyeOff,
  Paperclip,
  Mail,
} from "lucide-react";
import type {
  PublicReportReason,
  ReportAction,
  ReportEvidence,
  ReportTargetMedia,
} from "@sigillus/contracts";
import { AdminLayoutShell } from "./admin-layout-shell";
import {
  actOnReport,
  getReportContact,
  getReportEvidence,
  getReportTargetMedia,
  getReports,
  resolveReport,
  startReview,
} from "@/lib/admin-service";
import type { Report, ReportStatus, ReportType } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(t: ReportType): string {
  switch (t) {
    case "fake_profile":
      return "Perfil Falso";
    case "scam":
      return "Golpe / Fraude";
    case "harassment":
      return "Assédio";
    case "inappropriate_content":
      return "Conteúdo Inapropriado";
    case "other":
      return "Outro";
  }
}

function publicReasonLabel(reason: PublicReportReason | undefined): string {
  switch (reason) {
    case "photo_without_consent":
      return "Foto sem consentimento";
    case "minor":
      return "Menor de idade";
    case "coercion":
      return "Coação";
    case "illegal_content":
      return "Conteúdo ilegal";
    default:
      return "Outro";
  }
}

function reportLabel(report: Report): string {
  return report.source === "public" ? publicReasonLabel(report.reason) : typeLabel(report.type);
}

function actionLabel(action: ReportAction): string {
  switch (action) {
    case "remove_media":
      return "Mídia removida";
    case "unpublish_profile":
      return "Anúncio despublicado";
    case "dismiss":
      return "Encerrada sem ação";
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeBadge(t: ReportType) {
  const map: Record<ReportType, string> = {
    fake_profile: "border-violet-500/40 bg-violet-950/70 text-violet-300",
    scam: "border-orange-500/40 bg-orange-950/70 text-orange-300",
    harassment: "border-red-500/40 bg-red-950/70 text-red-300",
    inappropriate_content: "border-amber-500/40 bg-amber-950/70 text-amber-300",
    other: "border-zinc-700 bg-zinc-900/80 text-zinc-400",
  };
  return map[t];
}

function statusBadge(s: ReportStatus) {
  switch (s) {
    case "pending":
      return {
        label: "Pendente",
        cls: "border-amber-500/40 bg-amber-950/60 text-amber-300",
        icon: Clock,
      };
    case "under_review":
      return {
        label: "Em análise",
        cls: "border-blue-500/40 bg-blue-950/60 text-blue-300",
        icon: Eye,
      };
    case "resolved":
      return {
        label: "Resolvida",
        cls: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
        icon: CheckCircle2,
      };
    case "dismissed":
      return {
        label: "Arquivada",
        cls: "border-zinc-700 bg-zinc-900/60 text-zinc-500",
        icon: Archive,
      };
  }
}

function roleIcon(role: "cliente" | "profissional") {
  return role === "cliente" ? (
    <User className="h-3.5 w-3.5 text-blue-400" />
  ) : (
    <Users className="h-3.5 w-3.5 text-wine-400" />
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `há ${mins} min`;
  if (hours < 24) return `há ${hours} h`;
  return `há ${days} d`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/80"
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-100 text-base">Encerrar Denúncia</h2>
              <p className="text-xs text-zinc-500">Decisão final do moderador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
          Denúncia registrada por{" "}
          <span className="font-bold text-zinc-200">{report.reporterName ?? "Canal público"}</span>{" "}
          contra{" "}
          <span className="font-bold text-zinc-200">
            {report.reportedName ?? report.profileSlug ?? "anúncio não identificado"}
          </span>
          .
        </p>

        {/* Escolha */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setChoice("resolved")}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
              choice === "resolved"
                ? "border-emerald-600/60 bg-emerald-950/60 text-emerald-300 shadow-md"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Procedente (Resolver)</span>
          </button>
          <button
            onClick={() => setChoice("dismissed")}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
              choice === "dismissed"
                ? "border-zinc-700 bg-zinc-800/80 text-zinc-200 shadow-md"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Improcedente (Arquivar)</span>
          </button>
        </div>

        {/* Nota */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            choice === "resolved"
              ? "Descreva a ação tomada (ex: perfil advertido, usuário suspenso)..."
              : "Descreva a justificativa (ex: evidências insuficientes)..."
          }
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40 font-medium"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!note.trim() || loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-wine-600 to-wine-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:from-wine-500 hover:to-wine-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Confirmar Decisão
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ActionRequest {
  report: Report;
  action: ReportAction;
  asset?: ReportTargetMedia;
}

const ACTION_TITLES: Record<ReportAction, string> = {
  remove_media: "Remover mídia",
  unpublish_profile: "Despublicar anúncio",
  dismiss: "Encerrar sem ação",
};

const ACTION_DESCRIPTIONS: Record<ReportAction, string> = {
  remove_media:
    "A mídia sai do anúncio e do armazenamento. Imagens parecidas ficam bloqueadas para novo envio.",
  unpublish_profile:
    "O anúncio sai do ar com o motivo vinculado a esta denúncia. A conta não é suspensa.",
  dismiss: "A denúncia é arquivada sem alterar o anúncio.",
};

function ActionModal({
  request,
  onClose,
  onConfirm,
}: {
  request: ActionRequest;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(note.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/80"
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 className="font-bold text-zinc-100 text-base">{ACTION_TITLES[request.action]}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-zinc-400 leading-relaxed">
          {ACTION_DESCRIPTIONS[request.action]}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          aria-label="Observação da moderação"
          placeholder="Observação da moderação (opcional)"
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40 font-medium"
        />
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-wine-600 to-wine-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:from-wine-500 hover:to-wine-600 disabled:opacity-50"
          >
            {loading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReportContactReveal({ reportId }: { reportId: string }) {
  const [contact, setContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    try {
      const result = await getReportContact(reportId);
      setContact(result.contactEmail ?? "");
    } finally {
      setLoading(false);
    }
  };

  if (contact !== null) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-zinc-300">
        <Mail className="h-3 w-3" />
        {contact || "Sem e-mail de contato"}
      </span>
    );
  }

  return (
    <button
      onClick={handleReveal}
      disabled={loading}
      className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-100 disabled:opacity-60"
    >
      <Mail className="h-3 w-3" />
      Ver contato
    </button>
  );
}

function ReportEvidenceList({ report }: { report: Report }) {
  const [items, setItems] = useState<ReportEvidence[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (report.evidenceCount === 0) {
    return null;
  }

  const handleLoad = async () => {
    setLoading(true);
    setItems(await getReportEvidence(report.id));
    setLoading(false);
  };

  return (
    <div className="mx-5 mb-4 space-y-2">
      {items === null ? (
        <button
          onClick={handleLoad}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-zinc-100 disabled:opacity-60"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Ver provas ({report.evidenceCount})
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-zinc-100"
            >
              Prova {index + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportModeration({
  report,
  disabled,
  onRequest,
}: {
  report: Report;
  disabled: boolean;
  onRequest: (request: ActionRequest) => void;
}) {
  const [media, setMedia] = useState<ReportTargetMedia[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadMedia = async () => {
    setLoading(true);
    setMedia(await getReportTargetMedia(report.id));
    setLoading(false);
  };

  return (
    <div className="space-y-3 border-t border-zinc-800/60 bg-zinc-950/40 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {report.targetProfileId && media === null && (
          <button
            onClick={handleLoadMedia}
            disabled={loading || disabled}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
          >
            <ImageOff className="h-3.5 w-3.5" />
            Ver mídias do anúncio
          </button>
        )}
        {report.targetProfileId && (
          <button
            onClick={() => onRequest({ report, action: "unpublish_profile" })}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-xl border border-red-800/60 bg-red-950/50 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-900/60 disabled:opacity-60"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Despublicar anúncio
          </button>
        )}
        <button
          onClick={() => onRequest({ report, action: "dismiss" })}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
        >
          <Archive className="h-3.5 w-3.5" />
          Encerrar sem ação
        </button>
      </div>
      {media !== null &&
        (media.length === 0 ? (
          <p className="text-xs text-zinc-500">O anúncio não tem mídias publicadas.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {media.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
              >
                {item.url && item.kind === "image" ? (
                  <Image
                    src={item.url}
                    alt="Mídia do anúncio denunciado"
                    width={240}
                    height={240}
                    unoptimized
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-[11px] text-zinc-500">
                    Vídeo
                  </div>
                )}
                <button
                  onClick={() => onRequest({ report, action: "remove_media", asset: item })}
                  disabled={disabled}
                  className="w-full border-t border-zinc-800 px-2 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-950/50 disabled:opacity-60"
                >
                  Remover mídia
                </button>
              </li>
            ))}
          </ul>
        ))}
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
  const [actionRequest, setActionRequest] = useState<ActionRequest | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getReports();
    setReports(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
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
      (r.reporterName ?? "").toLowerCase().includes(q) ||
      (r.reportedName ?? "").toLowerCase().includes(q) ||
      (r.profileSlug ?? "").toLowerCase().includes(q) ||
      reportLabel(r).toLowerCase().includes(q);
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

  const handleAction = async (note: string) => {
    if (!actionRequest) return;
    const { report, action, asset } = actionRequest;
    setActionId(report.id);
    await actOnReport(report.id, action, note, asset?.id);
    setActionRequest(null);
    await load();
    setActionId(null);
  };

  return (
    <AdminLayoutShell breadcrumb="Denúncias & Moderação">
      <AnimatePresence>
        {actionRequest && (
          <ActionModal
            request={actionRequest}
            onClose={() => setActionRequest(null)}
            onConfirm={handleAction}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {resolveTarget && (
          <ResolveModal
            report={resolveTarget}
            onClose={() => setResolveTarget(null)}
            onResolve={handleResolve}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Central de Denúncias
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Gerencie infrações relativas a fraudes, assédios ou conteúdos inapropriados relatados
              por usuários.
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/60">
          <div className="flex items-center gap-1 overflow-x-auto p-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-wine-900/60 text-wine-200 border border-wine-800/60 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive ? "bg-wine-500 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative px-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Denunciante, acusado ou infração…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40 font-medium"
            />
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-wine-500" />
            <p className="text-xs font-medium text-zinc-500">Carregando registro de denúncias...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/60 bg-zinc-900/20 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-3 text-zinc-600">
              <Flag className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-zinc-300">Nenhuma denúncia encontrada</p>
            <p className="mt-1 text-xs text-zinc-500">Não há registros na categoria selecionada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((report, i) => {
              const badge = statusBadge(report.status);
              return (
                <motion.div
                  key={report.id}
                  data-testid={`report-card-${report.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-lg"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 p-5 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-wine-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${typeBadge(report.type)}`}
                          >
                            {reportLabel(report)}
                          </span>
                          {report.source === "public" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-950/60 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                              <Globe className="h-3 w-3" />
                              Canal público
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {timeAgo(report.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${badge.cls}`}
                    >
                      <badge.icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  </div>

                  {/* Reporter vs Reported Parties */}
                  <div className="flex flex-wrap items-center gap-3 bg-zinc-950/60 px-5 py-3 text-xs border-b border-zinc-800/40">
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                      {report.reporterRole ? (
                        roleIcon(report.reporterRole)
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-sky-400" />
                      )}
                      <span className="font-bold text-zinc-200">
                        {report.reporterName ?? "Denúncia pública"}
                      </span>
                      {report.reporterRole && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                          ({report.reporterRole})
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-600 font-bold">→ denunciou →</span>
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                      {report.reportedRole && roleIcon(report.reportedRole)}
                      <span className="font-bold text-zinc-200">
                        {report.reportedName ?? "Anúncio não identificado"}
                      </span>
                      {report.reportedRole && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                          ({report.reportedRole})
                        </span>
                      )}
                    </div>
                    {report.profileSlug && (
                      <a
                        href={`/anuncio/${report.profileSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-wine-300 underline-offset-2 hover:underline"
                      >
                        /anuncio/{report.profileSlug}
                      </a>
                    )}
                    {!report.profileSlug && report.targetUrl && (
                      <span className="text-[11px] font-mono text-zinc-400 break-all">
                        {report.targetUrl}
                      </span>
                    )}
                    {report.hasContactEmail && <ReportContactReveal reportId={report.id} />}
                  </div>

                  {/* Body Description */}
                  <div className="p-5">
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 font-normal">
                      {report.description}
                    </p>
                  </div>

                  <ReportEvidenceList report={report} />

                  {report.action && (
                    <div className="mx-5 mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-300">
                      <span className="font-bold text-zinc-100">{actionLabel(report.action)}</span>
                      {report.actionByEmail && <span> · por {report.actionByEmail}</span>}
                      {report.respondedAt && <span> · {formatDateTime(report.respondedAt)}</span>}
                    </div>
                  )}

                  {/* Existing Resolution Note */}
                  {report.resolution && (
                    <div className="mx-5 mb-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-4">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        Resolução Oficial
                      </p>
                      <p className="text-xs text-emerald-300 font-medium">{report.resolution}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(report.status === "pending" || report.status === "under_review") && (
                    <ReportModeration
                      report={report}
                      disabled={actionId === report.id}
                      onRequest={setActionRequest}
                    />
                  )}

                  {(report.status === "pending" || report.status === "under_review") && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800/60 bg-zinc-950/40 px-5 py-3">
                      {report.status === "pending" && (
                        <button
                          onClick={() => handleStartReview(report.id)}
                          disabled={actionId === report.id}
                          className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-950/40 transition-all hover:bg-blue-500 disabled:opacity-60"
                        >
                          {actionId === report.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          <span>Iniciar Análise</span>
                        </button>
                      )}
                      <button
                        onClick={() => setResolveTarget(report)}
                        disabled={actionId === report.id}
                        className="flex items-center gap-1.5 rounded-xl border border-wine-700/80 bg-wine-900/60 px-4 py-2 text-xs font-bold text-wine-200 shadow-sm transition-all hover:bg-wine-800 hover:border-wine-600 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-wine-400" />
                        <span>Tomar Decisão</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
