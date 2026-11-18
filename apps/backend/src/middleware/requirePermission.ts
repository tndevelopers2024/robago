// src/middleware/requirePermission.ts
import type { NextFunction, Request, Response } from "express";
import { can, type Permission } from "@robago/shared";
import { ApiError } from "../utils/ApiError.js";

/** Must be mounted after `requireAuth`. Lets the request through only if the user's role holds `permission`
 *  (see packages/shared/src/permissions.ts for what each role may do). */
export function requirePermission(permission: Permission) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) return next(ApiError.unauthorized());
        if (!can(req.user.role, permission)) {
            return next(ApiError.forbidden("You do not have permission to perform this action"));
        }
        next();
    };
}
