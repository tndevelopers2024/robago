// src/models/Product.model.ts
import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { ProductType, Unit } from "@robago/shared";

const productSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, default: null },
        categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        unit: { type: String, enum: Object.values(Unit), required: true, default: Unit.Piece },
        type: {
            type: String,
            enum: Object.values(ProductType),
            required: true,
            default: ProductType.RawMaterial,
        },
    },
    { timestamps: true },
);
productSchema.index({ categoryId: 1 });
productSchema.index({ name: "text" });

export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: Types.ObjectId };
export const Product = model("Product", productSchema);
