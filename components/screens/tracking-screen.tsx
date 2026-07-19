"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoBanner } from "@/components/ui/info-banner";
import { Modal } from "@/components/ui/modal";
import { StarRatingInput } from "@/components/ui/star-rating-input";
import { Toast } from "@/components/ui/toast";
import { serviceTracking } from "@/lib/mock-data";

export function TrackingScreen() {
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Acompanhamento do servico</h1>
        <Card className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Status" value={serviceTracking.status} />
            <Metric label="Previsao" value={serviceTracking.estimatedArrival} />
            <Metric label="Tempo em atendimento" value={serviceTracking.elapsed} />
          </div>
          <InfoBanner title="Profissional pronta" description="Recebemos confirmacao de preparo. Voce pode liberar check-in ao chegar no local." tone="highlight" />
          <div className="grid gap-2 sm:grid-cols-3">
            <Button>Confirmar check-in</Button>
            <Button variant="secondary" onClick={() => { setFeedback(null); setShowRateModal(true); }}>Finalizar servico</Button>
            <Button variant="danger">Botao de emergencia / panico</Button>
          </div>
          {feedback === "success" ? <Toast type="success" title="Avaliacao enviada" message="Obrigado pelo feedback. Sua opiniao ajuda a comunidade." /> : null}
          {feedback === "error" ? <Toast type="error" title="Falha ao enviar" message="Nao foi possivel enviar agora. Tente novamente." /> : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900">Linha do atendimento</h2>
          <TimelineItem title="Pagamento em custodia confirmado" subtitle="19:10" />
          <TimelineItem title="Profissional em deslocamento" subtitle="19:30" />
          <TimelineItem title="Codigo de check-in" subtitle={serviceTracking.checkInCode} />
        </Card>
      </div>

      <Modal
        open={showRateModal}
        onClose={() => !loading && setShowRateModal(false)}
        title="Como foi seu atendimento?"
        description="Avalie de 1 a 5 estrelas e deixe um comentario opcional."
        actions={
          <>
            <Button variant="secondary" fullWidth disabled={loading} onClick={() => setShowRateModal(false)}>
              Cancelar
            </Button>
            <Button
              fullWidth
              disabled={loading || rating === 0}
              onClick={() => {
                setLoading(true);
                setFeedback(null);
                setTimeout(() => {
                  if (rating >= 1) {
                    setFeedback("success");
                    setShowRateModal(false);
                    setComment("");
                    setRating(0);
                  } else {
                    setFeedback("error");
                  }
                  setLoading(false);
                }, 900);
              }}
            >
              {loading ? "Enviando..." : "Enviar avaliacao"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <StarRatingInput value={rating} onChange={setRating} disabled={loading} />
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Conte como foi sua experiencia (opcional)"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-200"
          />
        </div>
      </Modal>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-zinc-50 p-3"><p className="text-xs text-zinc-500">{label}</p><p className="text-sm font-semibold text-zinc-900">{value}</p></div>;
}

function TimelineItem({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3"><span className="h-2.5 w-2.5 rounded-full bg-wine-700" /><div><p className="text-sm font-medium text-zinc-900">{title}</p><p className="text-xs text-zinc-500">{subtitle}</p></div></div>;
}
