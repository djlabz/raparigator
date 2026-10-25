"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Images, Rocket, Sparkles, TrendingUp, UserRound, Zap } from "lucide-react";
import { Modal, type ModalScrollAvailability } from "@/components/ui/modal";
import { ShinyButton } from "@/components/ui/shiny-button";
import {
  getBillingSavingsPercent,
  getPlanOption,
  getSharedGains,
  PREMIUM_EXCLUSIVE_FEATURES,
  usePremiumPlans,
} from "@/lib/premium-catalog";
import { usePremiumPlan } from "@/lib/premium-plan";
import type { PremiumBillingCycle } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

export type PremiumHighlight =
  | "topSearch"
  | "traffic"
  | "portfolio"
  | "media"
  | "alias"
  | "earlyAccess";

interface PremiumConversionModalProps {
  open: boolean;
  onClose: () => void;
  highlight?: PremiumHighlight;
  from?: string;
}

const BENEFIT_CELLS: Array<{
  id: PremiumHighlight;
  title: string;
  description: string;
  icon: typeof TrendingUp;
}> = [
  {
    id: "topSearch",
    title: "Topo das Pesquisas",
    description: "Perfil em destaque com mais visualizações, mais conversões, selo e card Premium.",
    icon: TrendingUp,
  },
  {
    id: "traffic",
    title: "Tráfego VIP revelado",
    description: "Gráficos completos de visitas, origens e posição na busca.",
    icon: BarChart3,
  },
  {
    id: "portfolio",
    title: "Mídia no portfólio",
    description: "No Comum: 10 fotos e 3 vídeos. No Premium: mídias ilimitadas para o seu anúncio.",
    icon: Images,
  },
  {
    id: "media",
    title: "Visualização única",
    description: "Envie mídias de visualização única no chat — recurso exclusivo Premium.",
    icon: Zap,
  },
  {
    id: "alias",
    title: "Apelido por conversa",
    description: "Defina apelido por cliente/conversa — exclusivo Premium.",
    icon: UserRound,
  },
  {
    id: "earlyAccess",
    title: "Acesso prioritário",
    description: "Acesso prioritário a novos recursos e benefícios",
    icon: Rocket,
  },
];

const BILLING_LABELS: Record<PremiumBillingCycle, string> = {
  monthly: "Mensal",
  semiannual: "Semestral",
};

export function PremiumConversionModal({
  open,
  onClose,
  highlight,
  from,
}: PremiumConversionModalProps) {
  const router = useRouter();
  const { checkoutEnabled } = usePremiumPlan();
  const [step, setStep] = useState<1 | 2>(1);
  const [wasOpen, setWasOpen] = useState(open);
  const [billingCycle, setBillingCycle] = useState<PremiumBillingCycle>("semiannual");
  const [scrollGateMeasured, setScrollGateMeasured] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);
  const [reachedEnd, setReachedEnd] = useState(false);
  const sharedGains = getSharedGains();
  const { plans: planOptions, stale: plansStale, loading: plansLoading } = usePremiumPlans();
  const selectedPlan =
    planOptions.find((option) => option.cycle === billingCycle) ?? getPlanOption(billingCycle);
  const savingsPercent = getBillingSavingsPercent();

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(1);
      setBillingCycle("semiannual");
      setScrollGateMeasured(false);
      setCanScrollDown(true);
      setReachedEnd(false);
    }
  }

  const handleScrollAvailabilityChange = (state: ModalScrollAvailability) => {
    setScrollGateMeasured(true);
    setCanScrollDown(state.canScrollDown);
    setReachedEnd(state.reachedEnd);
  };

  const step2CtaDisabled = step === 2 && (!scrollGateMeasured || (canScrollDown && !reachedEnd));

  const handleClose = () => {
    setStep(1);
    setScrollGateMeasured(false);
    setCanScrollDown(true);
    setReachedEnd(false);
    onClose();
  };

  const handleGoCheckout = () => {
    const params = new URLSearchParams();
    params.set("billing", billingCycle);
    if (from) {
      params.set("from", from);
    } else if (highlight) {
      params.set("from", highlight);
    }
    handleClose();
    router.push(`/profissional/assinatura-premium?${params.toString()}`);
  };

  if (!checkoutEnabled) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Sigillus Premium"
      titleClassName="font-display text-3xl leading-[1.2] font-semibold tracking-[-0.02em] text-gold-bright sm:text-4xl sm:leading-[1.2]"
      size="md"
      mobileCentered
      scrollResetKey={step}
      onScrollAvailabilityChange={step === 2 ? handleScrollAvailabilityChange : undefined}
      showScrollHint={step === 2 && canScrollDown && !reachedEnd}
      actions={
        step === 1 ? (
          <ShinyButton
            fullWidth
            onClick={() => {
              setScrollGateMeasured(false);
              setCanScrollDown(true);
              setReachedEnd(false);
              setStep(2);
            }}
          >
            Continuar
          </ShinyButton>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {plansStale ? (
              <p className="text-center text-xs font-medium text-wine-700">
                Não foi possível confirmar os valores dos planos. Recarregue a página para assinar.
              </p>
            ) : null}
            <ShinyButton
              fullWidth
              disabled={step2CtaDisabled || plansStale || plansLoading}
              onClick={handleGoCheckout}
            >
              Continuar para assinatura
            </ShinyButton>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              ← Ver benefícios
            </button>
          </div>
        )
      }
    >
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        <span className={cn(step === 1 && "text-gold")}>1 · Benefícios</span>
        <span aria-hidden="true">/</span>
        <span className={cn(step === 2 && "text-gold")}>2 · Comparar</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-gold/35 bg-premium-surface p-3 sm:p-4"
          >
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BENEFIT_CELLS.map((cell, index) => {
                const Icon = cell.icon;
                const highlighted = highlight === cell.id;
                const isLastOdd =
                  index === BENEFIT_CELLS.length - 1 && BENEFIT_CELLS.length % 2 === 1;
                return (
                  <motion.li
                    key={cell.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 360,
                      damping: 28,
                      delay: index * 0.05,
                    }}
                    className={cn(
                      "flex gap-3 rounded-xl border border-premium-border bg-black/35 p-3.5",
                      isLastOdd && "sm:col-span-2",
                      highlighted && "border-gold-bright/70 bg-gold-bright/5 animate-glow-pulse",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-bright/12">
                      <Icon className="h-4 w-4 text-gold-bright" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-gold-bright">
                        {cell.title}
                        {highlighted ? (
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
                        ) : null}
                      </p>
                      <p className="text-xs leading-relaxed text-zinc-400">{cell.description}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Plano atual
                </p>
                <p className="mt-1 text-base font-semibold text-zinc-900">Comum</p>
                <ul className="mt-4 space-y-3.5">
                  {sharedGains.map((gain, index) => (
                    <li
                      key={gain.id}
                      className={cn(
                        "space-y-0.5",
                        index === 0 && "pb-3.5 border-b border-zinc-100",
                      )}
                    >
                      <p className="text-[13px] font-semibold leading-snug text-zinc-800">
                        {gain.label}
                      </p>
                      <p className="text-sm leading-snug text-zinc-600">{gain.from}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gold/40 bg-premium-surface p-4 text-white">
                <p className="font-display text-xl font-semibold leading-none text-gold-bright [-webkit-text-stroke:0.6px_var(--color-gold)]">
                  Premium
                </p>
                <ul className="mt-4 space-y-3.5">
                  {sharedGains.map((gain, index) => (
                    <li
                      key={gain.id}
                      className={cn(
                        "space-y-0.5",
                        index === 0 && "pb-3.5 border-b border-white/10",
                      )}
                    >
                      <p className="text-[13px] font-semibold leading-snug text-gold-bright">
                        {gain.label}
                      </p>
                      <p className="text-sm leading-snug text-zinc-200">{gain.to}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
                    Exclusivo Premium
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {PREMIUM_EXCLUSIVE_FEATURES.map((feature) => (
                      <li key={feature} className="text-sm leading-snug text-zinc-200">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-center text-sm leading-relaxed text-zinc-600">
                Economize {savingsPercent}% no plano semestral
              </p>
              <div className="grid grid-cols-2 gap-2">
                {planOptions.map((option) => {
                  const selected = billingCycle === option.cycle;
                  return (
                    <button
                      key={option.cycle}
                      type="button"
                      onClick={() => setBillingCycle(option.cycle)}
                      className={cn(
                        "relative rounded-xl border px-3 py-3 text-left transition",
                        selected
                          ? "border-gold bg-premium-surface shadow-[0_0_0_1px_rgba(218,165,32,0.35)]"
                          : "border-zinc-200 bg-white hover:border-gold/50",
                      )}
                    >
                      {option.badge ? (
                        <span
                          className={cn(
                            "absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            selected
                              ? "bg-gold-bright text-premium-surface"
                              : "bg-zinc-900 text-gold-bright",
                          )}
                        >
                          {option.badge}
                        </span>
                      ) : null}
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          selected ? "text-gold-bright" : "text-zinc-900",
                        )}
                      >
                        {option.label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-base font-bold leading-none",
                          selected ? "text-white" : "text-zinc-800",
                        )}
                      >
                        {currency(option.price)}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-medium",
                          selected ? "text-zinc-400" : "text-zinc-500",
                        )}
                      >
                        {option.cycle === "monthly" ? "por mês" : "por semestre"}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-sm font-semibold text-zinc-900">
                {currency(selectedPlan.monthlyEquivalent)}/mês
                <span className="ml-1 font-normal text-zinc-500">
                  · {BILLING_LABELS[billingCycle].toLowerCase()}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
