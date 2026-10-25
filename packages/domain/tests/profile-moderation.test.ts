import { describe, expect, it } from "vitest";
import {
  PROFILE_INITIAL_STATUS,
  canReview,
  transitionOnPublish,
  transitionOnReview,
} from "../src/profile-moderation";

describe("máquina de moderação do perfil", () => {
  it("perfil nasce como rascunho", () => {
    expect(PROFILE_INITIAL_STATUS).toBe("draft");
  });

  it("admin só decide perfil em análise", () => {
    expect(canReview("pending_review")).toBe(true);
    expect(canReview("draft")).toBe(false);
    expect(canReview("published")).toBe(false);
    expect(canReview("rejected")).toBe(false);
  });

  it("publicar leva rascunho, rejeitado e em análise para a fila de revisão", () => {
    expect(transitionOnPublish("draft")).toEqual({ status: "pending_review", needsReview: true });
    expect(transitionOnPublish("rejected")).toEqual({
      status: "pending_review",
      needsReview: true,
    });
    expect(transitionOnPublish("pending_review")).toEqual({
      status: "pending_review",
      needsReview: true,
    });
  });

  it("perfil já publicado republica sem nova revisão", () => {
    expect(transitionOnPublish("published")).toEqual({ status: "published", needsReview: false });
  });

  it("decisão do admin resolve a revisão", () => {
    expect(transitionOnReview("approve")).toBe("published");
    expect(transitionOnReview("reject")).toBe("rejected");
  });
});
