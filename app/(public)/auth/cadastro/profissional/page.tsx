import type { Metadata } from "next";
import { ProfessionalSignupScreen } from "@/components/screens/professional-signup-screen/professional-signup-screen";

export const metadata: Metadata = { title: "Cadastro de profissional | Sigillus", description: "Envie seus dados e verificacao para atuar como profissional na Sigillus." };

export default function ProfessionalSignupPage() {
  return <ProfessionalSignupScreen />;
}
