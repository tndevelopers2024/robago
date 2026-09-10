// src/middleware/requireRole.ts
import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@robago/shared";
import { ApiError } from "../utils/ApiError.js";

/** Must be mounted after `requireAuth` — reads `req.user` set there.
 *  This is the server-side enforcement robago-prd.md §0/§4 flags as entirely missing
 *  from the legacy app (role existed but gated nothing). */
export function requireRole(...allowed: UserRole[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(ApiError.unauthorized());
        }
        if (!allowed.includes(req.user.role)) {
            return next(ApiError.forbidden("You do not have permission to perform this action"));
        }
        next();
    };
}
