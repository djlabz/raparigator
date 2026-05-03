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
  LocationAddress,
  ProfileCharacteristics,
  AdPreview,
} from "./types";

const DEBOUNCE_MS = 1000;

type UpdateOptions = {
  autoSave?: boolean;
};

type SaveResult = "saved" | "no_changes" | "error" | "busy";

function serializeProfileForm(state: ProfileFormState) {
  return JSON.stringify(state);
}

function createLocationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `location-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toCurrencyMaskDigits(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/\D/g, ""));

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  return String(Math.round(numericValue * 100));
}

const defaultCharacteristics: ProfileCharacteristics = {
  gender: "Selecionar",
  genitalia: "",
  sexualPreference: "",
  weight: "",
  height: "",
  ethnicity: "Selecionar",
  eyeColor: "",
  hairColor: "Selecionar",
  hairLength: "",
  silicone: "",
  tattoos: "",
  piercings: "",
  smoker: "Selecionar",
  languages: "",
};

const defaultServices: ServiceOption[] = [
  { label: "Atendimento em Hotel", selected: false },
  { label: "Casais", selected: false },
  { label: "Com Local", selected: false },
  { label: "Dominação", selected: false },
  { label: "Dupla Penetração", selected: false },
  { label: "Festas", selected: false },
  { label: "Fetiches", selected: false },
  { label: "Fisting", selected: false },
  { label: "Inversão de Papeis", selected: false },
  { label: "Jantar", selected: false },
  { label: "Massagens", selected: false },
  { label: "Namorada Fake", selected: false },
  { label: "Podolatria", selected: false },
  { label: "Squirt", selected: false },
  { label: "Submissão", selected: false },
  { label: "Viagens", selected: false },
];

const defaultPricing: PricingItem[] = [
  { label: "1 hora", price: "30000", disabled: false, billingType: "hourly" },
  { label: "30 min", price: "", disabled: true, billingType: "hourly" },
  { label: "15 min", price: "", disabled: true, billingType: "hourly" },
  { label: "Diária", price: "", disabled: true, billingType: "fixed" },
  { label: "Pernoite", price: "", disabled: true, billingType: "fixed" },
  { label: "Sexo anal com preservativo", price: "", disabled: true, billingType: "fixed" },
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
    const match = ad.pricingTable?.find((p) => {
      const normalizedDefaultLabel = defaultItem.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const normalizedLabel = p.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      if (normalizedLabel === normalizedDefaultLabel) {
        return true;
      }

      if (defaultItem.label === "Sexo anal com preservativo") {
        return normalizedLabel === "adicao de sexo anal";
      }

      return false;
    });

    // Regra de carregamento inicial solicitada:
    // 1 hora deve sempre iniciar com 300 ativo, independentemente do valor salvo anterior.
    if (defaultItem.label === "1 hora") {
      return { ...defaultItem, price: "30000", disabled: false };
    }

    // Pernoite deve sempre vir zerado (price vazio), independentemente do valor salvo anterior.
    if (defaultItem.label === "Pernoite") {
      return { ...defaultItem, price: "", disabled: true };
    }

    if (!match) {
      return defaultItem;
    }

    return { ...defaultItem, price: toCurrencyMaskDigits(match.price), disabled: false };
  });

  const services = defaultServices.map((defaultService) => ({
    ...defaultService,
    selected: false,
  }));

  const initialLocationAddress: LocationAddress = {
    id: createLocationId(),
    label: ad.neighborhood?.trim() ? `${ad.neighborhood.trim()}, ${ad.city}` : `${ad.city}, ${ad.state}`,
    addressLine: ad.neighborhood?.trim() ?? "",
    city: ad.city,
    state: ad.state,
    country: "Brasil",
    notes: "",
    active: true,
  };

  return {
    images: ad.images.length > 0 ? ad.images : [],
    coverIndex: 0,
    shortDescription: ad.shortDescription ?? "",
    description: ad.description ?? "",
    characteristics: {
      ...defaultCharacteristics,
      // Menus dropdown iniciam em "Selecionar" e campos de digitação iniciam vazios.
      ethnicity: defaultCharacteristics.ethnicity,
      hairColor: defaultCharacteristics.hairColor,
      height: "",
      weight: "",
    },
    services,
    pricing,
    venues: defaultVenues,
    acceptsTravel: false,
    locationAddresses: [initialLocationAddress],
    locationState: ad.state,
    locationCity: ad.city,
    showAvailability: false,
    availability: defaultAvailability,
  };
}

function calculateProfileScore(state: ProfileFormState): ProfileScore {
  // Photos (0-15): 3+ photos = 15, 2 = 11, 1 = 6, 0 = 0
  const photosScore = state.images.length >= 3 ? 15 : state.images.length === 2 ? 11 : state.images.length === 1 ? 6 : 0;

  // Characteristics (0-20): all visible fields filled = 20
  const hasCharacteristics = [
    state.characteristics.gender,
    state.characteristics.ethnicity,
    state.characteristics.height,
    state.characteristics.weight,
    state.characteristics.hairColor,
    state.characteristics.smoker,
  ].every((value) => value.trim().length > 0 && value !== "Selecionar");
  const characteristicsScore = hasCharacteristics ? 20 : 0;

  // Pricing (0-20): at least one active price defined = 20, none = 0
  const definedPrices = state.pricing.filter((p) => !p.disabled && p.price.trim().length > 0).length;
  const pricingScore = definedPrices >= 1 ? 20 : 0;

  // Location (0-15): active address + state/city = 15, partial = 7, none = 0
  const hasLocation = state.locationState.trim().length > 0 && state.locationCity.trim().length > 0;
  const hasActiveAddress = state.locationAddresses.some((address) => address.active);
  const locationScore = hasLocation && hasActiveAddress ? 15 : hasLocation || hasActiveAddress ? 7 : 0;

  // Description (0-15): short + long = 15, only one filled = 8, none = 0
  const hasShort = state.shortDescription.trim().length > 0;
  const hasLong = state.description.trim().length > 10;
  const descriptionScore = hasShort && hasLong ? 15 : hasShort || hasLong ? 8 : 0;

  // Services (0-10): at least 1 selected = 10, none = 0
  const selectedServices = state.services.filter((s) => s.selected).length;
  const servicesScore = selectedServices > 0 ? 10 : 0;

  // Availability (0-5): public schedule visible + at least one enabled day = 5, partial = 2, none = 0
  const hasAvailableDays = state.availability.some((day) => day.enabled);
  const availabilityScore = state.showAvailability && hasAvailableDays ? 5 : state.showAvailability || hasAvailableDays ? 2 : 0;

  const total = photosScore + characteristicsScore + pricingScore + locationScore + descriptionScore + servicesScore + availabilityScore;

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

  const hasAddress = state.locationAddresses.length > 0;
  if (!hasAddress && state.locationState.trim().length > 0) {
    tips.push({ id: "venue", text: "Cadastre ao menos um endereço para facilitar o encontro com clientes", priority: "low" });
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
  const triggerSave = useCallback((source: "auto" | "manual" = "auto"): Promise<SaveResult> => {
    const hasChanges = serializeProfileForm(formRef.current) !== lastSavedSnapshotRef.current;

    if (!hasChanges) {
      // Feedback visual de clique sem regravar no backend
      if (source === "manual") {
        setSaveStatus("saved");
        if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
        idleStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1200);
      }
      return Promise.resolve("no_changes");
    }

    if (isSavingRef.current) return Promise.resolve("busy");

    isSavingRef.current = true;
    setSaveStatus("saving");

    // Simula chamada API (PATCH incremental)
    return new Promise((resolve) => {
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
          resolve("saved");
        } catch {
          setSaveStatus("error");
          resolve("error");
        } finally {
          isSavingRef.current = false;
        }
      }, 600);
    });
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void triggerSave("auto");
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
    return triggerSave("manual");
  }, [triggerSave]);

  // Update setter helper
  const updateField = useCallback(
    <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K], options?: UpdateOptions) => {
      const shouldAutoSave = options?.autoSave ?? true;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (shouldAutoSave) {
        scheduleSave();
      }
    },
    [scheduleSave],
  );

  const updateNestedField = useCallback(
    <K extends keyof ProfileFormState>(key: K, nestedKey: string, value: unknown, options?: UpdateOptions) => {
      const shouldAutoSave = options?.autoSave ?? true;
      setForm((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as Record<string, unknown>), [nestedKey]: value },
      }));
      if (shouldAutoSave) {
        scheduleSave();
      }
    },
    [scheduleSave],
  );

  const updateForm = useCallback(
    (updater: (current: ProfileFormState) => ProfileFormState, options?: UpdateOptions) => {
      const shouldAutoSave = options?.autoSave ?? true;
      setForm((prev) => updater(prev));
      if (shouldAutoSave) {
        scheduleSave();
      }
    },
    [scheduleSave],
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    setHasUnsavedChanges(serializeProfileForm(form) !== lastSavedSnapshotRef.current);
  }, [form]);

  return {
    form,
    saveStatus,
    hasUnsavedChanges,
    lastSavedAt,
    score,
    tips,
    setForm,
    updateField,
    updateNestedField,
    updateForm,
    triggerSave,
    manualSave,
  };
}

export type UseProfileFormReturn = ReturnType<typeof useProfileForm>;
