// src/controllers/inventory.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as inventoryService from "../services/inventory.service.js";
import type { CreateInventoryInput, UpdateInventoryInput } from "@robago/shared";

export const list = asyncHandler(async (req: Request, res: Response) => {
    const { search, warehouseId, type } = req.query as Record<string, string | undefined>;
    const inventory = await inventoryService.listInventory({ search, warehouseId, type });
    res.status(200).json(inventory);
});

export const alerts = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await inventoryService.getAlerts());
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await inventoryService.getInventoryById(req.params.id as string));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const inventory = await inventoryService.createInventory(req.body as CreateInventoryInput);
    res.status(201).json(inventory);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const inventory = await inventoryService.updateInventory(
        req.params.id as string,
        req.body as UpdateInventoryInput,
    );
    res.status(200).json(inventory);
});

// Actual file-upload handling (multer + storage provider) is intentionally out of scope
// here — this stub accepts a pre-uploaded URL so the endpoint shape matches
// robago-prd.md §6 (`POST /inventory/:id/image`) while the storage integration
// (S3 / Supabase / etc.) is decided. Swap the body shape for a multipart handler once
// that decision is made; nothing else in the contract needs to change.
export const setImage = asyncHandler(async (req: Request, res: Response) => {
    const { imgUrl } = req.body as { imgUrl: string };
    const inventory = await inventoryService.setInventoryImage(req.params.id as string, imgUrl);
    res.status(200).json(inventory);
});
