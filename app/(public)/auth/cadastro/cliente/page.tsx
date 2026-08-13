import type { Metadata, Viewport } from "next";
import { ClientSignupScreen } from "@/components/screens/client-signup-screen";

export const metadata: Metadata = {
  title: "Cadastro de cliente | Sigillus",
  description: "Crie sua conta de cliente para contratar com seguranca e custodia.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function ClientSignupPage() {
  return <ClientSignupScreen />;
}
