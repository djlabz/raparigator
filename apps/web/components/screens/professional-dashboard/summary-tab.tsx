"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { isEarningsSimulatorEnabled } from "@/lib/earnings-simulator-flag";

export function SummaryTab() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {isEarningsSimulatorEnabled() ? (
        <Link
          href="/profissional/simulador"
          className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/70 transition-colors hover:border-wine-200"
        >
          <span className="min-w-0">
            <span className="block font-semibold text-zinc-900">Simulador de projeção</span>
            <span className="block text-sm text-zinc-600">
              Simule a projeção por mês e por ano com os seus números.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-zinc-500" aria-hidden />
        </Link>
      ) : null}

      <Card className="bg-linear-to-r from-wine-50 to-wine-100/50 border border-wine-200 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-wine-900 mb-2">Dica para aumentar conversão</h3>
            <p className="text-sm text-wine-800">
              Adicione mais fotos de alta qualidade à sua galeria.
            </p>
            <button className="mt-3 text-wine-700 font-semibold text-sm hover:underline">
              → Ir para galeria
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
