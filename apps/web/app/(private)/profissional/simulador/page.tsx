import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EarningsSimulatorScreen } from "@/components/screens/earnings-simulator/earnings-simulator-screen";
import { isEarningsSimulatorEnabled } from "@/lib/earnings-simulator-flag";

export const metadata: Metadata = {
  title: "Simulador de projeção | Sigillus",
  description: "Simulação de projeção com os seus próprios números.",
  robots: { index: false, follow: false },
};

export default function EarningsSimulatorPage() {
  if (!isEarningsSimulatorEnabled()) {
    notFound();
  }
  return <EarningsSimulatorScreen />;
}
