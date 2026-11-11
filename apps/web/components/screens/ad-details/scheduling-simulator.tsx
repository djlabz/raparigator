"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { Check, Lock, MessageSquare, DollarSign, Zap, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PixIcon } from "@/components/ui/pix-icon";
import { CashIcon } from "@/components/ui/cash-icon";
import { VerifiedCheckIcon } from "@/components/ui/verified-check-icon";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";
import {
  ENCOUNTER_SIMULATOR_ANCHOR,
  ENCOUNTER_SIMULATOR_SCROLL_MARGIN,
} from "@/lib/encounter-brief";
import { useContactCta } from "./use-contact-cta";
import type { AdDetailsVariant } from "./variant";
import type { EncounterBrief, ProfessionalAd } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

const SIMULATOR_THEME = {
  premium: {
    card: "border-y-zinc-200/80 border-r-zinc-200/80 border-l-4 border-l-wine-800 bg-linear-to-br from-white to-zinc-50/40 shadow-md",
    titleIcon: "text-wine-800",
    optionSelected: "border-wine-800 bg-red-50/40 ring-1 ring-wine-800/30 shadow-sm",
    extraSelected: "border-wine-800 bg-red-50/40 ring-1 ring-wine-800/30 shadow-xs",
    selectedText: "text-wine-800",
    checkOn: "border-wine-800 bg-wine-800 text-white",
    plus: "text-wine-800",
    popularBadge: "bg-[#ffc107] text-zinc-900",
    summary: "bg-zinc-950 text-white shadow-lg",
    summaryRow: "text-zinc-400",
    summaryValue: "",
    summaryDivider: "border-zinc-800",
    totalLabel: "text-zinc-100",
    totalIcon: "text-emerald-400",
    totalValue: "text-amber-300",
    actions: "bg-zinc-900/50",
    loginButton: "bg-zinc-800 text-white ring-1 ring-white/5 hover:bg-zinc-700",
    chatButton: "bg-zinc-800 text-white ring-1 ring-white/5 hover:bg-zinc-700",
    externalButton: "bg-zinc-800 ring-1 ring-white/5 hover:bg-zinc-700",
  },
  standard: {
    card: "border border-zinc-200/80 bg-white shadow-sm",
    titleIcon: "text-wine-700",
    optionSelected: "border-wine-700 bg-red-50/40 ring-1 ring-wine-700/30 shadow-sm",
    extraSelected: "border-wine-700 bg-red-50/40 ring-1 ring-wine-700/30 shadow-xs",
    selectedText: "text-wine-700",
    checkOn: "border-wine-700 bg-wine-700 text-white",
    plus: "text-wine-700",
    popularBadge: "bg-zinc-800 text-white",
    summary: "border border-zinc-200 bg-zinc-50 shadow-sm",
    summaryRow: "text-zinc-600",
    summaryValue: "font-medium text-zinc-900",
    summaryDivider: "border-zinc-300",
    totalLabel: "text-zinc-900",
    totalIcon: "text-emerald-600",
    totalValue: "text-zinc-900",
    actions: "border-t border-zinc-100 bg-white",
    loginButton: "bg-zinc-900 text-white! ring-1 ring-zinc-950/5 hover:bg-zinc-800",
    chatButton: "bg-wine-700 text-white hover:bg-wine-800",
    externalButton: "border border-zinc-200 bg-white hover:bg-zinc-50",
  },
} as const satisfies Record<AdDetailsVariant, Record<string, string>>;

const PAYMENT_METHOD_OPTIONS = [
  {
    id: "pix",
    label: "Pix",
    Icon: PixIcon,
    iconClassName: "text-teal-500",
    iconSlotClassName: undefined,
  },
  {
    id: "dinheiro",
    label: "Dinheiro",
    Icon: CashIcon,
    iconClassName: "text-emerald-600",
    iconSlotClassName: "w-5",
  },
] as const;

function PaymentMethodBadge({
  label,
  Icon,
  iconClassName,
  iconSlotClassName,
}: {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  iconSlotClassName?: string;
}) {
  const icon = <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} />;

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-zinc-500 select-none"
      title={label}
    >
      {iconSlotClassName ? (
        <span className={cn("inline-flex shrink-0 items-center justify-center", iconSlotClassName)}>
          {icon}
        </span>
      ) : (
        icon
      )}
      {label}
    </span>
  );
}

interface SchedulingSimulatorProps {
  ad: ProfessionalAd;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
  basePrice: number;
  calculatedExtrasCost: number;
  totalCalculatedValue: number;
  role: string;
  variant: AdDetailsVariant;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  brief: EncounterBrief | null;
}

export function SchedulingSimulator({
  ad,
  selectedDuration,
  setSelectedDuration,
  selectedExtras,
  toggleExtra,
  basePrice,
  calculatedExtrasCost,
  totalCalculatedValue,
  role,
  variant,
  setRiskTarget,
  brief,
}: SchedulingSimulatorProps) {
  const theme = SIMULATOR_THEME[variant];
  const { onLoginClick, openChatWithBrief } = useContactCta(brief);

  return (
    <Card
      id={ENCOUNTER_SIMULATOR_ANCHOR}
      className={cn(
        "relative space-y-5 overflow-hidden rounded-2xl p-5 sm:p-6",
        theme.card,
        ENCOUNTER_SIMULATOR_SCROLL_MARGIN,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <h3 className="flex min-w-0 shrink items-center gap-2.5 font-display text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
            <Zap className={cn("h-5 w-5 shrink-0", theme.titleIcon)} /> Simulador de Encontro
          </h3>
          <div className="mt-0.5 shrink-0">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs font-bold tracking-widest text-emerald-800 uppercase sm:text-xs">
              <VerifiedCheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{" "}
              <span className="hidden sm:inline">Serviço</span> Seguro
            </span>
          </div>
        </div>
        {ad.paymentMethods && ad.paymentMethods.length > 0 && (
          <div className="-mx-1 flex flex-nowrap items-center gap-x-2.5 overflow-x-auto px-1 sm:gap-x-3">
            <span className="shrink-0 text-[11px] font-black uppercase tracking-widest text-zinc-900">
              Aceita:
            </span>
            {PAYMENT_METHOD_OPTIONS.map((option) =>
              ad.paymentMethods?.includes(option.id) ? (
                <PaymentMethodBadge
                  key={option.id}
                  label={option.label}
                  Icon={option.Icon}
                  iconClassName={option.iconClassName}
                  iconSlotClassName={
                    "iconSlotClassName" in option ? option.iconSlotClassName : undefined
                  }
                />
              ) : null,
            )}
            {ad.paymentMethods.includes("credito") && ad.paymentMethods.includes("debito") ? (
              <PaymentMethodBadge
                key="credito-debito"
                label="Crédito e Débito"
                Icon={CreditCard}
                iconClassName="text-indigo-500"
              />
            ) : (
              <>
                {ad.paymentMethods.includes("credito") && (
                  <PaymentMethodBadge
                    key="credito"
                    label="Crédito"
                    Icon={CreditCard}
                    iconClassName="text-indigo-500"
                  />
                )}
                {ad.paymentMethods.includes("debito") && (
                  <PaymentMethodBadge
                    key="debito"
                    label="Débito"
                    Icon={CreditCard}
                    iconClassName="text-indigo-500"
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {ad.pricingTable.map((plan) => {
          const isSelected = selectedDuration === plan.label;
          return (
            <button
              key={plan.label}
              type="button"
              onClick={() => setSelectedDuration(plan.label)}
              className={cn(
                "group relative flex min-h-15.5 cursor-pointer flex-nowrap items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all sm:min-h-16.5 sm:px-5 sm:py-3.5",
                isSelected
                  ? theme.optionSelected
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
              )}
            >
              <div className="flex min-w-0 shrink flex-col pr-2">
                <span className="text-xs font-black tracking-widest whitespace-nowrap text-zinc-400 uppercase sm:text-xs">
                  Duração
                </span>
                <span
                  className={cn(
                    "mt-0.5 truncate text-sm font-semibold whitespace-nowrap sm:text-base",
                    isSelected ? cn("font-bold", theme.selectedText) : "text-zinc-700",
                  )}
                >
                  {plan.label}
                </span>
              </div>

              <div className="flex shrink-0 flex-nowrap items-center gap-3">
                {isSelected && (
                  <span className="mr-1 text-sm font-bold whitespace-nowrap text-zinc-900 sm:text-base">
                    {currency(plan.price)}
                  </span>
                )}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    isSelected ? theme.checkOn : "border-zinc-200 bg-zinc-50/50",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </div>

              {plan.label === "1 hora" && (
                <span
                  className={cn(
                    "absolute -top-2.5 right-3 z-10 block rounded-full border-2 border-white px-3 py-0.5 text-xs leading-none font-extrabold tracking-widest uppercase shadow-sm sm:right-4 sm:text-xs",
                    theme.popularBadge,
                  )}
                >
                  Popular
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <p className="text-xs font-bold tracking-widest text-zinc-900 uppercase sm:text-xs">
          Deseja incluir algum adicional?
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ad.services.map((svc) => {
            const hasExtra = selectedExtras.includes(svc);
            return (
              <button
                key={svc}
                type="button"
                onClick={() => toggleExtra(svc)}
                className={cn(
                  "flex min-h-11.5 cursor-pointer items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all sm:min-h-12.5 sm:px-4",
                  hasExtra
                    ? theme.extraSelected
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
                )}
              >
                <span
                  className={cn(
                    "truncate pr-1 text-xs font-medium sm:pr-2 sm:text-sm",
                    hasExtra ? "font-semibold text-zinc-900" : "text-zinc-700",
                  )}
                >
                  {svc}
                </span>

                <div className="flex shrink-0 items-center gap-3">
                  {hasExtra && (
                    <span className="flex items-center text-sm font-medium text-zinc-900">
                      <span className={cn("mr-1 font-bold", theme.plus)}>+</span> {currency(150)}
                    </span>
                  )}
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      hasExtra ? theme.checkOn : "border-zinc-200 bg-zinc-50/50",
                    )}
                  >
                    {hasExtra && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("mt-2 flex flex-col overflow-hidden rounded-2xl", theme.summary)}>
        <div className="space-y-3 p-5 pb-4">
          <div className={cn("flex items-center justify-between text-xs", theme.summaryRow)}>
            <span>Encontro Selecionado ({selectedDuration})</span>
            <span className={cn("font-mono", theme.summaryValue)}>{currency(basePrice)}</span>
          </div>
          {selectedExtras.length > 0 && (
            <div
              className={cn(
                "animate-slide-in flex items-center justify-between text-xs",
                theme.summaryRow,
              )}
            >
              <span>Adicionais Personalizados ({selectedExtras.length})</span>
              <span className={cn("flex items-center font-mono", theme.summaryValue)}>
                <span className={cn("mr-1.5 font-bold", theme.plus)}>+</span>{" "}
                {currency(calculatedExtrasCost)}
              </span>
            </div>
          )}
          <div
            className={cn(
              "mt-2 flex items-center justify-between border-t border-dashed pt-3 text-sm",
              theme.summaryDivider,
            )}
          >
            <span className={cn("flex items-center gap-1.5 font-bold", theme.totalLabel)}>
              <DollarSign className={cn("h-4 w-4", theme.totalIcon)} />
              Valor Total:
            </span>
            <span className={cn("font-mono text-lg font-black", theme.totalValue)}>
              {currency(totalCalculatedValue)}
            </span>
          </div>
        </div>

        <div className={cn("flex flex-col gap-2.5 p-4", theme.actions)}>
          {role === "visitor" ? (
            <Link
              href="/auth/login"
              onClick={onLoginClick}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold shadow-sm transition-all active:scale-[0.98]",
                theme.loginButton,
              )}
            >
              <Lock className="h-4 w-4" /> Entrar para Interagir
            </Link>
          ) : (
            <button
              type="button"
              onClick={openChatWithBrief}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold shadow-sm transition-all active:scale-[0.98]",
                theme.chatButton,
              )}
            >
              <MessageSquare className="h-4 w-4" /> Chat Direto
            </button>
          )}
          <div className="flex w-full items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRiskTarget("WhatsApp")}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold text-whatsapp shadow-sm transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none active:scale-[0.98]",
                theme.externalButton,
              )}
            >
              <WhatsAppIcon className="h-4.5 w-4.5" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setRiskTarget("Telegram")}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold text-telegram shadow-sm transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none active:scale-[0.98]",
                theme.externalButton,
              )}
            >
              <TelegramIcon className="h-4.5 w-4.5" /> Telegram
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
