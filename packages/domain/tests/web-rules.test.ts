import { describe, expect, it } from "vitest";
import {
  clampMobileContactFabY,
  contactGreetingText,
  getMobileContactFabDragConstraints,
  getMobileContactFabTooltipSide,
  getNavigationItems,
  getProfileHref,
  getRoleLabel,
  notificationHref,
  sanitizeRedirect,
  shareCopyText,
  shareProfileUrl,
  telegramChatUrl,
  telegramShareUrl,
  translateAuthError,
  whatsAppChatUrl,
  whatsAppShareUrl,
} from "../src/index";

describe("links de compartilhamento e contato", () => {
  it("monta o link curto e os textos com o link", () => {
    expect(shareProfileUrl("luna")).toBe("https://sigillus.app/p/luna");
    expect(shareCopyText("Luna", "luna")).toContain("https://sigillus.app/p/luna");
    expect(contactGreetingText("Luna", "luna")).toMatch(/^Olá, Luna\./);
  });

  it("WhatsApp e Telegram recebem o texto codificado e o contato limpo", () => {
    expect(whatsAppShareUrl("Luna", "luna")).toMatch(/^https:\/\/wa\.me\/\?text=Confira/);
    expect(telegramShareUrl("Luna", "luna")).toContain(
      `url=${encodeURIComponent("https://sigillus.app/p/luna")}`,
    );
    expect(whatsAppChatUrl("+55 (11) 99999-0000", "oi & tchau")).toBe(
      "https://wa.me/5511999990000?text=oi%20%26%20tchau",
    );
    expect(telegramChatUrl("@luna_v", "oi")).toBe("https://t.me/luna_v?text=oi");
  });
});

describe("navegação por papel", () => {
  it("itens, rótulo e destino do perfil por papel", () => {
    expect(getNavigationItems("visitor")).toEqual([]);
    expect(getNavigationItems("profissional").map((item) => item.href)).toContain(
      "/profissional/dashboard",
    );
    expect(getRoleLabel("cliente")).toBe("Cliente");
    expect(getRoleLabel("visitor")).toBe("Visitante");
    expect(getProfileHref("visitor")).toBe("/auth/login");
    expect(getProfileHref("profissional")).toBe("/conta");
  });
});

describe("mensagens de erro de autenticação", () => {
  it("traduz pelo código do better-auth", () => {
    expect(
      translateAuthError({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    ).toBe("Credenciais inválidas. Verifique seu e-mail e senha.");
    expect(translateAuthError({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toBe(
      "Este e-mail já está cadastrado.",
    );
    expect(translateAuthError({ code: "TOKEN_EXPIRED", message: "Token expired" })).toBe(
      "Este link expirou. Peça um novo.",
    );
  });

  it("código desconhecido nunca mostra o texto em inglês", () => {
    expect(
      translateAuthError({ code: "FAILED_TO_CREATE_SESSION", message: "Failed to create session" }),
    ).toBe("Ocorreu um erro ao processar sua solicitação. Tente novamente.");
  });

  it("erro sem código vem da própria API, em português, e passa direto", () => {
    expect(translateAuthError({ message: "Informe um CPF válido.", status: 400 })).toBe(
      "Informe um CPF válido.",
    );
    expect(
      translateAuthError({ code: "ALIAS_TAKEN", message: "Esse apelido já está em uso." }),
    ).toBe("Esse apelido já está em uso.");
    expect(translateAuthError({ statusText: "Bad Request" })).toBe(
      "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
    );
  });

  it("rede e ausência de erro têm texto fixo", () => {
    expect(translateAuthError(new TypeError("Failed to fetch"))).toMatch(/conectar ao servidor/);
    expect(translateAuthError(null)).toBe("Ocorreu um erro inesperado. Tente novamente.");
  });
});

describe("links de notificação e redirecionamento", () => {
  it("notificação sem href cai no fluxo do perfil", () => {
    expect(notificationHref({ href: "/chat" })).toBe("/chat");
    expect(notificationHref({ href: undefined })).toBe("/conta#profile-workflow");
  });

  it("redirecionamento só aceita caminho interno", () => {
    expect(sanitizeRedirect("/anuncio/luna?x=1")).toBe("/anuncio/luna?x=1");
    expect(sanitizeRedirect("//evil.com")).toBeNull();
    expect(sanitizeRedirect("https://evil.com")).toBeNull();
    expect(sanitizeRedirect(null)).toBeNull();
  });
});

describe("geometria do botão flutuante de contato", () => {
  it("prende o deslocamento vertical dentro da tela", () => {
    expect(clampMobileContactFabY(-10_000, 800)).toBe(-(800 - 56 - 69 - 16));
    expect(clampMobileContactFabY(50, 800)).toBe(0);
    expect(Math.abs(clampMobileContactFabY(-100, 100))).toBe(0);
  });

  it("dica abre do lado oposto e o arrasto respeita as margens", () => {
    expect(getMobileContactFabTooltipSide("left")).toBe("right");
    expect(getMobileContactFabDragConstraints(390, 844)).toEqual({
      top: -(844 - 56 - 69 - 16),
      bottom: 0,
      left: 0,
      right: 390 - 56 - 32,
    });
  });
});
