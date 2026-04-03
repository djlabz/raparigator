import type { Metadata } from "next";
import { ProfessionalDashboardScreen } from "@/components/screens/professional-signup-screnn/professional-dashboard-screen";

export const metadata: Metadata = { title: "Dashboard profissional | Sigillus", description: "Gerencie anuncio, servicos, valores e historico na area profissional da Sigillus." };

export default function ProfessionalDashboardPage() {
  return <ProfessionalDashboardScreen />;
}
