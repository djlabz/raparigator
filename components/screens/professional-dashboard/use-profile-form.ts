"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ProfileFormState,
  SaveStatus,
  SmartTip,
  ProfileScore,
  AvailabilityDay,
  ServiceOption,
  PricingItem,
  LocationVenue,
  ProfileCharacteristics,
  AdPreview,
} from "./types";

const DEBOUNCE_MS = 1000;

function serializeProfileForm(state: ProfileFormState) {
  return JSON.stringify(state);
}

const defaultCharacteristics: ProfileCharacteristics = {
  gender: "",
  genitalia: "",
  sexualPreference: "",
  weight: "",
  height: "",
  ethnicity: "",
  eyeColor: "",
  hairColor: "",
  hairLength: "",
  silicone: "",
  tattoos: "",
  piercings: "",
  smoker: "",
  languages: "",
};

const defaultServices: ServiceOption[] = [
  { label: "Jantar", selected: false },
  { label: "Companhia", selected: false },
  { label: "Evento social", selected: false },
  { label: "Atendimento em hotel", selected: false },
  { label: "Viagens curtas", selected: false },
  { label: "Acompanhamento corporativo", selected: false },
  { label: "Festas", selected: false },
  { label: "Pernoite", selected: false },
];

const defaultPricing: PricingItem[] = [
  { label: "15 min", price: "", disabled: false },
  { label: "30 min", price: "", disabled: false },
  { label: "1 hora", price: "", disabled: false },
  { label: "2 horas", price: "", disabled: false },
  { label: "4 horas", price: "", disabled: false },
  { label: "Pernoite", price: "", disabled: false },
  { label: "Diária", price: "", disabled: false },
];

const defaultVenues: LocationVenue[] = [
  { key: "own", label: "Local próprio", checked: false },
  { key: "hotel", label: "Hotel", checked: false },
  { key: "events", label: "Eventos", checked: false },
  { key: "parties", label: "Festas", checked: false },
];

const defaultAvailability: AvailabilityDay[] = [
  { day: "SEG", enabled: true, start: "10:00", end: "22:00" },
  { day: "TER", enabled: true, start: "10:00", end: "22:00" },
  { day: "QUA", enabled: true, start: "10:00", end: "22:00" },
  { day: "QUI", enabled: true, start: "10:00", end: "22:00" },
  { day: "SEX", enabled: true, start: "10:00", end: "00:00" },
  { day: "SAB", enabled: false, start: "--:--", end: "--:--" },
  { day: "DOM", enabled: false, start: "--:--", end: "--:--" },
];

function buildInitialState(ad: AdPreview): ProfileFormState {
  const pricing = defaultPricing.map((defaultItem) => {
    const match = ad.pricingTable?.find((p) => p.label === defaultItem.label);
    return match ? { ...defaultItem, price: String(match.price) } : defaultItem;
  });

  const services = defaultServices.map((defaultService) => ({
    ...defaultService,
    selected: ad.services?.includes(defaultService.label) ?? false,
  }));

  return {
    images: ad.images.length > 0 ? ad.images : [],
    coverIndex: 0,
    shortDescription: ad.shortDescription ?? "",
    description: ad.description ?? "",
    characteristics: {
      ...defaultCharacteristics,
      ethnicity: ad.ethnicity ?? "",
      hairColor: ad.hairColor ?? "",
      height: ad.heightCm ? String(ad.heightCm) : "",
    },
    services,
    pricing,
    venues: defaultVenues,
    locationState: ad.state,
    locationCity: ad.city,
    showAvailability: false,
    availability: defaultAvailability,
  };
}

function calculateProfileScore(state: ProfileFormState): ProfileScore {
  // Photos (0-25): 3+ photos = 25, 2 = 18, 1 = 10, 0 = 0
  const photosScore = state.images.length >= 3 ? 25 : state.images.length === 2 ? 18 : state.images.length === 1 ? 10 : 0;

  // Description (0-20): has both short + long = 20, only short = 10, only long = 12, none = 0
  const hasShort = state.shortDescription.trim().length > 0;
  const hasLong = state.description.trim().length > 10;
  const descriptionScore = hasShort && hasLong ? 20 : hasShort ? 10 : hasLong ? 12 : 0;

  // Pricing (0-25): at least 2 prices defined = 25, 1 = 12, 0 = 0
  const definedPrices = state.pricing.filter((p) => !p.disabled && p.price.trim().length > 0).length;
  const pricingScore = definedPrices >= 2 ? 25 : definedPrices === 1 ? 12 : 0;

  // Services (0-15): at least 3 selected = 15, 2 = 10, 1 = 5, 0 = 0
  const selectedServices = state.services.filter((s) => s.selected).length;
  const servicesScore = selectedServices >= 3 ? 15 : selectedServices === 2 ? 10 : selectedServices === 1 ? 5 : 0;

  // Location (0-15): state + city + at least 1 venue = 15, partial = 8, none = 0
  const hasLocation = state.locationState.trim().length > 0 && state.locationCity.trim().length > 0;
  const hasVenue = state.venues.some((v) => v.checked);
  const locationScore = hasLocation && hasVenue ? 15 : hasLocation || hasVenue ? 8 : 0;

  const total = photosScore + descriptionScore + pricingScore + servicesScore + locationScore;

  return {
    percentage: Math.min(total, 100),
    breakdown: {
      photos: photosScore,
      description: descriptionScore,
      pricing: pricingScore,
      services: servicesScore,
      location: locationScore,
    },
  };
}

function generateSmartTips(state: ProfileFormState): SmartTip[] {
  const tips: SmartTip[] = [];

  if (state.images.length < 3) {
    tips.push({ id: "photos", text: `Adicione pelo menos 3 fotos para aumentar sua visibilidade (${state.images.length}/3)`, priority: "high" });
  }

  if (state.shortDescription.trim().length === 0) {
    tips.push({ id: "short-desc", text: "Preencha uma descrição curta para aparecer melhor no feed", priority: "high" });
  }

  const definedPrices = state.pricing.filter((p) => !p.disabled && p.price.trim().length > 0).length;
  if (definedPrices < 2) {
    tips.push({ id: "pricing", text: "Perfis com preços definidos convertem até 40% mais", priority: "high" });
  }

  const selectedServices = state.services.filter((s) => s.selected).length;
  if (selectedServices === 0) {
    tips.push({ id: "services", text: "Selecione os serviços que você realiza para atrair mais clientes", priority: "medium" });
  }

  if (state.description.trim().length < 50 && state.description.trim().length > 0) {
    tips.push({ id: "long-desc", text: "Complete sua descrição com pelo menos 50 caracteres para mais conversões", priority: "medium" });
  }

  const hasVenue = state.venues.some((v) => v.checked);
  if (!hasVenue && state.locationState.trim().length > 0) {
    tips.push({ id: "venue", text: "Informe onde você atende para facilitar o encontro com clientes", priority: "low" });
  }

  return tips;
}

export function useProfileForm(ad: AdPreview) {
  const [form, setForm] = useState<ProfileFormState>(() => buildInitialState(ad));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const formRef = useRef(form);
  const lastSavedSnapshotRef = useRef(serializeProfileForm(form));

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Profile score
  const score = calculateProfileScore(form);

  // Smart tips
  const tips = generateSmartTips(form);

  // Debounced auto-save
  const triggerSave = useCallback((source: "auto" | "manual" = "auto") => {
    const hasChanges = serializeProfileForm(formRef.current) !== lastSavedSnapshotRef.current;

    if (!hasChanges) {
      // Feedback visual de clique sem regravar no backend
      if (source === "manual") {
        setSaveStatus("saved");
        if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
        idleStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1200);
      }
      return;
    }

    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setSaveStatus("saving");

    // Simula chamada API (PATCH incremental)
    setTimeout(() => {
      try {
        // TODO: substituir por chamada real à API
        // await patchProfile(slug, changedFields)
        const savedAt = new Date();
        lastSavedSnapshotRef.current = serializeProfileForm(formRef.current);
        setSaveStatus("saved");
        setLastSavedAt(savedAt);
        if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
        idleStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      } finally {
        isSavingRef.current = false;
      }
    }, 600);
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSave("auto");
    }, DEBOUNCE_MS);
  }, [triggerSave]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
    };
  }, []);

  const manualSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    triggerSave("manual");
  }, [triggerSave]);

  // Update setter helper
  const updateField = useCallback(
    <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      scheduleSave();
    },
    [scheduleSave],
  );

  const updateNestedField = useCallback(
    <K extends keyof ProfileFormState>(key: K, nestedKey: string, value: unknown) => {
      setForm((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as Record<string, unknown>), [nestedKey]: value },
      }));
      scheduleSave();
    },
    [scheduleSave],
  );

  return {
    form,
    saveStatus,
    lastSavedAt,
    score,
    tips,
    setForm,
    updateField,
    updateNestedField,
    triggerSave,
    manualSave,
  };
}

export type UseProfileFormReturn = ReturnType<typeof useProfileForm>;
