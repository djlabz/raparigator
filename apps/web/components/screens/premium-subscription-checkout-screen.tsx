"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Crown, CreditCard } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PixIcon } from "@/components/ui/pix-icon";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Toast } from "@/components/ui/toast";
import { getImmediateGains, getPlanOption, usePremiumPlans } from "@/lib/premium-catalog";
import { usePremiumPlan } from "@/lib/premium-plan";
import type { PremiumBillingCycle } from "@/lib/types";
import { currency, cn } from "@/lib/utils";

function isBillingCycle(value: string | null): value is PremiumBillingCycle {
  return value === "monthly" || value === "semiannual";
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCardCvv(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

const fieldClassName =
  "h-11 w-full rounded-xl border border-white/15 bg-[#1a1a1a] px-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-gold-bright/55 focus:ring-2 focus:ring-gold-bright/15";

export function PremiumSubscriptionCheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPremium, activatePremium, checkoutEnabled } = usePremiumPlan();
  const { plans: planOptions, stale: plansStale, loading: plansLoading } = usePremiumPlans();

  useEffect(() => {
    if (!checkoutEnabled) {
      router.replace("/profissional/dashboard");
    }
  }, [checkoutEnabled, router]);

  const billingParam = searchParams.get("billing");
  const initialBilling: PremiumBillingCycle = isBillingCycle(billingParam)
    ? billingParam
    : "semiannual";
  const [billingCycle, setBillingCycle] = useState<PremiumBillingCycle>(initialBilling);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedPlan = useMemo(
    () =>
      planOptions.find((option) => option.cycle === billingCycle) ?? getPlanOption(billingCycle),
    [planOptions, billingCycle],
  );
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

  if (!checkoutEnabled) {
    return null;
  }

  if (isPremium && !showSuccess) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg">
          <div className="space-y-5 rounded-3xl border border-gold/40 bg-premium-surface p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-bright/15 animate-glow-pulse">
              <Crown className="h-7 w-7 text-gold-bright" aria-hidden="true" />
            </span>
            <h1 className="font-display text-3xl font-semibold text-gold-bright">
              Você já é Premium
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Sua assinatura está ativa. Continue no topo das pesquisas com o tráfego VIP.
            </p>
            <Button fullWidth onClick={() => router.push("/profissional/dashboard?tab=Resumo")}>
              Ir ao painel
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-3xl border border-gold/40 bg-premium-surface"
          >
            <div className="border-b border-gold/25 px-5 py-6 sm:px-7">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                Sigillus Premium
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-gold-bright sm:text-4xl">
                Assinatura Premium
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                Escolha o ciclo, a forma de pagamento e confirme para ativar o destaque.
              </p>
            </div>

            <div className="space-y-6 p-5 pb-7 sm:p-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Ciclo</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {planOptions.map((option) => {
                    const selected = billingCycle === option.cycle;
                    return (
                      <button
                        key={option.cycle}
                        type="button"
                        onClick={() => setBillingCycle(option.cycle)}
                        className={cn(
                          "relative rounded-2xl border p-4 pt-5 text-left transition",
                          selected
                            ? "border-gold-bright/70 bg-[#1a1a1a] shadow-[0_0_0_1px_rgba(255,223,0,0.2)]"
                            : "border-white/10 bg-transparent hover:border-gold/45",
                        )}
                      >
                        {option.badge ? (
                          <span
                            className={cn(
                              "absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              selected
                                ? "bg-gold-bright text-premium-surface"
                                : "bg-zinc-800 text-gold-bright",
                            )}
                          >
                            {option.badge}
                          </span>
                        ) : null}
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            selected ? "text-gold-bright" : "text-zinc-300",
                          )}
                        >
                          {option.label}
                        </p>
                        <p
                          className={cn(
                            "mt-2 font-sans text-3xl font-semibold tabular-nums tracking-tight",
                            selected ? "text-gold-bright" : "text-white",
                          )}
                        >
                          {currency(option.price)}
                        </p>
                        {option.cycle === "semiannual" ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {currency(option.monthlyEquivalent)}/mês
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-zinc-500">por mês</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                  Pagamento
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                      paymentMethod === "pix"
                        ? "border-gold-bright/60 bg-gold-bright/10 text-gold-bright"
                        : "border-white/10 text-zinc-400 hover:border-gold/40 hover:text-zinc-200",
                    )}
                  >
                    <PixIcon className="h-4 w-4" aria-hidden="true" />
                    Pix
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                      paymentMethod === "card"
                        ? "border-gold-bright/60 bg-gold-bright/10 text-gold-bright"
                        : "border-white/10 text-zinc-400 hover:border-gold/40 hover:text-zinc-200",
                    )}
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Cartão
                  </button>
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {paymentMethod === "card" ? (
                    <motion.div
                      key="card-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                          Dados do cartão
                        </p>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="premium-card-name"
                            className="text-sm font-medium text-zinc-300"
                          >
                            Nome no cartão
                          </label>
                          <input
                            id="premium-card-name"
                            type="text"
                            autoComplete="cc-name"
                            placeholder="Como está impresso no cartão"
                            value={cardName}
                            onChange={(event) => setCardName(event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="premium-card-number"
                            className="text-sm font-medium text-zinc-300"
                          >
                            Número do cartão
                          </label>
                          <input
                            id="premium-card-number"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(event) =>
                              setCardNumber(formatCardNumber(event.target.value))
                            }
                            className={fieldClassName}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="premium-card-expiry"
                              className="text-sm font-medium text-zinc-300"
                            >
                              Validade
                            </label>
                            <input
                              id="premium-card-expiry"
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              placeholder="MM/AA"
                              value={cardExpiry}
                              onChange={(event) =>
                                setCardExpiry(formatCardExpiry(event.target.value))
                              }
                              className={fieldClassName}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="premium-card-cvv"
                              className="text-sm font-medium text-zinc-300"
                            >
                              CVV
                            </label>
                            <input
                              id="premium-card-cvv"
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(event) => setCardCvv(formatCardCvv(event.target.value))}
                              className={fieldClassName}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pix-hint"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                        Após confirmar, o Pix será gerado para concluir o pagamento.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {plansStale ? (
                <p className="text-sm font-medium text-wine-700">
                  Não foi possível confirmar os valores dos planos. Recarregue a página antes de
                  assinar.
                </p>
              ) : null}
              <ShinyButton
                fullWidth
                disabled={plansStale || plansLoading}
                onClick={handleConfirm}
                className="tabular-nums tracking-tight"
              >
                {isPaying ? "Processando..." : `Confirmar · ${currency(selectedPlan.price)}`}
              </ShinyButton>

              {showSuccess ? (
                <Toast
                  type="success"
                  title="Premium ativado"
                  message="Assinatura confirmada. Redirecionando ao painel..."
                />
              ) : null}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="rounded-3xl border border-gold/40 bg-premium-surface p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold text-gold-bright">Resumo</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 text-zinc-300">
                  <span>Plano {selectedPlan.label}</span>
                  <strong className="shrink-0 font-sans tabular-nums tracking-tight text-gold-bright">
                    {currency(selectedPlan.price)}
                  </strong>
                </div>
                {selectedPlan.cycle === "semiannual" ? (
                  <p className="text-xs text-zinc-500">
                    Equivale a {currency(selectedPlan.monthlyEquivalent)}/mês
                  </p>
                ) : null}
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-base text-white">
                  <span>Total</span>
                  <strong className="font-sans text-2xl font-semibold tabular-nums tracking-tight text-gold-bright">
                    {currency(selectedPlan.price)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gold/35 bg-premium-surface p-5 pb-7 sm:p-6 sm:pb-8">
              <h2 className="font-display text-xl font-semibold text-gold-bright">
                Ganho imediato
              </h2>
              <ul className="mt-4 space-y-4">
                {gains.map((gain) => (
                  <li key={gain.id} className="flex items-start gap-3 text-sm leading-snug">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold-bright"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 wrap-break-word">
                      <span className="block font-medium text-white">{gain.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-[#E8C547]">
                        {gain.to}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </AppShell>
  );
}
