"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HistoryFilter, HistoryItem } from "./types";

const historyItems: HistoryItem[] = [
  { id: 1, client: "João Silva", service: "Full Experience (1h)", date: "10/04/2026", status: "Concluído", value: "R$ 800" },
  { id: 2, client: "Maria Santos", service: "Quick Visit (30min)", date: "09/04/2026", status: "Concluído", value: "R$ 450" },
  { id: 3, client: "Pedro Costa", service: "Full Experience (1h)", date: "08/04/2026", status: "Em Andamento", value: "R$ 800" },
  { id: 4, client: "Ana Oliveira", service: "Jantar + Acompanhamento", date: "07/04/2026", status: "Finalizado", value: "R$ 1.200" },
  { id: 5, client: "Carlos Mendes", service: "Quick Visit (30min)", date: "06/04/2026", status: "Concluído", value: "R$ 450" },
];

const filterOptions: HistoryFilter[] = ["Todos", "Concluído", "Finalizado", "Em Andamento"];

export function HistoryTab() {
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("Todos");

  const filteredItems = activeFilter === "Todos" ? historyItems : historyItems.filter(item => item.status === activeFilter);

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-4 border-b border-zinc-100 pb-4">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
              activeFilter === filter
                ? "bg-wine-700 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">Histórico de atendimentos</h2>
        {filteredItems.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum atendimento neste período.</p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-zinc-200 rounded-xl bg-zinc-50 hover:bg-white transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 text-sm truncate">{item.client}</p>
                <p className="text-xs text-zinc-600 mt-1">{item.service}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap",
                  item.status === "Concluído" ? "bg-emerald-50 text-emerald-700" :
                    item.status === "Finalizado" ? "bg-blue-50 text-blue-700" :
                      "bg-amber-50 text-amber-700"
                )}>
                  {item.status}
                </span>
                <span className="text-sm font-semibold text-zinc-900">{item.value}</span>
              </div>
              <p className="text-xs text-zinc-500">{item.date}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
