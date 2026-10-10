import { redirect } from "next/navigation";

export default function RecuperarSenhaRedirectPage() {
  redirect("/auth/esqueci-senha");
}
