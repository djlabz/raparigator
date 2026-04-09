"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ads } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { SummaryTab } from "./summary-tab";
import { AnnouncementTab } from "./announcement-tab";
import { HistoryTab } from "./history-tab";
import type { AdStatus } from "./types";

const tabs = ["Resumo", "Anúncio", "Histórico"] as const;

export function ProfessionalDashboardScreen() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Resumo");
  const [adStatus, setAdStatus] = useState<AdStatus>("Ativo");

  const currentAd = ads[0]; // Luna Velvet - primeiro anúncio do mock
  const adSlug = currentAd.slug;

  return (
    <AppShell>
      <div className="grid gap-4 overflow-x-hidden lg:gap-6 lg:grid-cols-[240px_1fr]">
        {/* Menu Lateral Desktop */}
        <aside className="hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:block h-fit sticky top-24">
          <p className="mb-4 text-lg font-bold text-zinc-900">Painel profissional</p>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  activeTab === tab ? "bg-wine-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4 overflow-x-hidden lg:space-y-6">
          {/* Menu Superior Mobile */}
          <div className="flex gap-2 overflow-auto lg:hidden hide-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  activeTab === tab ? "bg-wine-700 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {tab}
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
          {activeTab === "Histórico" && <HistoryTab />}
        </div>
      </div>
    </AppShell>
  );
}
