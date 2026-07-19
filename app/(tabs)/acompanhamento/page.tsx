import type { Metadata } from "next";
import { TrackingScreen } from "@/components/screens/tracking-screen";

export const metadata: Metadata = { title: "Acompanhamento de servico | Sigillus", description: "Acompanhe status, check-in e seguranca do atendimento em tempo real." };

export default function TrackingPage() {
  return <TrackingScreen />;
}
