// src/controllers/category.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "@robago/shared";

export const list = asyncHandler(async (req: Request, res: Response) => {
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const categories = await categoryService.listCategories({ type });
    res.status(200).json(categories);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body as CreateCategoryInput);
    res.status(201).json(category);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(
        req.params.id as string,
        req.body as UpdateCategoryInput,
    );
    res.status(200).json(category);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await categoryService.deleteCategory(req.params.id as string);
    res.status(204).send();
});
