// src/controllers/taggedEntity.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

interface TaggedEntityServiceLike<T> {
    list(): Promise<unknown>;
    create(input: T): Promise<unknown>;
    update(id: string, input: Partial<T>): Promise<unknown>;
    remove(id: string): Promise<void>;
}

export function createTaggedEntityController<T>(service: TaggedEntityServiceLike<T>) {
    return {
        list: asyncHandler(async (_req: Request, res: Response) => {
            res.status(200).json(await service.list());
        }),
        create: asyncHandler(async (req: Request, res: Response) => {
            res.status(201).json(await service.create(req.body as T));
        }),
        update: asyncHandler(async (req: Request, res: Response) => {
            res.status(200).json(
                await service.update(req.params.id as string, req.body as Partial<T>),
            );
        }),
        remove: asyncHandler(async (req: Request, res: Response) => {
            await service.remove(req.params.id as string);
            res.status(204).send();
        }),
    };
}
