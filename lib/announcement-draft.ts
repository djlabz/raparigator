"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AnnouncementAdPreview,
  AnnouncementCharacteristics,
  AnnouncementDraftState,
  AnnouncementLocationAddress,
  AnnouncementLocationVenue,
  AnnouncementPricingItem,
  AnnouncementProfileScore,
  AnnouncementPublishResult,
  AnnouncementPublishWarningItem,
  AnnouncementSaveResult,
  AnnouncementSaveSectionResult,
  AnnouncementSaveStatus,
  AnnouncementSectionDirtyState,
  AnnouncementSectionKey,
  AnnouncementSectionSnapshots,
  AnnouncementServiceOption,
  AnnouncementSmartTip,
  AvailabilityDay,
} from "@/lib/announcement-draft-types";
import { ads } from "@/lib/mock-data";

const SELECT_PLACEHOLDER = "Selecionar";
const HAIR_SELECTION_SEPARATOR = "::";
const SAVE_LATENCY_MS = 600;
const SAVED_STATUS_RESET_MS = 2000;
const NO_CHANGES_STATUS_RESET_MS = 1200;
const PUBLISH_ERROR_MESSAGE = "Não deu pra publicar agora, amor. Tenta de novo em um instante?";
const PUBLISH_BLOCKED_MESSAGE = "Há pendências nos grupos abaixo.";
const PRICING_PAYMENT_ERROR_MESSAGE = "Ao menos uma modalidade de pagamento deve ser selecionada.";

type AnnouncementRequiredCharacteristicKey = keyof Pick<
  AnnouncementCharacteristics,
  "gender" | "ethnicity" | "height" | "weight" | "hairColor" | "smoker"
>;

const REQUIRED_CHARACTERISTIC_KEYS: AnnouncementRequiredCharacteristicKey[] = [
  "gender",
  "ethnicity",
  "height",
  "weight",
  "hairColor",
  "smoker",
];

const CHARACTERISTICS_FIELD_LABELS: Record<AnnouncementRequiredCharacteristicKey, string> = {
  gender: "Gênero",
  ethnicity: "Etnia",
  height: "Altura (cm)",
  weight: "Peso (kg)",
  hairColor: "Tipo e Cor do Cabelo",
  smoker: "Fumante",
};

export const SECTION_LABELS: Record<AnnouncementSectionKey, string> = {
  characteristics: "Características físicas",
  pricing: "Tabela de preços",
  location: "Localização",
  description: "Descrição do Perfil",
  services: "Serviços Oferecidos",
  availability: "Horários de Disponibilidade",
};

export const OPTIMIZE_SECTION_ORDER: AnnouncementSectionKey[] = [
  "characteristics",
  "pricing",
  "location",
  "description",
  "services",
  "availability",
];

export function isSelectUnselected(value: string) {
  return value.trim().length === 0 || value === SELECT_PLACEHOLDER;
}

export function sanitizeNumericInput(value: string, maxLength = 4) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function isHairSelectionComplete(value: string) {
  if (!value.trim() || value === SELECT_PLACEHOLDER) {
    return false;
  }

  if (!value.includes(HAIR_SELECTION_SEPARATOR)) {
    return true;
  }

  const [type = SELECT_PLACEHOLDER, color = SELECT_PLACEHOLDER] = value.split(HAIR_SELECTION_SEPARATOR);

  return !isSelectUnselected(type) && !isSelectUnselected(color);
}

export function serializeAnnouncementDraft(state: AnnouncementDraftState) {
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

const defaultCharacteristics: AnnouncementCharacteristics = {
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

const defaultServices: AnnouncementServiceOption[] = [
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

const defaultPricing: AnnouncementPricingItem[] = [
  { label: "1 hora", price: "30000", disabled: false, billingType: "hourly" },
  { label: "30 min", price: "", disabled: true, billingType: "hourly" },
  { label: "15 min", price: "", disabled: true, billingType: "hourly" },
  { label: "Diária", price: "", disabled: true, billingType: "fixed" },
  { label: "Pernoite", price: "", disabled: true, billingType: "fixed" },
  { label: "Sexo anal com preservativo", price: "", disabled: true, billingType: "fixed" },
];

const defaultVenues: AnnouncementLocationVenue[] = [
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

export function buildInitialState(ad: AnnouncementAdPreview): AnnouncementDraftState {
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

    if (defaultItem.label === "1 hora") {
      return { ...defaultItem, price: "30000", disabled: false };
    }

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

  const initialLocationAddress: AnnouncementLocationAddress = {
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
    coverPreviews: ad.images.length > 0 ? ad.images.map(() => "") : [],
    shortDescription: ad.shortDescription ?? "",
    description: ad.description ?? "",
    characteristics: {
      ...defaultCharacteristics,
      ethnicity: defaultCharacteristics.ethnicity,
      hairColor: defaultCharacteristics.hairColor,
      height: "",
      weight: "",
    },
    services,
    pricing,
    paymentMethods: ["dinheiro"],
    venues: defaultVenues,
    acceptsTravel: false,
    locationAddresses: [initialLocationAddress],
    locationState: ad.state,
    locationCity: ad.city,
    showAvailability: false,
    availability: defaultAvailability,
  };
}

export function calculateProfileScore(state: AnnouncementDraftState): AnnouncementProfileScore {
  const photosScore = state.images.length >= 3 ? 15 : state.images.length === 2 ? 11 : state.images.length === 1 ? 6 : 0;

  const hasCharacteristics = [
    state.characteristics.gender,
    state.characteristics.ethnicity,
    state.characteristics.height,
    state.characteristics.weight,
    state.characteristics.smoker,
  ].every((value) => value.trim().length > 0 && value !== SELECT_PLACEHOLDER) && isHairSelectionComplete(state.characteristics.hairColor);
  const characteristicsScore = hasCharacteristics ? 20 : 0;

  const definedPrices = state.pricing.filter((p) => !p.disabled && p.price.trim().length > 0).length;
  const pricingScore = definedPrices >= 1 ? 20 : 0;

  const hasLocation = state.locationState.trim().length > 0 && state.locationCity.trim().length > 0;
  const hasActiveAddress = state.locationAddresses.some((address) => address.active);
  const locationScore = hasLocation && hasActiveAddress ? 15 : hasLocation || hasActiveAddress ? 7 : 0;

  const hasShort = state.shortDescription.trim().length > 0;
  const hasLong = state.description.trim().length > 10;
  const descriptionScore = hasShort && hasLong ? 15 : hasShort || hasLong ? 8 : 0;

  const selectedServices = state.services.filter((s) => s.selected).length;
  const servicesScore = selectedServices > 0 ? 10 : 0;

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

export function generateSmartTips(state: AnnouncementDraftState): AnnouncementSmartTip[] {
  const tips: AnnouncementSmartTip[] = [];

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

export function buildSectionSnapshots(form: AnnouncementDraftState): AnnouncementSectionSnapshots {
  return {
    characteristics: JSON.stringify(form.characteristics),
    pricing: JSON.stringify({ pricing: form.pricing, paymentMethods: form.paymentMethods }),
    location: JSON.stringify({
      locationState: form.locationState,
      locationCity: form.locationCity,
      acceptsTravel: form.acceptsTravel,
      locationAddresses: form.locationAddresses,
    }),
    description: JSON.stringify({
      shortDescription: form.shortDescription,
      description: form.description,
    }),
    services: JSON.stringify(form.services),
    availability: JSON.stringify({
      showAvailability: form.showAvailability,
      availability: form.availability,
    }),
  };
}

export function getPublishValidationErrors(form: AnnouncementDraftState): string[] {
  const errors: string[] = [];
  const hasCharacteristics = ![
    isSelectUnselected(form.characteristics.gender),
    isSelectUnselected(form.characteristics.ethnicity),
    sanitizeNumericInput(form.characteristics.height).length === 0,
    sanitizeNumericInput(form.characteristics.weight).length === 0,
    !isHairSelectionComplete(form.characteristics.hairColor),
    isSelectUnselected(form.characteristics.smoker),
  ].some(Boolean);
  const hasPricing = form.pricing.some((item) => !item.disabled && item.price.trim().length > 0);
  const hasLocation = form.locationState.trim().length > 0 && form.locationCity.trim().length > 0;
  const hasPaymentMethods = (form.paymentMethods || []).length > 0;

  if (!hasCharacteristics) errors.push("Preencha os campos obrigatórios em Características físicas.");
  if (!hasPricing) errors.push("Defina ao menos um preço ativo na Tabela de preços.");
  if (!hasPaymentMethods) errors.push("Selecione ao menos uma forma de pagamento aceita na Tabela de preços.");
  if (!hasLocation) errors.push("Preencha Estado e Cidade na seção Localização.");

  return errors;
}

export function isSectionReadyForOptimization(form: AnnouncementDraftState, section: AnnouncementSectionKey): boolean {
  switch (section) {
    case "characteristics":
      return [
        form.characteristics.gender,
        form.characteristics.ethnicity,
        form.characteristics.height,
        form.characteristics.weight,
        form.characteristics.smoker,
      ].every((value) => value.trim().length > 0 && value !== SELECT_PLACEHOLDER) && isHairSelectionComplete(form.characteristics.hairColor);
    case "pricing":
      return form.pricing.some((item) => !item.disabled && item.price.trim().length > 0);
    case "location":
      return form.locationState.trim().length > 0 && form.locationCity.trim().length > 0 && form.locationAddresses.some((address) => address.active);
    case "description":
      return form.shortDescription.trim().length > 0 && form.description.trim().length > 10;
    case "services":
      return form.services.some((service) => service.selected);
    case "availability":
      return form.showAvailability && form.availability.some((day) => day.enabled);
    default: {
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

function getMissingCharacteristics(characteristics: AnnouncementCharacteristics) {
  return REQUIRED_CHARACTERISTIC_KEYS.filter((key) => {
    const value = characteristics[key];

    if (key === "hairColor") {
      return !isHairSelectionComplete(value);
    }

    if (key === "height" || key === "weight") {
      return sanitizeNumericInput(value).length === 0;
    }

    return isSelectUnselected(value);
  });
}

function syncDraftToMockAd(slug: string, form: AnnouncementDraftState) {
  const target = ads.find((item) => item.slug === slug);

  if (!target) {
    return false;
  }

  target.images = [...form.images];
  target.shortDescription = form.shortDescription;
  target.description = form.description;

  if (form.locationCity.trim()) {
    target.city = form.locationCity.trim();
  }

  if (form.locationState.trim()) {
    target.state = form.locationState.trim();
  }

  const activeAddress = form.locationAddresses.find((address) => address.active);
  if (activeAddress?.addressLine.trim()) {
    target.neighborhood = activeAddress.addressLine.trim();
  }

  const selectedServices = form.services.filter((service) => service.selected).map((service) => service.label);
  if (selectedServices.length > 0) {
    target.services = selectedServices;
  }

  return true;
}

async function persistDraftMock(slug: string, form: AnnouncementDraftState): Promise<"saved" | "error"> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, SAVE_LATENCY_MS);
  });

  if (!syncDraftToMockAd(slug, form)) {
    return "error";
  }

  return "saved";
}

export type AnnouncementPublishOptions = {
  status: "Ativo" | "Pausado";
  onActivate: () => void;
};

export function useAnnouncementDraft(ad: AnnouncementAdPreview) {
  const [form, setForm] = useState<AnnouncementDraftState>(() => buildInitialState(ad));
  const [saveStatus, setSaveStatus] = useState<AnnouncementSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedEpoch, setSavedEpoch] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSectionSnapshots, setSavedSectionSnapshots] = useState<AnnouncementSectionSnapshots>(() => buildSectionSnapshots(form));

  const formRef = useRef(form);
  const isSavingRef = useRef(false);
  const idleStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef(serializeAnnouncementDraft(form));

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    return () => {
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(serializeAnnouncementDraft(form) !== lastSavedSnapshotRef.current);
  }, [form, savedEpoch]);

  useEffect(() => {
    const target = ads.find((item) => item.slug === ad.slug);

    if (!target) {
      return;
    }

    target.images = [...form.images];
  }, [ad.slug, form.images]);

  const score = calculateProfileScore(form);
  const tips = generateSmartTips(form);

  const sectionSnapshots = useMemo(() => buildSectionSnapshots(form), [form]);
  const sectionDirtyState = useMemo<AnnouncementSectionDirtyState>(
    () => ({
      characteristics: sectionSnapshots.characteristics !== savedSectionSnapshots.characteristics,
      pricing: sectionSnapshots.pricing !== savedSectionSnapshots.pricing,
      location: sectionSnapshots.location !== savedSectionSnapshots.location,
      description: sectionSnapshots.description !== savedSectionSnapshots.description,
      services: sectionSnapshots.services !== savedSectionSnapshots.services,
      availability: sectionSnapshots.availability !== savedSectionSnapshots.availability,
    }),
    [savedSectionSnapshots, sectionSnapshots],
  );

  const updateField = useCallback(<K extends keyof AnnouncementDraftState>(key: K, value: AnnouncementDraftState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNestedField = useCallback(<K extends keyof AnnouncementDraftState>(key: K, nestedKey: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), [nestedKey]: value },
    }));
  }, []);

  const updateForm = useCallback((updater: (current: AnnouncementDraftState) => AnnouncementDraftState) => {
    setForm((prev) => updater(prev));
  }, []);

  const persistDraft = useCallback(async (): Promise<AnnouncementSaveResult> => {
    const hasChanges = serializeAnnouncementDraft(formRef.current) !== lastSavedSnapshotRef.current;

    if (!hasChanges) {
      setSaveStatus("saved");
      setSavedEpoch((current) => current + 1);
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
      idleStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), NO_CHANGES_STATUS_RESET_MS);
      return "no_changes";
    }

    if (isSavingRef.current) {
      return "busy";
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      const result = await persistDraftMock(ad.slug, formRef.current);

      if (result === "error") {
        setSaveStatus("error");
        return "error";
      }

      lastSavedSnapshotRef.current = serializeAnnouncementDraft(formRef.current);
      setSavedEpoch((current) => current + 1);
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
      idleStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_STATUS_RESET_MS);
      return "saved";
    } catch {
      setSaveStatus("error");
      return "error";
    } finally {
      isSavingRef.current = false;
    }
  }, [ad.slug]);

  const saveSection = useCallback(
    async (section: AnnouncementSectionKey): Promise<AnnouncementSaveSectionResult> => {
      if (!sectionDirtyState[section]) {
        return { ok: false, reason: "not_dirty" };
      }

      if (saveStatus === "saving") {
        return { ok: false, reason: "busy" };
      }

      if (section === "characteristics") {
        const missing = getMissingCharacteristics(formRef.current.characteristics);

        if (missing.length > 0) {
          return {
            ok: false,
            reason: "characteristics",
            missing,
            message: `Campo ${missing.map((field) => CHARACTERISTICS_FIELD_LABELS[field]).join(", ")} não preenchido`,
          };
        }
      }

      if (section === "pricing" && (formRef.current.paymentMethods || []).length === 0) {
        return { ok: false, reason: "pricing", message: PRICING_PAYMENT_ERROR_MESSAGE };
      }

      const saveResult = await persistDraft();

      if (saveResult === "error" || saveResult === "busy") {
        return { ok: false, reason: saveResult };
      }

      setSavedSectionSnapshots(buildSectionSnapshots(formRef.current));

      return { ok: true, saveResult };
    },
    [persistDraft, saveStatus, sectionDirtyState],
  );

  const cancelSection = useCallback(
    (section: AnnouncementSectionKey) => {
      if (!sectionDirtyState[section] || saveStatus === "saving") {
        return;
      }

      switch (section) {
        case "characteristics": {
          const savedCharacteristics = JSON.parse(savedSectionSnapshots.characteristics) as AnnouncementCharacteristics;
          updateField("characteristics", savedCharacteristics);
          return;
        }
        case "pricing": {
          const parsed = JSON.parse(savedSectionSnapshots.pricing) as
            | AnnouncementPricingItem[]
            | { pricing: AnnouncementPricingItem[]; paymentMethods?: string[] };
          const isLegacy = Array.isArray(parsed);
          updateForm((current) => ({
            ...current,
            pricing: isLegacy ? parsed : parsed.pricing,
            paymentMethods: isLegacy || !parsed.paymentMethods || parsed.paymentMethods.length === 0 ? ["dinheiro"] : parsed.paymentMethods,
          }));
          return;
        }
        case "location": {
          const savedLocation = JSON.parse(savedSectionSnapshots.location) as Pick<
            AnnouncementDraftState,
            "locationState" | "locationCity" | "acceptsTravel" | "locationAddresses"
          >;
          updateForm((current) => ({
            ...current,
            locationState: savedLocation.locationState,
            locationCity: savedLocation.locationCity,
            acceptsTravel: savedLocation.acceptsTravel,
            locationAddresses: savedLocation.locationAddresses,
          }));
          return;
        }
        case "description": {
          const savedDescription = JSON.parse(savedSectionSnapshots.description) as Pick<AnnouncementDraftState, "shortDescription" | "description">;
          updateForm((current) => ({
            ...current,
            shortDescription: savedDescription.shortDescription,
            description: savedDescription.description,
          }));
          return;
        }
        case "services": {
          const savedServices = JSON.parse(savedSectionSnapshots.services) as AnnouncementServiceOption[];
          updateField("services", savedServices);
          return;
        }
        case "availability": {
          const savedAvailability = JSON.parse(savedSectionSnapshots.availability) as Pick<AnnouncementDraftState, "showAvailability" | "availability">;
          updateForm((current) => ({
            ...current,
            showAvailability: savedAvailability.showAvailability,
            availability: savedAvailability.availability,
          }));
          return;
        }
        default: {
          const exhaustiveCheck: never = section;
          return exhaustiveCheck;
        }
      }
    },
    [savedSectionSnapshots, saveStatus, sectionDirtyState, updateField, updateForm],
  );

  const publish = useCallback(
    async ({ status, onActivate }: AnnouncementPublishOptions): Promise<AnnouncementPublishResult> => {
      if (saveStatus === "saving") {
        return { ok: false, reason: "error", message: PUBLISH_ERROR_MESSAGE };
      }

      const currentForm = formRef.current;
      const validationErrors = getPublishValidationErrors(currentForm);
      const dirtySections = (Object.keys(sectionDirtyState) as AnnouncementSectionKey[])
        .filter((section) => sectionDirtyState[section])
        .map((section) => ({ kind: "unsaved" as const, section, label: SECTION_LABELS[section] }));

      if (validationErrors.length > 0 || dirtySections.length > 0) {
        const requiredItems: AnnouncementPublishWarningItem[] = [];

        validationErrors.forEach((message) => {
          if (message.includes(SECTION_LABELS.characteristics)) {
            requiredItems.push({ kind: "required", section: "characteristics", label: SECTION_LABELS.characteristics });
            return;
          }

          if (message.includes(SECTION_LABELS.pricing)) {
            requiredItems.push({ kind: "required", section: "pricing", label: SECTION_LABELS.pricing });
            return;
          }

          if (message.includes(SECTION_LABELS.location)) {
            requiredItems.push({ kind: "required", section: "location", label: SECTION_LABELS.location });
            return;
          }

          if (message.includes(SECTION_LABELS.description)) {
            requiredItems.push({ kind: "required", section: "description", label: SECTION_LABELS.description });
          }
        });

        return {
          ok: false,
          reason: "blocked",
          message: PUBLISH_BLOCKED_MESSAGE,
          items: [...requiredItems, ...dirtySections],
        };
      }

      const saveResult = await persistDraft();

      if (saveResult === "error") {
        return { ok: false, reason: "error", message: PUBLISH_ERROR_MESSAGE };
      }

      setSavedSectionSnapshots(buildSectionSnapshots(formRef.current));

      if (status !== "Ativo") {
        onActivate();
      }

      return { ok: true };
    },
    [persistDraft, saveStatus, sectionDirtyState],
  );

  return {
    form,
    saveStatus,
    hasUnsavedChanges,
    lastSavedAt,
    score,
    tips,
    sectionDirtyState,
    savedSectionSnapshots,
    setForm,
    updateField,
    updateNestedField,
    updateForm,
    saveSection,
    cancelSection,
    publish,
    isSectionReadyForOptimization: (section: AnnouncementSectionKey) => isSectionReadyForOptimization(form, section),
  };
}

export type UseAnnouncementDraftReturn = ReturnType<typeof useAnnouncementDraft>;
