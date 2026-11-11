import { describe, expect, it } from "vitest";
import { canStartReportReview, isReportOpen } from "../src/report-status";

describe("report-status", () => {
  it("denúncia aberta é a que não foi resolvida nem arquivada", () => {
    expect(isReportOpen("pending")).toBe(true);
    expect(isReportOpen("under_review")).toBe(true);
    expect(isReportOpen("resolved")).toBe(false);
    expect(isReportOpen("dismissed")).toBe(false);
  });

  it("só denúncia pendente pode entrar em análise", () => {
    expect(canStartReportReview("pending")).toBe(true);
    expect(canStartReportReview("under_review")).toBe(false);
    expect(canStartReportReview("resolved")).toBe(false);
    expect(canStartReportReview("dismissed")).toBe(false);
  });
});
