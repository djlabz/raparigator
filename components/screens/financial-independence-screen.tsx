"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoHint } from "@/components/ui/info-hint";
import { Select } from "@/components/ui/select";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PremiumConversionModal } from "@/components/ui/premium-conversion-modal";
import { chromeBelowHeaderStickyTop } from "@/lib/chrome-styles";
import { usePremiumPlan, PREMIUM_VISIBILITY_MULTIPLIER } from "@/lib/premium-plan";
import { cn, currency } from "@/lib/utils";

const TARGET = 1_000_000;
const MIN_WAGE = 1512;
const CLT_INSS_RATE = 0.075;
const CLT_VT_RATE = 0.06;
const CLT_FGTS_RATE = 0.08;

function buildCltReference() {
  const gross = MIN_WAGE;
  const inss = gross * CLT_INSS_RATE;
  const transport = gross * CLT_VT_RATE;
  const fgtsEmployer = gross * CLT_FGTS_RATE;
  const net = gross - inss - transport;
  return { gross, inss, transport, fgtsEmployer, net };
}

function CltPayrollBreakdown({
  gross,
  inss,
  transport,
  fgtsEmployer,
  net,
}: {
  gross: number;
  inss: number;
  transport: number;
  fgtsEmployer: number;
  net: number;
}) {
  return (
    <div className="space-y-2" data-testid="clt-payroll-breakdown">
      <p className="font-semibold text-zinc-800">Referência CLT (salário mínimo)</p>
      <ul className="space-y-1 text-zinc-600">
        <li className="flex justify-between gap-3">
          <span>Bruto</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(gross)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− INSS ({(CLT_INSS_RATE * 100).toFixed(1).replace(".", ",")}%)</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(inss)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− Vale-transporte ({(CLT_VT_RATE * 100).toFixed(0)}%)</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(transport)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− IRRF</span>
          <span className="shrink-0 font-medium text-zinc-800">{currency(0)}</span>
        </li>
        <li className="flex justify-between gap-3 border-t border-zinc-100 pt-1 font-semibold text-zinc-800">
          <span>= Líquido na comparação</span>
          <span className="shrink-0">{currency(net)}</span>
        </li>
      </ul>
      <p className="text-[11px] leading-snug text-zinc-500">
        FGTS ({(CLT_FGTS_RATE * 100).toFixed(0)}% = {currency(fgtsEmployer)}) é depósito do empregador na conta do trabalhador — não desconta do contracheque. IRRF no mínimo costuma ser R$ 0.
      </p>
    </div>
  );
}

// Metas tangíveis para o "Conceito C"
const DREAMS = [
  { id: "moto", label: "Moto Esportiva", price: 35_000, icon: IconMoto },
  { id: "carro", label: "Carro SUV", price: 120_000, icon: IconCar },
  { id: "casa", label: "Casa Própria", price: 350_000, icon: IconHome },
  { id: "milhao", label: "Liberdade (1 Milhão)", price: 1_000_000, icon: IconTrophy, highlight: true },
];

// --- Ícones SVG Inline ---
function IconRocket(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4-1 4-1" /><path d="M12 15v5s3.03-.55 4-2c1.1-1.62 1-4 1-4" /></svg>;
}
function IconTurtle(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 7-7 5-7-5" /><path d="M12 22a10 10 0 0 1-10-10" /><path d="M22 12a10 10 0 0 1-10 10" /><circle cx="12" cy="12" r="3" /></svg>;
}
function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
}
function IconMoto(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h-5a1 1 0 0 0-1 1v4h-3v-3h2l1-4h3l2 2Z" /><path d="M12 11h7v3h-3" /></svg>;
}
function IconCar(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M14 14h6" /></svg>;
}
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
function IconTrophy(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
}
function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
}
function IconMinus(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="0.5" y="0.5" width="23" height="23" rx="11.5" stroke="currentColor" strokeWidth="1" /><path d="M17.3334 12H6.66669" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="0.5" y="0.5" width="23" height="23" rx="11.5" stroke="currentColor" strokeWidth="1" /><path fillRule="evenodd" clipRule="evenodd" d="M11.3334 11.3333V7.33332C11.3334 6.96666 11.6334 6.66666 12 6.66666C12.3667 6.66666 12.6667 6.96666 12.6667 7.33332V11.3333H16.6667C17.0334 11.3333 17.3334 11.6333 17.3334 12C17.3334 12.3667 17.0334 12.6667 16.6667 12.6667H12.6667V16.6667C12.6667 17.0333 12.3667 17.3333 12 17.3333C11.6334 17.3333 11.3334 17.0333 11.3334 16.6667V12.6667H7.33335C6.96669 12.6667 6.66669 12.3667 6.66669 12C6.66669 11.6333 6.96669 11.3333 7.33335 11.3333H11.3334Z" fill="currentColor" /></svg>;
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

function IconDollarSign(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="1" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

// --- Componente Counter (input com botões +/-) ---
interface CounterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  highlighted?: boolean;
}

function Counter({ label, value, onChange, step = 1, min = 0, max = 9999, prefix, suffix, icon, highlighted = false }: CounterProps) {
  const adjust = (delta: number) => {
    const current = Number(value) || min;
    const next = Math.max(min, Math.min(max, current + delta));
    onChange(String(next));
  };

  return (
    <div className="space-y-1">
      <label className="text-xs sm:text-sm font-medium text-zinc-700 flex items-center gap-2">
        {icon && <span className="text-zinc-600">{icon}</span>}
        {label}
      </label>
      <div className={`flex h-10 items-center justify-between rounded-xl border px-3 transition-all ${highlighted
        ? 'border-wine-300 bg-wine-50/30 shadow-sm'
        : 'border-zinc-200 bg-white'
        }`}>
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="flex shrink-0 items-center justify-center border-0 bg-transparent p-1.5 hover:bg-zinc-100 rounded-lg transition-colors -ml-1.5"
          aria-label={`diminui ${step}`}
        >
          <IconMinus className="w-5 h-5 text-zinc-700" />
        </button>
        <div className="flex items-center text-sm font-semibold text-zinc-900">
          {prefix && <span className="text-xs text-zinc-500 mr-1">{prefix}</span>}
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const num = e.target.value.replace(/\D/g, "");
              onChange(num);
            }}
            className="w-12 text-center text-sm rounded-none border-none bg-transparent font-semibold text-zinc-900 focus:outline-none"
            inputMode="numeric"
          />
          {suffix && <span className="text-xs text-zinc-500 ml-1">/{suffix}</span>}
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          className="flex shrink-0 items-center justify-center border-0 bg-transparent p-1.5 hover:bg-zinc-100 rounded-lg transition-colors -mr-1.5"
          aria-label={`adiciona ${step}`}
        >
          <IconPlus className="w-5 h-5 text-zinc-700" />
        </button>
      </div>
    </div>
  );
}

// --- Funções Auxiliares ---
function formatDurationDetailed(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = Math.ceil(totalMonths % 12);

  if (years > 0) {
    if (months > 0) return `${years} Anos e ${months} Meses`;
    return `${years} Anos`;
  }
  return `${months} Meses`;
}

export function FinancialIndependenceScreen() {
  const [valuePerService, setValuePerService] = useState("300");
  const [servicesPerDay, setServicesPerDay] = useState("4");
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState("5");

  const [projectionTime, setProjectionTime] = useState("");
  const [projectionUnit, setProjectionUnit] = useState("months");

  const [submitted, setSubmitted] = useState(false);
  const [infoOpenId, setInfoOpenId] = useState<string | null>(null);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [topSearchBoost, setTopSearchBoost] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const { isPremium } = usePremiumPlan();
  const reduceMotion = useReducedMotion();
  const heroMotionTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 28 };

  useEffect(() => {
    if (!submitted) return;
    const onScroll = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        setHeroCollapsed(false);
        return;
      }
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y > 80) setHeroCollapsed(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [submitted]);

  const parsed = useMemo(() => {
    const value = Number(valuePerService);
    const services = Number(servicesPerDay);
    const days = Number(workDaysPerWeek);

    // Validação básica
    const valid = value > 0 && services > 0 && days > 0 && days <= 7;
    if (!valid) return null;

    // Receita do Usuário
    const boostMultiplier = topSearchBoost ? PREMIUM_VISIBILITY_MULTIPLIER : 1;
    const dailyRevenue = value * services * boostMultiplier;
    const weeklyRevenue = dailyRevenue * days;
    const monthlyRevenue = weeklyRevenue * 4.33;

    const baseMonthlyRevenue = value * services * days * 4.33;
    const monthsToMillionBase = Math.ceil(TARGET / baseMonthlyRevenue);

    const clt = buildCltReference();

    const monthsToMillionUser = Math.ceil(TARGET / monthlyRevenue);
    const monthsToMillionCLT = Math.ceil(TARGET / clt.net);

    const monthsSaved = monthsToMillionCLT - monthsToMillionUser;
    const yearsSaved = Math.floor(monthsSaved / 12);

    const equivalenceRatio = monthlyRevenue / clt.net;

    // Metas atingidas
    const dreamsCalculated = DREAMS.map(dream => ({
      ...dream,
      monthsToAchieve: Math.ceil(dream.price / monthlyRevenue)
    }));

    // CÁLCULO DA PROJEÇÃO (MONTANTE ACUMULADO)
    // Se não preencheu nada ou valor é 0, o padrão é 1 mês
    const effectiveTimeNum = Number(projectionTime) > 0 ? Number(projectionTime) : 1;
    const effectiveUnit = Number(projectionTime) > 0 ? projectionUnit : "months";

    const projectionMonths = effectiveUnit === "years" ? effectiveTimeNum * 12 : effectiveTimeNum;
    const projectedAmount = monthlyRevenue * projectionMonths;

    return {
      monthlyRevenue,
      monthsToMillionUser,
      monthsToMillionCLT,
      yearsSaved,
      equivalenceRatio,
      dreamsCalculated,
      projectedAmount,
      effectiveTimeNum,
      effectiveUnit,
      monthsSavedWithPremium: monthsToMillionBase - monthsToMillionUser,
      projectionMonths,
      clt,
    };
  }, [valuePerService, servicesPerDay, workDaysPerWeek, projectionTime, projectionUnit, topSearchBoost]);

  const cltReference = useMemo(() => buildCltReference(), []);

  const handleReset = () => {
    setSubmitted(false);
    setInfoOpenId(null);
    setHeroCollapsed(false);
  };

  // Lógica para clarear/escurecer os inputs de meta de tempo
  // Reseta ao estado inicial se o valor for 0 ou vazio
  const hasProjection = Number(projectionTime) > 0;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4 overflow-x-clip md:space-y-5">

        {!submitted && (
          <>
            <header className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-zinc-900 md:text-2xl">Calculadora de Liberdade</h1>
                <InfoHint
                  id="calc-base"
                  label="Como calculamos"
                  openId={infoOpenId}
                  onOpenChange={setInfoOpenId}
                >
                  <div className="space-y-3">
                    <p>
                      Seu ritmo mensal: valor × atendimentos × dias × 4,33 semanas.
                    </p>
                    <CltPayrollBreakdown {...cltReference} />
                  </div>
                </InfoHint>
              </div>
              <p className="text-sm text-zinc-600">Descubra o quão rápido você pode atingir sua independência financeira.</p>
            </header>

            <Card className="space-y-4 p-4 md:space-y-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                <Counter
                  label="Valor por atendimento"
                  value={valuePerService}
                  onChange={setValuePerService}
                  step={50}
                  min={50}
                  max={9999}
                  prefix="R$"
                  icon={<IconDollarSign className="w-4 h-4" />}
                />
                <Counter
                  label="Atendimentos por dia"
                  value={servicesPerDay}
                  onChange={setServicesPerDay}
                  step={1}
                  min={1}
                  max={20}
                  icon={<IconUsers className="w-4 h-4" />}
                />
                <Counter
                  label="Dias de trabalho por semana"
                  value={workDaysPerWeek}
                  onChange={setWorkDaysPerWeek}
                  step={1}
                  min={1}
                  max={7}
                  icon={<IconCalendar className="w-4 h-4" />}
                />

                <div className={`flex gap-2 transition-all duration-300 ${hasProjection ? 'opacity-100 grayscale-0' : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                  <div className="flex-1">
                    <Counter
                      label="Meta de tempo (Opcional)"
                      value={projectionTime}
                      onChange={(e) => setProjectionTime(Number(e) > 0 ? e : "")}
                      step={1}
                      min={0}
                      max={120}
                      icon={<IconClock className="w-4 h-4" />}
                      highlighted={hasProjection}
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      id="unidade-tempo"
                      label="Unidade"
                      value={projectionUnit}
                      onChange={(e) => setProjectionUnit(e.target.value)}
                      options={[
                        { value: "months", label: "Meses" },
                        { value: "years", label: "Anos" },
                      ]}
                      className={hasProjection ? "border-wine-300 bg-wine-50/30 text-wine-900" : "border-zinc-200 bg-white text-zinc-900"}
                    />
                  </div>
                </div>
              </div>

              {parsed ? (
                <div
                  data-testid="freedom-live-preview"
                  className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-center"
                >
                  <p className="text-lg font-bold text-emerald-700 md:text-xl">
                    ≈ {currency(parsed.monthlyRevenue)} / mês
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-800/80 md:text-sm">
                    {parsed.yearsSaved > 0
                      ? `~${parsed.yearsSaved} anos a menos que o ritmo CLT`
                      : "Você já está no ritmo — refine os números"}
                  </p>
                </div>
              ) : null}

              <Button
                size="lg"
                className="w-full text-base font-semibold md:text-lg"
                onClick={() => {
                  setInfoOpenId(null);
                  setSubmitted(true);
                }}
              >
                Ver meu Painel da Liberdade 🚀
              </Button>
            </Card>
          </>
        )}

        {submitted && parsed ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-4">
            <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${topSearchBoost ? "border-[#DAA520]/50 bg-[#121212] shadow-zinc-900/20" : "border-zinc-200 bg-white shadow-zinc-200/70"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-bold ${topSearchBoost ? "text-[#FFDF00]" : "text-zinc-900"}`}>
                      Topo das Pesquisas
                    </p>
                    <InfoHint
                      id="premium"
                      label="Sobre o Topo das Pesquisas"
                      openId={infoOpenId}
                      onOpenChange={setInfoOpenId}
                      className={topSearchBoost ? "[&_button]:border-[#DAA520]/60 [&_button]:bg-zinc-900 [&_button]:text-[#FFDF00] [&_button]:hover:border-[#DAA520] [&_button]:hover:text-[#FFDF00]" : undefined}
                    >
                      Simula o efeito da visibilidade Premium nos seus números.
                    </InfoHint>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={topSearchBoost}
                  aria-label="Simular com Topo das Pesquisas"
                  onClick={() => setTopSearchBoost((prev) => !prev)}
                  className={`relative h-7 w-13 shrink-0 rounded-full transition-colors ${topSearchBoost ? "bg-[#DAA520] premium-glow-pulse" : "bg-zinc-200"}`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow ${topSearchBoost ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`}
                  />
                </button>
              </div>
              <AnimatePresence>
                {topSearchBoost ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <motion.p
                        key={parsed.monthsSavedWithPremium}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                        className="text-sm text-zinc-300"
                      >
                        <span className="font-bold text-[#FFDF00]">−{parsed.monthsSavedWithPremium} meses</span> de trabalho
                        até a sua liberdade com o Premium
                      </motion.p>
                      {!isPremium ? (
                        <ShinyButton size="sm" onClick={() => setUpsellOpen(true)}>
                          Garantir meu Topo das Pesquisas
                        </ShinyButton>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div
              data-testid="freedom-hero"
              data-collapsed={heroCollapsed ? "true" : "false"}
              className={cn(
                "z-10 w-full min-w-0 max-w-full border border-emerald-200/90 bg-emerald-50/95 backdrop-blur-md",
                "sticky [overflow-anchor:none]",
                chromeBelowHeaderStickyTop,
                "md:top-[calc(9rem+env(safe-area-inset-top,0px))]",
                heroCollapsed
                  ? "rounded-xl px-3 py-2 shadow-md md:rounded-2xl md:px-4 md:py-3 md:shadow-sm"
                  : "rounded-2xl p-4 shadow-sm md:p-5",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {heroCollapsed ? (
                  <motion.div
                    key="compact"
                    data-testid="freedom-hero-compact"
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={heroMotionTransition}
                    className="flex w-full min-w-0 items-center gap-2 md:hidden"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-emerald-800/70">
                        Sua liberdade
                      </p>
                      <div className="flex min-w-0 items-baseline gap-1.5">
                        <span className="shrink-0 text-sm font-bold text-emerald-700">
                          {parsed.yearsSaved > 0 ? `${parsed.yearsSaved} anos` : "No ritmo"}
                        </span>
                        <span className="text-emerald-600/50" aria-hidden>
                          ·
                        </span>
                        <span className="truncate text-sm font-bold text-emerald-700">
                          {currency(parsed.projectedAmount)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500"
                      aria-label="Nova Simulação"
                    >
                      <IconRefresh className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
                    transition={heroMotionTransition}
                    className="space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl font-bold text-zinc-900 md:text-3xl">
                        {parsed.yearsSaved > 0 ? (
                          <>
                            Você está comprando{" "}
                            <span className="text-emerald-600">{parsed.yearsSaved} anos</span> da sua vida de volta.
                          </>
                        ) : (
                          <>Você já está no ritmo — refine os números.</>
                        )}
                      </h2>
                      <div className="hidden shrink-0 md:block">
                        <Button
                          onClick={handleReset}
                          className="h-9 items-center gap-2 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200"
                        >
                          <IconRefresh className="h-4 w-4" />
                          Nova Simulação
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 md:hidden">
                      Esse é o poder de valorizar a sua hora de trabalho.
                    </p>
                    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-emerald-200/80 pt-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                            Montante em {parsed.effectiveTimeNum}{" "}
                            {parsed.effectiveUnit === "years"
                              ? parsed.effectiveTimeNum === 1
                                ? "ano"
                                : "anos"
                              : parsed.effectiveTimeNum === 1
                                ? "mês"
                                : "meses"}
                          </p>
                          <InfoHint
                            id="amount"
                            label="Sobre o montante"
                            openId={infoOpenId}
                            onOpenChange={setInfoOpenId}
                            align="end"
                          >
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-zinc-800">Como chega nesse montante</p>
                                <p>
                                  {currency(parsed.monthlyRevenue)} / mês × {parsed.projectionMonths}{" "}
                                  {parsed.projectionMonths === 1 ? "mês" : "meses"} ={" "}
                                  <span className="font-semibold text-zinc-800">{currency(parsed.projectedAmount)}</span>
                                </p>
                                <p className="text-[11px] text-zinc-500">
                                  Base: valor × atendimentos × dias × 4,33 semanas.
                                </p>
                              </div>
                              <CltPayrollBreakdown {...parsed.clt} />
                            </div>
                          </InfoHint>
                        </div>
                        <p data-testid="freedom-hero-amount" className="text-3xl font-bold text-emerald-600 md:text-4xl">
                          {currency(parsed.projectedAmount)}
                        </p>
                      </div>
                      <Button
                        onClick={handleReset}
                        className="inline-flex h-9 items-center gap-2 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200 md:hidden"
                      >
                        <IconRefresh className="h-4 w-4" />
                        Nova Simulação
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div data-testid="freedom-metrics-grid" className="grid gap-3 md:grid-cols-2 md:gap-4">
              <Card className="relative overflow-hidden border-zinc-200 p-4 shadow-sm md:col-span-1 md:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">🏁 A Corrida do Milhão</h3>
                  <InfoHint
                    id="race"
                    label="Sobre a corrida do milhão"
                    openId={infoOpenId}
                    onOpenChange={setInfoOpenId}
                  >
                    <div className="space-y-3">
                      <p>
                        Tempo para juntar R$ 1 milhão no seu ritmo vs poupando o líquido CLT de{" "}
                        {currency(parsed.clt.net)} / mês.
                      </p>
                      <CltPayrollBreakdown {...parsed.clt} />
                    </div>
                  </InfoHint>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-end justify-between text-sm">
                      <div className="flex items-center gap-2 font-bold text-emerald-700">
                        <IconRocket className="h-5 w-5" /> SEU RITMO
                      </div>
                      <motion.span
                        key={parsed.monthsToMillionUser}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 20 }}
                        className={`text-lg font-bold ${topSearchBoost ? "text-[#DAA520]" : "text-emerald-600"}`}
                      >
                        {formatDurationDetailed(parsed.monthsToMillionUser)}
                      </motion.span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full w-[95%] animate-pulse rounded-full bg-emerald-500"></div>
                    </div>
                  </div>

                  <div className="space-y-2 opacity-60">
                    <div className="flex items-end justify-between text-sm">
                      <div className="flex items-center gap-2 font-semibold text-zinc-600">
                        <IconTurtle className="h-5 w-5" /> RITMO PADRÃO (CLT)
                      </div>
                      <span className="font-semibold text-zinc-500">{formatDurationDetailed(parsed.monthsToMillionCLT)}</span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full w-[15%] rounded-full bg-zinc-400"></div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 md:col-span-1">
                <Card className="flex flex-col items-center justify-center space-y-2 border-wine-100 bg-wine-50 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-wine-700">Sua potência</p>
                  <div className="text-3xl font-bold text-zinc-900 md:text-4xl">1 Mês</div>
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                    <IconCalendar className="h-5 w-5" />
                    <span>do seu trabalho</span>
                  </div>
                </Card>

                <Card className="relative flex flex-col items-center justify-center space-y-2 overflow-hidden border-zinc-200 bg-zinc-50 p-4 text-center">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <IconCalendar className="h-24 w-24" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Equivale a</p>
                    <InfoHint
                      id="equivalence"
                      label="Sobre a equivalência"
                      openId={infoOpenId}
                      onOpenChange={setInfoOpenId}
                      align="end"
                    >
                      <div className="space-y-3">
                        <p>
                          1 mês no seu ritmo ({currency(parsed.monthlyRevenue)}) equivale a{" "}
                          {parsed.equivalenceRatio.toFixed(1).replace(".", ",")} meses do líquido CLT.
                        </p>
                        <CltPayrollBreakdown {...parsed.clt} />
                      </div>
                    </InfoHint>
                  </div>
                  <div className="text-3xl font-bold text-zinc-700 md:text-4xl">
                    {parsed.equivalenceRatio.toFixed(1).replace('.', ',')} Meses
                  </div>
                  <div className="flex items-center justify-center gap-2 text-zinc-500">
                    <span className="text-sm">de um trabalho comum (CLT)</span>
                  </div>
                </Card>
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 ml-1 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">🏆 Linha do Tempo das Conquistas</h3>
                  <InfoHint
                    id="dreams"
                    label="Sobre as conquistas"
                    openId={infoOpenId}
                    onOpenChange={setInfoOpenId}
                  >
                    Tempo estimado para cada meta mantendo o ritmo simulado.
                  </InfoHint>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
                  {parsed.dreamsCalculated.map((dream) => (
                    <Card
                      key={dream.id}
                      className={`flex h-full flex-col justify-between border-2 p-3 transition-all hover:scale-105 md:p-4 ${dream.highlight
                        ? "border-emerald-100 bg-emerald-50/50"
                        : "border-transparent bg-white shadow-sm hover:border-zinc-200"
                        }`}
                    >
                      <div className="space-y-2 md:space-y-3">
                        <div className={`w-fit rounded-lg p-2 ${dream.highlight ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                          <dream.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${dream.highlight ? 'text-emerald-700' : 'text-zinc-900'}`}>
                            {dream.label}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{currency(dream.price)}</p>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-dashed border-zinc-200 pt-2 md:mt-4 md:pt-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Você conquista em</p>
                        <motion.p
                          key={dream.monthsToAchieve}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 380, damping: 20 }}
                          className={`text-xl font-bold ${topSearchBoost ? "text-[#DAA520]" : dream.highlight ? 'text-emerald-600' : 'text-zinc-800'}`}
                        >
                          {formatDurationDetailed(dream.monthsToAchieve)}
                        </motion.p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <PremiumConversionModal
          open={upsellOpen}
          onClose={() => setUpsellOpen(false)}
          highlight="topSearch"
          from="topSearch"
        />

        {/* Empty State para erros */}
        {submitted && !parsed && (
          <div className="pt-4">
            <EmptyState
              title="Hmm, esses números não fecharam"
              description="Dá uma olhadinha nos valores — por aqui a gente só aceita números positivos, combinado?"
            />
            <Button variant="ghost" onClick={handleReset} className="mt-4 w-full">Tentar novamente</Button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
