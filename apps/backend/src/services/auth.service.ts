// src/services/auth.service.ts
import { User } from "../models/User.model.js";
import { comparePassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import type { LoginInput, UserDTO } from "@robago/shared";
import jwt from "jsonwebtoken";

function toUserDTO(user: {
    _id: unknown;
    phoneNumber: string;
    name: string;
    role: UserDTO["role"];
}): UserDTO {
    return {
        id: String(user._id),
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
    };
}

export async function login(input: LoginInput): Promise<{
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
}> {
    // Deliberately generic message for both "no such user" and "wrong passcode" — the
    // legacy app leaked which case applied ("Phone number not registered." vs "Wrong
    // passcode"), which lets an attacker enumerate valid phone numbers. robago-prd.md §8
    // flags this and recommends against it for the rebuild.
    const INVALID_CREDENTIALS = "Invalid phone number or passcode";

    const user = await User.findOne({ phoneNumber: input.phoneNumber }).select("+passwordHash");
    if (!user) throw ApiError.unauthorized(INVALID_CREDENTIALS);

    const ok = await comparePassword(input.passcode, user.passwordHash);
    if (!ok) throw ApiError.unauthorized(INVALID_CREDENTIALS);

    const accessToken = signAccessToken({
        sub: String(user._id),
        phoneNumber: user.phoneNumber,
        role: user.role as UserDTO["role"],
    });
    const refreshToken = signRefreshToken({ sub: String(user._id), tokenVersion: user.tokenVersion });

    return { user: toUserDTO(user), accessToken, refreshToken };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw ApiError.unauthorized("Refresh token expired");
        }
        throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized("User no longer exists");
    if (user.tokenVersion !== payload.tokenVersion) {
        // Token was issued before a password reset / explicit revocation — reject it.
        throw ApiError.unauthorized("Refresh token has been revoked");
    }

    const accessToken = signAccessToken({
        sub: String(user._id),
        phoneNumber: user.phoneNumber,
        role: user.role as UserDTO["role"],
    });
    return { accessToken, refreshToken };
}

export async function getMe(userId: string): Promise<UserDTO> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return toUserDTO(user);
}
