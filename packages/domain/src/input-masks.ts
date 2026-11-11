export function formatIntegerGroup(value: string): string {
  const normalized = value.replace(/^0+(?=\d)/, "");
  if (!normalized) {
    return "0";
  }
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) {
    return "";
  }
  const normalizedDigits = digits.padStart(3, "0");
  return `${formatIntegerGroup(normalizedDigits.slice(0, -2))},${normalizedDigits.slice(-2)}`;
}

export function formatWeightInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) {
    return "";
  }
  const clampedDigits = Number(digits) > 1000 ? "1000" : digits;
  const normalizedDigits = clampedDigits.padStart(2, "0");
  return `${formatIntegerGroup(normalizedDigits.slice(0, -1))},${normalizedDigits.slice(-1)}`;
}

export function formatHeightInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function sanitizeCityInput(value: string): string {
  return value
    .replace(/[^A-Za-zÀ-ÿ' -]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 60);
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCardCvv(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}
