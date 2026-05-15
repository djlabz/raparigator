export interface ProfileCompletionForm {
  fullName: string;
  cpf: string;
  email: string;
  confirmEmail: string;
  phone: string;
  city: string;
  preference: string;
}

export function isProfileFormComplete(role: "cliente" | "profissional", form: ProfileCompletionForm) {
  const cpfDigits = form.cpf.replace(/\D/g, "");
  const phoneDigits = form.phone.replace(/\D/g, "");

  if (!form.fullName.trim()) return false;
  if (cpfDigits.length !== 11) return false;
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return false;
  if (form.confirmEmail.trim() !== form.email.trim()) return false;
  if (phoneDigits.length < 10) return false;

  if (role === "cliente") {
    if (!form.city.trim()) return false;
    if (!form.preference.trim()) return false;
  }

  return true;
}