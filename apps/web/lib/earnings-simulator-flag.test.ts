import { afterEach, describe, expect, it, vi } from "vitest";
import { isEarningsSimulatorEnabled } from "./earnings-simulator-flag";

describe("isEarningsSimulatorEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fica ligado quando a env não está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_FINANCIAL_SIMULATOR_ENABLED", undefined);
    expect(isEarningsSimulatorEnabled()).toBe(true);
  });

  it("fica ligado com true", () => {
    vi.stubEnv("NEXT_PUBLIC_FINANCIAL_SIMULATOR_ENABLED", "true");
    expect(isEarningsSimulatorEnabled()).toBe(true);
  });

  it("desliga só com false", () => {
    vi.stubEnv("NEXT_PUBLIC_FINANCIAL_SIMULATOR_ENABLED", "false");
    expect(isEarningsSimulatorEnabled()).toBe(false);
  });
});
