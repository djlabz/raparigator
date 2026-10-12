import { INVALID_CPF_MESSAGE, isValidCpf } from "@sigillus/domain";
import type { UserRole } from "@sigillus/contracts";
import { APIError } from "better-auth/api";

export type SignupSensitiveFields = {
  role: UserRole;
  cpf: string | null;
  phone: string | null;
  city: string | null;
};

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new APIError("BAD_REQUEST", { message: "Dados de cadastro inválidos." });
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readSignupSensitiveFields(source: Record<string, unknown>): SignupSensitiveFields {
  const role = source.role ?? "cliente";
  if (role !== "cliente" && role !== "profissional") {
    throw new APIError("BAD_REQUEST", { message: "Papel inválido." });
  }
  const cpf = optionalText(source.cpf);
  if (cpf && !isValidCpf(cpf)) {
    throw new APIError("BAD_REQUEST", { message: INVALID_CPF_MESSAGE });
  }
  return { role, cpf, phone: optionalText(source.phone), city: optionalText(source.city) };
}
