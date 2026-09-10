// src/schemas/auth.schema.ts
import { z } from "zod";
import { UserRole } from "../enums.js";

// robago-prd.md §8 Auth: "Please enter a phoneNumber and passcode" when either is missing.
// Zod v4 raises its own type-mismatch message for a genuinely *missing* key (undefined)
// before a `.min()` check ever runs, so the schema-level `error` override is what makes
// the PRD's message fire for both "missing" and "empty string" — not just the latter.
export const loginSchema = z.object({
    phoneNumber: z
        .string({ error: "Please enter a phoneNumber and passcode" })
        .trim()
        .min(1, "Please enter a phoneNumber and passcode"),
    passcode: z
        .string({ error: "Please enter a phoneNumber and passcode" })
        .min(1, "Please enter a phoneNumber and passcode"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userDtoSchema = z.object({
    id: z.string(),
    phoneNumber: z.string(),
    name: z.string(),
    role: z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]),
});
export type UserDTO = z.infer<typeof userDtoSchema>;

export const loginResponseSchema = z.object({
    user: userDtoSchema,
    accessToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshResponseSchema = z.object({
    accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
