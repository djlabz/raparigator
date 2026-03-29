"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { dashboardSummary } from "@/lib/mock-data";
import { currency, cn } from "@/lib/utils";

const tabs = ["Resumo", "Servicos", "Valores", "Perfil", "Historico"];

export function ProfessionalDashboardScreen() {
  const [activeAd, setActiveAd] = useState(dashboardSummary.activeAd);
  const [activeTab, setActiveTab] = useState("Perfil"); // Inicia na aba Perfil para ver o resultado do mockup

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Menu Lateral Desktop */}
        <aside className="hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:block h-fit sticky top-24">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Painel profissional</p>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  activeTab === tab ? "bg-wine-700 text-white!" : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {/* Menu Superior Mobile */}
          <div className="flex gap-2 overflow-auto lg:hidden hide-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab ? "bg-wine-700 text-white!" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Cabeçalho de Status Persistente */}
          <Card className="flex flex-wrap items-center justify-between gap-3 bg-white">
            <div>
              <p className="text-sm text-zinc-500 font-medium">Status do anúncio público</p>
              <div className="flex items-center gap-2 mt-1">
                {/* Container relativo para empilhar as bolinhas */}
                <div className="relative flex h-3 w-3 items-center justify-center">
                  {/* Bolinha que faz o efeito de pulso (cresce e some) - Só aparece se activeAd for true */}
                  {activeAd && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  {/* Bolinha principal estática */}
                  <span
                    className={cn(
                      "relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-300",
                      activeAd ? "bg-emerald-500" : "bg-zinc-300"
                    )}
                  />
                </div>
                <p className="text-lg font-bold text-zinc-900">
                  {activeAd ? "Ativo e visível" : "Pausado"}
                </p>
              </div>
            </div>
            <Button
              className={cn("transition-all", activeAd ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-wine-700 text-white hover:bg-wine-800")}
              onClick={() => setActiveAd((value) => !value)}
            >
              {activeAd ? "Pausar anúncio" : "Ativar anúncio"}
            </Button>
          </Card>

          {/* CONTEÚDO DAS ABAS */}

          {activeTab === "Resumo" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Receita do mês" value={currency(dashboardSummary.monthRevenue)} />
                <MetricCard title="Atendimentos" value={String(dashboardSummary.completedServices)} />
                <MetricCard title="Visualizações" value={String(dashboardSummary.profileViews)} />
                <MetricCard title="Conversão" value={`${dashboardSummary.conversionRate}%`} />
              </section>
              <Card>
                <EmptyState title="Resumo" description="Selecione as outras abas para gerenciar suas fotos, serviços e disponibilidade." actionLabel="Ver Perfil" onAction={() => setActiveTab("Perfil")} />
              </Card>
            </div>
          )}

          {activeTab === "Perfil" && <ProfileManagementTab />}

          {activeTab === "Servicos" && <ServicesManagementTab />}

          {activeTab === "Valores" && (
            <Card>
              <EmptyState title="Valores" description="A gestão de valores agora está unificada na aba de Serviços." actionLabel="Ir para Serviços" onAction={() => setActiveTab("Servicos")} />
            </Card>
          )}

          {activeTab === "Historico" && (
            <Card className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Histórico de atendimentos</h2>
              <HistoryItem title="Cliente verificado" subtitle="Concluído em 05/03 - R$ 820" />
              <HistoryItem title="Cliente premium" subtitle="Concluído em 03/03 - R$ 1.200" />
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// --- Sub-componentes da tela ---

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
    </Card>
  );
}

function HistoryItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 bg-zinc-50/50">
      <p className="text-sm font-bold text-zinc-900">{title}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function ProfileManagementTab() {
  return (
    <div className="space-y-6">
      {/* Galeria de Fotos (Bento Grid) */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-lg text-zinc-900">Galeria de Fotos</h3>
          <button className="text-wine-700 text-sm font-bold hover:underline">
            + Adicionar
          </button>
        </div>
        <div className="p-4 sm:p-6 bg-zinc-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-2 gap-3 h-75 sm:h-100">
            <div className="col-span-2 row-span-2 relative rounded-xl border-2 border-wine-700 overflow-hidden group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Principal" />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
              <div className="absolute top-3 left-3 bg-wine-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Capa</div>
            </div>
            <div className="relative rounded-xl overflow-hidden group cursor-pointer bg-zinc-200 border border-zinc-200">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Galeria 1" />
            </div>
            <div className="relative rounded-xl overflow-hidden group cursor-pointer bg-zinc-200 border border-zinc-200">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Galeria 2" />
            </div>
            <div className="relative rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-wine-700 hover:border-wine-300 transition-colors cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-wider mt-1">Upload</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhes & Localização */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6 text-zinc-900 border-b border-zinc-100 pb-4">Detalhes & Localização</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome Artístico</label>
              <input type="text" defaultValue="Isabella Valente" className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Cidade</label>
                <input type="text" defaultValue="São Paulo" className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Bairro</label>
                <input type="text" defaultValue="Jardins" className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all font-medium" />
              </div>
            </div>

            {/* Mapa e Raio de Atendimento adicionados aqui */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Raio de Atendimento</label>
                <span className="text-sm font-bold text-wine-700">15 km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                defaultValue="15"
                className="w-full accent-wine-700"
              />

              <div className="relative rounded-xl overflow-hidden border border-zinc-200 h-40 bg-zinc-100 mt-2 group">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=60"
                  alt="Prévia do Mapa"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="bg-white text-zinc-900 px-4 py-2 rounded-full shadow-md border border-zinc-200 flex items-center gap-2 text-sm font-bold hover:bg-zinc-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine-700"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    Ajustar localização
                  </button>
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* Disponibilidade */}
        <Card className="p-6 flex flex-col">
          <h3 className="font-bold text-lg mb-6 text-zinc-900 border-b border-zinc-100 pb-4">Disponibilidade</h3>
          <div className="space-y-4 flex-1">
            {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((day, i) => (
              <div key={day} className={`flex items-center justify-between ${i > 4 ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 text-xs font-black text-zinc-500">{day}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={i <= 4} />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-wine-700"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" defaultValue={i <= 4 ? "10:00" : "--:--"} disabled={i > 4} className="w-18 text-center border border-zinc-200 rounded-md text-xs font-bold px-2 py-2 focus:border-wine-700 outline-none disabled:bg-zinc-50" />
                  <span className="text-zinc-400 text-xs">—</span>
                  <input type="text" defaultValue={i <= 4 ? (i === 4 ? "00:00" : "22:00") : "--:--"} disabled={i > 4} className="w-18 text-center border border-zinc-200 rounded-md text-xs font-bold px-2 py-2 focus:border-wine-700 outline-none disabled:bg-zinc-50" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-100">
            <Button className="w-full bg-zinc-900 hover:bg-black text-white">Salvar Perfil</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ServicesManagementTab() {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <h3 className="font-bold text-lg text-zinc-900">Serviços & Valores</h3>
        <button className="text-wine-700 text-sm font-bold hover:underline border-2 border-dashed border-wine-200 px-4 py-2 rounded-lg bg-wine-50/50">
          + Novo Serviço
        </button>
      </div>

      <div className="space-y-4">
        {/* Serviço 1 */}
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-wrap lg:flex-nowrap items-center gap-4 hover:border-zinc-300 transition-colors">
          <div className="flex-1 min-w-50">
            <p className="text-sm font-bold text-zinc-900">Full Experience (1h)</p>
            <p className="text-xs text-zinc-500 mt-1">Atendimento completo e personalizado</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-zinc-200 w-full lg:w-auto shadow-sm">
            <span className="text-xs font-bold text-zinc-400">R$</span>
            <input type="text" defaultValue="800,00" className="w-20 text-sm font-bold outline-none bg-transparent text-zinc-900" />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto px-1">
            <input type="checkbox" className="w-4 h-4 text-wine-700 rounded border-zinc-300 focus:ring-wine-700" />
            <span className="text-sm font-medium text-zinc-600">A combinar</span>
          </div>
        </div>

        {/* Serviço 2 */}
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-wrap lg:flex-nowrap items-center gap-4 hover:border-zinc-300 transition-colors">
          <div className="flex-1 min-w-50">
            <p className="text-sm font-bold text-zinc-900">Quick Visit (30min)</p>
            <p className="text-xs text-zinc-500 mt-1">Atendimento expresso</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-zinc-200 w-full lg:w-auto shadow-sm">
            <span className="text-xs font-bold text-zinc-400">R$</span>
            <input type="text" defaultValue="450,00" className="w-20 text-sm font-bold outline-none bg-transparent text-zinc-900" />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto px-1">
            <input type="checkbox" className="w-4 h-4 text-wine-700 rounded border-zinc-300 focus:ring-wine-700" />
            <span className="text-sm font-medium text-zinc-600">A combinar</span>
          </div>
        </div>

        <div className="mt-8 pt-4 text-right">
          <Button className="bg-wine-700 hover:bg-wine-800 text-white w-full sm:w-auto px-8">Salvar Serviços</Button>
        </div>
      </div>
    </Card>
  );
}
