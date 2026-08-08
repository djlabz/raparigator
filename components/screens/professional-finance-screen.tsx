"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { dashboardSummary } from "@/lib/mock-data";
import { currency } from "@/lib/utils";

export function ProfessionalFinanceScreen() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Financeiro</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Controle de caixa e repasses</h1>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Receita do mês" value={currency(dashboardSummary.monthRevenue)} />
          <StatCard label="Serviços concluídos" value={String(dashboardSummary.completedServices)} />
          <StatCard label="Conversão" value={`${dashboardSummary.conversionRate}%`} />
          <StatCard label="Visitas ao perfil" value={String(dashboardSummary.profileViews)} />
        </section>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900">Resumo operacional</h2>
          <p className="text-sm text-zinc-600">
            Esta área é o ponto central para acompanhar entradas, custo de custódia, saques e previsibilidade de caixa.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </Card>
  );
}
