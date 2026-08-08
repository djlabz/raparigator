import type { Metadata } from "next";
import { ProfessionalFinanceScreen } from "@/components/screens/professional-finance-screen";

export const metadata: Metadata = { title: "Financeiro profissional | Sigillus", description: "Resumo financeiro e de repasses do perfil profissional." };

export default function ProfessionalFinancePage() {
  return <ProfessionalFinanceScreen />;
}
