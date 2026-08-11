import type { Metadata } from "next";
import { LoginScreen } from "@/components/screens/login-screen";

export const metadata: Metadata = {
  title: "Login | Sigillus",
  description: "Acesse sua conta Sigillus com seguranca.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
