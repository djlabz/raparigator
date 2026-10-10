import type { Metadata, Viewport } from "next";
import { ForgotPasswordScreen } from "@/components/screens/forgot-password-screen";

export const metadata: Metadata = {
  title: "Recuperar Senha | Sigillus",
  description: "Recupere o acesso à sua conta Sigillus com segurança.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
