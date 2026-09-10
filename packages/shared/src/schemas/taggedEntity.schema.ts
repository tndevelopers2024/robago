// src/schemas/taggedEntity.schema.ts
//
// Warehouse, Supplier, and ProductionUnit are byte-identical in shape
// (robago-prd.md §5: name/description/tagColor) but are kept as three distinct
// collections — a real-world party (e.g. "S A IMPEX") can legitimately be both a
// Supplier and a ProductionUnit at once (see robago-prd.md §9.1), so they must never
// be merged into one schema/collection.
import { z } from "zod";
import { taggedEntityBaseSchema } from "./common.schema.js";

export const createWarehouseSchema = taggedEntityBaseSchema;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export const updateWarehouseSchema = createWarehouseSchema.partial();
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

export const createSupplierSchema = taggedEntityBaseSchema;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const createProductionUnitSchema = taggedEntityBaseSchema;
export type CreateProductionUnitInput = z.infer<typeof createProductionUnitSchema>;
export const updateProductionUnitSchema = createProductionUnitSchema.partial();
export type UpdateProductionUnitInput = z.infer<typeof updateProductionUnitSchema>;
