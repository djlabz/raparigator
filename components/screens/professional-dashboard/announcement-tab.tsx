"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { currency, cn } from "@/lib/utils";
import type { AdPreview, AdStatus } from "./types";
import { useProfileForm } from "./use-profile-form";

// ─── Options para selects ─────────────────────────────────────────
const GENDER_OPTIONS = ["", "Feminino", "Masculino", "Trans", "Não-binário"];
const GENITALIA_OPTIONS = ["", "Feminino", "Masculino", "Neutro"];
const SEXUAL_PREF_OPTIONS = ["", "Hétero", "Bi", "Gay", "Pan", "Queer"];
const ETHNICITY_OPTIONS = ["", "Branca", "Preta", "Parda", "Amarela", "Indígena"];
const HAIR_COLOR_OPTIONS = ["", "Preto", "Castanho", "Loiro", "Ruivo", "Colorido", "Rosa", "Platinado"];
const HAIR_LENGTH_OPTIONS = ["", "Raspado", "Curto", "Médio", "Longo"];
const EYE_COLOR_OPTIONS = ["", "Castanho", "Azul", "Verde", "Mel", "Preto"];
const SILICONE_OPTIONS = ["", "Sim", "Não"];
const TATTOO_OPTIONS = ["", "Sim", "Não"];
const PIERCING_OPTIONS = ["", "Sim", "Não"];
const SMOKER_OPTIONS = ["", "Sim", "Não"];

const REVIEW_MOCK = [
  { id: "r1", author: "Cliente verificado", timeAgo: "3 dias", text: "Pontual, educada e super discreta.", score: 5 },
  { id: "r2", author: "Cliente premium", timeAgo: "1 semana", text: "Experiência impecável do início ao fim.", score: 5 },
  { id: "r3", author: "Cliente verificado", timeAgo: "2 semanas", text: "Excelente conversa e atendimento cordial.", score: 4 },
];

type EditSectionKey = "photos" | "description" | "characteristics" | "services" | "pricing" | "location" | "availability";

// ─── Componente Principal ─────────────────────────────────────────
export function AnnouncementTab({
  ad,
  adSlug,
  status,
  onToggleStatus,
}: {
  ad: AdPreview;
  adSlug: string;
  status: AdStatus;
  onToggleStatus: () => void;
}) {
  const formHook = useProfileForm(ad);
  const { form, saveStatus, lastSavedAt, score, tips, updateField, updateNestedField } = formHook;
  const [openSections, setOpenSections] = useState<Set<EditSectionKey>>(new Set(["photos"]));
  const editAreaRef = useRef<HTMLDivElement>(null);

  const toggleSection = (key: EditSectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const scrollToEdit = () => {
    editAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ── 1. Preview (mantido) ───────────────────────────────── */}
      <PreviewCard
        ad={ad}
        adSlug={adSlug}
        status={status}
        onToggleStatus={onToggleStatus}
        onEditClick={scrollToEdit}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
      />

      {/* ── 2. Score de Perfil ──────────────────────────────────── */}
      <ProfileScoreBar score={score} />

      {/* ── 3. Dicas Inteligentes ───────────────────────────────── */}
      {tips.length > 0 && <SmartTipsList tips={tips} />}

      {/* ── 4. Seções de Edição ─────────────────────────────────── */}
      <div ref={editAreaRef} className="space-y-3">
        {/* Fotos */}
        <SectionAccordion
          title="Fotos do perfil"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          }
          isOpen={openSections.has("photos")}
          onToggle={() => toggleSection("photos")}
        >
          <PhotosSection
            images={form.images}
            coverIndex={form.coverIndex}
            onAdd={() => {
              const placeholder = `https://images.unsplash.com/photo-${Date.now()}?w=400&auto=format&fit=crop`;
              updateField("images", [...form.images, placeholder]);
            }}
            onRemove={(idx) => {
              const next = form.images.filter((_, i) => i !== idx);
              updateField("images", next);
              if (form.coverIndex >= next.length) updateField("coverIndex", 0);
            }}
            onSetCover={(idx) => updateField("coverIndex", idx)}
            onReorder={(from, to) => {
              const next = [...form.images];
              const [item] = next.splice(from, 1);
              next.splice(to, 0, item);
              let newCover = form.coverIndex;
              if (form.coverIndex === from) newCover = to;
              else if (form.coverIndex === to) newCover = from;
              updateField("images", next);
              updateField("coverIndex", newCover);
            }}
          />
        </SectionAccordion>

        {/* Descrição */}
        <SectionAccordion
          title="Descrição"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>
          }
          isOpen={openSections.has("description")}
          onToggle={() => toggleSection("description")}
        >
          <DescriptionSection
            shortDescription={form.shortDescription}
            description={form.description}
            onShortDescChange={(v) => updateField("shortDescription", v)}
            onDescChange={(v) => updateField("description", v)}
          />
        </SectionAccordion>

        {/* Características */}
        <SectionAccordion
          title="Características físicas"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          }
          isOpen={openSections.has("characteristics")}
          onToggle={() => toggleSection("characteristics")}
        >
          <CharacteristicsSection
            characteristics={form.characteristics}
            onUpdate={(key, value) => updateNestedField("characteristics", key, value)}
          />
        </SectionAccordion>

        {/* Serviços */}
        <SectionAccordion
          title="Serviços oferecidos"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          }
          isOpen={openSections.has("services")}
          onToggle={() => toggleSection("services")}
        >
          <ServicesSection
            services={form.services}
            onToggle={(idx) => {
              const next = form.services.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s);
              updateField("services", next);
            }}
          />
        </SectionAccordion>

        {/* Tabela de Preços */}
        <SectionAccordion
          title="Tabela de preços"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          isOpen={openSections.has("pricing")}
          onToggle={() => toggleSection("pricing")}
        >
          <PricingSection
            pricing={form.pricing}
            onUpdate={(idx, field, value) => {
              const next = form.pricing.map((p, i) => i === idx ? { ...p, [field]: value } : p);
              updateField("pricing", next);
            }}
            onToggleDisabled={(idx) => {
              const next = form.pricing.map((p, i) => i === idx ? { ...p, disabled: !p.disabled } : p);
              updateField("pricing", next);
            }}
          />
        </SectionAccordion>

        {/* Localização */}
        <SectionAccordion
          title="Localização"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          }
          isOpen={openSections.has("location")}
          onToggle={() => toggleSection("location")}
        >
          <LocationSection
            venues={form.venues}
            state={form.locationState}
            city={form.locationCity}
            onVenueToggle={(idx) => {
              const next = form.venues.map((v, i) => i === idx ? { ...v, checked: !v.checked } : v);
              updateField("venues", next);
            }}
            onStateChange={(v) => updateField("locationState", v)}
            onCityChange={(v) => updateField("locationCity", v)}
          />
        </SectionAccordion>

        {/* Disponibilidade */}
        <SectionAccordion
          title="Horário de disponibilidade"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          isOpen={openSections.has("availability")}
          onToggle={() => toggleSection("availability")}
        >
          <AvailabilitySection
            showAvailability={form.showAvailability}
            availability={form.availability}
            onToggleShow={(v) => updateField("showAvailability", v)}
            onDayToggle={(idx, enabled) => {
              const next = form.availability.map((d, i) =>
                i === idx ? { ...d, enabled, start: enabled ? "10:00" : "--:--", end: enabled ? "22:00" : "--:--" } : d,
              );
              updateField("availability", next);
            }}
            onTimeChange={(idx, field, value) => {
              const next = form.availability.map((d, i) => i === idx ? { ...d, [field]: value } : d);
              updateField("availability", next);
            }}
          />
        </SectionAccordion>

      </div>
    </div>
  );
}

// ─── Preview Card (mantido com ajuste no botão Editar) ────────────
function PreviewCard({
  ad,
  adSlug,
  status,
  onToggleStatus,
  onEditClick,
  saveStatus,
  lastSavedAt,
}: {
  ad: AdPreview;
  adSlug: string;
  status: AdStatus;
  onToggleStatus: () => void;
  onEditClick: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
}) {
  return (
    <Card className="overflow-hidden border-zinc-200 bg-white shadow-[0_10px_28px_-22px_rgba(24,24,27,0.55)]">
      {/* Imagem de Capa */}
      <div className="relative h-44 sm:h-56 lg:h-64 w-full overflow-hidden bg-zinc-900">
        <Image
          src={ad.images[0]}
          alt={ad.artisticName}
          fill
          className="object-cover opacity-90"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm",
              status === "Ativo"
                ? "bg-emerald-500/90 text-white"
                : "bg-amber-500/90 text-white",
            )}
          >
            <span className="relative flex h-2 w-2">
              {status === "Ativo" && (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-full w-full rounded-full bg-white" />
                </>
              )}
              {status === "Pausado" && (
                <span className="relative inline-flex h-full w-full rounded-full bg-white" />
              )}
            </span>
            {status}
          </span>
        </div>

        {/* Indicador de salvamento */}
        <div className="absolute top-3 right-3">
          <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>

        {/* Overlay Info */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
          <h3 className="text-xl sm:text-2xl font-black text-white mb-1 drop-shadow-lg">
            {ad.artisticName}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-white/90">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {ad.city}, {ad.state}
            </span>
            <span className="inline">•</span>
            <span className="font-semibold text-white">A partir de {currency(ad.startingPrice)}</span>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-50/50">
        <div className="px-3 py-3 sm:px-4 sm:py-4 text-center border-r border-zinc-200">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Views</p>
          <p className="text-base sm:text-lg font-black text-zinc-900 mt-0.5">{ad.profileViews.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3 sm:px-4 sm:py-4 text-center border-r border-zinc-200">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avaliação</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-amber-500 text-xs sm:text-sm">★</span>
            <p className="text-base sm:text-lg font-black text-zinc-900">{ad.rating}</p>
          </div>
        </div>
        <div className="px-3 py-3 sm:px-4 sm:py-4 text-center">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reviews</p>
          <p className="text-base sm:text-lg font-black text-zinc-900 mt-0.5">{ad.reviewsCount}</p>
        </div>
      </div>

      {/* Ações Principais */}
      <div className="p-3.5 sm:p-5">
        <Link
          href={`/anuncio/${adSlug}`}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-wine-700 px-5 text-sm font-bold text-white! hover:bg-wine-800 transition-colors shadow-sm hover:shadow mb-2.5 sm:mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-white">Ver meu anúncio</span>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={onEditClick}
            className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-zinc-200 bg-white px-3 text-xs sm:text-sm font-semibold text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>

          <button
            onClick={onToggleStatus}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 rounded-lg border px-3 text-xs sm:text-sm font-semibold transition-colors",
              status === "Ativo"
                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
            )}
          >
            {status === "Ativo" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pausar
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ativar
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Profile Score Bar ────────────────────────────────────────────
function ProfileScoreBar({ score }: { score: { percentage: number } }) {
  const barColor = score.percentage >= 80 ? "bg-emerald-500" : score.percentage >= 50 ? "bg-amber-500" : "bg-red-400";
  const textColor = score.percentage >= 80 ? "text-emerald-700" : score.percentage >= 50 ? "text-amber-700" : "text-red-600";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-zinc-900">Completude do perfil</p>
        <p className={cn("text-sm font-black", textColor)}>{score.percentage}%</p>
      </div>
      <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${score.percentage}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        {score.percentage >= 80
          ? "Seu perfil está excelente! Mantenha atualizado."
          : score.percentage >= 50
            ? "Bom progresso! Complete mais campos para aparecer melhor."
            : "Complete mais campos para aumentar sua visibilidade."}
      </p>
    </Card>
  );
}

// ─── Smart Tips ───────────────────────────────────────────────────
function SmartTipsList({ tips }: { tips: Array<{ id: string; text: string; priority: "high" | "medium" | "low" }> }) {
  const priorityColors: Record<string, string> = {
    high: "border-red-200 bg-red-50",
    medium: "border-amber-200 bg-amber-50",
    low: "border-blue-200 bg-blue-50",
  };
  const priorityTextColors: Record<string, string> = {
    high: "text-red-800",
    medium: "text-amber-800",
    low: "text-blue-800",
  };
  const priorityLabels: Record<string, string> = {
    high: "Importante",
    medium: "Dica",
    low: "Sugestão",
  };

  return (
    <div className="space-y-2">
      {tips.map((tip) => (
        <Card key={tip.id} className={cn("p-3 sm:p-4 border", priorityColors[tip.priority])}>
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0 mt-0.5">💡</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", priorityTextColors[tip.priority])}>
                  {priorityLabels[tip.priority]}
                </span>
              </div>
              <p className={cn("text-xs sm:text-sm leading-relaxed", priorityTextColors[tip.priority])}>{tip.text}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Save Indicator ───────────────────────────────────────────────
function SaveIndicator({ status, lastSavedAt }: { status: "idle" | "saving" | "saved" | "error"; lastSavedAt: Date | null }) {
  if (status === "idle" && !lastSavedAt) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
      {status === "saving" && (
        <>
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Salvando...
        </>
      )}
      {status === "saved" && (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Salvo
        </>
      )}
      {status === "error" && (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          Erro
        </>
      )}
      {status === "idle" && lastSavedAt && (
        <span>Salvo às {lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
      )}
    </div>
  );
}

// ─── Accordion Wrapper ────────────────────────────────────────────
function SectionAccordion({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-zinc-200 bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 text-left min-h-11 hover:bg-zinc-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-wine-700">{icon}</span>
          <span className="text-sm sm:text-base font-semibold text-zinc-900">{title}</span>
        </div>
        <svg
          className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-zinc-100 pt-4">
          {children}
        </div>
      )}
    </Card>
  );
}

// ─── Input/Select helpers ─────────────────────────────────────────
function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all min-h-11"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt || "Selecionar..."}</option>
        ))}
      </select>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all disabled:bg-zinc-50 disabled:text-zinc-400 min-h-11"
      />
    </div>
  );
}

// ─── 5.1 Photos Section ───────────────────────────────────────────
function PhotosSection({
  images,
  coverIndex,
  onAdd,
  onRemove,
  onSetCover,
  onReorder,
}: {
  images: string[];
  coverIndex: number;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onSetCover: (idx: number) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {images.slice(0, 6).map((img, idx) => (
          <div
            key={idx}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden group border-2 transition-all",
              idx === coverIndex ? "border-wine-700" : "border-zinc-200",
            )}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx);
              setDragIdx(null);
            }}
          >
            <Image
              src={img}
              alt={`Foto ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => onSetCover(idx)}
                className="p-1.5 bg-white/90 rounded-full text-zinc-900 hover:bg-white text-xs"
                title="Definir como capa"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </button>
              <button
                onClick={() => onRemove(idx)}
                className="p-1.5 bg-red-500/90 rounded-full text-white hover:bg-red-500 text-xs"
                title="Remover"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {idx === coverIndex && (
              <div className="absolute top-1 left-1 bg-wine-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Capa</div>
            )}
          </div>
        ))}

        {/* Botão Adicionar */}
        <button
          onClick={onAdd}
          className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-wine-700 hover:border-wine-300 transition-colors cursor-pointer min-h-11"
        >
          <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          <span className="text-[10px] font-bold uppercase">Add</span>
        </button>
      </div>
      <p className="text-[10px] text-zinc-400">Arraste para reordenar · Clique na ☆ para definir capa</p>
    </div>
  );
}

// ─── 5.2 Description Section ──────────────────────────────────────
function DescriptionSection({
  shortDescription,
  description,
  onShortDescChange,
  onDescChange,
}: {
  shortDescription: string;
  description: string;
  onShortDescChange: (v: string) => void;
  onDescChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Descrição curta</label>
        <textarea
          value={shortDescription}
          onChange={(e) => onShortDescChange(e.target.value)}
          placeholder="Ex: Atendimento discreto com experiência premium..."
          maxLength={150}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all resize-none"
        />
        <p className="text-[10px] text-zinc-400 mt-1 text-right">{shortDescription.length}/150</p>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Descrição completa</label>
        <textarea
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Descreva seu atendimento, diferenciais, o que o cliente pode esperar..."
          maxLength={1000}
          rows={5}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all resize-none"
        />
        <p className="text-[10px] text-zinc-400 mt-1 text-right">{description.length}/1000</p>
      </div>
    </div>
  );
}

// ─── 5.3 Characteristics Section ──────────────────────────────────
function CharacteristicsSection({
  characteristics: c,
  onUpdate,
}: {
  characteristics: {
    gender: string;
    genitalia: string;
    sexualPreference: string;
    weight: string;
    height: string;
    ethnicity: string;
    eyeColor: string;
    hairColor: string;
    hairLength: string;
    silicone: string;
    tattoos: string;
    piercings: string;
    smoker: string;
    languages: string;
  };
  onUpdate: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Grupo Básico */}
      <div>
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Informações básicas</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormSelect label="Gênero" value={c.gender} options={GENDER_OPTIONS} onChange={(v) => onUpdate("gender", v)} />
          <FormSelect label="Genitália" value={c.genitalia} options={GENITALIA_OPTIONS} onChange={(v) => onUpdate("genitalia", v)} />
          <FormSelect label="Preferência sexual" value={c.sexualPreference} options={SEXUAL_PREF_OPTIONS} onChange={(v) => onUpdate("sexualPreference", v)} />
        </div>
      </div>

      {/* Grupo Corpo */}
      <div>
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Corpo</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormInput label="Peso (kg)" value={c.weight} onChange={(v) => onUpdate("weight", v)} placeholder="Ex: 60" />
          <FormInput label="Altura (cm)" value={c.height} onChange={(v) => onUpdate("height", v)} placeholder="Ex: 170" />
          <FormSelect label="Etnia" value={c.ethnicity} options={ETHNICITY_OPTIONS} onChange={(v) => onUpdate("ethnicity", v)} />
          <FormSelect label="Cor dos olhos" value={c.eyeColor} options={EYE_COLOR_OPTIONS} onChange={(v) => onUpdate("eyeColor", v)} />
          <FormSelect label="Cor do cabelo" value={c.hairColor} options={HAIR_COLOR_OPTIONS} onChange={(v) => onUpdate("hairColor", v)} />
          <FormSelect label="Tam. cabelo" value={c.hairLength} options={HAIR_LENGTH_OPTIONS} onChange={(v) => onUpdate("hairLength", v)} />
        </div>
      </div>

      {/* Grupo Extras */}
      <div>
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Extras</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormSelect label="Silicone" value={c.silicone} options={SILICONE_OPTIONS} onChange={(v) => onUpdate("silicone", v)} />
          <FormSelect label="Tatuagens" value={c.tattoos} options={TATTOO_OPTIONS} onChange={(v) => onUpdate("tattoos", v)} />
          <FormSelect label="Piercings" value={c.piercings} options={PIERCING_OPTIONS} onChange={(v) => onUpdate("piercings", v)} />
          <FormSelect label="Fumante" value={c.smoker} options={SMOKER_OPTIONS} onChange={(v) => onUpdate("smoker", v)} />
        </div>
      </div>

      {/* Idiomas */}
      <FormInput label="Idiomas" value={c.languages} onChange={(v) => onUpdate("languages", v)} placeholder="Ex: Português, Inglês, Espanhol" />
    </div>
  );
}

// ─── 5.4 Services Section ─────────────────────────────────────────
function ServicesSection({
  services,
  onToggle,
}: {
  services: Array<{ label: string; selected: boolean }>;
  onToggle: (idx: number) => void;
}) {
  return (
    <div className="space-y-2">
      {services.map((svc, idx) => (
        <button
          key={svc.label}
          onClick={() => onToggle(idx)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left min-h-11 transition-all",
            svc.selected
              ? "border-wine-200 bg-wine-50"
              : "border-zinc-200 bg-white hover:bg-zinc-50",
          )}
        >
          <span className="text-sm font-medium text-zinc-900">{svc.label}</span>
          <div className={cn(
            "w-10 h-6 rounded-full relative transition-colors shrink-0",
            svc.selected ? "bg-wine-700" : "bg-zinc-200",
          )}>
            <div className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
              svc.selected ? "left-4.5" : "left-0.5",
            )} />
          </div>
        </button>
      ))}
      {services.filter((s) => s.selected).length === 0 && (
        <p className="text-xs text-zinc-400 mt-2">Nenhum serviço selecionado — eles não aparecerão no perfil público.</p>
      )}
    </div>
  );
}

// ─── 5.5 Pricing Section ──────────────────────────────────────────
function PricingSection({
  pricing,
  onUpdate,
  onToggleDisabled,
}: {
  pricing: Array<{ label: string; price: string; disabled: boolean }>;
  onUpdate: (idx: number, field: "price" | "disabled", value: string | boolean) => void;
  onToggleDisabled: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      {pricing.map((item, idx) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-all",
            item.disabled ? "border-zinc-100 bg-zinc-50/50 opacity-50" : "border-zinc-200 bg-white",
          )}
        >
          <span className="text-sm font-medium text-zinc-700 w-20 shrink-0">{item.label}</span>
          <div className="flex-1">
            <input
              type="text"
              inputMode="numeric"
              value={item.disabled ? "" : item.price}
              disabled={item.disabled}
              onChange={(e) => onUpdate(idx, "price", e.target.value)}
              placeholder="R$ 0"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all disabled:bg-transparent disabled:text-zinc-400 min-h-11"
            />
          </div>
          <label className="flex items-center gap-2 shrink-0 cursor-pointer min-h-11">
            <input
              type="checkbox"
              checked={item.disabled}
              onChange={() => onToggleDisabled(idx)}
              className="sr-only"
            />
            <div className={cn(
              "w-9 h-5 rounded-full relative transition-colors",
              item.disabled ? "bg-zinc-300" : "bg-wine-700",
            )}>
              <div className={cn(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                item.disabled ? "left-0.5" : "left-4.5",
              )} />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Não realiza</span>
          </label>
        </div>
      ))}
    </div>
  );
}

// ─── 5.6 Location Section ─────────────────────────────────────────
function LocationSection({
  venues,
  state,
  city,
  onVenueToggle,
  onStateChange,
  onCityChange,
}: {
  venues: Array<{ key: string; label: string; checked: boolean }>;
  state: string;
  city: string;
  onVenueToggle: (idx: number) => void;
  onStateChange: (v: string) => void;
  onCityChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Onde atende */}
      <div>
        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Onde atende</label>
        <div className="grid grid-cols-2 gap-2">
          {venues.map((v, idx) => (
            <button
              key={v.key}
              onClick={() => onVenueToggle(idx)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all min-h-11",
                v.checked
                  ? "border-wine-200 bg-wine-50 text-wine-800"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                v.checked ? "bg-wine-700 border-wine-700" : "border-zinc-300",
              )}>
                {v.checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estado e Cidade */}
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Estado" value={state} onChange={onStateChange} placeholder="Ex: SP" />
        <FormInput label="Cidade" value={city} onChange={onCityChange} placeholder="Ex: São Paulo" />
      </div>
    </div>
  );
}

// ─── 5.7 Availability Section ─────────────────────────────────────
function AvailabilitySection({
  showAvailability,
  availability,
  onToggleShow,
  onDayToggle,
  onTimeChange,
}: {
  showAvailability: boolean;
  availability: Array<{ day: string; enabled: boolean; start: string; end: string }>;
  onToggleShow: (v: boolean) => void;
  onDayToggle: (idx: number, enabled: boolean) => void;
  onTimeChange: (idx: number, field: "start" | "end", value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Toggle exibição */}
      <label className="flex items-center justify-between cursor-pointer min-h-11 p-3 rounded-lg border border-zinc-200 bg-white">
        <span className="text-sm font-medium text-zinc-900">Exibir horários no perfil</span>
        <div className="relative">
          <input type="checkbox" checked={showAvailability} onChange={(e) => onToggleShow(e.target.checked)} className="sr-only" />
          <div className={cn("w-11 h-6 rounded-full transition-colors", showAvailability ? "bg-wine-700" : "bg-zinc-200")}>
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
              showAvailability ? "left-6" : "left-1",
            )} />
          </div>
        </div>
      </label>

      {showAvailability && (
        <div className="space-y-2">
          {availability.map((entry, idx) => (
            <div
              key={entry.day}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                entry.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50/50 opacity-50",
              )}
            >
              <span className="w-8 text-[11px] font-black text-zinc-500 shrink-0">{entry.day}</span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={entry.enabled}
                  onChange={(e) => onDayToggle(idx, e.target.checked)}
                  className="sr-only"
                />
                <div className={cn("w-8 h-4 rounded-full transition-colors", entry.enabled ? "bg-wine-700" : "bg-zinc-200")}>
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform",
                    entry.enabled ? "left-4" : "left-0.5",
                  )} />
                </div>
              </label>
              <input
                type="text"
                value={entry.start}
                disabled={!entry.enabled}
                onChange={(e) => onTimeChange(idx, "start", e.target.value)}
                className="w-14 text-center border border-zinc-200 rounded-md text-xs font-bold px-2 py-2 focus:border-wine-700 outline-none disabled:bg-zinc-50 disabled:text-zinc-400 min-h-11"
              />
              <span className="text-zinc-300 text-xs">—</span>
              <input
                type="text"
                value={entry.end}
                disabled={!entry.enabled}
                onChange={(e) => onTimeChange(idx, "end", e.target.value)}
                className="w-14 text-center border border-zinc-200 rounded-md text-xs font-bold px-2 py-2 focus:border-wine-700 outline-none disabled:bg-zinc-50 disabled:text-zinc-400 min-h-11"
              />
            </div>
          ))}
        </div>
      )}
      {!showAvailability && (
        <p className="text-xs text-zinc-400">Horários desativados — não aparecerão no perfil público.</p>
      )}
    </div>
  );
}
