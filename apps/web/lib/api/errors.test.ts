import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "@/lib/api/errors";

const FALLBACK = "Não deu certo.";

describe("apiErrorMessage", () => {
  it("validação mostra o primeiro problema do campo", () => {
    const error = {
      code: "BAD_REQUEST",
      message: "Dados inválidos. Confira os campos.",
      data: { issues: [{ message: "Informe sua senha.", path: ["password"] }] },
    };
    expect(apiErrorMessage(error, FALLBACK)).toBe("Informe sua senha.");
  });

  it("BAD_REQUEST sem issues usa a mensagem do servidor", () => {
    expect(apiErrorMessage({ code: "BAD_REQUEST", message: "Senha incorreta." }, FALLBACK)).toBe(
      "Senha incorreta.",
    );
  });

  it("limite de tentativas e falha de rede têm texto fixo", () => {
    expect(apiErrorMessage({ code: "RATE_LIMITED", message: "Too Many" }, FALLBACK)).toBe(
      "Muitas tentativas. Aguarde um instante.",
    );
    expect(apiErrorMessage(new TypeError("Failed to fetch"), FALLBACK)).toMatch(/conectar/);
  });

  it("erro interno ou sem código cai no texto da tela", () => {
    expect(
      apiErrorMessage(
        { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
        FALLBACK,
      ),
    ).toBe(FALLBACK);
    expect(apiErrorMessage(new Error("boom"), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });

  it("erro de regra do servidor mostra a mensagem dele", () => {
    expect(
      apiErrorMessage({ code: "CONFLICT", message: "Denúncia já foi encerrada." }, FALLBACK),
    ).toBe("Denúncia já foi encerrada.");
  });
});
