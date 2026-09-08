import { z } from "zod";

export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  passcode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Passcode must be exactly 6 digits"),
});

export type LoginInput = z.infer<typeof loginSchema>;
