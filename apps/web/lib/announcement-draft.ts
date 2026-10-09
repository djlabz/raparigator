"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AnnouncementAdPreview,
  AnnouncementCharacteristics,
  AnnouncementDraftState,
  AnnouncementListingStatus,
  AnnouncementPricingItem,
  AnnouncementProfileScore,
  AnnouncementPublishResult,
  AnnouncementSaveSectionResult,
  AnnouncementSaveStatus,
  AnnouncementSectionDirtyState,
  AnnouncementSectionKey,
  AnnouncementSectionSnapshots,
  AnnouncementServiceOption,
  AnnouncementSmartTip,
  AvailabilityStatus,
  ProfessionalAd,
} from "@sigillus/contracts";
import {
  ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
  ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE,
  buildInitialState,
  buildSectionSnapshots,
  calculateProfileScore,
  generateSmartTips,
  getPublishBlockingItems,
  isSectionReadyForOptimization,
  serializeAnnouncementDraft,
  validateSectionForSave,
} from "@sigillus/domain";
import { getApiClient } from "@/lib/api/client";

export {
  OPTIMIZE_SECTION_ORDER,
  SECTION_LABELS,
  buildInitialState,
  buildSectionSnapshots,
  calculateProfileScore,
  generateSmartTips,
  getPublishValidationErrors,
  isHairSelectionComplete,
  isSectionReadyForOptimization,
  isSelectUnselected,
  sanitizeNumericInput,
  serializeAnnouncementDraft,
} from "@sigillus/domain";

const SAVED_STATUS_RESET_MS = 2000;

export type MyAnnouncementResult = {
  ad: ProfessionalAd | undefined;
  draft: AnnouncementDraftState | null;
  listingStatus: AnnouncementListingStatus;
  score: AnnouncementProfileScore | null;
  tips: AnnouncementSmartTip[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type MyAnnouncementState = {
  ad: ProfessionalAd | null;
  draft: AnnouncementDraftState | null;
  listingStatus: AnnouncementListingStatus;
  score: AnnouncementProfileScore | null;
  tips: AnnouncementSmartTip[];
};

let myAnnouncementCache: MyAnnouncementState | null = null;

export function useMyAnnouncement(): MyAnnouncementResult {
  const [state, setState] = useState<MyAnnouncementState | null>(() => myAnnouncementCache);
  const [isLoading, setIsLoading] = useState<boolean>(() => !myAnnouncementCache);
  const [error, setError] = useState<string | null>(null);

  const fetchMine = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getApiClient().announcements.getMine();
      const nextState: MyAnnouncementState = {
        ad: result.ad,
        draft: result.draft,
        listingStatus: result.listingStatus,
        score: result.score,
        tips: result.tips,
      };
      myAnnouncementCache = nextState;
      setState(nextState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o anúncio.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (myAnnouncementCache) {
      return;
    }
    fetchMine();
  }, [fetchMine]);

  return {
    ad: state?.ad ?? undefined,
    draft: state?.draft ?? null,
    listingStatus: state?.listingStatus ?? "Ativo",
    score: state?.score ?? null,
    tips: state?.tips ?? [],
    isLoading,
    error,
    refetch: fetchMine,
  };
}

export async function updateListingStatus(status: AnnouncementListingStatus): Promise<void> {
  await getApiClient().announcements.setListingStatus({ status });
  if (myAnnouncementCache) {
    myAnnouncementCache.listingStatus = status;
    if (myAnnouncementCache.ad) {
      myAnnouncementCache.ad.status = status === "Ativo" ? "livre" : "indisponivel";
    }
  }
}

export async function updateAvailability(status: AvailabilityStatus): Promise<void> {
  await getApiClient().announcements.setAvailability({ status });
}

export async function updateContact(contact: {
  whatsappNumber: string | null;
  telegramUsername: string | null;
}): Promise<void> {
  await getApiClient().announcements.setContact(contact);
}

export function syncDraftToMockAd(_slug: string, _form: AnnouncementDraftState) {
  return true;
}

export type AnnouncementPublishOptions = {
  status: "Ativo" | "Pausado";
  onActivate: () => void;
};

export function useAnnouncementDraft(
  ad: AnnouncementAdPreview,
  initialDraft?: AnnouncementDraftState | null,
) {
  const [form, setForm] = useState<AnnouncementDraftState>(
    () => initialDraft ?? buildInitialState(ad),
  );
  const [saveStatus, setSaveStatus] = useState<AnnouncementSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedEpoch, setSavedEpoch] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSectionSnapshots, setSavedSectionSnapshots] = useState<AnnouncementSectionSnapshots>(
    () => buildSectionSnapshots(form),
  );

  const formRef = useRef(form);
  const isSavingRef = useRef(false);
  const idleStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef(serializeAnnouncementDraft(form));
  const initializedDraftRef = useRef<string | null>(
    initialDraft ? serializeAnnouncementDraft(initialDraft) : null,
  );

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
    if (initialDraft && !hasUnsavedChanges) {
      const serialized = serializeAnnouncementDraft(initialDraft);
      if (serialized !== initializedDraftRef.current) {
        initializedDraftRef.current = serialized;
        setForm(initialDraft);
        setSavedSectionSnapshots(buildSectionSnapshots(initialDraft));
        lastSavedSnapshotRef.current = serialized;
      }
    }
  }, [initialDraft, hasUnsavedChanges]);

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

  const updateField = useCallback(
    <K extends keyof AnnouncementDraftState>(key: K, value: AnnouncementDraftState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateNestedField = useCallback(
    <K extends keyof AnnouncementDraftState>(key: K, nestedKey: string, value: unknown) => {
      setForm((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as Record<string, unknown>), [nestedKey]: value },
      }));
    },
    [],
  );

  const updateForm = useCallback(
    (updater: (current: AnnouncementDraftState) => AnnouncementDraftState) => {
      setForm((prev) => updater(prev));
    },
    [],
  );

  const saveSection = useCallback(
    async (section: AnnouncementSectionKey): Promise<AnnouncementSaveSectionResult> => {
      if (!sectionDirtyState[section]) {
        return { ok: false, reason: "not_dirty" };
      }

      if (saveStatus === "saving" || isSavingRef.current) {
        return { ok: false, reason: "busy" };
      }

      const validationFailure = validateSectionForSave(section, formRef.current);
      if (validationFailure) {
        return validationFailure;
      }

      isSavingRef.current = true;
      setSaveStatus("saving");
      try {
        const client = getApiClient();
        const result = await client.announcements.saveSection({
          section,
          draft: formRef.current,
        });

        if (!result.ok) {
          setSaveStatus("error");
          return result;
        }

        lastSavedSnapshotRef.current = serializeAnnouncementDraft(formRef.current);
        setSavedEpoch((current) => current + 1);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
        idleStatusTimeoutRef.current = setTimeout(
          () => setSaveStatus("idle"),
          SAVED_STATUS_RESET_MS,
        );

        setSavedSectionSnapshots(buildSectionSnapshots(formRef.current));
        return result;
      } catch {
        setSaveStatus("error");
        return { ok: false, reason: "error" };
      } finally {
        isSavingRef.current = false;
      }
    },
    [saveStatus, sectionDirtyState],
  );

  const cancelSection = useCallback(
    (section: AnnouncementSectionKey) => {
      if (!sectionDirtyState[section] || saveStatus === "saving") {
        return;
      }

      switch (section) {
        case "characteristics": {
          const savedCharacteristics = JSON.parse(
            savedSectionSnapshots.characteristics,
          ) as AnnouncementCharacteristics;
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
            paymentMethods:
              isLegacy || !parsed.paymentMethods || parsed.paymentMethods.length === 0
                ? ["dinheiro"]
                : parsed.paymentMethods,
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
          const savedDescription = JSON.parse(savedSectionSnapshots.description) as Pick<
            AnnouncementDraftState,
            "shortDescription" | "description"
          >;
          updateForm((current) => ({
            ...current,
            shortDescription: savedDescription.shortDescription,
            description: savedDescription.description,
          }));
          return;
        }
        case "services": {
          const savedServices = JSON.parse(
            savedSectionSnapshots.services,
          ) as AnnouncementServiceOption[];
          updateField("services", savedServices);
          return;
        }
        case "availability": {
          const savedAvailability = JSON.parse(savedSectionSnapshots.availability) as Pick<
            AnnouncementDraftState,
            "showAvailability" | "availability"
          >;
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
    async ({
      status,
      onActivate,
    }: AnnouncementPublishOptions): Promise<AnnouncementPublishResult> => {
      if (saveStatus === "saving" || isSavingRef.current) {
        return { ok: false, reason: "error", message: ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE };
      }

      const dirtySections = (Object.keys(sectionDirtyState) as AnnouncementSectionKey[]).filter(
        (section) => sectionDirtyState[section],
      );
      const blockingItems = getPublishBlockingItems(formRef.current, dirtySections);

      if (blockingItems.length > 0) {
        return {
          ok: false,
          reason: "blocked",
          message: ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
          items: blockingItems,
        };
      }

      isSavingRef.current = true;
      setSaveStatus("saving");
      try {
        const client = getApiClient();
        const result = await client.announcements.publish({
          draft: formRef.current,
        });

        if (!result.ok) {
          setSaveStatus("idle");
          return result;
        }

        lastSavedSnapshotRef.current = serializeAnnouncementDraft(formRef.current);
        setSavedEpoch((current) => current + 1);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        if (idleStatusTimeoutRef.current) clearTimeout(idleStatusTimeoutRef.current);
        idleStatusTimeoutRef.current = setTimeout(
          () => setSaveStatus("idle"),
          SAVED_STATUS_RESET_MS,
        );

        setSavedSectionSnapshots(buildSectionSnapshots(formRef.current));

        if (status !== "Ativo") {
          onActivate();
        }

        return { ok: true };
      } catch {
        setSaveStatus("error");
        return { ok: false, reason: "error", message: ANNOUNCEMENT_PUBLISH_ERROR_MESSAGE };
      } finally {
        isSavingRef.current = false;
      }
    },
    [saveStatus, sectionDirtyState],
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
    isSectionReadyForOptimization: (section: AnnouncementSectionKey) =>
      isSectionReadyForOptimization(form, section),
  };
}

export type UseAnnouncementDraftReturn = ReturnType<typeof useAnnouncementDraft>;
