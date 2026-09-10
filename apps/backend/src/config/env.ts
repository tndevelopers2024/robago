// src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().default(3000),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
    JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    COOKIE_DOMAIN: z.string().optional(),
});

// Parsed once at import time — any process that imports this module fails fast with a
// clear message instead of limping along with `undefined` secrets (the exact failure
// mode that let robago-prd.md §0's legacy app ship a hardcoded DB token in the client).
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
