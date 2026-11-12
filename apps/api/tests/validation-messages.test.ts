import { describe, expect, it } from "vitest";
import { VALIDATION_ERROR_MESSAGE } from "@sigillus/contracts";
import { loadConfig } from "../src/config";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness();

type ValidationBody = {
  code: string;
  message: string;
  data?: { issues: Array<{ message: string; path: string[] }> };
};

describe("mensagens de validação em português", () => {
  it("input inválido responde 400 com texto padrão e issues traduzidas", async () => {
    const result = await harness.rpc<ValidationBody>("reports/createPublic", {
      profileSlug: "alguem",
      reason: "photo_without_consent",
      details: "curto",
    });
    expect(result.status).toBe(400);
    expect(result.body.message).toBe(VALIDATION_ERROR_MESSAGE);
    const issue = result.body.data?.issues.find((item) => item.path.includes("details"));
    expect(issue?.message).toMatch(/caracteres|pequeno|mínimo|ao menos/i);
    expect(JSON.stringify(result.body)).not.toMatch(/Too small|Input validation failed/);
  });

  it("rota autenticada sem sessão responde com a mensagem do contrato", async () => {
    const result = await harness.rpc<{ code: string; message: string }>("chat/listConversations");
    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Sessão necessária.");
  });

  it("env inválido no boot lista os problemas em português", () => {
    expect(() => loadConfig({})).toThrow(/Configuração inválida/);
    try {
      loadConfig({});
    } catch (error) {
      expect(String(error)).not.toMatch(/Invalid input|Required|expected string/);
    }
  });
});
