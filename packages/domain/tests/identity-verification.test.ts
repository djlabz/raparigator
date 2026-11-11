import { describe, expect, it } from "vitest";
import {
  IDENTITY_REQUIRED_MESSAGES,
  identityGateNeedsHistory,
  identityPublishGate,
} from "../src/identity-verification";

describe("identity-verification", () => {
  it("sem exigência de identidade, publica", () => {
    expect(
      identityPublishGate({ required: false, activeStatus: null, hasPrevious: false }),
    ).toEqual({
      ok: true,
    });
  });

  it("identidade aprovada publica", () => {
    expect(
      identityPublishGate({ required: true, activeStatus: "approved", hasPrevious: true }),
    ).toEqual({ ok: true });
  });

  it("em análise bloqueia com a mensagem de análise", () => {
    expect(
      identityPublishGate({ required: true, activeStatus: "pending", hasPrevious: true }),
    ).toEqual({ ok: false, message: IDENTITY_REQUIRED_MESSAGES.pending });
  });

  it("sem verificação ativa: reprovada se já enviou antes, ausente se nunca enviou", () => {
    expect(identityPublishGate({ required: true, activeStatus: null, hasPrevious: true })).toEqual({
      ok: false,
      message: IDENTITY_REQUIRED_MESSAGES.rejected,
    });
    expect(identityPublishGate({ required: true, activeStatus: null, hasPrevious: false })).toEqual(
      {
        ok: false,
        message: IDENTITY_REQUIRED_MESSAGES.missing,
      },
    );
  });

  it("só consulta o histórico quando a exigência vale e não há verificação ativa", () => {
    expect(identityGateNeedsHistory(false, null)).toBe(false);
    expect(identityGateNeedsHistory(true, "approved")).toBe(false);
    expect(identityGateNeedsHistory(true, "pending")).toBe(false);
    expect(identityGateNeedsHistory(true, null)).toBe(true);
  });
});
