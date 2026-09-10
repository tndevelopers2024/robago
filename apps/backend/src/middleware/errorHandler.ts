// src/middleware/errorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
        });
    }

    // Mongoose duplicate-key error (e.g. duplicate phoneNumber) — code 11000.
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
        return res.status(409).json({ error: "A record with this value already exists" });
    }

    console.error(err);
    return res.status(500).json({
        error: "Internal server error",
        ...(env.NODE_ENV !== "production" && err instanceof Error ? { detail: err.message } : {}),
    });
}
