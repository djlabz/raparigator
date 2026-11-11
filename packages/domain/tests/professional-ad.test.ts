import { describe, expect, it } from "vitest";
import { ProfessionalAdSchema } from "@sigillus/contracts";
import { emptyProfessionalAd } from "../src/professional-ad";

describe("professional-ad", () => {
  it("anúncio vazio é um rascunho válido pelo contrato, sem números", () => {
    const ad = emptyProfessionalAd();
    expect(ProfessionalAdSchema.parse(ad)).toEqual(ad);
    expect(ad).toMatchObject({ verificationStatus: "draft", startingPrice: 0, profileViews: 0 });
  });

  it("cada chamada devolve um objeto novo", () => {
    const first = emptyProfessionalAd();
    first.images.push("x");
    expect(emptyProfessionalAd().images).toEqual([]);
  });
});
