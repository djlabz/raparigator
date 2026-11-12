import { z } from "zod";

export const SignupRoleSchema = z.enum(["cliente", "profissional"]);
export type SignupRole = z.infer<typeof SignupRoleSchema>;

export const SignupFormSchema = z.object({
  fullName: z.string(),
  cpf: z.string(),
  email: z.string(),
  confirmEmail: z.string(),
  phone: z.string(),
  city: z.string(),
  preference: z.string(),
});
export type SignupForm = z.infer<typeof SignupFormSchema>;

export const SignupFieldErrorsSchema = SignupFormSchema.partial();
export type SignupFieldErrors = z.infer<typeof SignupFieldErrorsSchema>;

export const EmailPairErrorsSchema = z.object({
  email: z.string().optional(),
  confirmEmail: z.string().optional(),
});
export type EmailPairErrors = z.infer<typeof EmailPairErrorsSchema>;

export const PasswordPairErrorsSchema = z.object({
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});
export type PasswordPairErrors = z.infer<typeof PasswordPairErrorsSchema>;
