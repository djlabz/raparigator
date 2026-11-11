export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatRelativeTime(time: string, now = Date.now()): string {
  const parsed = Date.parse(time);
  if (Number.isNaN(parsed)) {
    return time;
  }
  const diffMs = now - parsed;
  if (diffMs < 60_000) {
    return "Agora";
  }
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `Há ${diffMinutes} min`;
  }
  const date = new Date(parsed);
  const nowDate = new Date(now);
  const isToday =
    date.getDate() === nowDate.getDate() &&
    date.getMonth() === nowDate.getMonth() &&
    date.getFullYear() === nowDate.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  if (isToday) {
    return `Hoje, ${hours}:${minutes}`;
  }
  const yesterday = new Date(now - 86_400_000);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) {
    return `Ontem, ${hours}:${minutes}`;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}, ${hours}:${minutes}`;
}

export const APP_TIME_ZONE = "America/Sao_Paulo";

export type DateStyle = "date" | "dateTime" | "dateTimeLong";

const DATE_STYLE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  date: { day: "2-digit", month: "short", year: "numeric" },
  dateTime: {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  dateTimeLong: {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

export function formatDateBR(
  value: string | Date | null | undefined,
  style: DateStyle = "dateTime",
  fallback = "",
): string {
  if (!value) {
    return fallback;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleString("pt-BR", { ...DATE_STYLE_OPTIONS[style], timeZone: APP_TIME_ZONE });
}

export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  const local = at === -1 ? email : email.slice(0, at);
  const domain = at === -1 ? "" : email.slice(at + 1);
  const visible = local.slice(0, Math.min(3, Math.max(local.length - 1, 0)));
  const masked = `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}`;
  return domain ? `${masked}@${domain}` : masked;
}

export function splitCityState(value: string | null | undefined): { city: string; state: string } {
  if (!value) {
    return { city: "", state: "" };
  }
  const separator = value.lastIndexOf(",");
  if (separator === -1) {
    return { city: value.trim(), state: "" };
  }
  return {
    city: value.slice(0, separator).trim(),
    state: value.slice(separator + 1).trim(),
  };
}
