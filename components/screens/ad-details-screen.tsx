"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll } from "motion/react";
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Expand,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuthSession } from "@/lib/auth-session";
import { ads, reviews } from "@/lib/mock-data";
import type { ProfessionalAd } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

interface AdDetailsScreenProps {
  slug: string;
}

function MobileContactFAB({
  ad,
  setRiskTarget,
}: {
  ad: ProfessionalAd;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 450) {
      if (!isVisible) setIsVisible(true);
    } else if (isVisible) {
      setIsVisible(false);
      setIsOpen(false);
    }
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (showTooltip) setShowTooltip(false);
  };

  const handleDragEnd = () => {
    if (!constraintsRef.current) return;
    const rect = constraintsRef.current.getBoundingClientRect();
    const currentX = x.get();

    const fabSize = 56;
    const midPoint = (rect.width - fabSize) / 2;

    if (currentX > midPoint) {
      animate(x, rect.width - fabSize, { type: "spring", bounce: 0.2, duration: 0.5 });
    } else {
      animate(x, 0, { type: "spring", bounce: 0.2, duration: 0.5 });
    }
  };

  return (
    <div
      className="fixed left-4 right-4 top-4 bottom-21.25 z-60 pointer-events-none md:hidden"
      ref={constraintsRef}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ x, y }}
            className="absolute bottom-0 flex w-14 pointer-events-auto flex-col items-center justify-end"
          >
            <div className="relative flex w-full items-center justify-center">
              <AnimatePresence>
                {showTooltip && !isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="absolute left-17 z-10 w-max max-w-35 rounded-xl border border-dashed border-stone-400/70 bg-[#f5f4ef]/85 px-3 py-1.5 text-xs font-medium leading-tight text-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                  >
                    <div className="absolute top-1/2 -left-1.5 h-0 w-0 -translate-y-1/2 border-y-4 border-y-transparent border-r-[6px] border-r-[#f5f4ef]/85" />
                    Clique para entrar em contato.
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -65 }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute"
                    >
                      <Link
                        href="/chat"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#222] text-white shadow-lg"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -115 }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                      className="absolute"
                    >
                      <button
                        onClick={() => setRiskTarget("WhatsApp")}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -165 }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="absolute"
                    >
                      <button
                        onClick={() => setRiskTarget("Telegram")}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <button
                onClick={toggleOpen}
                className={cn(
                  "relative z-20 h-14 w-14 shrink-0 cursor-pointer rounded-full bg-linear-to-tr from-amber-300 via-amber-400 to-amber-200 p-0.5 shadow-xl transition-transform active:scale-95",
                  isOpen && "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
                )}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border border-black/40 bg-zinc-900">
                  <Image
                    src={ad.images[0]}
                    alt={ad.artisticName}
                    fill
                    className="object-cover"
                    sizes="56px"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute right-0 bottom-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#10b981] ring-2 ring-white">
                  {isOpen ? <X className="h-2 w-2 text-white" /> : <ChevronRight className="h-2 w-2 text-white opacity-0" />}
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
  const { role } = useAuthSession();
  const [riskTarget, setRiskTarget] = useState<"WhatsApp" | "Telegram" | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryMode, setGalleryMode] = useState<"alternative" | "grid">("alternative");

  const ad = useMemo(() => ads.find((item) => item.slug === slug), [slug]);
  const adReviews = useMemo(() => reviews.filter((review) => review.adId === ad?.id), [ad?.id]);

  const bentoItems = useMemo(() => {
    if (!ad || !ad.images) return [];
    const limitImages = ad.images.slice(0, 5);
    const items: Array<{ type: "image"; src: string; originalIndex: number } | { type: "info"; src: string; originalIndex: number }> =
      limitImages.map((img, idx) => ({
        type: "image" as const,
        src: img,
        originalIndex: idx,
      }));
    const infoPlateIndex = Math.min(3, items.length);
    items.splice(infoPlateIndex, 0, {
      type: "info" as const,
      src: "",
      originalIndex: -1,
    });
    return items;
  }, [ad]);

  const [selectedDuration, setSelectedDuration] = useState<string>(() => {
    if (ad && ad.pricingTable && ad.pricingTable.length > 0) {
      const hourOption = ad.pricingTable.find((p) => p.label.toLowerCase().includes("1 hora"));
      if (hourOption) return hourOption.label;
      return ad.pricingTable[0].label;
    }
    return "1 hora";
  });
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const basePrice = useMemo(() => {
    if (!ad) return 0;
    const option = ad.pricingTable.find((t) => t.label === selectedDuration);
    return option ? option.price : ad.startingPrice;
  }, [ad, selectedDuration]);

  const calculatedExtrasCost = useMemo(() => selectedExtras.length * 150, [selectedExtras]);
  const totalCalculatedValue = useMemo(() => basePrice + calculatedExtrasCost, [basePrice, calculatedExtrasCost]);

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) => (prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]));
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex !== null && ad) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % ad.images.length);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex !== null && ad) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + ad.images.length) % ad.images.length);
    }
  };

  if (!ad) {
    return (
      <AppShell>
        <EmptyState title="Perfil nao encontrado" description="Esse anuncio pode ter sido removido ou alterado." />
      </AppShell>
    );
  }

  const isPremium = ad.adTier === "premium";
  const premiumAttributes = [
    { label: "Altura", value: `${ad.heightCm} cm`, icon: "/icons/attributes/size-woman.svg" },
    { label: "Tipo e cor de cabelo", value: `${ad.hairType} • ${ad.hairColor}`, icon: "/icons/attributes/hair-woman.svg" },
    { label: "Etnia", value: ad.ethnicity, icon: "/icons/attributes/person.svg" },
    { label: "Cor dos olhos", value: ad.eyeColor, icon: "/icons/attributes/eye.svg" },
    { label: "Fumante?", value: "Não", icon: "/icons/attributes/smoking.svg" },
    { label: "Peso", value: `${ad.weightKg} kg`, icon: "/icons/attributes/weight.svg" },
  ];

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className="mx-auto max-w-6xl space-y-7 pb-24 md:pb-12 xl:max-w-7xl">
        {isPremium && (
          <section className="relative isolate overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-xl">
            <div className="relative h-48 w-full overflow-hidden bg-zinc-900 sm:h-64 md:h-72">
              <Image src={ad.images[0]} alt="Foto de capa premium" fill className="object-cover" priority sizes="100vw" referrerPolicy="no-referrer" />

              <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] px-3 py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md">
                <span className="text-xs text-[#FFDF00] drop-shadow-[0_0_4px_rgba(255,223,0,0.9)]">★</span>
                <span className="bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-xs font-extrabold tracking-[0.2em] text-transparent uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                  Premium
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />
            </div>

            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-black/20 via-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.02)_0%,transparent_40%,rgba(218,165,32,0.03)_100%)]" />

            <div className="relative z-10 w-full px-4 pb-4 sm:px-8 sm:pb-6 md:px-12 md:pb-8">
              <div className="flex flex-col gap-5 md:gap-6">
                <div className="relative -mt-8 flex flex-row items-center gap-3 sm:-mt-12 sm:gap-4 md:-mt-16 md:items-end md:justify-between">
                  <div className="flex items-end gap-3 sm:gap-4">
                    <div className="relative inline-block shrink-0 align-bottom">
                      <div className="relative z-10 h-20 w-20 rounded-full bg-linear-to-tr from-amber-300 via-[#a88222] to-amber-300 p-1 shadow-[0_0_20px_rgba(218,165,32,0.35)] sm:h-28 sm:w-28 md:h-36 md:w-36">
                        <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-[#121212]">
                          <Image
                            src={ad.images[1] || ad.images[0]}
                            alt={ad.artisticName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 144px"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <div className="absolute right-1 bottom-1 z-20 sm:right-3 sm:bottom-3">
                        <span className="relative flex h-3 w-3 items-center justify-center sm:h-4 sm:w-4">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-65"></span>
                          <span className="relative inline-flex h-full w-full rounded-full bg-[#10b981] ring-2 ring-[#121212]"></span>
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1 text-left sm:space-y-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
                        <h1 className="min-w-0 font-display text-xl font-bold leading-tight text-[#FFDF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-3xl">
                          {ad.artisticName}
                        </h1>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-300 sm:gap-x-5 sm:text-sm">
                        <span className="flex items-center gap-1.5 font-medium leading-none">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#96001e] sm:h-4 sm:w-4" />
                          {ad.neighborhood}, {ad.city}
                        </span>

                        <span className="flex items-center gap-1.5 font-medium leading-none">
                          <Image src="/icons/attributes/age.svg" alt="Idade" width={16} height={16} className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4" referrerPolicy="no-referrer" />
                          {ad.age} anos
                        </span>

                        <div className="flex items-center gap-1.5 font-medium leading-none text-[#10b981]">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                          Identidade Verificada
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-6">
                  {premiumAttributes.map((attribute) => (
                    <div
                      key={attribute.label}
                      className="flex min-h-20 items-center gap-2 rounded-2xl border border-white/8 bg-[#0c0c0c]/90 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02] sm:min-h-24 sm:gap-3 sm:px-4 sm:py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-black/55 sm:h-12 sm:w-12">
                        <Image src={attribute.icon} alt={attribute.label} width={34} height={34} className="h-7 w-7 object-contain sm:h-8 sm:w-8" referrerPolicy="no-referrer" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-bold tracking-[0.16em] text-amber-300/85 uppercase sm:text-xs sm:tracking-[0.18em]">{attribute.label}</p>
                        <p className="wrap-break-word text-xs font-semibold text-zinc-100 sm:text-base">{attribute.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {!isPremium && (
          <section className="relative h-64 w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-md sm:h-80 md:h-96">
            <Image src={ad.images[0]} alt="Foto de capa standard" fill className="object-cover" priority sizes="100vw" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 z-10 bg-linear-to-t from-zinc-950/95 via-zinc-950/45 to-black/30" />

            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-end md:justify-between md:p-8">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="relative shrink-0">
                  <div className="relative h-18 w-18 overflow-hidden rounded-full border-4 border-white/95 bg-zinc-900 shadow-lg sm:h-24 sm:w-24 md:h-32 md:w-32">
                    <Image
                      src={ad.images[1] || ad.images[0]}
                      alt={ad.artisticName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 72px, (max-width: 768px) 96px, 128px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute right-1 bottom-1 z-20 sm:right-2 sm:bottom-2">
                    <span className="relative flex h-3 w-3 items-center justify-center sm:h-4 sm:w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-65"></span>
                      <span className="relative inline-flex h-full w-full rounded-full bg-[#10b981] ring-2 ring-white"></span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-2xl md:text-3xl">{ad.artisticName}</h1>
                    <span className="text-base font-semibold text-zinc-100 sm:text-lg md:text-xl">{ad.age} anos</span>
                    <span className="origin-left scale-90">
                      <StatusBadge status={ad.status} />
                    </span>
                  </div>
                  <p className="font-sans text-xs font-medium text-zinc-100 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] sm:text-sm md:text-base">
                    {ad.displayName} • {ad.neighborhood}, {ad.city}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex w-full flex-col gap-1.5">
            <div className={cn("hidden w-full items-center gap-3 md:grid", ad.images.length > 5 ? "grid-cols-5" : "grid-cols-4")}>
              <div className={cn("flex h-9 items-center gap-2", ad.images.length > 5 ? "col-span-4" : "col-span-3")}>
                <h2 className="shrink-0 font-display text-lg font-bold text-zinc-900 md:text-xl">Ensaio Fotográfico</h2>
                <div className="ml-2 mr-3 h-0.75 grow rounded-full bg-zinc-200/80" />

                <div className="flex shrink-0 rounded-lg bg-zinc-100 p-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setGalleryMode("alternative");
                    }}
                    className={cn(
                      "cursor-pointer rounded-md p-1.5 transition-all duration-200 hover:scale-105 active:scale-95",
                      galleryMode === "alternative" ? "bg-white text-wine-700 shadow-xs" : "text-zinc-400 hover:text-zinc-700",
                    )}
                    title="Destaque / Alternativo"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h10v10H4zM16 4h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h10v4H10z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setGalleryMode("grid");
                    }}
                    className={cn(
                      "cursor-pointer rounded-md p-1.5 transition-all duration-200 hover:scale-105 active:scale-95",
                      galleryMode === "grid" ? "bg-white text-wine-700 shadow-xs" : "text-zinc-400 hover:text-zinc-700",
                    )}
                    title="Grade"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="col-span-1 flex h-9 w-full items-center justify-between gap-2">
                <div className="h-0.75 grow rounded-full bg-zinc-200/80" />
                <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold text-zinc-500">{ad.images.length} fotos</span>
              </div>
            </div>

            <div className="flex w-full flex-row items-center justify-between gap-2 md:hidden">
              <div className="flex flex-col gap-0.5">
                <h2 className="shrink-0 font-display text-base font-bold text-zinc-900 sm:text-lg">Ensaio Fotográfico</h2>
                <p className="text-xs text-zinc-500 sm:text-xs">Sessão exclusiva Sigillus</p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="flex rounded-lg bg-zinc-100 p-0.5 sm:p-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setGalleryMode("alternative");
                    }}
                    className={cn(
                      "cursor-pointer rounded-md p-1 transition-all duration-200 hover:scale-105 active:scale-[0.93] sm:p-1.5",
                      galleryMode === "alternative" ? "bg-white text-wine-700 shadow-xs" : "text-zinc-400 hover:text-zinc-700",
                    )}
                    title="Destaque / Alternativo"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h10v10H4zM16 4h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h10v4H10z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setGalleryMode("grid");
                    }}
                    className={cn(
                      "cursor-pointer rounded-md p-1 transition-all duration-200 hover:scale-105 active:scale-[0.93] sm:p-1.5",
                      galleryMode === "grid" ? "bg-white text-wine-700 shadow-xs" : "text-zinc-400 hover:text-zinc-700",
                    )}
                    title="Grade"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 font-mono text-xs font-bold text-zinc-500 sm:px-3 sm:py-1.5 sm:text-xs">{ad.images.length} fotos</span>
              </div>
            </div>

            <p className="mt-0.5 hidden px-1 text-xs text-zinc-500 md:block">Sessão exclusiva autenticada pessoalmente pela Sigillus</p>
          </div>

          {galleryMode === "grid" && (
            <div className="grid animate-fade-in grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {ad.images.map((img, idx) => (
                <div
                  key={img}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className="group relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/50 bg-zinc-100 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                >
                  <Image
                    src={img}
                    alt={`${ad.artisticName} ensaio ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="rounded-full border border-white/20 bg-white/10 p-2.5 backdrop-blur-md transition-all hover:scale-110 active:scale-90">
                      <Expand className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {galleryMode === "alternative" && (
            <div className="grid grid-flow-dense grid-cols-2 auto-rows-[150px] gap-3 animate-fade-in sm:grid-cols-3 sm:auto-rows-[190px] lg:grid-cols-5 lg:auto-rows-[210px]">
              {bentoItems.map((item, idx) => {
                const isImage = item.type === "image";

                let spanClass = "col-span-1 row-span-1";
                if (idx === 0) {
                  spanClass = "col-span-2 row-span-2";
                } else if (item.type === "info") {
                  spanClass = "col-span-2 row-span-2 lg:col-span-1";
                } else if (idx === 6) {
                  spanClass = "row-span-1 col-span-2 sm:col-span-1";
                }

                if (!isImage) {
                  return (
                    <div
                      key="info-plate"
                      className={cn(
                        "hidden h-full flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-linear-to-b from-zinc-50 to-white p-5 shadow-xs lg:flex",
                        spanClass,
                      )}
                    >
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex -space-x-2.5 overflow-hidden">
                          {ad.images.slice(0, 4).map((img, i) => (
                            <div key={i} className="relative inline-block h-9 w-9 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-white">
                              <Image src={img} alt="preview" fill className="object-cover" sizes="36px" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                          {ad.images.length > 4 && (
                            <div className="relative inline-flex h-9 w-9 select-none items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white ring-2 ring-white">
                              +{ad.images.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-left font-display text-xs font-bold tracking-widest text-[#96001e] uppercase">Selo Anti-Edição</h4>
                          <p className="text-left text-xs leading-relaxed text-zinc-600">
                            Nossas profissionais são fotografadas em ensaios auditados. Proteção garantida contra o uso de fotos falsas (fake profiles).
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-zinc-100 pt-4">
                        <div className="flex flex-row flex-wrap items-start gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            Biotipo Confirmado
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold tracking-wide text-[#96001e] uppercase">
                            <Award className="h-3.5 w-3.5 shrink-0 text-[#96001e]" />
                            Fotos Sem Filtros
                          </span>
                          {isPremium && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold tracking-wide text-amber-800 uppercase">
                              <Sparkles className="h-3.5 w-3.5 shrink-0 fill-amber-300/25 text-amber-600" />
                              Premium Luxo
                            </span>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedPhotoIndex(0);
                          }}
                          className="py-2 text-xs font-bold text-zinc-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Ver Book Completo
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.src}
                    onClick={() => setSelectedPhotoIndex(item.originalIndex)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-900 shadow-xs transition-all duration-300 hover:shadow-md",
                      spanClass,
                    )}
                  >
                    <Image
                      src={item.src}
                      alt={`${ad.artisticName} ensaio bento ${idx}`}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes={spanClass.includes("col-span-2") ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 50vw, 25vw"}
                      priority={idx === 0}
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-wine-700 p-2 text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 sm:p-2.5">
                        <Expand className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {ad.images.length > 5 && galleryMode === "alternative" && (
            <div className="group relative mt-3 h-28 w-full cursor-pointer overflow-hidden rounded-2xl sm:h-32 lg:hidden" onClick={() => setSelectedPhotoIndex(5)}>
              <Image
                src={ad.images[5]}
                alt="Mais fotos"
                fill
                className="scale-110 object-cover opacity-80 blur-sm transition-all duration-500 group-hover:scale-115 group-hover:blur-[6px]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] transition-colors duration-300 group-hover:bg-black/40">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <span className="mb-0.5 text-2xl leading-none font-light text-white">+</span>
                </div>
                <span className="text-xs font-bold tracking-widest text-white/90 uppercase drop-shadow-sm sm:text-xs">Ver mais fotos</span>
              </div>
            </div>
          )}

          {galleryMode === "alternative" && (
            <div className="mt-3 animate-fade-in lg:hidden">
              <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-linear-to-b from-zinc-50 to-white p-6 shadow-xs sm:p-7">
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {ad.images.slice(0, 4).map((img, i) => (
                      <div key={i} className="relative inline-block h-10 w-10 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-white sm:h-11 sm:w-11">
                        <Image src={img} alt="preview" fill className="object-cover" sizes="36px" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    {ad.images.length > 4 && (
                      <div className="relative inline-flex h-10 w-10 select-none items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white ring-2 ring-white sm:h-11 sm:w-11">
                        +{ad.images.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-left font-display text-sm font-bold tracking-[0.22em] text-[#96001e] uppercase">Selo Anti-Edição</h4>
                    <p className="text-left text-base leading-relaxed text-zinc-600">
                      Nossas profissionais são fotografadas em ensaios auditados. Proteção garantida contra o uso de fotos falsas (fake profiles).
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4 border-t border-zinc-100 pt-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row flex-wrap items-start gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        Biotipo Confirmado
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold tracking-wide text-[#96001e] uppercase">
                        <Award className="h-4 w-4 shrink-0 text-[#96001e]" />
                        Fotos Sem Filtros
                      </span>
                      {isPremium && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-800 uppercase">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 fill-amber-300/25 text-amber-600" />
                          Premium Luxo
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPhotoIndex(0);
                    }}
                    className="h-11 py-2 text-base font-bold text-zinc-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Ver Book Completo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="relative space-y-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <div className="pointer-events-none absolute top-0 right-0 p-5 opacity-[0.03]">
                <Sparkles className="h-28 w-28 text-[#96001e]" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md border border-red-100/60 bg-red-50 px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#96001e] uppercase">
                    Sobre a Profissional
                  </span>
                  <div className="hidden h-1 rounded-full bg-zinc-100 sm:block lg:grow" />
                </div>

                <h3 className="font-display text-xl font-bold tracking-tight text-zinc-900">Atendimento Premium com discrição absoluta</h3>

                <blockquote className="border-l-4 border-[#96001e] py-1 pl-4 font-serif text-sm leading-relaxed text-zinc-600 italic sm:text-base">
                  &ldquo;{ad.shortDescription}&rdquo;
                </blockquote>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4 text-xs font-medium text-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="leading-none font-extrabold text-zinc-900">Ambiente Privado</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Itaim Bibi • São Paulo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-amber-100 bg-amber-50 p-1.5 text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <p className="leading-none font-extrabold text-zinc-900">Avaliações Positivas</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{ad.rating.toFixed(1)} / 5 ({ad.reviewsCount} votos)</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative space-y-5 overflow-hidden rounded-2xl border-y-zinc-200/80 border-r-zinc-200/80 border-l-4 border-l-[#96001e] bg-linear-to-br from-white to-zinc-50/40 p-5 shadow-md sm:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 pr-2">
                    <h3 className="flex items-center gap-2 font-display text-base font-bold text-zinc-900">
                      <Zap className="h-4 w-4 shrink-0 text-[#96001e]" /> Simulador de Agendamento
                    </h3>
                    <p className="max-w-[320px] text-xs text-zinc-500 sm:text-xs">
                      Configure a duração do seu agendamento e adicione preferências instantaneamente.
                    </p>
                  </div>
                  <div className="mt-0.5 shrink-0">
                    <span className="ml-2 flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs font-bold tracking-widest text-emerald-800 uppercase sm:text-xs">
                      <Lock className="h-2.5 w-2.5 shrink-0 text-emerald-600" /> <span className="hidden sm:inline">Serviço</span> Seguro
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {ad.pricingTable.map((plan) => {
                  const isSelected = selectedDuration === plan.label;
                  return (
                    <button
                      key={plan.label}
                      type="button"
                      onClick={() => setSelectedDuration(plan.label)}
                      className={cn(
                        "group relative flex min-h-15.5 cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all sm:min-h-16.5 sm:px-5 sm:py-3.5",
                        isSelected
                          ? "border-[#96001e] bg-red-50/40 ring-1 ring-[#96001e]/30 shadow-sm"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
                      )}
                    >
                      <div className="flex flex-col pr-2">
                        <span className="text-xs font-black tracking-widest text-zinc-400 uppercase sm:text-xs">Duração</span>
                        <span className={cn("mt-0.5 truncate text-sm font-semibold sm:text-base", isSelected ? "font-bold text-[#96001e]" : "text-zinc-700")}>
                          {plan.label}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {isSelected && <span className="mr-1 animate-fade-in text-sm font-bold text-zinc-900 sm:text-base">{currency(plan.price)}</span>}
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                            isSelected ? "border-[#96001e] bg-[#96001e] text-white" : "border-zinc-200 bg-zinc-50/50",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>

                      {plan.label === "1 hora" && (
                        <span className="absolute -top-2.5 right-3 z-10 block rounded-full border-2 border-white bg-[#ffc107] px-3 py-0.5 text-xs leading-none font-extrabold tracking-widest text-zinc-900 uppercase shadow-sm sm:right-4 sm:text-xs">
                          Popular
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-zinc-100 pt-5">
                <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase sm:text-xs">Deseja incluir algum adicional?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ad.services.map((svc) => {
                    const hasExtra = selectedExtras.includes(svc);
                    return (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => toggleExtra(svc)}
                        className={cn(
                          "flex min-h-11.5 cursor-pointer items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all sm:min-h-12.5 sm:px-4",
                          hasExtra
                            ? "border-[#96001e] bg-red-50/40 ring-1 ring-[#96001e]/30 shadow-xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
                        )}
                      >
                        <span className={cn("truncate pr-1 text-xs font-medium sm:pr-2 sm:text-sm", hasExtra ? "font-semibold text-zinc-900" : "text-zinc-700")}>
                          {svc}
                        </span>

                        <div className="flex shrink-0 items-center gap-3">
                          {hasExtra && (
                            <span className="flex animate-fade-in items-center text-sm font-medium text-zinc-900">
                              <span className="mr-1 font-bold text-[#96001e]">+</span> {currency(150)}
                            </span>
                          )}
                          <div
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                              hasExtra ? "border-[#96001e] bg-[#96001e] text-white" : "border-zinc-200 bg-zinc-50/50",
                            )}
                          >
                            {hasExtra && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 rounded-xl bg-zinc-950 p-4 text-white shadow-md">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Encontro Selecionado ({selectedDuration})</span>
                  <span className="font-mono">{currency(basePrice)}</span>
                </div>
                {selectedExtras.length > 0 && (
                  <div className="animate-slide-in flex items-center justify-between text-xs text-zinc-400">
                    <span>Adicionais Personalizados ({selectedExtras.length})</span>
                    <span className="flex items-center font-mono">
                      <span className="mr-1.5 font-bold text-[#96001e]">+</span> {currency(calculatedExtrasCost)}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between border-t border-zinc-800 pt-2 text-sm">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-100">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    Valor Total Protegido
                  </span>
                  <span className="font-mono text-lg font-black text-amber-300">{currency(totalCalculatedValue)}</span>
                </div>
              </div>

              <div className="pt-1">
                {role === "visitor" ? (
                  <Link
                    href="/auth/login"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-wine-700 px-5 text-center text-base font-bold text-white! shadow-lg shadow-red-900/10 transition-all duration-200 hover:bg-wine-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2"
                    style={{ color: "#ffffff" }}
                  >
                    <span className="text-white!">Entrar para Agendar com Custódia</span>
                  </Link>
                ) : (
                  <Link
                    href="/checkout"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-wine-700 px-5 text-center text-base font-bold text-white! shadow-lg shadow-red-900/15 transition-all duration-200 hover:bg-wine-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2"
                    style={{ color: "#ffffff" }}
                  >
                    <span className="text-white!">Contratar com Custódia Segura</span>
                  </Link>
                )}
              </div>
            </Card>

            <Card className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-zinc-100 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-zinc-900">Avaliações dos Clientes ({ad.reviewsCount})</h3>
                  <p className="text-xs text-zinc-400">Comentários autênticos gerados após transações com custódia resolvida</p>
                </div>
                <div className="self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 sm:self-center">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span className="text-xs font-black text-amber-800">{ad.rating.toFixed(1)} / 5</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {adReviews.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-400">Nenhum comentário ou avaliação recente no momento.</p>
                ) : (
                  adReviews.map((review) => (
                    <article key={review.id} className="space-y-2.5 rounded-xl border border-zinc-100/90 bg-[#fafafa]/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 font-display text-xs font-bold uppercase text-zinc-600 shadow-xs">
                            {review.author.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{review.author}</p>
                            <span className="mt-0.5 block text-xs leading-none font-semibold text-zinc-400">Membro Verificado • Há poucos dias</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 rounded-md border border-amber-100/40 bg-amber-50 px-2 py-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span className="text-xs font-bold text-amber-800">{review.score.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="pl-10 text-xs leading-relaxed text-zinc-600">&ldquo;{review.comment}&rdquo;</p>

                      <div className="animate-fade-in flex items-center gap-1 pl-10 pt-1 text-xs font-bold tracking-wider text-emerald-700 uppercase">
                        <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        Atendimento Recomendado
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="order-last lg:order-first p-5 sm:p-6 border-0 bg-linear-to-br from-[#121212] via-[#1a1a1a] to-[#0a0a0a] shadow-xl rounded-2xl text-center space-y-6 relative overflow-hidden">
              {/* Premium Background Elements */}
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-12">
                <Sparkles className="h-32 w-32 text-amber-300" />
              </div>
              <div className="absolute -left-10 -bottom-10 h-32 w-32 overflow-hidden rounded-full bg-linear-to-tr from-amber-500/20 to-transparent blur-2xl" />

              <div className="relative space-y-4 z-10 flex flex-col items-center">
                {/* Minimalist Sigillus Logo/Icon Element */}
                <div className="h-12 w-12 rounded-full border border-amber-900/40 bg-black/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.1)] mb-1">
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-xs uppercase tracking-[0.2em] font-extrabold text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Alto Padrão • Discrição
                  </h3>
                  <h4 className="font-display text-2xl font-bold bg-linear-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent pb-1">
                    Acesso Exclusivo
                  </h4>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed max-w-62.5 font-medium">
                  Sinta o privilégio de um encontro inesquecível. Entre em contato diretamente para alinhar os detalhes com total privacidade.
                </p>

                <div className="w-full flex items-center justify-center gap-4 py-2 border-y border-white/5">
                  <div className="flex flex-col items-center">
                    <Lock className="h-4 w-4 text-emerald-400 mb-1" />
                    <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Sigilo</span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <Star className="h-4 w-4 text-amber-400 mb-1" />
                    <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">Prestígio</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative z-10 w-full mt-2">
                {role === "visitor" ? (
                  <Link
                    href="/auth/login"
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-linear-to-r from-amber-500 via-amber-400 to-amber-500 p-px w-full transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  >
                    <span className="inline-flex h-12 w-full items-center justify-center rounded-[11px] bg-[#121212] px-5 py-2 transition-all duration-300 group-hover:bg-transparent">
                      <span className="font-bold text-amber-400 transition-colors duration-300 group-hover:text-zinc-950 flex items-center gap-2">
                        Entrar para Interagir
                      </span>
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/chat"
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-linear-to-r from-amber-500 via-amber-400 to-amber-500 p-px w-full transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  >
                    <span className="inline-flex h-12 w-full items-center justify-center rounded-[11px] bg-[#121212] px-5 py-2 transition-all duration-300 group-hover:bg-transparent">
                      <span className="font-bold text-amber-400 transition-colors duration-300 group-hover:text-zinc-950 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" /> Iniciar Chat
                      </span>
                    </span>
                  </Link>
                )}

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setRiskTarget("WhatsApp")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-[#1a1a1a] text-[#25D366] border border-[#25D366]/20 hover:border-[#25D366]/40 hover:bg-[#222] h-12 px-2 text-sm shadow-[0_0_10px_rgba(37,211,102,0.1)] focus-visible:outline-none"
                  >
                    <Phone className="h-4 w-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => setRiskTarget("Telegram")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-[#1a1a1a] text-[#229ED9] border border-[#229ED9]/20 hover:border-[#229ED9]/40 hover:bg-[#222] h-12 px-2 text-sm shadow-[0_0_10px_rgba(34,158,217,0.1)] focus-visible:outline-none"
                  >
                    <Send className="h-4 w-4" /> Telegram
                  </button>
                </div>
              </div>


              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-zinc-400 text-left leading-relaxed flex items-start gap-2 shadow-inner backdrop-blur-sm relative z-10 w-full mt-2">
                <Crown className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  O contato é mantido em extrema privacidade. Detalhes e disponibilidade são acordados diretamente com a profissional.
                </span>
              </div>
            </Card>


            <Card className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 border-b border-zinc-100 pb-2 font-display text-base font-bold text-zinc-900">
                <Award className="h-5 w-5 text-[#96001e]" /> Especialidades e Especificações
              </h3>

              <div className="space-y-4 text-sm text-zinc-700">
                <div>
                  <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Acompanhamentos Disponíveis</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ad.services.map((service) => (
                      <span
                        key={service}
                        className="flex items-center gap-1 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs transition-transform hover:scale-[1.02]"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#96001e]" />
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {ad.fetishOptions && ad.fetishOptions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Interesses Especiais / Fantasias</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ad.fetishOptions.map((f) => (
                        <span key={f} className="rounded-lg border border-zinc-100 bg-[#fafafa] px-2.5 py-1 text-xs font-semibold text-zinc-600 shadow-2xs">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </section>
      </div>

      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-zinc-950/98 p-4 backdrop-blur-md animate-fade-in">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedPhotoIndex(null);
            }}
            className="absolute top-4 right-4 z-10000 cursor-pointer rounded-full border border-white/5 bg-black/40 p-2.5 text-white transition-colors hover:bg-black/70 backdrop-blur-xs"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevPhoto();
            }}
            className="absolute top-1/2 left-3 z-10000 -translate-y-1/2 cursor-pointer rounded-full border border-white/5 bg-black/40 p-3 text-white transition-colors hover:bg-black/70 backdrop-blur-xs"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative aspect-3/4 max-h-[82vh] max-w-full select-none animate-scale-up sm:max-w-2xl">
            <Image
              src={ad.images[selectedPhotoIndex]}
              alt={`Foto de detalhe ${selectedPhotoIndex + 1}`}
              fill
              className="rounded-xl object-contain drop-shadow-[0_8px_30px_rgb(0,0,0,0.8)]"
              sizes="(max-width: 768px) 100vw, 768px"
              referrerPolicy="no-referrer"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextPhoto();
            }}
            className="absolute top-1/2 right-3 z-10000 -translate-y-1/2 cursor-pointer rounded-full border border-white/5 bg-black/40 p-3 text-white transition-colors hover:bg-black/70 backdrop-blur-xs"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/5 bg-black/60 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-300 backdrop-blur-xs">
            {selectedPhotoIndex + 1} de {ad.images.length}
          </div>
        </div>
      )}

      <MobileContactFAB ad={ad} setRiskTarget={setRiskTarget} />

      <RiskWarningModal
        open={Boolean(riskTarget)}
        onClose={() => setRiskTarget(null)}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined") {
            window.open(riskTarget === "WhatsApp" ? "https://web.whatsapp.com" : "https://telegram.org", "_blank", "noopener,noreferrer");
          }
        }}
      />
    </AppShell>
  );
}
