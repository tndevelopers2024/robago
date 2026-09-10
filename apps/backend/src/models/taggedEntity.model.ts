// src/models/taggedEntity.model.ts
//
// Warehouse, Supplier, and ProductionUnit share an identical schema shape
// (robago-prd.md §5/§9.1) but are deliberately kept as three separate collections —
// a real-world party (e.g. "S A IMPEX") can be both a Supplier and a ProductionUnit
// at once, so merging them into one collection would make that impossible to represent.
import { Schema, model, type InferSchemaType } from "mongoose";


function taggedEntitySchema() {
    return new Schema(
        {
            name: { type: String, required: true },
            description: { type: String, default: "" },
            tagColor: { type: String, match: /^#[0-9a-fA-F]{6}$/, required: true },
        },
        { timestamps: true },
    );
}

const warehouseSchema = taggedEntitySchema();
export type WarehouseDoc = InferSchemaType<typeof warehouseSchema>;
export const Warehouse = model("Warehouse", warehouseSchema);

const supplierSchema = taggedEntitySchema();
export type SupplierDoc = InferSchemaType<typeof supplierSchema>;
export const Supplier = model("Supplier", supplierSchema);

const productionUnitSchema = taggedEntitySchema();
export type ProductionUnitDoc = InferSchemaType<typeof productionUnitSchema>;
export const ProductionUnit = model("ProductionUnit", productionUnitSchema);
