import { describe, expect, it } from "vitest";
import { formatCurrencyBRL, formatRelativeTime, normalizeText } from "../src/format";

describe("format", () => {
  it("normalizeText remove acentos e espaços nas bordas", () => {
    expect(normalizeText("  São Paulo  ")).toBe("sao paulo");
    expect(normalizeText("Olá, VOCÊ!")).toBe("ola, voce!");
  });

  it("formatCurrencyBRL formata valores para reais", () => {
    const formatted = formatCurrencyBRL(350);
    expect(formatted.replace(/\u00a0/g, " ")).toBe("R$ 350,00");
  });

  it("formatRelativeTime lida com strings não ISO e intervalos relativos", () => {
    const now = new Date("2026-10-09T18:00:00.000Z").getTime();
    expect(formatRelativeTime("Agora", now)).toBe("Agora");
    expect(formatRelativeTime("Hoje, 09:40", now)).toBe("Hoje, 09:40");

    const justNow = new Date(now - 30_000).toISOString();
    expect(formatRelativeTime(justNow, now)).toBe("Agora");

    const minutesAgo = new Date(now - 15 * 60_000).toISOString();
    expect(formatRelativeTime(minutesAgo, now)).toBe("Há 15 min");

    const yesterday = new Date(now - 25 * 3600_000).toISOString();
    expect(formatRelativeTime(yesterday, now)).toContain("Ontem");

    const daysAgo = new Date(now - 5 * 24 * 3600_000).toISOString();
    expect(formatRelativeTime(daysAgo, now)).toContain("/");
  });
});
