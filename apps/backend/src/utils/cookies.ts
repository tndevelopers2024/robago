// src/utils/cookies.ts
import type { CookieOptions } from "express";
import { env } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "robago_refresh_token";

export function refreshCookieOptions(): CookieOptions {
    const isProd = env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: env.COOKIE_DOMAIN,
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    };
}
