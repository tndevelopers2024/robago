// src/models/Category.model.ts
import { Schema, model, type InferSchemaType } from "mongoose";
import { ProductType, TagColor } from "@robago/shared";

const categorySchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        tagColor: { type: String, enum: Object.values(TagColor), required: true },
        type: {
            type: String,
            enum: Object.values(ProductType),
            required: true,
            default: ProductType.RawMaterial,
        },
    },
    { timestamps: true },
);
categorySchema.index({ title: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export const Category = model("Category", categorySchema);
