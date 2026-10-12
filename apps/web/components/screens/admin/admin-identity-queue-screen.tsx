"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { BadgeCheck, CheckCircle2, Clock, Eye, ShieldX, XCircle } from "lucide-react";
import type {
  IdentityVerificationFiles,
  IdentityVerificationStatus,
  IdentityVerificationSummary,
} from "@sigillus/contracts";
import { getApiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { AdminLayoutShell } from "./admin-layout-shell";

type TabFilter = "all" | IdentityVerificationStatus;

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Pendentes", value: "pending" },
  { label: "Aprovadas", value: "approved" },
  { label: "Reprovadas", value: "rejected" },
  { label: "Todas", value: "all" },
];

const STATUS_BADGES: Record<
  IdentityVerificationStatus,
  { label: string; cls: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pendente",
    cls: "border-amber-500/40 bg-amber-950/60 text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Aprovada",
    cls: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
    icon: BadgeCheck,
  },
  rejected: {
    label: "Reprovada",
    cls: "border-red-500/40 bg-red-950/60 text-red-300",
    icon: ShieldX,
  },
};

const MIN_REASON_LENGTH = 3;

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AdminIdentityQueueScreen() {
  const [tab, setTab] = useState<TabFilter>("pending");
  const [items, setItems] = useState<IdentityVerificationSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (filter: TabFilter) => {
    try {
      const status = filter === "all" ? undefined : filter;
      setItems(await getApiClient().admin.identityVerifications({ status }));
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error, "Não foi possível carregar a fila de verificações."));
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  return (
    <AdminLayoutShell breadcrumb="Verificações de identidade">
      <div className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-5">
          <h1 className="font-display text-2xl font-bold text-zinc-100">
            Verificações de identidade
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Compare o documento com a selfie antes de liberar a publicação do anúncio. Os arquivos
            são apagados ao reprovar e 30 dias depois da aprovação.
          </p>
        </div>

        <div role="tablist" className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => {
                setItems(null);
                setTab(item.value);
              }}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors",
                tab === item.value
                  ? "border-wine-600/60 bg-wine-950/60 text-wine-200"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loadError ? (
          <p className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            {loadError}
          </p>
        ) : items === null ? (
          <div className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
            Nenhuma verificação nesta fila.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <VerificationCard key={item.id} item={item} onChanged={() => load(tab)} />
            ))}
          </ul>
        )}
      </div>
    </AdminLayoutShell>
  );
}

function VerificationCard({
  item,
  onChanged,
}: {
  item: IdentityVerificationSummary;
  onChanged: () => Promise<void>;
}) {
  const [files, setFiles] = useState<IdentityVerificationFiles | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badge = STATUS_BADGES[item.status];
  const BadgeIcon = badge.icon;
  const title = item.artisticName ?? item.profileSlug ?? `Conta ${item.userId}`;

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const showFiles = async () => {
    setError(null);
    try {
      setFiles(await getApiClient().admin.identityFileUrl({ id: item.id }));
    } catch (err) {
      setError(errorMessage(err, "Não foi possível abrir os arquivos."));
    }
  };

  const approve = () =>
    run(
      () => getApiClient().admin.approveIdentity({ id: item.id }),
      "Não foi possível aprovar a verificação.",
    );

  const reject = () =>
    run(
      () => getApiClient().admin.rejectIdentity({ id: item.id, reason: reason.trim() }),
      "Não foi possível reprovar a verificação.",
    );

  return (
    <li
      data-testid="identity-verification-card"
      className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-zinc-100">{title}</p>
          {item.profileSlug ? (
            <p className="text-xs text-zinc-500">/anuncio/{item.profileSlug}</p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">Enviada em {formatDateTime(item.createdAt)}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
            badge.cls,
          )}
        >
          <BadgeIcon className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      </div>

      {item.status !== "pending" ? (
        <div className="space-y-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-3 text-xs text-zinc-400">
          <p>
            Analisada por <span className="font-semibold text-zinc-200">{item.reviewedBy}</span> em{" "}
            {formatDateTime(item.reviewedAt)}
          </p>
          {item.rejectReason ? <p>Motivo: {item.rejectReason}</p> : null}
          {!item.filesAvailable ? <p>Arquivos já apagados do armazenamento.</p> : null}
        </div>
      ) : null}

      {item.filesAvailable ? (
        files ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <FilePreview label="Documento" url={files.documentUrl} />
            <FilePreview label="Selfie" url={files.selfieUrl} />
          </div>
        ) : (
          <button
            type="button"
            onClick={showFiles}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver documento e selfie
          </button>
        )
      ) : null}

      {item.status === "pending" ? (
        isRejecting ? (
          <div className="space-y-2">
            <label
              htmlFor={`reject-reason-${item.id}`}
              className="block text-xs font-bold text-zinc-300"
            >
              Motivo da reprovação (a anunciante vai ler)
            </label>
            <textarea
              id={`reject-reason-${item.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs font-medium text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-wine-700 focus:ring-1 focus:ring-wine-500/40"
              placeholder="Ex.: documento ilegível, selfie não confere com o documento."
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(false);
                  setReason("");
                }}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={busy || reason.trim().length < MIN_REASON_LENGTH}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Confirmar reprovação
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-red-900/70 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-950/60 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reprovar
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprovar
            </button>
          </div>
        )
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-400">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function FilePreview({ label, url }: { label: string; url: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <Image
        src={url}
        alt={label}
        width={480}
        height={360}
        unoptimized
        className="aspect-[4/3] w-full object-contain"
      />
      <figcaption className="px-3 py-2 text-xs font-bold text-zinc-400">{label}</figcaption>
    </figure>
  );
}
