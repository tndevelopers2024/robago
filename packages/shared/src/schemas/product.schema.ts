// src/schemas/product.schema.ts
import { z } from "zod";
import { ProductType, Unit } from "../enums.js";

// robago-prd.md §8 Products: "Please select a category" when categoryId is missing.
export const createProductSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim().optional(),
    categoryId: z
        .string({ error: "Please select a category" })
        .regex(/^[0-9a-fA-F]{24}$/, "Please select a category"),
    unit: z.enum(Object.values(Unit) as [Unit, ...Unit[]]).default(Unit.Piece),
    type: z
        .enum(Object.values(ProductType) as [ProductType, ...ProductType[]])
        .default(ProductType.RawMaterial),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
