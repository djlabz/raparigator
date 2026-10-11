"use client";

import { useState, type FormEvent } from "react";
import {
  REPORT_EVIDENCE_MAX_BYTES,
  REPORT_EVIDENCE_MAX_FILES,
  REPORT_RESPONSE_SLA_HOURS,
  type CreatePublicReportInput,
  type PublicReportReason,
} from "@sigillus/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiClient } from "@/lib/api/client";

const REASONS: { value: PublicReportReason; label: string }[] = [
  { value: "photo_without_consent", label: "Foto publicada sem consentimento" },
  { value: "minor", label: "Pessoa menor de idade" },
  { value: "coercion", label: "Anunciante sob coação" },
  { value: "illegal_content", label: "Conteúdo ilegal" },
  { value: "other", label: "Outro motivo" },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AD_PATH_PATTERN = /^\/?anuncio\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;
const MAX_MEGABYTES = Math.round(REPORT_EVIDENCE_MAX_BYTES / (1024 * 1024));

type Target = Pick<CreatePublicReportInput, "targetUrl" | "profileSlug">;

function parseTarget(value: string): Target | null {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return { targetUrl: new URL(trimmed).toString() };
    } catch {
      return null;
    }
  }
  const path = AD_PATH_PATTERN.exec(trimmed);
  if (path) {
    return { profileSlug: path[1] };
  }
  const slug = trimmed.toLowerCase();
  return SLUG_PATTERN.test(slug) ? { profileSlug: slug } : null;
}

function errorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "RATE_LIMITED") {
    return "Muitas denúncias em pouco tempo. Aguarde um minuto e tente de novo.";
  }
  if (code === "BAD_REQUEST") {
    return "Confira os campos: o link do anúncio e a descrição (mínimo de 10 caracteres) são obrigatórios.";
  }
  return "Não foi possível enviar a denúncia agora. Tente de novo em instantes.";
}

export function ReportForm() {
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState<PublicReportReason>("photo_without_consent");
  const [details, setDetails] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  const handleFiles = (list: FileList | null) => {
    const selected = Array.from(list ?? []);
    if (selected.length > REPORT_EVIDENCE_MAX_FILES) {
      setError(`Envie no máximo ${REPORT_EVIDENCE_MAX_FILES} imagens.`);
      return;
    }
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setError("As provas precisam ser imagens.");
      return;
    }
    if (selected.some((file) => file.size > REPORT_EVIDENCE_MAX_BYTES)) {
      setError(`Cada imagem pode ter até ${MAX_MEGABYTES} MB.`);
      return;
    }
    setError(null);
    setFiles(selected);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseTarget(target);
    if (!parsed) {
      setError("Informe o link do anúncio (o endereço que termina em /anuncio/nome).");
      return;
    }
    if (details.trim().length < 10) {
      setError("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await getApiClient().reports.createPublic({
        ...parsed,
        reason,
        details: details.trim(),
        contactEmail: contactEmail.trim() || undefined,
        evidence: files.map((file) => ({ contentType: file.type, sizeBytes: file.size })),
      });
      await Promise.all(
        result.evidenceUploads.map((upload, index) =>
          fetch(upload.uploadUrl, {
            method: upload.method,
            headers: upload.headers,
            body: files[index],
          }),
        ),
      );
      setProtocol(result.reportId);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (protocol) {
    return (
      <Card className="space-y-2 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Denúncia recebida</h2>
        <p className="text-sm text-zinc-600">
          Protocolo <span className="font-mono text-zinc-900">{protocol}</span>. A moderação analisa
          o pedido em até {REPORT_RESPONSE_SLA_HOURS} horas.
        </p>
      </Card>
    );
  }

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20";

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="report-target" className="text-sm font-medium text-zinc-800">
            Link do anúncio
          </label>
          <input
            id="report-target"
            type="text"
            inputMode="url"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Cole aqui o link do anúncio"
            className={fieldClass}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="report-reason" className="text-sm font-medium text-zinc-800">
            Motivo
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value as PublicReportReason)}
            className={fieldClass}
          >
            {REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="report-details" className="text-sm font-medium text-zinc-800">
            O que está errado
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            maxLength={4000}
            className={`${fieldClass} resize-none`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="report-contact" className="text-sm font-medium text-zinc-800">
            E-mail para contato (opcional)
          </label>
          <input
            id="report-contact"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className={fieldClass}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="report-evidence" className="text-sm font-medium text-zinc-800">
            Provas (opcional, até {REPORT_EVIDENCE_MAX_FILES} imagens de até {MAX_MEGABYTES} MB)
          </label>
          <input
            id="report-evidence"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-wine-700">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar denúncia"}
        </Button>
      </form>
    </Card>
  );
}
