import { describe, expect, it, vi } from "vitest";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness({ captureLogs: true });

describe("falha ao ler a sessão", () => {
  it("responde como anônimo e registra o erro do better-auth no log", async () => {
    const spy = vi
      .spyOn(harness.deps.auth.api, "getSession")
      .mockRejectedValue(new Error("banco indisponível"));
    try {
      const result = await harness.rpc<{ user: null }>("auth/me", {}, { cookie: "x=y" });
      expect(result.status).toBe(200);
      expect(result.body.user).toBeNull();
    } finally {
      spy.mockRestore();
    }
    expect(harness.logs()).toContain("getSession falhou");
  });

  it("registra no log a falha da sessão de administrador", async () => {
    const spy = vi
      .spyOn(harness.deps.adminAuth.api, "getSession")
      .mockRejectedValue(new Error("banco indisponível"));
    try {
      const result = await harness.rpc("admin/dashboard", {}, { cookie: "x=y" });
      expect(result.status).toBe(401);
    } finally {
      spy.mockRestore();
    }
    expect(harness.logs()).toContain("getSession de admin falhou");
  });
});
