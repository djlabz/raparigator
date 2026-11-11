import { useEffect, useMemo, useState } from "react";
import { useProfessionalAd } from "@/lib/ad-data";
import { useAuthSession } from "@/lib/auth-session";
import {
  buildEncounterBrief,
  decodeBriefSelection,
  readSimulationDraft,
  saveSimulationDraft,
} from "@/lib/encounter-brief";
import type { EncounterBrief, ProfessionalAd, SimulationSelection } from "@/lib/types";

interface BentoItem {
  type: "image" | "info";
  src: string;
  originalIndex: number;
}

export interface UseAdDetailsReturn {
  ad: ProfessionalAd | undefined;
  isLoading: boolean;
  role: ReturnType<typeof useAuthSession>["role"];
  riskTarget: "WhatsApp" | "Telegram" | null;
  setRiskTarget: (target: "WhatsApp" | "Telegram" | null) => void;
  selectedPhotoIndex: number | null;
  setSelectedPhotoIndex: (index: number | null) => void;
  galleryMode: "alternative" | "grid";
  setGalleryMode: (mode: "alternative" | "grid") => void;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
  bentoItems: BentoItem[];
  basePrice: number;
  calculatedExtrasCost: number;
  totalCalculatedValue: number;
  nextPhoto: () => void;
  prevPhoto: () => void;
  brief: EncounterBrief | null;
}

const DEFAULT_DURATION = "1 hora";

function resolveInitialSelection(ad: ProfessionalAd | undefined): SimulationSelection {
  const fallbackDuration =
    ad?.pricingTable?.find((plan) => plan.label.toLowerCase().includes(DEFAULT_DURATION))?.label ??
    ad?.pricingTable?.[0]?.label ??
    DEFAULT_DURATION;

  if (!ad || typeof window === "undefined") {
    return { duration: fallbackDuration, extras: [] };
  }

  const fromLink = decodeBriefSelection(window.location.search, ad);
  if (fromLink) {
    return fromLink;
  }

  const fromDraft = readSimulationDraft(ad.slug);
  if (fromDraft) {
    const duration = ad.pricingTable.some((plan) => plan.label === fromDraft.duration)
      ? fromDraft.duration
      : fallbackDuration;
    return { duration, extras: fromDraft.extras.filter((extra) => ad.services.includes(extra)) };
  }

  return { duration: fallbackDuration, extras: [] };
}

export function useAdDetails(slug: string): UseAdDetailsReturn {
  const { role } = useAuthSession();
  const [riskTarget, setRiskTarget] = useState<"WhatsApp" | "Telegram" | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryMode, setGalleryMode] = useState<"alternative" | "grid">("alternative");

  const { ad, isLoading } = useProfessionalAd(slug);

  const bentoItems = useMemo(() => {
    if (!ad || !ad.images) return [];
    const limitImages = ad.images.slice(0, 5);
    const items: BentoItem[] = limitImages.map((img, idx) => ({
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

  const initialSelection = useMemo<SimulationSelection>(() => resolveInitialSelection(ad), [ad]);
  const [chosenDuration, setSelectedDuration] = useState<string | null>(null);
  const [chosenExtras, setChosenExtras] = useState<string[] | null>(null);
  const selectedDuration = chosenDuration ?? initialSelection.duration;
  const selectedExtras = chosenExtras ?? initialSelection.extras;

  useEffect(() => {
    if (!ad) {
      return;
    }
    saveSimulationDraft(ad.slug, { duration: selectedDuration, extras: selectedExtras });
  }, [ad, selectedDuration, selectedExtras]);

  const basePrice = useMemo(() => {
    if (!ad) return 0;
    const option = ad.pricingTable.find((t) => t.label === selectedDuration);
    return option ? option.price : ad.startingPrice;
  }, [ad, selectedDuration]);

  const calculatedExtrasCost = useMemo(() => selectedExtras.length * 150, [selectedExtras]);
  const totalCalculatedValue = useMemo(
    () => basePrice + calculatedExtrasCost,
    [basePrice, calculatedExtrasCost],
  );

  const toggleExtra = (extra: string) => {
    setChosenExtras((prev) => {
      const current = prev ?? selectedExtras;
      return current.includes(extra)
        ? current.filter((item) => item !== extra)
        : [...current, extra];
    });
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

  const brief = useMemo(
    () =>
      ad
        ? buildEncounterBrief(
            ad,
            selectedDuration,
            selectedExtras,
            basePrice,
            calculatedExtrasCost,
            totalCalculatedValue,
          )
        : null,
    [ad, basePrice, calculatedExtrasCost, selectedDuration, selectedExtras, totalCalculatedValue],
  );

  return {
    ad,
    isLoading,
    role,
    riskTarget,
    setRiskTarget,
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    galleryMode,
    setGalleryMode,
    selectedDuration,
    setSelectedDuration,
    selectedExtras,
    toggleExtra,
    bentoItems,
    basePrice,
    calculatedExtrasCost,
    totalCalculatedValue,
    nextPhoto,
    prevPhoto,
    brief,
  };
}
