// src/schemas/common.schema.ts
import { z } from "zod";


/** Validates a MongoDB ObjectId string (24 hex chars) — used for every FK-style field. */
export const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid id");

export const tagColorSchema = z
    .string({ error: "Select or pick a tag color" })
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code (e.g. #FFCBA4)");

/** Shared shape for Category / Warehouse / Supplier / ProductionUnit's "name/description/tagColor" trio. */
export const taggedEntityBaseSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim().default(""),
    tagColor: tagColorSchema,
});

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
