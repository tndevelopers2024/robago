// src/models/Inventory.model.ts
import { Schema, model, Types, type InferSchemaType } from "mongoose";

const inventorySchema = new Schema(
    {
        alertThreshold: { type: Number, default: null, min: 0 }, // required only for RawMaterial products — enforced in the service layer, see services/inventory.service.ts
        location: { type: String, required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
        imgUrl: { type: String, default: null },
        supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
        price: { type: Number, required: true, min: 0.01, max: 10000 },
        quantity: { type: Number, required: true, default: 0 },
    },
    { timestamps: { createdAt: false, updatedAt: "lastUpdated" } },
);
inventorySchema.index({ productId: 1 });
inventorySchema.index({ warehouseId: 1 });

export type InventoryDoc = InferSchemaType<typeof inventorySchema> & { _id: Types.ObjectId };
export const Inventory = model("Inventory", inventorySchema);
