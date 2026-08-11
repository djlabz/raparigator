import type { Metadata } from "next";
import { CheckoutScreen } from "@/components/screens/checkout-screen";

export const metadata: Metadata = {
  title: "Checkout seguro | Sigillus",
  description: "Contrate com pagamento em custodia e total rastreabilidade dentro da Sigillus.",
};

export default function CheckoutPage() {
  return <CheckoutScreen />;
}
