"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dashboardSummary } from "@/lib/mock-data";
import { currency, cn } from "@/lib/utils";

const tabs = ["Resumo", "Anúncio", "Histórico"];
const availabilityDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"] as const;

type AvailabilityDay = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

const defaultAvailability: AvailabilityDay[] = availabilityDays.map((day, index) => ({
  day,
  enabled: index <= 4,
  start: index <= 4 ? "10:00" : "--:--",
  end: index <= 4 ? (index === 4 ? "00:00" : "22:00") : "--:--",
}));

// Dados simulados da galeria
const galleryImages = [
  { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop", isCover: true, alt: "Capa" },
  { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop", isCover: false, alt: "Galeria 1" },
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop", isCover: false, alt: "Galeria 2" }
];

type Announcement = { id: number; name: string; city: string; status: "Ativo" | "Pausado" | "Inativo"; views: number; activeCount: number; };

const initialAnnouncements: Announcement[] = [
  { id: 1, name: "Isabella Valente", city: "São Paulo", status: "Ativo", views: 1290, activeCount: 46 },
  { id: 2, name: "Sofia Martins", city: "São Paulo", status: "Pausado", views: 856, activeCount: 32 },
  { id: 3, name: "Carla Santos", city: "Rio de Janeiro", status: "Inativo", views: 542, activeCount: 18 },
];

export function ProfessionalDashboardScreen() {
  const [activeTab, setActiveTab] = useState("Resumo");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<number | null>(null);

  // Novo Estado para a lista de anúncios para permitir toggle de status (REQ 2)
  const [announcementsList, setAnnouncementsList] = useState(initialAnnouncements);

  // MODO TELA CHEIA: Ao gerenciar um anúncio específico
  if (selectedAnnouncement !== null) {
    return (
      <AppShell onBack={() => setSelectedAnnouncement(null)}>
        <div className="mx-auto max-w-5xl space-y-6 pb-10">
          <AnnouncementManagementTab publicAdHref={`/anuncio/${selectedAnnouncement}`} />
        </div>
      </AppShell>
    );
  }

  // MODO NORMAL: Dashboard com Abas
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

          {activeTab === "Resumo" && (
            <div className="space-y-4 lg:space-y-6">
              {/* Grid Principal - 4 Métricas */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCardComDica
                  title="Receita do mês"
                  value={currency(dashboardSummary.monthRevenue)}
                  change={12}
                  icon="💰"
                  tip="R$ 200 acima da meta"
                />
                <MetricCardComDica
                  title="Atendimentos"
                  value={String(dashboardSummary.completedServices)}
                  change={8}
                  icon="👥"
                  tip="Média de 1,5 por dia"
                />
                <MetricCardComDica
                  title="Visualizações"
                  value={String(dashboardSummary.profileViews)}
                  change={-5}
                  icon="👁️"
                  tip="142 este mês"
                />
                <MetricCardComDica
                  title="Conversão"
                  value={`${dashboardSummary.conversionRate}%`}
                  change={3}
                  icon="📈"
                  tip="2.2% acima da média"
                />
              </section>

              {/* Card de Dicas e Orientações */}
              <Card className="bg-linear-to-r from-wine-50 to-wine-100/50 border border-wine-200 p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💡</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-wine-900 mb-2">Dica para aumentar conversão</h3>
                    <p className="text-sm text-wine-800">Adicione mais fotos de alta qualidade à sua galeria. Perfis com +5 fotos têm 35% mais conversões!</p>
                    <button className="mt-3 text-wine-700 font-semibold text-sm hover:underline">→ Ir para galeria</button>
                  </div>
                </div>
              </Card>

              {/* Comparativo com Período Anterior */}
              <Card className="space-y-4 p-4 sm:p-6">
                <h3 className="font-bold text-lg text-zinc-900">Comparativo - Mês Anterior</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Receita ↑</p>
                    <p className="text-lg font-bold text-emerald-900 mt-1">+12% (R$ 3.200)</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Atendimentos ↑</p>
                    <p className="text-lg font-bold text-emerald-900 mt-1">+8% (4 atendimentos)</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 font-semibold uppercase">Visualizações ↓</p>
                    <p className="text-lg font-bold text-red-900 mt-1">-5% (142 views)</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold uppercase">Taxa de Conversão ↑</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">+3% (18.2%)</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "Anúncio" && (
            <div className="space-y-4 lg:space-y-6">
              {/* O painel profissional foi removido (REQ 2) */}
              <AnnouncementListSection
                announcements={announcementsList} // Passar a lista como prop
                setAnnouncements={setAnnouncementsList} // Passar o setter como prop
                onSelectAnnouncement={setSelectedAnnouncement}
              />
            </div>
          )}

          {activeTab === "Histórico" && <HistoryManagementTab />}
        </div>
      </div>
    </AppShell>
  );
}

// --- Sub-componentes da tela ---

function MetricCardComDica({ title, value, change, icon, tip }: { title: string; value: string; change: number; icon: string; tip: string }) {
  const isPositive = change >= 0;
  return (
    <Card className="p-4 hover:border-wine-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn("text-xs font-semibold", isPositive ? "text-emerald-600" : "text-red-600")}>
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-xs text-zinc-500">vs. mês anterior</span>
      </div>
      <p className="text-xs text-zinc-600 mt-2 bg-zinc-50 px-2 py-1 rounded">{tip}</p>
    </Card>
  );
}

function AnnouncementListSection({
  announcements, // Aceitar a lista como prop (REQ 2)
  setAnnouncements, // Aceitar o setter como prop (REQ 2)
  onSelectAnnouncement,
}: {
  announcements: Array<{ id: number; name: string; city: string; status: "Ativo" | "Pausado" | "Inativo"; views: number; activeCount: number; }>; // Definir o tipo (REQ 2)
  setAnnouncements: React.Dispatch<React.SetStateAction<Array<{ id: number; name: string; city: string; status: "Ativo" | "Pausado" | "Inativo"; views: number; activeCount: number; }>>>;
  onSelectAnnouncement: (id: number) => void;
}) {
  // Mock data de anúncios - remover a constante interna (REQ 2)
  // const announcements = [
  //   { id: 1, name: "Isabella Valente", city: "São Paulo", status: "Ativo" as const, views: 1290, activeCount: 46 },
  //   { id: 2, name: "Sofia Martins", city: "São Paulo", status: "Pausado" as const, views: 856, activeCount: 32 },
  //   { id: 3, name: "Carla Santos", city: "Rio de Janeiro", status: "Inativo" as const, views: 542, activeCount: 18 },
  // ];

  // Função para alternar o status do anúncio (REQ 2)
  const toggleAdStatus = (id: number) => {
    setAnnouncements((current) =>
      current.map((ad) => {
        if (ad.id === id) {
          if (ad.status === "Inativo") return ad; // Não faz nada se inativo
          const nextStatus = ad.status === "Ativo" ? "Pausado" : "Ativo";
          return { ...ad, status: nextStatus };
        }
        return ad;
      })
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-lg text-zinc-900">Meus Anúncios</h3>
          <Button className="h-9 rounded-lg bg-wine-700 px-4 text-sm font-bold text-white hover:bg-wine-800 shadow-sm">
            + Novo Anúncio
          </Button>
        </div>
        <div className="grid gap-4">
          {announcements.map((ad) => (
            <div key={ad.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold text-zinc-900">{ad.name}</p>

                  {/* Status Indicator Pill */}
                  <span className={cn(
                    "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                    ad.status === "Ativo" ? "bg-emerald-50 text-emerald-700" :
                      ad.status === "Pausado" ? "bg-amber-50 text-amber-700" :
                        "bg-zinc-100 text-zinc-600"
                  )}>
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      {ad.status === "Ativo" && (
                        <>
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500"></span>
                        </>
                      )}
                      {ad.status === "Pausado" && (
                        <span className="relative inline-flex h-full w-full rounded-full bg-amber-500"></span>
                      )}
                      {ad.status === "Inativo" && (
                        <span className="relative inline-flex h-full w-full rounded-full bg-zinc-400"></span>
                      )}
                    </span>
                    <span>{ad.status}</span>
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{ad.city} • {ad.views} visualizações • {ad.activeCount} atendimentos</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Botão Gerenciar modificado para selecionar o ID */}
                <Button
                  variant="secondary"
                  onClick={() => onSelectAnnouncement(ad.id)}
                  className="flex-1 sm:flex-initial bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                >
                  Gerenciar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toggleAdStatus(ad.id)} // Adicionar evento onClick (REQ 2)
                  className={cn("flex-1 sm:flex-initial", ad.status === "Ativo" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50")}
                >
                  {ad.status === "Ativo" ? "Pausar" : "Ativar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AnnouncementManagementTab({ publicAdHref }: { publicAdHref: string }) {
  return <ProfileManagementTab publicAdHref={publicAdHref} />;
}

function HistoryManagementTab() {
  const [activeFilter, setActiveFilter] = useState<"Todos" | "Concluído" | "Finalizado" | "Em Andamento">("Todos");

  const historyItems = [
    { id: 1, client: "João Silva", service: "Full Experience (1h)", date: "10/04/2026", status: "Concluído" as const, value: "R$ 800" },
    { id: 2, client: "Maria Santos", service: "Quick Visit (30min)", date: "09/04/2026", status: "Concluído" as const, value: "R$ 450" },
    { id: 3, client: "Pedro Costa", service: "Full Experience (1h)", date: "08/04/2026", status: "Em Andamento" as const, value: "R$ 800" },
    { id: 4, client: "Ana Oliveira", service: "Jantar + Acompanhamento", date: "07/04/2026", status: "Finalizado" as const, value: "R$ 1.200" },
    { id: 5, client: "Carlos Mendes", service: "Quick Visit (30min)", date: "06/04/2026", status: "Concluído" as const, value: "R$ 450" },
  ];

  const filterOptions: Array<"Todos" | "Concluído" | "Finalizado" | "Em Andamento"> = ["Todos", "Concluído", "Finalizado", "Em Andamento"];
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

function ProfileManagementTab({ publicAdHref }: { publicAdHref: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availability, setAvailability] = useState<AvailabilityDay[]>(defaultAvailability);

  useEffect(() => {
    const storedAvailability = window.localStorage.getItem("sigillus-professional-availability");
    if (!storedAvailability) return;

    try {
      const parsedAvailability = JSON.parse(storedAvailability) as AvailabilityDay[];
      if (Array.isArray(parsedAvailability) && parsedAvailability.length === defaultAvailability.length) {
        setAvailability(parsedAvailability);
      }
    } catch {
      window.localStorage.removeItem("sigillus-professional-availability");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sigillus-professional-availability", JSON.stringify(availability));
  }, [availability]);

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  const closeLightbox = () => setLightboxOpen(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  useEffect(() => {
    if (lightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [lightboxOpen]);

  return (
    <div className="space-y-6">
      {lightboxOpen && (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-300">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all duration-200 z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 sm:left-10 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/60 rounded-full transition-all duration-200 z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 sm:right-10 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/60 rounded-full transition-all duration-200 z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
            onClick={closeLightbox}
          >
            <img
              src={galleryImages[currentIndex].url}
              alt={galleryImages[currentIndex].alt}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 flex flex-col items-center gap-4 z-50">
            <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 text-sm font-medium tracking-wide">
              Foto {currentIndex + 1} de {galleryImages.length}
            </div>

            <div className="flex max-w-full flex-wrap justify-center gap-2 pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "relative h-20 w-20 rounded-lg overflow-hidden border-2 transition-all",
                    currentIndex === idx
                      ? "border-white scale-105 shadow-lg"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-white/50"
                  )}
                >
                  <img
                    src={img.url}
                    alt={`Previsão ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-2 bg-white">
          <h3 className="font-bold text-lg text-zinc-900">Galeria de Fotos</h3>
          <div className="flex items-center gap-2">
            <Link
              href={publicAdHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Ver anúncio público
            </Link>
            <Button className="h-9 rounded-lg border border-wine-700 bg-wine-700 px-4 text-sm font-bold text-white hover:bg-wine-800">
              + Adicionar
            </Button>
          </div>
        </div>
        <div className="bg-zinc-50/50 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-2">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setLightboxOpen(true);
                }}
                className={cn(
                  "relative rounded-xl overflow-hidden group cursor-pointer bg-zinc-200 transition-all",
                  img.isCover ? "col-span-2 row-span-2 border-2 border-wine-700 shadow-sm" : "border border-zinc-200"
                )}
              >
                <img
                  src={img.url}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-500"
                  alt={img.alt}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
                  <div className="bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm text-zinc-900 transform scale-90 group-hover:scale-100 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                </div>

                {img.isCover && (
                  <>
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute top-3 left-3 bg-wine-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Capa</div>
                  </>
                )}
              </div>
            ))}

            <div className="relative rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-wine-700 hover:border-wine-300 transition-colors cursor-pointer group">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="mb-1 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider mt-1">Upload</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="p-4 sm:p-6">
          <h3 className="font-bold text-lg mb-6 text-zinc-900 border-b border-zinc-100 pb-4">Detalhes & Localização</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome Artístico</label>
              <input type="text" defaultValue="Isabella Valente" className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all font-medium" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Cidade</label>
                <input type="text" defaultValue="São Paulo" className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Bairro</label>
                <input type="text" defaultValue="Jardins" className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none transition-all font-medium" />
              </div>
            </div>

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-wine-700"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    Ajustar localização
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-4 sm:p-6">
          <h3 className="font-bold text-lg mb-6 text-zinc-900 border-b border-zinc-100 pb-4">Disponibilidade</h3>
          <div className="space-y-4 flex-1">
            {availability.map((entry, index) => (
              <div key={entry.day} className={`flex flex-wrap items-center justify-between gap-2 ${!entry.enabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 text-xs font-black text-zinc-500">{entry.day}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={entry.enabled}
                      onChange={() => setAvailability((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: !item.enabled, start: !item.enabled ? "10:00" : "--:--", end: !item.enabled ? (index === 4 ? "00:00" : "22:00") : "--:--" } : item))}
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-wine-700"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.start}
                    disabled={!entry.enabled}
                    onChange={(event) => setAvailability((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item))}
                    className="w-16 text-center border border-zinc-200 rounded-md text-xs font-bold px-2 py-2 focus:border-wine-700 outline-none disabled:bg-zinc-50 sm:w-20"
                  />
                  <span className="text-zinc-400 text-xs">—</span>
                  <input
                    type="text"
                    value={entry.end}
                    disabled={!entry.enabled}
                    onChange={(event) => setAvailability((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item))}
                    className="w-16 text-center border border-zinc-200 rounded-md text-xs font-bold px-2 py-2 focus:border-wine-700 outline-none disabled:bg-zinc-50 sm:w-20"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
