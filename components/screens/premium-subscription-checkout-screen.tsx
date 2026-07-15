"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Crown, CreditCard } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoBanner } from "@/components/ui/info-banner";
import { Select } from "@/components/ui/select";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Toast } from "@/components/ui/toast";
import { getImmediateGains, getPlanOption, PREMIUM_PLAN_OPTIONS } from "@/lib/premium-catalog";
import { usePremiumPlan } from "@/lib/premium-plan";
import type { PremiumBillingCycle } from "@/lib/types";
import { currency, cn } from "@/lib/utils";

function isBillingCycle(value: string | null): value is PremiumBillingCycle {
  return value === "monthly" || value === "yearly";
}

export function PremiumSubscriptionCheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPremium, activatePremium } = usePremiumPlan();

  const billingParam = searchParams.get("billing");
  const initialBilling: PremiumBillingCycle = isBillingCycle(billingParam) ? billingParam : "yearly";
  const [billingCycle, setBillingCycle] = useState<PremiumBillingCycle>(initialBilling);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isPaying, setIsPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedPlan = useMemo(() => getPlanOption(billingCycle), [billingCycle]);
  const gains = getImmediateGains();

  const handleConfirm = () => {
    if (isPaying || isPremium) {
      return;
    }

    setIsPaying(true);
    window.setTimeout(() => {
      activatePremium();
      setIsPaying(false);
      setShowSuccess(true);
      window.setTimeout(() => {
        router.push("/profissional/dashboard?tab=Resumo");
      }, 1400);
    }, 800);
  };

  if (isPremium && !showSuccess) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg space-y-4">
          <Card className="space-y-4 border-[#DAA520]/35 bg-[#121212] p-6 text-center text-white shadow-none">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFDF00]/15 premium-glow-pulse">
              <Crown className="h-7 w-7 text-[#FFDF00]" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-semibold text-[#FFDF00]">Você já é Premium</h1>
            <p className="text-sm text-zinc-300">Sua assinatura já está ativa. Continue aproveitando o topo das pesquisas e o tráfego VIP.</p>
            <Button fullWidth onClick={() => router.push("/profissional/dashboard?tab=Resumo")}>
              Ir ao painel
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Assinatura Premium</h1>
            <p className="mt-1 text-sm text-zinc-600">Escolha o ciclo, a forma de pagamento e confirme. Nesta demo o pagamento é simulado.</p>
          </div>

          <Card className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {PREMIUM_PLAN_OPTIONS.map((option) => {
                const selected = billingCycle === option.cycle;
                return (
                  <button
                    key={option.cycle}
                    type="button"
                    onClick={() => setBillingCycle(option.cycle)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      selected ? "border-[#DAA520] bg-[#121212] text-white" : "border-zinc-200 bg-white hover:border-[#DAA520]/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-bold", selected ? "text-[#FFDF00]" : "text-zinc-900")}>{option.label}</p>
                      {option.badge ? (
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", selected ? "bg-[#FFDF00]/15 text-[#FFDF00]" : "bg-wine-50 text-wine-700")}>
                          {option.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className={cn("mt-2 font-display text-2xl font-semibold", selected ? "text-[#FFDF00]" : "text-zinc-900")}>
                      {currency(option.price)}
                    </p>
                  </button>
                );
              })}
            </div>

            <Select
              id="premium-payment-method"
              label="Forma de pagamento"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              options={[
                { value: "pix", label: "Pix" },
                { value: "card", label: "Cartão" },
              ]}
            />

            <InfoBanner
              tone="highlight"
              title="Assinatura renovável (mock)"
              description={
                paymentMethod === "pix"
                  ? "No backend real, um QR Code Pix seria gerado. Aqui a confirmação ativa o Premium imediatamente."
                  : "No backend real, o cartão seria tokenizado. Aqui a confirmação ativa o Premium imediatamente."
              }
            />

            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              <CreditCard className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              Método selecionado: {paymentMethod === "pix" ? "Pix" : "Cartão"} · ciclo {selectedPlan.label.toLowerCase()}
            </div>

            <ShinyButton fullWidth onClick={handleConfirm}>
              {isPaying ? "Processando..." : "Confirmar e pagar"}
            </ShinyButton>

            {showSuccess ? (
              <Toast type="success" title="Premium ativado" message="Pagamento simulado com sucesso. Redirecionando ao painel..." />
            ) : null}
          </Card>
        </section>

        <aside className="space-y-4">
          <Card className="space-y-3 border-[#DAA520]/30 bg-[#121212] text-white shadow-none">
            <h2 className="font-display text-lg font-semibold text-[#FFDF00]">Resumo</h2>
            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Plano {selectedPlan.label}</span>
                <strong className="text-[#FFDF00]">{currency(selectedPlan.price)}</strong>
              </div>
              {selectedPlan.cycle === "yearly" ? (
                <p className="text-xs text-zinc-400">Equivale a {currency(selectedPlan.monthlyEquivalent)}/mês</p>
              ) : null}
              <div className="border-t border-white/10 pt-2 text-base">
                <div className="flex items-center justify-between text-white">
                  <span>Total</span>
                  <strong className="text-[#FFDF00]">{currency(selectedPlan.price)}</strong>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-zinc-900">Ganho imediato</h2>
            <ul className="space-y-2">
              {gains.map((gain) => (
                <li key={gain.id} className="flex items-start gap-2 text-sm text-zinc-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#DAA520]" aria-hidden="true" />
                  <span>
                    {gain.label}: <span className="text-zinc-400 line-through">{gain.from}</span> →{" "}
                    <strong className="text-zinc-900">{gain.to}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
