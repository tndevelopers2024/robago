// src/schemas/category.schema.ts
import { z } from "zod";
import { ProductType } from "../enums.js";
import { tagColorSchema } from "./common.schema.js";

export const createCategorySchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().default(""),
    tagColor: tagColorSchema,
    type: z
        .enum(Object.values(ProductType) as [ProductType, ...ProductType[]])
        .default(ProductType.RawMaterial),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
