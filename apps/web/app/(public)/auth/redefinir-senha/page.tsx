import type { Metadata, Viewport } from "next";
import { ResetPasswordScreen } from "@/components/screens/reset-password-screen";

export const metadata: Metadata = {
  title: "Redefinir Senha | Sigillus",
  description: "Defina sua nova senha para acessar sua conta Sigillus.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function ResetPasswordPage() {
  return <ResetPasswordScreen />;
}
