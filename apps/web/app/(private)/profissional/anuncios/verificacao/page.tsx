import type { Metadata } from "next";
import { IdentityVerificationScreen } from "@/components/screens/identity-verification-screen";

export const metadata: Metadata = {
  title: "Verificação de identidade | Sigillus",
  description: "Envio de documento e selfie para liberar a publicação do anúncio.",
  robots: { index: false, follow: false },
};

export default function IdentityVerificationPage() {
  return <IdentityVerificationScreen />;
}
