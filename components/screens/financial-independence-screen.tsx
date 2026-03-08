"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currency } from "@/lib/utils";

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

// --- Ícones SVG Inline (para evitar erros de lib externa) ---
function IconRocket(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4-1 4-1" /><path d="M12 15v5s3.03-.55 4-2c1.1-1.62 1-4 1-4" /></svg>;
}
function IconTurtle(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 7-7 5-7-5" /><path d="M12 22a10 10 0 0 1-10-10" /><path d="M22 12a10 10 0 0 1-10 10" /><circle cx="12" cy="12" r="3" /></svg>; // Abstract representation
}
function IconCalendar(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
}
function IconMoto(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h-5a1 1 0 0 0-1 1v4h-3v-3h2l1-4h3l2 2Z" /><path d="M12 11h7v3h-3" /></svg>;
}
function IconCar(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M14 14h6" /></svg>;
}
function IconHome(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
function IconTrophy(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
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
  const [serviceValue, setServiceValue] = useState("450");
  const [serviceHours, setServiceHours] = useState("2");
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState("5");

  // Inputs de projeção (mantidos no estado, mas opcionais na lógica principal agora)
  const [projectionTime, setProjectionTime] = useState("");
  const [projectionUnit, setProjectionUnit] = useState("months");

  const [submitted, setSubmitted] = useState(false);

  const parsed = useMemo(() => {
    const value = Number(serviceValue);
    const hours = Number(serviceHours);
    const days = Number(workDaysPerWeek);

    // Validação básica
    const valid = value > 0 && hours > 0 && days > 0 && days <= 7;
    if (!valid) return null;

    // Receita do Usuário
    const appointmentsPerDay = Math.max(Math.floor(8 / hours), 1);
    const weeklyRevenue = value * appointmentsPerDay * days;
    const monthlyRevenue = weeklyRevenue * 4.33;

    // Dados CLT (Referência)
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

    return {
      monthlyRevenue,
      monthsToMillionUser,
      monthsToMillionCLT,
      yearsSaved,
      equivalenceRatio,
      dreamsCalculated
    };
  }, [serviceHours, serviceValue, workDaysPerWeek]);

  // Se quiser recalcular
  const handleReset = () => {
    setSubmitted(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">

        {/* --- TELA DE INPUTS (Visível apenas se NÃO submetido) --- */}
        {!submitted && (
          <>
            <header>
              <h1 className="text-2xl font-semibold text-zinc-900">Calculadora de Liberdade</h1>
              <p className="text-sm text-zinc-600">Descubra o quão rápido você pode atingir sua independência financeira.</p>
            </header>

            <Card className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="valor-servico"
                  label="Valor do serviço (R$)"
                  value={serviceValue}
                  onChange={(e) => setServiceValue(e.target.value)}
                  inputMode="decimal"
                />
                <Input
                  id="tempo-atendimento"
                  label="Tempo por atendimento (horas)"
                  value={serviceHours}
                  onChange={(e) => setServiceHours(e.target.value)}
                  inputMode="decimal"
                />
                <Input
                  id="dias-semana"
                  label="Dias de trabalho por semana"
                  value={workDaysPerWeek}
                  onChange={(e) => setWorkDaysPerWeek(e.target.value)}
                  inputMode="numeric"
                />
                {/* Mantive o campo opcional visualmente, mas sem foco na nova UI */}
                <div className="flex gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                  <div className="flex-1">
                    <Input
                      id="tempo-projecao"
                      label="Meta de tempo (Opcional)"
                      value={projectionTime}
                      onChange={(e) => setProjectionTime(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      id="unidade-tempo"
                      label="Unidade"
                      value={projectionUnit}
                      onChange={(e) => setProjectionUnit(e.target.value)}
                      options={[
                        { label: "Meses", value: "months" },
                        { label: "Anos", value: "years" },
                      ]}
                    />
                  </div>
                </div>
              </div>
              <Button size="lg" className="w-full text-lg font-semibold" onClick={() => setSubmitted(true)}>
                Ver meu "Painel da Liberdade" 🚀
              </Button>
            </Card>
          </>
        )}

        {/* --- TELA DE RESULTADOS (PAINEL DA LIBERDADE) --- */}
        {submitted && parsed ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* MANCHETE DE IMPACTO */}
            <div className="text-center space-y-2 py-4">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">
                Você está comprando <span className="text-emerald-600">{parsed.yearsSaved} anos</span> da sua vida de volta.
              </h2>
              <p className="text-zinc-600">Esse é o poder de valorizar a sua hora de trabalho.</p>
            </div>

            {/* CONCEITO A: A CORRIDA DA VIDA */}
            <Card className="p-6 border-zinc-200 shadow-lg relative overflow-hidden">
              <h3 className="text-lg font-semibold text-zinc-900 mb-6">🏁 A Corrida do Milhão</h3>

              <div className="space-y-8">
                {/* Barra do Usuário */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex items-center gap-2 font-bold text-emerald-700">
                      <IconRocket className="h-5 w-5" /> SEU RITMO
                    </div>
                    <span className="font-bold text-emerald-600 text-lg">{formatDurationDetailed(parsed.monthsToMillionUser)}</span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                    {/* A barra não é baseada em % matemática estrita, mas visual. Se fosse matemática, a barra CLT seria 100% e a user 2%.
                          Aqui usamos uma escala visual onde "Rápido" é uma barra curta (já que é tempo) ou invertemos?
                          O pedido foi: "Barra curta, quase cheia ou rápida". Vamos fazer estilo "Loading" até o objetivo.
                          Se é TEMPO, barra cheia = muito tempo. Barra vazia = pouco tempo.
                          Mas o usuário pediu: "Barra curta, quase cheia ou rápida" com ícone foguete.
                          Vamos fazer BARRA DE PROGRESSO DE VELOCIDADE. Barra cheia = Mais rápido. */}
                    <div className="h-full bg-emerald-500 rounded-full animate-pulse w-[95%]"></div>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">Rumo à liberdade total</p>
                </div>

                {/* Barra CLT */}
                <div className="space-y-2 opacity-60">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex items-center gap-2 font-semibold text-zinc-600">
                      <IconTurtle className="h-5 w-5" /> RITMO PADRÃO (CLT)
                    </div>
                    <span className="font-semibold text-zinc-500">{formatDurationDetailed(parsed.monthsToMillionCLT)}</span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                    {/* Barra muito pequena comparada a do usuário para dar sensação de lentidão */}
                    <div className="h-full bg-zinc-400 rounded-full w-[15%]"></div>
                  </div>
                  <p className="text-xs text-zinc-400 text-right">Trabalhando até a aposentadoria oficial</p>
                </div>
              </div>
            </Card>

            {/* CONCEITO B: BALANÇA DO ESFORÇO */}
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

            {/* CONCEITO C: METAS TANGÍVEIS */}
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
                        {/* APLICAÇÃO DA REGRA: NOME VERDE SE FOR 1 MILHÃO */}
                        <p className={`font-semibold leading-tight ${dream.highlight ? 'text-emerald-700' : 'text-zinc-900'}`}>
                          {dream.label}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{currency(dream.price)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed border-zinc-200">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Você conquista em</p>
                      <p className={`text-xl font-bold ${dream.highlight ? 'text-emerald-600' : 'text-zinc-800'}`}>
                        {formatDurationDetailed(dream.monthsToAchieve)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* BOTÃO VOLTAR */}
            <div className="flex justify-center pt-4">
              <Button onClick={handleReset} className="w-full md:w-auto">
                Refazer Simulação
              </Button>
            </div>

          </div>
        ) : null}

        {/* Empty State para erros */}
        {submitted && !parsed && (
          <div className="pt-4">
            <EmptyState title="Dados inválidos" description="Por favor, revise os valores inseridos. Certifique-se de usar números positivos." />
            <Button variant="ghost" onClick={() => setSubmitted(false)} className="mt-4 w-full">Tentar novamente</Button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
