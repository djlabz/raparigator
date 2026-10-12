import type { Metadata } from "next";
import { AdminIdentityQueueScreen } from "@/components/screens/admin/admin-identity-queue-screen";

export const metadata: Metadata = {
  title: "Verificações de identidade | Admin Sigillus",
  description: "Fila de verificação de identidade das anunciantes.",
};

export default function AdminVerificacoesPage() {
  return <AdminIdentityQueueScreen />;
}
