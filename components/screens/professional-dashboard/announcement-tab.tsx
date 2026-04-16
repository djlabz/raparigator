"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { AdPreview, AdStatus } from "./types";
import { useProfileForm } from "./use-profile-form";

// ─── Options para selects ─────────────────────────────────────────
const GENDER_OPTIONS = ["", "Feminino", "Masculino", "Trans", "Não-binário"];
const ETHNICITY_OPTIONS = ["", "Branca", "Preta", "Parda", "Amarela", "Indígena"];
const HAIR_COLOR_OPTIONS = ["", "Preto", "Castanho", "Loiro", "Ruivo", "Colorido", "Rosa", "Platinado"];
const SMOKER_OPTIONS = ["", "Sim", "Não"];
const VISIBILITY_STATUSES = ["Ativo", "Pausado", "Invisível"] as const;
type VisibilityStatus = (typeof VISIBILITY_STATUSES)[number];

export function AnnouncementTab({
  ad,
  status,
  onToggleStatus,
}: {
  ad: AdPreview;
  adSlug: string;
  status: AdStatus;
  onToggleStatus: () => void;
}) {
  const formHook = useProfileForm(ad);
  const { form, saveStatus, lastSavedAt, score, tips, updateField, updateNestedField, manualSave } = formHook;

  // Estado para Modal de Fotos
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [visibilityStatus, setVisibilityStatus] = useState<VisibilityStatus>(status === "Pausado" ? "Pausado" : "Ativo");

  useEffect(() => {
    if (status === "Ativo" || status === "Pausado") {
      setVisibilityStatus(status);
    }
  }, [status]);

  const statusStyles = {
    Ativo: {
      button: "bg-emerald-100 text-emerald-800 border-emerald-300",
      wave: "bg-emerald-400",
      dot: "bg-emerald-600",
    },
    Pausado: {
      button: "bg-orange-100 text-orange-800 border-orange-300",
      wave: "bg-orange-400",
      dot: "bg-orange-600",
    },
    Invisível: {
      button: "bg-zinc-200 text-zinc-700 border-zinc-300",
      wave: "bg-zinc-400",
      dot: "bg-zinc-600",
    },
  } as const;

  const handleViewPublicAd = () => {
    window.location.href = `/anuncio/${ad.slug}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Header & Bento Grid Fotos ──────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Seu Anúncio</h1>
            <p className="text-zinc-500 mt-1">Gerencie sua identidade visual e informações do anúncio.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:gap-3">
            <button onClick={handleViewPublicAd} className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-lg border border-zinc-200 bg-white font-bold text-zinc-700 hover:bg-zinc-50 transition-colors">
              Ver Anúncio Público
            </button>
            <button
              onClick={manualSave}
              disabled={saveStatus === "saving"}
              className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-lg bg-wine-700 text-white font-bold shadow-md hover:bg-wine-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
            </button>
          </div>
        </div>

        {/* Bento Grid Gallery */}
        <BentoPhotoGallery
          images={form.images}
          onPhotoClick={(idx) => setActivePhotoIndex(idx)}
          onAddPhoto={() => {
            const placeholder = `https://images.unsplash.com/photo-${Date.now()}?w=800&auto=format&fit=crop`;
            updateField("images", [...form.images, placeholder]);
          }}
        />
      </section>

      {/* Fullscreen Photo Modal */}
      {activePhotoIndex !== null && (
        <PhotoGalleryModal
          images={form.images}
          activeIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
          onChange={(idx) => setActivePhotoIndex(idx)}
        />
      )}

      {/* ── 2. Conteúdo e Informações (Split Layout) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Coluna Esquerda: Status & Dicas */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 sm:p-6 bg-white shadow-sm border-zinc-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-900">Status do Anúncio</span>
              <div className="relative flex flex-col items-end gap-1">
                <button onClick={onToggleStatus} className={cn("flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300", statusStyles[visibilityStatus].button)}>
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <span className={cn("absolute inline-flex h-4 w-4 rounded-full opacity-65 animate-ping", statusStyles[visibilityStatus].wave)}></span>
                    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", statusStyles[visibilityStatus].dot)}></span>
                  </span>
                  {visibilityStatus}
                </button>

                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-zinc-500 leading-none">
                  Alterar o status
                  <svg className="h-4 w-4 shrink-0 text-zinc-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9 4l-3 3h2.25v10.5h1.5V7H12L9 4z" />
                    <path d="M15 20l3-3h-2.25V6.5h-1.5V17H12l3 3z" />
                  </svg>
                </span>
              </div>
            </div>
            <ProfileScoreBar score={score} />
          </Card>

          {tips.length > 0 && (
            <div className="bg-zinc-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 relative z-10 flex items-center gap-2">
                <span className="text-amber-400">💡</span> Dicas Inteligentes
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10 mb-4">
                {tips[0].text}
              </p>
              <button className="text-xs font-black uppercase tracking-widest text-amber-400 hover:text-white transition-colors">Ver todas</button>
            </div>
          )}
        </div>

        {/* Coluna Direita: Campos de Edição */}
        <div className="lg:col-span-8 space-y-8">

          {/* ================= SEÇÃO OBRIGATÓRIOS ================= */}
          <div className="flex items-center gap-3 border-b border-zinc-200 pb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">*</div>
            <h2 className="text-xl font-bold text-zinc-900">Informações Obrigatórias</h2>
          </div>

          <SectionCard title="Características físicas" requiredAsterisk icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
            <CharacteristicsSection characteristics={form.characteristics} onUpdate={(key: string, value: string) => updateNestedField("characteristics", key, value)} />
          </SectionCard>

          <SectionCard title="Tabela de preços" requiredAsterisk icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <PricingSection
              pricing={form.pricing}
              onUpdate={(idx: number, field: string, value: string | number) => {
                const next = form.pricing.map((p, i) => i === idx ? { ...p, [field]: field === "price" ? String(value) : value } : p);
                updateField("pricing", next);
              }}
              onToggleDisabled={(idx: number) => {
                const next = form.pricing.map((p, i) => i === idx ? { ...p, disabled: !p.disabled } : p);
                updateField("pricing", next);
              }}
              onAddCustom={(name: string, price: string | number) => {
                const next = [...form.pricing, { label: name, price: String(price), disabled: false, isCustom: true }];
                updateField("pricing", next);
              }}
            />
          </SectionCard>

          <SectionCard title="Localização" requiredAsterisk icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
            <LocationSection
              state={form.locationState} city={form.locationCity}
              onStateChange={(v: string) => updateField("locationState", v)}
              onCityChange={(v: string) => updateField("locationCity", v)}
            />
          </SectionCard>

          {/* ================= SEÇÃO OPCIONAIS ================= */}
          <div className="flex items-center gap-3 border-b border-zinc-200 pb-2 mt-12">
            <h2 className="text-xl font-bold text-zinc-900">Informações Opcionais</h2>
          </div>

          <SectionCard title="Descrição do Perfil" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>}>
            <DescriptionSection shortDescription={form.shortDescription} description={form.description} onShortDescChange={(v: string) => updateField("shortDescription", v)} onDescChange={(v: string) => updateField("description", v)} />
          </SectionCard>

          <SectionCard title="Serviços Oferecidos" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}>
            <ServicesSection services={form.services} onToggle={(idx: number) => {
              const next = form.services.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s);
              updateField("services", next);
            }} />
          </SectionCard>

          <SectionCard title="Horários de Disponibilidade" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <AvailabilitySection
              showAvailability={form.showAvailability} availability={form.availability}
              onToggleShow={(v: boolean) => updateField("showAvailability", v)}
              onDayToggle={(idx: number, enabled: boolean) => {
                const next = form.availability.map((d, i) => i === idx ? { ...d, enabled, start: enabled ? "10:00" : "--:--", end: enabled ? "22:00" : "--:--" } : d);
                updateField("availability", next);
              }}
              onTimeChange={(idx: number, field: string, value: string) => {
                const next = form.availability.map((d, i) => i === idx ? { ...d, [field]: value } : d);
                updateField("availability", next);
              }}
            />
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

// ─── Componentes Visuais do Redesign ──────────────────────────────

function SectionCard({ title, icon, children, requiredAsterisk }: { title: string, icon: React.ReactNode, children: React.ReactNode, requiredAsterisk?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full p-5 sm:p-6 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-zinc-100/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-wine-700 p-2 bg-wine-50 rounded-lg shrink-0">{icon}</div>
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">
            {title}
            {requiredAsterisk && <span className="text-red-600 ml-1">*</span>}
          </h3>
        </div>
        <span className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-600 flex items-center justify-center shrink-0" aria-hidden="true">
          <svg className={cn("w-4 h-4 transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      {isOpen && <div className="p-6 sm:p-8">{children}</div>}
    </div>
  )
}

function BentoPhotoGallery({ images, onPhotoClick, onAddPhoto }: { images: string[], onPhotoClick: (idx: number) => void, onAddPhoto: () => void }) {
  const displayPhotos = images.slice(0, 4);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[250px]">
      {/* Imagem Principal */}
      <div
        className="col-span-2 row-span-2 relative group rounded-2xl overflow-hidden shadow-sm cursor-pointer"
        onClick={() => images.length > 0 && onPhotoClick(0)}
      >
        {images[0] ? (
          <>
            <Image src={images[0]} alt="Principal" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </div>
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest text-wine-700 shadow-lg">Capa do Perfil</div>
          </>
        ) : (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">Sem fotos</div>
        )}
      </div>

      {/* Imagens Menores */}
      {Array.from({ length: 3 }).map((_, i) => {
        const idx = i + 1;
        const img = displayPhotos[idx];
        if (img) {
          return (
            <div key={idx} onClick={() => onPhotoClick(idx)} className="relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer aspect-square sm:aspect-auto">
              <Image src={img} alt={`Foto ${idx}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </div>
            </div>
          )
        }

        // Se for o primeiro slot vazio, mostra o Add Photo
        if (idx === displayPhotos.length) {
          return (
            <div key={idx} onClick={onAddPhoto} className="relative rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:border-wine-300 hover:bg-wine-50 hover:text-wine-700 text-zinc-400 transition-all group aspect-square sm:aspect-auto">
              <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="text-[11px] font-bold uppercase tracking-wider">Add Foto</span>
            </div>
          )
        }

        return <div key={idx} className="hidden sm:block rounded-2xl bg-zinc-50/50 border border-zinc-100 aspect-square sm:aspect-auto" />
      })}
    </div>
  )
}

function PhotoGalleryModal({ images, activeIndex, onClose, onChange }: { images: string[], activeIndex: number, onClose: () => void, onChange: (idx: number) => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="relative w-full max-w-5xl h-[60vh] sm:h-[70vh] px-4">
        <Image src={images[activeIndex]} fill className="object-contain" alt="Fullscreen" />
      </div>

      <div className="w-full max-w-5xl mt-6 px-4">
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={cn("relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden snap-center transition-all", i === activeIndex ? "ring-2 ring-wine-500 opacity-100 scale-105" : "opacity-50 hover:opacity-100")}
            >
              <Image src={img} fill className="object-cover" alt={`Thumb ${i}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Inputs de Formulário e Seções Base ───────────────────────────

function FormInput({ label, value, onChange, placeholder, disabled }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-wine-500 focus:border-wine-500 focus:bg-white outline-none transition-all disabled:opacity-50" />
    </div>
  )
}

function FormSelect({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-wine-500 focus:border-wine-500 focus:bg-white outline-none transition-all">
        {options.map(o => <option key={o} value={o}>{o || "Selecione..."}</option>)}
      </select>
    </div>
  )
}

// ─── Seções Específicas ──────────────────────────────────────────

function CharacteristicsSection({ characteristics: c, onUpdate }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <FormSelect label="Gênero" value={c.gender} options={GENDER_OPTIONS} onChange={(v) => onUpdate("gender", v)} />
      <FormSelect label="Etnia" value={c.ethnicity} options={ETHNICITY_OPTIONS} onChange={(v) => onUpdate("ethnicity", v)} />
      <FormInput label="Altura (cm)" value={c.height} onChange={(v) => onUpdate("height", v)} placeholder="Ex: 170" />
      <FormInput label="Peso (kg)" value={c.weight} onChange={(v) => onUpdate("weight", v)} placeholder="Ex: 60" />
      <FormSelect label="Cor do Cabelo" value={c.hairColor} options={HAIR_COLOR_OPTIONS} onChange={(v) => onUpdate("hairColor", v)} />
      <FormSelect label="Fumante" value={c.smoker} options={SMOKER_OPTIONS} onChange={(v) => onUpdate("smoker", v)} />
    </div>
  )
}

function PricingSection({ pricing, onUpdate, onToggleDisabled, onAddCustom }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const handleSaveCustom = () => {
    if (customName && customPrice) {
      onAddCustom(customName, customPrice);
      setCustomName("");
      setCustomPrice("");
      setIsModalOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      {pricing.map((item: any, idx: number) => (
        <div key={idx} className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-xl border transition-all gap-4", item.disabled ? "bg-zinc-50 border-zinc-100 opacity-60" : "bg-white border-zinc-200 shadow-sm")}>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-200 shrink-0">
              <svg className="w-5 h-5 text-wine-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="font-bold text-zinc-900">{item.label}</p>
              <p className="text-xs text-zinc-500">{item.isCustom ? "Serviço personalizado" : "Serviço padrão"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-200 focus-within:border-wine-500 focus-within:ring-1 focus-within:ring-wine-500 w-full sm:w-32">
              <span className="text-sm font-bold text-zinc-400 mr-2">R$</span>
              <input type="text" inputMode="numeric" value={item.disabled ? "" : item.price} disabled={item.disabled} onChange={(e) => onUpdate(idx, "price", e.target.value)} className="w-full bg-transparent font-bold outline-none text-zinc-900 placeholder:text-zinc-300" placeholder="0,00" />
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={!item.disabled} onChange={() => onToggleDisabled(idx)} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wine-700"></div>
            </label>
          </div>
        </div>
      ))}

      <button onClick={() => setIsModalOpen(true)} className="w-full py-4 mt-2 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-600 font-bold hover:text-wine-700 hover:border-wine-700 hover:bg-wine-50 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-wine-500/30">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        CRIAR SERVIÇO CUSTOMIZADO
      </button>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Serviço">
        <div className="space-y-4 pt-2">
          <FormInput label="Nome do serviço" value={customName} onChange={setCustomName} placeholder="Ex: Acompanhamento em Evento" />
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2">Valor sugerido (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 500"
              className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-wine-500 focus:border-wine-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <button onClick={handleSaveCustom} className="w-full mt-4 bg-wine-700 hover:bg-wine-800 text-white font-bold py-3 rounded-xl transition-colors">
            Adicionar e Ativar
          </button>
        </div>
      </Modal>
    </div>
  )
}

function LocationSection({ state, city, onStateChange, onCityChange }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500">Sede Principal</label>
        <button className="text-[11px] font-bold text-wine-700 border border-wine-200 bg-wine-50 px-2.5 py-1.5 rounded-lg hover:bg-wine-100 transition-colors flex items-center gap-1 cursor-pointer">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Detectar localização atual
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Estado" value={state} onChange={onStateChange} placeholder="Ex: SP" />
        <FormInput label="Cidade" value={city} onChange={onCityChange} placeholder="Ex: São Paulo" />
      </div>
    </div>
  )
}

function DescriptionSection({ shortDescription, description, onShortDescChange, onDescChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2">Resumo em uma frase (Headline)</label>
        <input type="text" value={shortDescription} onChange={(e) => onShortDescChange(e.target.value)} placeholder="Ex: Atendimento discreto com experiência premium..." maxLength={150} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-wine-700 focus:ring-2 focus:ring-wine-700 outline-none transition-all" />
      </div>
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2">Narrativa Profissional Completa</label>
        <textarea value={description} onChange={(e) => onDescChange(e.target.value)} placeholder="Descreva seu atendimento, diferenciais, o que o cliente pode esperar..." maxLength={1000} rows={4} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-wine-700 focus:ring-2 focus:ring-wine-700 outline-none transition-all resize-none" />
      </div>
    </div>
  )
}

function ServicesSection({ services, onToggle }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {services.map((svc: any, idx: number) => (
        <button key={svc.label} onClick={() => onToggle(idx)} className={cn("flex items-center justify-between p-4 rounded-xl border text-left transition-all", svc.selected ? "border-wine-500 bg-wine-50/50 shadow-sm" : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100")}>
          <span className={cn("text-sm font-bold", svc.selected ? "text-wine-900" : "text-zinc-600")}>{svc.label}</span>
          <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors", svc.selected ? "bg-wine-700 border-wine-700 text-white" : "border-zinc-300 bg-white")}>
            {svc.selected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
        </button>
      ))}
    </div>
  )
}

function AvailabilitySection({ showAvailability, availability, onToggleShow, onDayToggle, onTimeChange }: any) {
  return (
    <div className="space-y-6">
      <label className="flex items-center justify-between cursor-pointer p-5 rounded-xl border border-zinc-200 bg-zinc-50/50">
        <div>
          <span className="text-base font-bold text-zinc-900 block">Exibir grade de horários pública</span>
          <span className="text-xs text-zinc-500">Deixe os clientes saberem exatamente quando você atende.</span>
        </div>
        <div className="relative">
          <input type="checkbox" checked={showAvailability} onChange={(e) => onToggleShow(e.target.checked)} className="sr-only peer" />
          <div className="w-12 h-6 bg-zinc-200 rounded-full peer peer_checked:after:translate-x-full after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wine-700"></div>
        </div>
      </label>

      {showAvailability && (
        <div className="grid grid-cols-1 gap-2">
          {availability.map((entry: any, idx: number) => (
            <div key={entry.day} className={cn("flex items-center gap-4 p-3 rounded-xl border transition-all", entry.enabled ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-50 border-zinc-100 opacity-60")}>
              <div className="flex items-center gap-3 w-28 shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={entry.enabled} onChange={(e) => onDayToggle(idx, e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-wine-700"></div>
                </label>
                <span className="text-xs font-black text-zinc-700 w-10">{entry.day}</span>
              </div>

              <div className="flex-1 flex items-center justify-end gap-2">
                <input type="text" value={entry.start} disabled={!entry.enabled} onChange={(e) => onTimeChange(idx, "start", e.target.value)} className="w-16 text-center border border-zinc-200 bg-zinc-50 rounded-lg text-sm font-bold py-2 focus:border-wine-500 outline-none disabled:opacity-50" />
                <span className="text-zinc-400 text-sm font-bold">às</span>
                <input type="text" value={entry.end} disabled={!entry.enabled} onChange={(e) => onTimeChange(idx, "end", e.target.value)} className="w-16 text-center border border-zinc-200 bg-zinc-50 rounded-lg text-sm font-bold py-2 focus:border-wine-500 outline-none disabled:opacity-50" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaveIndicator({ status, lastSavedAt }: { status: "idle" | "saving" | "saved" | "error"; lastSavedAt: Date | null }) {
  if (status === "idle" && !lastSavedAt) return <span>Salvar Anúncio</span>;
  if (status === "saving") return <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Salvando</>;
  if (status === "saved") return <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Salvo</>;
  return <span>Salvo {lastSavedAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>;
}

function ProfileScoreBar({ score }: { score: { percentage: number } }) {
  const barColor = score.percentage >= 80 ? "bg-emerald-500" : score.percentage >= 50 ? "bg-amber-500" : "bg-red-400";
  const textColor = score.percentage >= 80 ? "text-emerald-700" : score.percentage >= 50 ? "text-amber-700" : "text-red-600";

  return (
    <div className="space-y-2.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-wine-700">Índice de Qualidade</span>
      <h3 className="text-xl font-bold text-zinc-900 leading-tight">Força do Perfil</h3>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)} style={{ width: `${score.percentage}%` }} />
      </div>
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className={cn("uppercase tracking-wider", textColor)}>{score.percentage}% Completo</span>
        <button type="button" className="text-wine-700 cursor-pointer hover:underline uppercase">Otimizar Agora</button>
      </div>
    </div>
  );
}
