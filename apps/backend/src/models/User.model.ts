// src/models/User.model.ts
import { Schema, model, type InferSchemaType } from "mongoose";
import { UserRole } from "@robago/shared";

const userSchema = new Schema(
    {
        phoneNumber: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(UserRole),
            required: true,
            default: UserRole.Manager,
        },
        passwordHash: { type: String, required: true, select: false },
        fcmToken: { type: String, default: null },
        // Bumped on password reset to invalidate every outstanding refresh token for this
        // user in one step (see utils/jwt.ts RefreshTokenPayload.tokenVersion).
        tokenVersion: { type: Number, default: 0 },
    },
    { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
