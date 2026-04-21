"use client";

import { Button } from "@/components/ui/button";
import { cn, currency } from "@/lib/utils";
import { quickFilters } from "./constants";

type SelectionField = "ethnicities" | "hairs" | "services";

interface FeedFiltersContentProps {
  selectedLocation: string;
  activeQuickFilters: string[];
  selectedGender: string;
  maxPrice: number;
  selectedAdTypes: string[];
  selectedEthnicities: string[];
  selectedHairs: string[];
  selectedServices: string[];
  onToggleQuickFilter: (filter: string) => void;
  onSelectGender: (gender: string) => void;
  onSetMaxPrice: (value: number) => void;
  onToggleAdTypeFilter: (type: string) => void;
  onToggleSelection: (field: SelectionField, value: string) => void;
  onOpenLocationToolsModal: () => void;
}

export function FeedFiltersContent({
  selectedLocation,
  activeQuickFilters,
  selectedGender,
  maxPrice,
  selectedAdTypes,
  selectedEthnicities,
  selectedHairs,
  selectedServices,
  onToggleQuickFilter,
  onSelectGender,
  onSetMaxPrice,
  onToggleAdTypeFilter,
  onToggleSelection,
  onOpenLocationToolsModal,
}: FeedFiltersContentProps) {
  return (
    <div className="space-y-6">
      <section>
        <label className="mb-3 block text-sm font-bold text-zinc-900">Filtros rápidos</label>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => {
            const active = activeQuickFilters.includes(filter);

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onToggleQuickFilter(filter)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active ? "border-wine-700 bg-wine-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-wine-300 hover:bg-wine-50"
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <label className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine-700" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Localidade
        </label>

        <button
          type="button"
          onClick={onOpenLocationToolsModal}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left transition hover:border-wine-300 hover:bg-wine-50/50"
        >
          <span className="text-base font-medium text-zinc-900">{selectedLocation}</span>
          <span className="text-wine-700/70">▾</span>
        </button>
      </section>

      <section>
        <label className="mb-3 block text-sm font-bold text-zinc-900">Gênero & Categoria</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Todas",
            "Mulher",
            "Homem",
            "Trans",
            "Casal",
          ].map((gender) => (
            <button
              key={gender}
              onClick={() => onSelectGender(gender)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                selectedGender === gender
                  ? "border-wine-700 bg-wine-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-wine-300 hover:bg-wine-50"
              )}
            >
              {gender}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-bold text-zinc-900">Investimento (h)</label>
          <span className="text-xs font-bold text-wine-700">Até {currency(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={200}
          max={3000}
          step={50}
          value={maxPrice}
          onChange={(event) => onSetMaxPrice(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-wine-700"
        />
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-zinc-400">
          <span>R$ 200</span>
          <span>R$ 3.000</span>
        </div>
      </section>

      <section>
        <label className="mb-3 block text-sm font-bold text-zinc-900">Tipo de Anúncio</label>
        <div className="space-y-2">
          {[
            "Premium",
            "Standard",
          ].map((type) => (
            <label key={type} className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-wine-50/50">
              <input
                type="checkbox"
                checked={type === "Premium" ? selectedAdTypes.includes(type) || activeQuickFilters.includes("Premium") : selectedAdTypes.includes(type)}
                onChange={() => onToggleAdTypeFilter(type)}
                className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-wine-700 focus:ring-wine-700"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                {type === "Premium" && <span className="text-sm text-wine-700">★</span>}
                {type}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-900">Etnia</label>
          <div className="flex flex-wrap gap-2">
            {[
              "Caucasiana",
              "Negra",
              "Asiática",
              "Latina",
            ].map((eth) => (
              <button
                key={eth}
                onClick={() => onToggleSelection("ethnicities", eth)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedEthnicities.includes(eth) ? "border-wine-300 bg-wine-100 text-wine-800" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {eth}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-900">Cabelo</label>
          <div className="flex flex-wrap gap-2">
            {[
              "Loira",
              "Morena",
              "Ruiva",
            ].map((hair) => (
              <button
                key={hair}
                onClick={() => onToggleSelection("hairs", hair)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedHairs.includes(hair) ? "border-wine-300 bg-wine-100 text-wine-800" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {hair}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <label className="mb-3 block text-sm font-bold text-zinc-900">Serviços</label>
        <div className="space-y-2">
          {[
            "Viagem / Tour",
            "Jantares e Eventos",
            "Fetiches",
          ].map((service) => (
            <label key={service} className="-ml-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-wine-50/50">
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => onToggleSelection("services", service)}
                className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-wine-700 focus:ring-wine-700"
              />
              {service}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
