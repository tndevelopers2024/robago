// src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const cleanStr = (val: unknown) => (typeof val === "string" ? val.trim().replace(/^['"]|['"]$/g, "") : val);

const envSchema = z.object({
    NODE_ENV: z
        .preprocess(cleanStr, z.string().optional())
        .transform((val) => {
            if (!val) return "production";
            const normalized = val.toLowerCase();
            if (normalized === "dev" || normalized === "development") {
                return "development" as const;
            }
            if (normalized === "test") {
                return "test" as const;
            }
            // Defaults to "production" for "prod", "production", "publish" (Hostinger mode), or any other value
            return "production" as const;
        }),
    PORT: z.coerce.number().int().default(5001),
    MONGO_URI: z.preprocess(cleanStr, z.string().min(1, "MONGO_URI is required")),
    JWT_ACCESS_SECRET: z.preprocess(
        cleanStr,
        z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
    ),
    JWT_REFRESH_SECRET: z.preprocess(
        cleanStr,
        z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
    ),
    JWT_ACCESS_EXPIRES_IN: z.preprocess(cleanStr, z.string().default("15m")),
    JWT_REFRESH_EXPIRES_IN: z.preprocess(cleanStr, z.string().default("30d")),
    CORS_ORIGIN: z.preprocess(cleanStr, z.string().default("*")),
    COOKIE_DOMAIN: z.preprocess(cleanStr, z.string().optional()),
    // Email reminders (optional — without SMTP_HOST the app still works; email reminders just say they aren't set up).
    SMTP_HOST: z.preprocess(cleanStr, z.string().optional()),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_SECURE: z.preprocess(cleanStr, z.enum(["true", "false"]).default("false")),
    SMTP_USER: z.preprocess(cleanStr, z.string().optional()),
    SMTP_PASS: z.preprocess(cleanStr, z.string().optional()),
    EMAIL_FROM: z.preprocess(cleanStr, z.string().optional()), // e.g. "Robago Accounts <accounts@robago.com>"
    EMAIL_REPLY_TO: z.preprocess(cleanStr, z.string().optional()),
    COMPANY_NAME: z.preprocess(cleanStr, z.string().default("Robago")),
});

// Parsed once at import time — any process that imports this module fails fast with a
// clear message instead of limping along with `undefined` secrets.
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Invalid environment configuration — see errors above");
}

export const env = parsed.data;
export type Env = typeof env;
