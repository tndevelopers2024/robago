// src/utils/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "@robago/shared";

export interface AccessTokenPayload {
    sub: string; // User's Mongo _id as a string
    phoneNumber: string;
    role: UserRole;
}

export interface RefreshTokenPayload {
    sub: string;
    tokenVersion: number; // bumped to invalidate all outstanding refresh tokens for a user (e.g. on password reset)
}

export function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
