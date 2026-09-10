// src/schemas/user.schema.ts
import { z } from "zod";
import { UserRole } from "../enums.js";

const userRoleSchema = z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]);

// robago-prd.md §6: server hashes `passcode` into passwordHash — never accept a hash from the client.
export const createUserSchema = z.object({
    phoneNumber: z
        .string()
        .trim()
        .regex(/^\d{7,15}$/, "Enter a valid phone number"),
    name: z.string().trim().min(1, "Name is required"),
    role: userRoleSchema.default(UserRole.User),
    passcode: z.string().min(4, "Passcode must be at least 4 characters"),
    fcmToken: z.string().nullable().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

// Edits: passcode reset is optional; phoneNumber is the collection's key and is not editable
// via this schema (renaming a user's phone number is a delete+recreate in the rebuild, matching
// how the legacy schema treats it as a primary key with FK references from `transaction.createdBy`).
export const updateUserSchema = z.object({
    name: z.string().trim().min(1).optional(),
    role: userRoleSchema.optional(),
    passcode: z.string().min(4, "Passcode must be at least 4 characters").optional(),
    fcmToken: z.string().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// robago-prd.md §8 Users: duplicate phone number → "User with this phone number already exists!"
// This is inherently a DB uniqueness check, not something a stateless Zod schema can enforce —
// the backend's create-user handler must catch the Mongo duplicate-key error (or pre-check via
// `User.exists({ phoneNumber })`) and return exactly this message as a 409.
export const DUPLICATE_PHONE_NUMBER_MESSAGE = "User with this phone number already exists!";
