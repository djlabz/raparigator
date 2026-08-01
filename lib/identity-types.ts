export type ProfileIdentityRole = "cliente" | "profissional";

export type ProfileIdentityForm = {
  fullName: string;
  cpf: string;
  email: string;
  confirmEmail: string;
  phone: string;
  city: string;
  preference: string;
};

export type ProfileIdentityFieldErrors = Partial<Record<keyof ProfileIdentityForm, string>>;

export type EmailPairErrors = {
  email?: string;
  confirmEmail?: string;
};

export type PasswordPairErrors = {
  password?: string;
  confirmPassword?: string;
};
