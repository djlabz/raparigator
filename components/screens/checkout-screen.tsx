"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoBanner } from "@/components/ui/info-banner";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { currency } from "@/lib/utils";

const serviceValue = 800;
const platformFee = 96;

export function CheckoutScreen() {
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900">Fluxo de contratacao</h1>
          <Card className="space-y-4">
            <Select
              id="date"
              label="Data"
              options={[
                { value: "2026-03-07", label: "Hoje, 07/03" },
                { value: "2026-03-08", label: "Amanha, 08/03" },
              ]}
            />
            <Select
              id="time"
              label="Horario"
              options={[
                { value: "21:00", label: "21:00" },
                { value: "22:00", label: "22:00" },
                { value: "23:00", label: "23:00" },
              ]}
            />
            <Select
              id="method"
              label="Forma de pagamento"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              options={[
                { value: "pix", label: "Pix" },
                { value: "card", label: "Cartao" },
              ]}
            />
            <InfoBanner
              tone="highlight"
              title="Pagamento em custodia (escrow)"
              description="O valor fica protegido na Sigillus e so e liberado apos conclusao confirmada do servico."
            />
            <Button
              fullWidth
              onClick={() => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 4000);
              }}
            >
              Confirmar e pagar
            </Button>
            {showSuccess ? (
              <Toast
                type="success"
                title="Pagamento reservado"
                message="Servico confirmado com custodia ativa."
              />
            ) : null}
          </Card>
        </section>

        <aside>
          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-zinc-900">Resumo</h2>
            <div className="space-y-2 text-sm text-zinc-700">
              <div className="flex items-center justify-between">
                <span>Servico (2 horas)</span>
                <strong>{currency(serviceValue)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxa da plataforma</span>
                <strong>{currency(platformFee)}</strong>
              </div>
              <div className="border-t border-zinc-200 pt-2 text-base text-zinc-900">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <strong>{currency(serviceValue + platformFee)}</strong>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
