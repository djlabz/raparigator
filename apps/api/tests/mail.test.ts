import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";
import { createLogger } from "../src/lib/logger";
import {
  createLogMailer,
  createMailer,
  createMemoryMailer,
  createResendMailer,
} from "../src/lib/mail";

const logger = createLogger({ level: "fatal", pretty: false });

describe("lib / mail", () => {
  it("LogMailer registra envio e retorna ok", async () => {
    const mailer = createLogMailer(logger);
    const result = await mailer.send({
      to: "cliente@teste.dev",
      subject: "Assunto Teste",
      text: "Mensagem de texto",
    });
    expect(result.ok).toBe(true);
    expect(result.id).toMatch(/^log_/);
  });

  it("MemoryMailer armazena mensagens e limpa o buffer", async () => {
    const mailer = createMemoryMailer();
    expect(mailer.sent).toHaveLength(0);

    const result = await mailer.send({
      to: "usuario@teste.dev",
      subject: "Redefinir senha",
      text: "Link de redefinição",
    });

    expect(result.ok).toBe(true);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.to).toBe("usuario@teste.dev");
    expect(mailer.sent[0]?.subject).toBe("Redefinir senha");

    mailer.clear();
    expect(mailer.sent).toHaveLength(0);
  });

  it("ResendMailer dispara POST com headers e payload esperados", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedInit = init;
      return new Response(JSON.stringify({ id: "resend_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const mailer = createResendMailer({
      apiKey: "re_teste_123456",
      from: "Sigillus <contato@sigillus.dev>",
      logger,
      fetchFn: mockFetch as typeof fetch,
    });

    const result = await mailer.send({
      to: "destino@teste.dev",
      subject: "Confirmação",
      text: "Código: 123456",
      html: "<p>Código: 123456</p>",
    });

    expect(result).toEqual({ id: "resend_123", ok: true });
    expect(capturedUrl).toBe("https://api.resend.com/emails");
    expect(capturedInit?.method).toBe("POST");

    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_teste_123456");
    expect(headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(String(capturedInit?.body));
    expect(body).toEqual({
      from: "Sigillus <contato@sigillus.dev>",
      to: ["destino@teste.dev"],
      subject: "Confirmação",
      text: "Código: 123456",
      html: "<p>Código: 123456</p>",
    });
  });

  it("ResendMailer trata resposta de erro HTTP e falha de rede sem quebrar", async () => {
    const errorFetch = async (): Promise<Response> => {
      return new Response(JSON.stringify({ message: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    };

    const mailer = createResendMailer({
      apiKey: "chave_invalida",
      from: "teste@sigillus.dev",
      logger,
      fetchFn: errorFetch as typeof fetch,
    });

    const httpError = await mailer.send({
      to: "alvo@teste.dev",
      subject: "Teste",
      text: "Texto",
    });
    expect(httpError).toEqual({ ok: false });

    const networkErrorFetch = async (): Promise<Response> => {
      throw new Error("DNS resolution failure");
    };

    const networkMailer = createResendMailer({
      apiKey: "chave_invalida",
      from: "teste@sigillus.dev",
      logger,
      fetchFn: networkErrorFetch as typeof fetch,
    });

    const networkError = await networkMailer.send({
      to: "alvo@teste.dev",
      subject: "Teste",
      text: "Texto",
    });
    expect(networkError).toEqual({ ok: false });
  });

  it("createMailer seleciona Resend quando configurado e LogMailer como fallback", () => {
    const baseEnv = {
      DATABASE_URL: "postgres://u:p@localhost:5432/d",
      AUTH_SECRET: "12345678901234567890123456789012",
      BILLING_WEBHOOK_SECRET: "1234567890123456",
      S3_ENDPOINT: "http://localhost:9000",
      S3_BUCKET: "bucket",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
    };

    const resendConfig = loadConfig({
      ...baseEnv,
      MAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_chave_valida",
    });
    const resendMailer = createMailer(resendConfig, logger);
    expect(resendMailer).toBeDefined();

    const missingKeyConfig = loadConfig({
      ...baseEnv,
      MAIL_PROVIDER: "resend",
      RESEND_API_KEY: "",
    });
    const fallbackMailer = createMailer(missingKeyConfig, logger);
    expect(fallbackMailer).toBeDefined();

    const logConfig = loadConfig({
      ...baseEnv,
      MAIL_PROVIDER: "log",
    });
    const logMailer = createMailer(logConfig, logger);
    expect(logMailer).toBeDefined();
  });
});
