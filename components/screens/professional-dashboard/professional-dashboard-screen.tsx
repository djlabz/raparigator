"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { ads } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { SummaryTab } from "./summary-tab";
import { AnnouncementTab } from "./announcement-tab";
import { HistoryTab } from "./history-tab";
import type { AdStatus } from "./types";

const tabs = ["Resumo", "Anúncio", "Avaliações", "Histórico"] as const;

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
          {activeTab === "Avaliações" && <ReviewsTab />}
          {activeTab === "Histórico" && <HistoryTab />}
        </div>
      </div>
    </AppShell>
  );
}

function ReviewsTab() {
  const reviews = [
    { id: "r1", author: "Cliente verificado", timeAgo: "3 dias", text: "Pontual, educada e super discreta.", score: 5 },
    { id: "r2", author: "Cliente premium", timeAgo: "1 semana", text: "Experiência impecável do início ao fim.", score: 5 },
    { id: "r3", author: "Cliente verificado", timeAgo: "2 semanas", text: "Excelente conversa e atendimento cordial.", score: 4 },
  ];

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Avaliações recentes</h2>
          <p className="mt-1 text-sm text-zinc-500">Últimos feedbacks recebidos no perfil.</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {reviews.length} avaliações
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition-colors hover:bg-white">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">{review.author}</span>
                <span className="text-[10px] text-zinc-400">{review.timeAgo}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className={cn("text-xs", index < review.score ? "text-amber-400" : "text-zinc-200")}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600">{review.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
