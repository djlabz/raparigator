import { currency } from "@/lib/utils";
import type { EncounterBrief, ProfessionalAd, SimulationSelection } from "@/lib/types";

const SIMULATION_DRAFT_KEY = "sigillus-sim-draft";
const FALLBACK_ORIGIN = "https://sigillus.app";

/** Âncora do Simulador de Encontro na página do anúncio */
export const ENCOUNTER_SIMULATOR_ANCHOR = "simulador-de-encontro";

/** Afasta a âncora do cabeçalho fixo (4rem no mobile, 5rem no desktop) */
export const ENCOUNTER_SIMULATOR_SCROLL_MARGIN =
  "scroll-mt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:scroll-mt-[calc(5.75rem+env(safe-area-inset-top,0px))]";

export function getAdEditHref(adSlug: string): string {
  return `/anuncio/${adSlug}#${ENCOUNTER_SIMULATOR_ANCHOR}`;
}

export function buildEncounterBrief(
  ad: ProfessionalAd,
  duration: string,
  extras: string[],
  basePrice: number,
  extrasCost: number,
  total: number,
): EncounterBrief {
  return {
    adSlug: ad.slug,
    artisticName: ad.artisticName,
    duration,
    basePrice,
    extras: [...extras],
    extrasCost,
    total,
  };
}

export function encodeBriefParams(selection: SimulationSelection): URLSearchParams {
  const params = new URLSearchParams();
  params.set("d", selection.duration);
  if (selection.extras.length > 0) {
    params.set("e", selection.extras.join("|"));
  }
  return params;
}

export function decodeBriefSelection(
  search: string,
  ad: ProfessionalAd,
): SimulationSelection | null {
  const params = new URLSearchParams(search);
  const rawDuration = params.get("d");
  const rawExtras = params.get("e");

  if (!rawDuration && !rawExtras) {
    return null;
  }

  const duration = ad.pricingTable.find((plan) => plan.label === rawDuration)?.label;
  const extras = (rawExtras ? rawExtras.split("|") : []).filter((extra) =>
    ad.services.includes(extra),
  );

  if (!duration && extras.length === 0) {
    return null;
  }

  return {
    duration: duration ?? ad.pricingTable[0]?.label ?? "",
    extras,
  };
}

export function getSimulationUrl(brief: EncounterBrief): string {
  const origin = typeof window === "undefined" ? FALLBACK_ORIGIN : window.location.origin;
  const params = encodeBriefParams({ duration: brief.duration, extras: brief.extras });
  return `${origin}/p/${brief.adSlug}?${params.toString()}`;
}

export function buildBriefMessageText(brief: EncounterBrief): string {
  const lines = [
    `Olá, ${brief.artisticName}! ✨`,
    "",
    "Vi seu anúncio na Sigillus e me interessei pela sua apresentação.",
    "",
    "📋 *O que tenho em mente:*",
    `⏳ Duração: ${brief.duration}`,
  ];

  if (brief.extras.length > 0) {
    lines.push(`➕ Adicionais: ${brief.extras.join(", ")}`);
  }

  lines.push(
    `💰 Estimativa: ${currency(brief.total)}`,
    "",
    `🔗 Simulação completa: ${getSimulationUrl(brief)}`,
    "",
    "Podemos conversar sobre disponibilidade e como você prefere combinar? 🙏",
  );

  return lines.join("\n");
}

export function buildBriefGreeting(brief: EncounterBrief): string {
  return `Olá, ${brief.artisticName}! Vi seu anúncio e montei uma simulação de encontro. Dá uma olhada no que tenho em mente e me diz se funciona pra você. ✨`;
}

function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export interface BriefHandoff {
  brief: EncounterBrief;
  conversationId: string;
}

/**
 * Entrega do briefing do anúncio para o chat. É um store em memória, e não um
 * parâmetro na URL, porque `TabsKeepAlive` mantém a aba do chat montada: uma tela
 * que já está viva não roda efeito de montagem nem observa a query de novo.
 */
let handoff: BriefHandoff | null = null;
const handoffListeners = new Set<() => void>();

function emitHandoff() {
  handoffListeners.forEach((listener) => listener());
}

export function subscribeBriefHandoff(listener: () => void) {
  handoffListeners.add(listener);
  return () => {
    handoffListeners.delete(listener);
  };
}

export function getBriefHandoff(): BriefHandoff | null {
  return handoff;
}

export function getServerBriefHandoff(): BriefHandoff | null {
  return null;
}

export function requestBriefHandoff(brief: EncounterBrief, conversationId: string) {
  handoff = { brief: { ...brief, extras: [...brief.extras] }, conversationId };
  emitHandoff();
}

export function clearBriefHandoff() {
  if (!handoff) {
    return;
  }
  handoff = null;
  emitHandoff();
}

export function saveSimulationDraft(slug: string, selection: SimulationSelection) {
  const drafts = readSessionJson<Record<string, SimulationSelection>>(SIMULATION_DRAFT_KEY) ?? {};
  writeSessionJson(SIMULATION_DRAFT_KEY, { ...drafts, [slug]: selection });
}

export function readSimulationDraft(slug: string): SimulationSelection | null {
  const drafts = readSessionJson<Record<string, SimulationSelection>>(SIMULATION_DRAFT_KEY);
  const draft = drafts?.[slug];
  if (!draft || typeof draft.duration !== "string" || !Array.isArray(draft.extras)) {
    return null;
  }
  return draft;
}
