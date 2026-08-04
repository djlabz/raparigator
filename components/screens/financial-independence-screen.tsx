"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoHint } from "@/components/ui/info-hint";
import { Select } from "@/components/ui/select";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PremiumConversionModal } from "@/components/ui/premium-conversion-modal";
import { chromeBelowDesktopNavStickyTop } from "@/lib/chrome-styles";
import { usePremiumPlan, PREMIUM_VISIBILITY_MULTIPLIER } from "@/lib/premium-plan";
import { cn, currency } from "@/lib/utils";

// --- Constantes e Configurações ---
const TARGET = 1_000_000;
const MIN_WAGE = 1512;

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

    // Dados CLT (Referência) — jornada fixa de 8h/dia
    const cltInss = MIN_WAGE * 0.075;
    const cltTransport = MIN_WAGE * 0.06;
    const cltNet = MIN_WAGE - cltInss - cltTransport;

    // Tempo até 1 Milhão
    const monthsToMillionUser = Math.ceil(TARGET / monthlyRevenue);
    const monthsToMillionCLT = Math.ceil(TARGET / cltNet);

    // Anos comprados de volta (Diferença)
    const monthsSaved = monthsToMillionCLT - monthsToMillionUser;
    const yearsSaved = Math.floor(monthsSaved / 12);

    // Razão de Equivalência (1 mês seu = X meses CLT)
    const equivalenceRatio = monthlyRevenue / cltNet;

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
    };
  }, [valuePerService, servicesPerDay, workDaysPerWeek, projectionTime, projectionUnit, topSearchBoost]);

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
      <div className="mx-auto max-w-5xl space-y-4 md:space-y-5">

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
                  Multiplicamos valor × atendimentos × dias × 4,33 semanas do mês. Usamos o salário mínimo líquido (descontos de INSS e VT) como ritmo padrão de comparação.
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
                  <p className={`text-sm font-bold ${topSearchBoost ? "text-[#FFDF00]" : "text-zinc-900"}`}>
                    Topo das Pesquisas
                  </p>
                  <p className={`text-xs mt-0.5 ${topSearchBoost ? "text-zinc-300" : "text-zinc-500"}`}>
                    Simule seus resultados com a visibilidade do plano Premium
                  </p>
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
                "z-10 border border-emerald-200 bg-emerald-50/95 shadow-sm backdrop-blur-md",
                "sticky rounded-2xl [overflow-anchor:none]",
                chromeBelowDesktopNavStickyTop,
                heroCollapsed ? "px-3 py-2" : "p-4 md:p-5",
              )}
            >
              {heroCollapsed ? (
                <div data-testid="freedom-hero-compact" className="flex items-center justify-between gap-3 md:hidden">
                  <p className="truncate text-sm font-bold text-emerald-700">
                    {parsed.yearsSaved > 0 ? `${parsed.yearsSaved} anos` : "No ritmo"} · {currency(parsed.projectedAmount)}
                  </p>
                  <Button
                    type="button"
                    onClick={handleReset}
                    className="h-8 shrink-0 bg-zinc-100 px-2 text-xs text-zinc-700 hover:bg-zinc-200"
                    aria-label="Nova Simulação"
                  >
                    <IconRefresh className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
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
                        >
                          Projeção do seu ritmo atual nesse período.
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
                </div>
              )}
            </div>

            <div data-testid="freedom-metrics-grid" className="space-y-3 md:space-y-4">
              <Card className="p-6 border-zinc-200 shadow-lg relative overflow-hidden">
                <h3 className="text-lg font-semibold text-zinc-900 mb-6">🏁 A Corrida do Milhão</h3>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-sm">
                      <div className="flex items-center gap-2 font-bold text-emerald-700">
                        <IconRocket className="h-5 w-5" /> SEU RITMO
                      </div>
                      <motion.span
                        key={parsed.monthsToMillionUser}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 20 }}
                        className={`font-bold text-lg ${topSearchBoost ? "text-[#DAA520]" : "text-emerald-600"}`}
                      >
                        {formatDurationDetailed(parsed.monthsToMillionUser)}
                      </motion.span>
                    </div>
                    <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full animate-pulse w-[95%]"></div>
                    </div>
                    <p className="text-xs text-zinc-500 text-right">Rumo à liberdade total</p>
                  </div>

                  <div className="space-y-2 opacity-60">
                    <div className="flex justify-between items-end text-sm">
                      <div className="flex items-center gap-2 font-semibold text-zinc-600">
                        <IconTurtle className="h-5 w-5" /> RITMO PADRÃO (CLT)
                      </div>
                      <span className="font-semibold text-zinc-500">{formatDurationDetailed(parsed.monthsToMillionCLT)}</span>
                    </div>
                    <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-400 rounded-full w-[15%]"></div>
                    </div>
                    <p className="text-xs text-zinc-400 text-right">Trabalhando até a aposentadoria oficial</p>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-wine-50 border-wine-100 p-6 flex flex-col justify-center items-center text-center space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-wine-700">Sua potência</p>
                  <div className="text-4xl font-bold text-zinc-900">1 Mês</div>
                  <div className="flex items-center justify-center gap-2 text-zinc-600">
                    <IconCalendar className="h-5 w-5" />
                    <span>do seu trabalho</span>
                  </div>
                </Card>

                <div className="flex md:hidden justify-center items-center text-zinc-300 font-bold text-2xl">=</div>

                <Card className="bg-zinc-50 border-zinc-200 p-6 flex flex-col justify-center items-center text-center space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <IconCalendar className="h-24 w-24" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Equivale a</p>
                  <div className="text-4xl font-bold text-zinc-700">
                    {parsed.equivalenceRatio.toFixed(1).replace('.', ',')} Meses
                  </div>
                  <div className="flex items-center justify-center gap-2 text-zinc-500">
                    <span className="text-sm">de um trabalho comum (CLT)</span>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-3 ml-1">🏆 Linha do Tempo das Conquistas</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {parsed.dreamsCalculated.map((dream) => (
                    <Card
                      key={dream.id}
                      className={`p-4 flex flex-col justify-between h-full border-2 transition-all hover:scale-105 ${dream.highlight
                        ? "border-emerald-100 bg-emerald-50/50"
                        : "border-transparent bg-white shadow-sm hover:border-zinc-200"
                        }`}
                    >
                      <div className="space-y-3">
                        <div className={`p-2 w-fit rounded-lg ${dream.highlight ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                          <dream.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className={`font-semibold leading-tight ${dream.highlight ? 'text-emerald-700' : 'text-zinc-900'}`}>
                            {dream.label}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">{currency(dream.price)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-dashed border-zinc-200">
                        <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Você conquista em</p>
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
            <Button variant="ghost" onClick={() => setSubmitted(false)} className="mt-4 w-full">Tentar novamente</Button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
