import { z } from "zod";

export const ContactVerificationChannelSchema = z.enum(["email", "phone"]);
export type ContactVerificationChannel = z.infer<typeof ContactVerificationChannelSchema>;

export const ChangePhoneInputSchema = z.strictObject({
  phone: z.string().max(30),
});
export type ChangePhoneInput = z.infer<typeof ChangePhoneInputSchema>;

export const ContactVerificationChannelStateSchema = z.object({
  target: z.string(),
  verified: z.boolean(),
  verifiedAt: z.string().nullable(),
  codeSentAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  attempts: z.number(),
});
export type ContactVerificationChannelState = z.infer<typeof ContactVerificationChannelStateSchema>;

export const ContactVerificationStateSchema = z.object({
  email: ContactVerificationChannelStateSchema,
  phone: ContactVerificationChannelStateSchema,
  required: z.boolean(),
});
export type ContactVerificationState = z.infer<typeof ContactVerificationStateSchema>;
