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
