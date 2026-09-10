// src/utils/asyncHandler.ts
import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Express 5 forwards rejected promises to `next` automatically for handlers it recognizes
 *  as async, but wrapping explicitly keeps this codebase correct even if that ever changes,
 *  and keeps every controller free of repeated try/catch boilerplate. */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
