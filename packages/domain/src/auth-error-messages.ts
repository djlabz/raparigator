export function translateAuthError(error: unknown): string {
  if (!error) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  const message =
    typeof error === "string"
      ? error
      : typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "";

  const lower = message.toLowerCase();

  if (
    lower.includes("invalid email or password") ||
    lower.includes("invalid_email_or_password") ||
    lower.includes("credenciais inválidas")
  ) {
    return "Credenciais inválidas. Verifique seu e-mail e senha.";
  }

  if (lower.includes("user already exists") || lower.includes("user_already_exists")) {
    return "Este e-mail já está cadastrado.";
  }

  if (lower.includes("suspended") || lower.includes("suspensa")) {
    return "Esta conta está suspensa. Entre em contato com o suporte.";
  }

  if (lower.includes("password is too short") || lower.includes("minpasswordlength")) {
    return "A senha deve ter no mínimo 8 caracteres.";
  }

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  if (message.length > 0) {
    return message;
  }

  return "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
}
