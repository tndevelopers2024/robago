// src/middleware/requireAuth.ts
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("Missing or malformed Authorization header"));
    }
    const token = header.slice("Bearer ".length);

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, phoneNumber: payload.phoneNumber, role: payload.role };
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(ApiError.unauthorized("Access token expired"));
        }
        return next(ApiError.unauthorized("Invalid access token"));
    }
}
