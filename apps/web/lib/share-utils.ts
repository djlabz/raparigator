import { buildBriefMessageText } from "@/lib/encounter-brief";
import type { EncounterBrief } from "@/lib/types";
import { contactGreetingText, whatsAppChatUrl, telegramChatUrl } from "@sigillus/domain";

export function getExternalContactText(
  name: string,
  slug: string,
  brief?: EncounterBrief | null,
): string {
  return brief ? buildBriefMessageText(brief) : contactGreetingText(name, slug);
}

export function getWhatsAppChatUrl(
  name: string,
  slug: string,
  phone: string,
  brief?: EncounterBrief | null,
): string {
  return whatsAppChatUrl(phone, getExternalContactText(name, slug, brief));
}

export function getTelegramChatUrl(
  name: string,
  slug: string,
  username: string,
  brief?: EncounterBrief | null,
): string {
  return telegramChatUrl(username, getExternalContactText(name, slug, brief));
}

export function vibrate(ms: number = 50): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      return;
    }
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Failed to copy text: ", e);
    }
  }
  return false;
}
