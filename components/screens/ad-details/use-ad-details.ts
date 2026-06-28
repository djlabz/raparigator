import { useMemo, useState } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { ads, reviews } from "@/lib/mock-data";
import type { ProfessionalAd, Review } from "@/lib/types";

export interface BentoItem {
  type: "image" | "info";
  src: string;
  originalIndex: number;
}

export interface UseAdDetailsReturn {
  ad: ProfessionalAd | undefined;
  adReviews: Review[];
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
  isPremium: boolean;
  premiumAttributes: Array<{ label: string; value: string; icon: string }>;
}

export function useAdDetails(slug: string): UseAdDetailsReturn {
  const { role } = useAuthSession();
  const [riskTarget, setRiskTarget] = useState<"WhatsApp" | "Telegram" | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryMode, setGalleryMode] = useState<"alternative" | "grid">("alternative");

  const ad = useMemo(() => ads.find((item) => item.slug === slug), [slug]);
  const adReviews = useMemo(() => reviews.filter((review) => review.adId === ad?.id), [ad?.id]);

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

  const isPremium = ad?.adTier === "premium";
  const premiumAttributes = ad
    ? [
        { label: "Altura", value: `${ad.heightCm} cm`, icon: "/icons/attributes/size-woman.svg" },
        { label: "Cabelo", value: `${ad.hairType} • ${ad.hairColor}`, icon: "/icons/attributes/hair-woman.svg" },
        { label: "Etnia", value: ad.ethnicity, icon: "/icons/attributes/person.svg" },
        { label: "Olhos", value: ad.eyeColor, icon: "/icons/attributes/eye.svg" },
        { label: "Fumante?", value: "Não", icon: "/icons/attributes/smoking.svg" },
        { label: "Peso", value: `${ad.weightKg} kg`, icon: "/icons/attributes/weight.svg" },
      ]
    : [];

  return {
    ad,
    adReviews,
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
    isPremium,
    premiumAttributes,
  };
}
