"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ads } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { SummaryTab } from "./summary-tab";
import { AnnouncementTab } from "./announcement-tab";
import { HistoryTab } from "./history-tab";
import type { AdStatus } from "./types";

const TABS = [
  { id: "Resumo", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { id: "Anúncio", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
  { id: "Avaliações", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
  { id: "Histórico", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { id: "Verificação", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
] as const;

export function ProfessionalDashboardScreen() {
  const [activeTab, setActiveTab] = useState<string>("Anúncio");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adStatus, setAdStatus] = useState<AdStatus>("Ativo");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (!requestedTab) {
      return;
    }

    const isValidTab = TABS.some((tab) => tab.id === requestedTab);
    if (isValidTab) {
      setActiveTab(requestedTab);
    }
  }, []);

  const currentAd = ads[0];
  const adSlug = currentAd.slug;

  return (
    <AppShell>
      <div className={cn(
        "grid gap-4 overflow-x-hidden lg:gap-8 lg:items-start transition-all duration-300",
        isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[256px_1fr]"
      )}>

        {/* Menu Lateral Desktop */}
        <aside className="hidden lg:flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm h-fit self-start transition-all duration-300">
          <div className="flex items-center justify-between mb-6 px-2">
            {!isSidebarCollapsed && (
              <span className="text-sm font-black tracking-widest text-wine-700 uppercase">
                Painel Profissional
              </span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-zinc-400 hover:text-wine-700 hover:bg-wine-50 rounded-lg transition-colors ml-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isSidebarCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h8m-8 6h16"} />
              </svg>
            </button>
          </div>

          <nav className="space-y-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={isSidebarCollapsed ? tab.id : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-wine-700/10 text-wine-700 border-r-4 border-wine-700"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {tab.icon}
                </svg>
                {!isSidebarCollapsed && <span>{tab.id}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4 overflow-x-hidden lg:space-y-6">
          {/* Menu Superior Mobile */}
          <div className="flex gap-2 overflow-auto lg:hidden hide-scrollbar pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  activeTab === tab.id ? "bg-wine-700 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {tab.icon}
                </svg>
                {tab.id}
              </button>
            ))}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          {activeTab === "Resumo" && <SummaryTab />}
          {activeTab === "Anúncio" && (
            <AnnouncementTab
              ad={currentAd}
              adSlug={adSlug}
              status={adStatus}
              onToggleStatus={() => setAdStatus(prev => prev === "Ativo" ? "Pausado" : "Ativo")}
            />
          )}
          {activeTab === "Avaliações" && <div className="p-4 bg-white rounded-xl shadow-sm"><h2 className="text-lg font-bold">Avaliações em breve</h2></div>}
          {activeTab === "Histórico" && <HistoryTab />}
          {activeTab === "Verificação" && <VerificationTab />}
        </div>
      </div>
    </AppShell>
  );
}

function VerificationTab() {
  const [verificationState] = useState({
    email: true,
    phone: false,
    document: false,
  });

  const verifiedItems = [verificationState.email, verificationState.phone, verificationState.document].filter(Boolean).length;
  const verificationProgress = Math.round((verifiedItems / 3) * 100);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Verificação da conta</p>
          <h2 className="mt-1 text-2xl font-semibold text-zinc-900">Confiança do perfil</h2>
          <p className="mt-1 text-sm text-zinc-600">Conclua as etapas abaixo para elevar a segurança da conta e fortalecer seu perfil.</p>
        </div>
        <span className="self-start rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
          {verifiedItems}/3 concluídas
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${verificationProgress}%` }} />
        </div>
        <p className="text-xs font-medium text-zinc-500">Progresso de verificação: {verificationProgress}%</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <VerificationItem title="E-mail" description="Contato principal confirmado." done={verificationState.email} actionLabel="Verificado" />
        <VerificationItem title="Telefone" description="Confirme com código por SMS." done={verificationState.phone} actionLabel="Verificar" />
        <VerificationItem title="Documento" description="Envie documento para validação." done={verificationState.document} actionLabel="Verificar" />
      </div>
    </div>
  );
}

function VerificationItem({
  title,
  description,
  done,
  actionLabel,
}: {
  title: string;
  description: string;
  done: boolean;
  actionLabel: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4", done ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50")}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={cn("text-sm font-semibold", done ? "text-emerald-700" : "text-zinc-700")}>{done ? "Concluído" : "Pendente"}</span>
        <button
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            done ? "bg-emerald-100 text-emerald-700" : "bg-wine-50 text-wine-700 hover:bg-wine-100",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
