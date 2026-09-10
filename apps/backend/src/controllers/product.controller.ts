// src/controllers/product.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as productService from "../services/product.service.js";
import type { CreateProductInput, UpdateProductInput } from "@robago/shared";

export const list = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, type, search } = req.query as Record<string, string | undefined>;
    const products = await productService.listProducts({ categoryId, type, search });
    res.status(200).json(products);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body as CreateProductInput);
    res.status(201).json(product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.updateProduct(
        req.params.id as string,
        req.body as UpdateProductInput,
    );
    res.status(200).json(product);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await productService.deleteProduct(req.params.id as string);
    res.status(204).send();
});
