import { describe, expect, it } from "vitest";
import { SlugSchema } from "@sigillus/contracts";
import { parseAdTarget, slugFromAdUrl, slugify } from "../src/ad-slug";

describe("ad-slug", () => {
  it("slugify gera um slug aceito pelo contrato", () => {
    expect(slugify("  Ana Clara Ávila!! ")).toBe("ana-clara-avila");
    expect(slugify("---")).toBe("");
    expect(SlugSchema.safeParse(slugify("Luna Velvet São Paulo")).success).toBe(true);
    expect(slugify("a".repeat(80))).toHaveLength(60);
  });

  it("extrai o slug do link do anúncio e ignora outras páginas", () => {
    expect(slugFromAdUrl("https://sigillus.app/anuncio/luna-velvet-sao-paulo?ref=feed")).toBe(
      "luna-velvet-sao-paulo",
    );
    expect(slugFromAdUrl("https://sigillus.app/anuncio/luna-velvet/")).toBe("luna-velvet");
    expect(slugFromAdUrl("https://sigillus.app/feed")).toBeNull();
    expect(slugFromAdUrl("não é url")).toBeNull();
  });

  it("parseAdTarget aceita link, caminho ou slug solto", () => {
    expect(parseAdTarget("https://sigillus.app/anuncio/x-1")).toEqual({
      targetUrl: "https://sigillus.app/anuncio/x-1",
    });
    expect(parseAdTarget("/anuncio/luna-velvet")).toEqual({ profileSlug: "luna-velvet" });
    expect(parseAdTarget("anuncio/luna-velvet/")).toEqual({ profileSlug: "luna-velvet" });
    expect(parseAdTarget("  Luna-Velvet ")).toEqual({ profileSlug: "luna-velvet" });
    expect(parseAdTarget("luna velvet")).toBeNull();
    expect(parseAdTarget("https://")).toBeNull();
  });
});
