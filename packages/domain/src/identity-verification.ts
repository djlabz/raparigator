export const IDENTITY_REQUIRED_MESSAGES = {
  missing:
    "Para publicar o anúncio, envie um documento com foto e uma selfie na verificação de identidade.",
  pending:
    "Sua verificação de identidade está em análise. O anúncio pode ser publicado assim que ela for aprovada.",
  rejected:
    "Sua verificação de identidade foi reprovada. Veja o motivo e envie novamente para publicar o anúncio.",
} as const;

export type IdentityPublishGate = { ok: true } | { ok: false; message: string };

export type IdentityGateInput = {
  required: boolean;
  activeStatus: "pending" | "approved" | null | undefined;
  hasPrevious: boolean;
};

export function identityPublishGate(input: IdentityGateInput): IdentityPublishGate {
  if (!input.required || input.activeStatus === "approved") {
    return { ok: true };
  }
  if (input.activeStatus === "pending") {
    return { ok: false, message: IDENTITY_REQUIRED_MESSAGES.pending };
  }
  return {
    ok: false,
    message: input.hasPrevious
      ? IDENTITY_REQUIRED_MESSAGES.rejected
      : IDENTITY_REQUIRED_MESSAGES.missing,
  };
}

export function identityGateNeedsHistory(
  required: boolean,
  activeStatus: IdentityGateInput["activeStatus"],
): boolean {
  return required && activeStatus !== "approved" && activeStatus !== "pending";
}
