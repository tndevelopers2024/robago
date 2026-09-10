// src/middleware/validate.ts
import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError.js";

/** Validates `req.body` against a @robago/shared Zod schema and replaces `req.body` with
 *  the parsed (defaulted/coerced) result. On failure, responds with the same 400 +
 *  field-error shape used throughout the REST contract (robago-prd.md §6). */
export function validateBody<T>(schema: ZodType<T>) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of result.error.issues) {
                const key = issue.path.join(".") || "_root";
                if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
            }
            return next(ApiError.badRequest("Validation failed", fieldErrors));
        }
        req.body = result.data;
        next();
    };
}

export function validateQuery<T>(schema: ZodType<T>) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of result.error.issues) {
                fieldErrors[issue.path.join(".") || "_root"] = issue.message;
            }
            return next(ApiError.badRequest("Invalid query parameters", fieldErrors));
        }
        // Express 5 makes `req.query` a getter-only proxy in some setups; stash the
        // parsed/coerced query separately rather than assigning back to req.query.
        (req as Request & { validatedQuery?: T }).validatedQuery = result.data;
        next();
    };
}
