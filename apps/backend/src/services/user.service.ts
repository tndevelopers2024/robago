// src/services/user.service.ts
import { User } from "../models/User.model.js";
import { Transaction } from "../models/Transaction.model.js";
import { hashPassword } from "../utils/password.js";
import { ApiError } from "../utils/ApiError.js";
import { DUPLICATE_PHONE_NUMBER_MESSAGE } from "@robago/shared";
import type { CreateUserInput, UpdateUserInput } from "@robago/shared";

export async function listUsers() {
    return User.find().sort({ name: 1 });
}

export async function createUser(input: CreateUserInput) {
    const existing = await User.exists({ phoneNumber: input.phoneNumber });
    if (existing) {
        throw ApiError.conflict(DUPLICATE_PHONE_NUMBER_MESSAGE, {
            phoneNumber: DUPLICATE_PHONE_NUMBER_MESSAGE,
        });
    }
    const passwordHash = await hashPassword(input.passcode);
    return User.create({
        phoneNumber: input.phoneNumber,
        name: input.name,
        role: input.role,
        passwordHash,
        fcmToken: input.fcmToken ?? null,
    });
}

export async function updateUser(phoneNumber: string, input: UpdateUserInput) {
    const update: Record<string, unknown> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.fcmToken !== undefined ? { fcmToken: input.fcmToken } : {}),
    };
    if (input.passcode) {
        update.passwordHash = await hashPassword(input.passcode);
        // Invalidate any outstanding refresh tokens for this user on passcode reset.
        update.$inc = { tokenVersion: 1 };
    }

    const { $inc, ...set } = update as { $inc?: { tokenVersion: number } } & Record<string, unknown>;
    const updated = await User.findOneAndUpdate(
        { phoneNumber },
        $inc ? { $set: set, $inc } : { $set: set },
        { new: true, runValidators: true },
    );
    if (!updated) throw ApiError.notFound("User not found");
    return updated;
}

export async function deleteUser(phoneNumber: string) {
    const user = await User.findOne({ phoneNumber });
    if (!user) throw ApiError.notFound("User not found");

    const hasTransactions = await Transaction.exists({ createdBy: phoneNumber });
    if (hasTransactions) {
        // Legacy `onDelete: set null` semantics — the user can be removed, but their
        // authored transactions keep their history rather than being deleted too.
        await Transaction.updateMany({ createdBy: phoneNumber }, { $set: { createdBy: null } });
    }
    await User.deleteOne({ phoneNumber });
}
