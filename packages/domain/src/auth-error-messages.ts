export const AUTH_GENERIC_ERROR_MESSAGE =
  "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
const AUTH_UNEXPECTED_ERROR_MESSAGE = "Ocorreu um erro inesperado. Tente novamente.";
const AUTH_NETWORK_ERROR_MESSAGE = "Não foi possível conectar ao servidor. Verifique sua conexão.";
const AUTH_RATE_LIMITED_MESSAGE = "Muitas tentativas. Aguarde um instante e tente de novo.";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Credenciais inválidas. Verifique seu e-mail e senha.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  INVALID_PASSWORD: "Senha incorreta.",
  PASSWORD_TOO_SHORT: "A senha deve ter no mínimo 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
  USER_ALREADY_EXISTS: "Este e-mail já está cadastrado.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Este e-mail já está cadastrado.",
  USER_NOT_FOUND: "Não encontramos uma conta com esse e-mail.",
  USER_EMAIL_NOT_FOUND: "Não encontramos uma conta com esse e-mail.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Esta conta não tem senha cadastrada.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  EMAIL_CAN_NOT_BE_UPDATED: "Não foi possível alterar o e-mail.",
  INVALID_TOKEN: "Este link é inválido ou já foi usado. Peça um novo.",
  TOKEN_EXPIRED: "Este link expirou. Peça um novo.",
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
  VALIDATION_ERROR: "Dados inválidos. Confira os campos.",
  MISSING_FIELD: "Preencha todos os campos obrigatórios.",
};

const SERVER_MESSAGE_CODES = new Set(["ALIAS_TAKEN"]);

type AuthErrorLike = { code?: unknown; message?: unknown; status?: unknown; statusText?: unknown };

export function translateAuthError(error: unknown): string {
  if (!error) {
    return AUTH_UNEXPECTED_ERROR_MESSAGE;
  }
  if (error instanceof TypeError) {
    return AUTH_NETWORK_ERROR_MESSAGE;
  }
  if (typeof error === "string") {
    return error.trim() || AUTH_GENERIC_ERROR_MESSAGE;
  }
  if (typeof error !== "object") {
    return AUTH_GENERIC_ERROR_MESSAGE;
  }
  const { code, message, status, statusText } = error as AuthErrorLike;
  if (status === 429) {
    return AUTH_RATE_LIMITED_MESSAGE;
  }
  if (typeof code === "string" && code && !SERVER_MESSAGE_CODES.has(code)) {
    return AUTH_ERROR_MESSAGES[code] ?? AUTH_GENERIC_ERROR_MESSAGE;
  }
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (typeof statusText === "string" && statusText.trim() && !/^[\x20-\x7e]+$/.test(statusText)) {
    return statusText;
  }
  return AUTH_GENERIC_ERROR_MESSAGE;
}
