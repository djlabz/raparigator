const NETWORK_ERROR_MESSAGE = "Não foi possível conectar ao servidor. Verifique sua conexão.";
const RATE_LIMITED_MESSAGE = "Muitas tentativas. Aguarde um instante.";

type ApiErrorLike = { code?: unknown; message?: unknown; data?: unknown };

function firstIssueMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const issues = (data as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) {
    return null;
  }
  const message = (issues[0] as { message?: unknown } | undefined)?.message;
  return typeof message === "string" && message ? message : null;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }
  if (!error || typeof error !== "object") {
    return fallback;
  }
  const { code, message, data } = error as ApiErrorLike;
  if (typeof code !== "string" || code === "INTERNAL_SERVER_ERROR") {
    return fallback;
  }
  if (code === "RATE_LIMITED") {
    return RATE_LIMITED_MESSAGE;
  }
  if (code === "BAD_REQUEST") {
    const issue = firstIssueMessage(data);
    if (issue) {
      return issue;
    }
  }
  return typeof message === "string" && message ? message : fallback;
}
