// src/utils/cookies.ts
import type { CookieOptions } from "express";
import { env } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "robago_refresh_token";

export function refreshCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        domain: env.COOKIE_DOMAIN,
        path: "/api/v1/auth",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days, matches JWT_REFRESH_EXPIRES_IN default
    };
}
