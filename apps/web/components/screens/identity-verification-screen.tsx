"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, Clock, FileImage, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  IDENTITY_VERIFICATION_CONTENT_TYPES,
  IDENTITY_VERIFICATION_MAX_BYTES,
  type IdentityVerificationContentType,
  type IdentityVerificationFileKind,
  type IdentityVerificationMine,
} from "@sigillus/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiClient } from "@/lib/api/client";

const ACCEPT = IDENTITY_VERIFICATION_CONTENT_TYPES.join(",");
const SUBMIT_ERROR = "Não foi possível enviar a verificação. Tente novamente.";

function isAcceptedType(type: string): type is IdentityVerificationContentType {
  return (IDENTITY_VERIFICATION_CONTENT_TYPES as readonly string[]).includes(type);
}

function fileError(file: File | null): string | null {
  if (!file) {
    return "Escolha o documento e a selfie.";
  }
  if (!isAcceptedType(file.type)) {
    return "Envie imagens JPG, PNG ou WEBP.";
  }
  if (file.size > IDENTITY_VERIFICATION_MAX_BYTES) {
    return "Cada imagem pode ter até 15 MB.";
  }
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function uploadFile(kind: IdentityVerificationFileKind, file: File): Promise<string> {
  const api = getApiClient();
  const contentType = file.type as IdentityVerificationContentType;
  const created = await api.identity.createUpload({ kind, contentType, sizeBytes: file.size });
  const response = await fetch(created.uploadUrl, {
    method: created.method,
    headers: created.headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(SUBMIT_ERROR);
  }
  return created.key;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return SUBMIT_ERROR;
}

export function IdentityVerificationScreen() {
  const [mine, setMine] = useState<IdentityVerificationMine | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMine(await getApiClient().identity.getMine());
      setLoadError(null);
    } catch {
      setLoadError("Não foi possível carregar a sua verificação de identidade.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const problem = fileError(documentFile) ?? fileError(selfieFile);
    if (problem || !documentFile || !selfieFile) {
      setSubmitError(problem ?? "Escolha o documento e a selfie.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const documentKey = await uploadFile("document", documentFile);
      const selfieKey = await uploadFile("selfie", selfieFile);
      setMine(await getApiClient().identity.submit({ documentKey, selfieKey }));
      setDocumentFile(null);
      setSelfieFile(null);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = mine !== null && (mine.status === null || mine.status === "rejected");

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Anúncios
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Verificação de identidade</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Toda anunciante passa por verificação de identidade antes de publicar o anúncio. As
            imagens ficam em área privada, só a equipe de moderação vê. Elas são apagadas na
            reprovação ou 30 dias depois da aprovação.
          </p>
        </div>

        {loadError ? (
          <Card className="p-5 text-sm text-red-700">{loadError}</Card>
        ) : mine === null ? (
          <div className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" />
        ) : (
          <StatusCard mine={mine} />
        )}

        {canSubmit ? (
          <Card className="p-5">
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <h2 className="text-base font-semibold text-zinc-900">
                {mine?.status === "rejected" ? "Enviar novamente" : "Enviar documentos"}
              </h2>
              <FileField
                id="identity-document"
                label="Documento com foto"
                hint="RG, CNH ou passaporte, com foto e dados legíveis."
                file={documentFile}
                onChange={setDocumentFile}
              />
              <FileField
                id="identity-selfie"
                label="Selfie"
                hint="Foto do seu rosto, de frente e com boa iluminação."
                file={selfieFile}
                onChange={setSelfieFile}
              />
              {submitError ? (
                <p role="alert" className="text-sm font-medium text-red-600">
                  {submitError}
                </p>
              ) : null}
              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar para verificação"}
              </Button>
            </form>
          </Card>
        ) : null}

        <Link
          href="/painel?tab=Anúncio"
          className="inline-flex text-sm font-semibold text-wine-700 underline underline-offset-2 hover:text-wine-800"
        >
          Voltar para o anúncio
        </Link>
      </div>
    </AppShell>
  );
}

function StatusCard({ mine }: { mine: IdentityVerificationMine }) {
  if (mine.status === "approved") {
    return (
      <Card className="flex items-start gap-3 border-emerald-200 bg-emerald-50 p-5">
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div>
          <p className="font-semibold text-emerald-900">Identidade verificada</p>
          <p className="mt-1 text-sm text-emerald-800">
            Aprovada em {formatDate(mine.reviewedAt)}. Seu anúncio já pode ser publicado.
          </p>
        </div>
      </Card>
    );
  }
  if (mine.status === "pending") {
    return (
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-5">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold text-amber-900">Em análise</p>
          <p className="mt-1 text-sm text-amber-800">
            Recebemos seus documentos em {formatDate(mine.submittedAt)}. O anúncio pode ser
            publicado assim que a verificação for aprovada.
          </p>
        </div>
      </Card>
    );
  }
  if (mine.status === "rejected") {
    return (
      <Card className="flex items-start gap-3 border-red-200 bg-red-50 p-5">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <p className="font-semibold text-red-900">Verificação reprovada</p>
          <p className="mt-1 text-sm text-red-800">
            Motivo: <span data-testid="identity-reject-reason">{mine.rejectReason}</span>
          </p>
          <p className="mt-1 text-sm text-red-800">
            Os arquivos enviados foram apagados. Envie novas imagens abaixo.
          </p>
        </div>
      </Card>
    );
  }
  return (
    <Card className="flex items-start gap-3 p-5">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-wine-700" />
      <div>
        <p className="font-semibold text-zinc-900">Verificação pendente de envio</p>
        <p className="mt-1 text-sm text-zinc-600">
          Envie uma foto do seu documento e uma selfie para liberar a publicação do anúncio.
        </p>
      </div>
    </Card>
  );
}

function FileField({
  id,
  label,
  hint,
  file,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      <p className="text-xs text-zinc-500">{hint}</p>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 transition-colors hover:border-wine-400 hover:bg-wine-50/40"
      >
        <FileImage className="h-5 w-5 shrink-0 text-zinc-500" />
        <span className="min-w-0 truncate">{file ? file.name : "Escolher imagem"}</span>
      </label>
      <input
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}
