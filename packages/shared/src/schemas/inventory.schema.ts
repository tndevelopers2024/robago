// src/schemas/inventory.schema.ts
import { z } from "zod";
import { ProductType } from "../enums.js";
import { objectIdSchema } from "./common.schema.js";

// robago-prd.md §8 Inventory field-level rules that Zod *can* check in isolation
// (no DB lookup required): warehouse/product presence, and the price bounds captured
// verbatim from the legacy form (`step=0.01 min=0.01 max=10000` → "Enter a price").
//
// Each required field below sets its own `error` (Zod v4's type-mismatch override) in
// addition to `.min()`'s message — a missing key hits the type check first and a Zod v4
// schema without this override falls back to a generic "expected string, received
// undefined" message instead of the PRD's wording (caught by app.test.ts).
export const createInventorySchema = z.object({
    productId: z.string({ error: "Select a product" }).regex(/^[0-9a-fA-F]{24}$/, "Select a product"),
    warehouseId: z
        .string({ error: "Select a warehouse" })
        .regex(/^[0-9a-fA-F]{24}$/, "Select a warehouse"),
    supplierId: objectIdSchema.optional(), // conditionally required — see validateInventoryBusinessRules below
    location: z.string({ error: "Location is required" }).trim().min(1, "Location is required"),
    price: z
        .number({ error: "Enter a price" })
        .min(0.01, "Enter a price")
        .max(10000, "Enter a price")
        .multipleOf(0.01, "Price must have at most 2 decimal places"),
    alertThreshold: z.number().int().min(0).optional(), // conditionally required — see below
    quantity: z.number().min(0).default(0),
    imgUrl: z.string().url().nullable().optional(),
});
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export const updateInventorySchema = createInventorySchema.partial();
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

/**
 * The "supplier + alertThreshold required only for RawMaterial products" rule
 * (robago-prd.md §8) depends on the *referenced* product's type, which a request-body
 * schema can't know without a DB lookup — so it isn't a plain Zod `.refine()` on the
 * schema above. Call this from the backend service layer once the product has been
 * fetched, and surface its messages the same way a Zod issue would (400 + field errors).
 */
export function validateInventoryBusinessRules(
    input: Pick<CreateInventoryInput, "supplierId" | "alertThreshold">,
    productType: ProductType,
): { field: "supplierId" | "alertThreshold"; message: string }[] {
    if (productType !== ProductType.RawMaterial) return [];
    const errors: { field: "supplierId" | "alertThreshold"; message: string }[] = [];
    if (!input.supplierId) errors.push({ field: "supplierId", message: "Select a supplier" });
    if (input.alertThreshold == null) {
        errors.push({ field: "alertThreshold", message: "Alert threshold is required for raw materials" });
    }
    return errors;
}
