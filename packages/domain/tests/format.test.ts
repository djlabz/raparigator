import { describe, expect, it } from "vitest";
import {
  formatCurrencyBRL,
  formatDateBR,
  formatRelativeTime,
  maskEmail,
  normalizeText,
  splitCityState,
} from "../src/format";

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

  it("formatDateBR usa o fuso de São Paulo em qualquer ambiente", () => {
    const iso = "2026-10-12T02:30:00.000Z";
    expect(formatDateBR(iso)).toBe("11/10/2026, 23:30");
    expect(formatDateBR(new Date(iso), "date").replace(/\u00a0/g, " ")).toBe("11 de out. de 2026");
    expect(formatDateBR(iso, "dateTimeLong")).toBe("11 de outubro de 2026 às 23:30");
  });

  it("formatDateBR devolve o fallback para vazio ou data inválida", () => {
    expect(formatDateBR(null)).toBe("");
    expect(formatDateBR(undefined, "date", "—")).toBe("—");
    expect(formatDateBR("não é data", "dateTime", "-")).toBe("-");
  });

  it("maskEmail preserva o domínio e nunca mostra a parte local inteira", () => {
    expect(maskEmail("mariana@teste.dev")).toBe("mar****@teste.dev");
    expect(maskEmail("ana@x.co")).toBe("an***@x.co");
    expect(maskEmail("jo@x.co")).toBe("j***@x.co");
    expect(maskEmail("a@x.co")).toBe("***@x.co");
    expect(maskEmail("semarroba")).toBe("sem******");
  });

  it("splitCityState separa cidade e UF pela última vírgula", () => {
    expect(splitCityState("Belo Horizonte, MG")).toEqual({ city: "Belo Horizonte", state: "MG" });
    expect(splitCityState("Curitiba")).toEqual({ city: "Curitiba", state: "" });
    expect(splitCityState(null)).toEqual({ city: "", state: "" });
  });
});
