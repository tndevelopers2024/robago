// src/models/Transaction.model.ts
import { Schema, model, type InferSchemaType } from "mongoose";
import { TransactionType } from "@robago/shared";

const transactionSchema = new Schema(
    {
        inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", required: true },
        transactionType: { type: String, enum: Object.values(TransactionType), required: true },
        quantity: { type: Number, required: true, min: 1 },
        producedBy: { type: Schema.Types.ObjectId, ref: "ProductionUnit", default: null },
        consumedBy: { type: Schema.Types.ObjectId, ref: "ProductionUnit", default: null },
        createdBy: { type: String, ref: "User", default: null }, // references User.phoneNumber, set from auth context server-side only
        notes: { type: String, default: null },
        timestamp: { type: Date, required: true, default: Date.now },
    },
    { timestamps: false },
);
transactionSchema.index({ inventoryId: 1, timestamp: -1 });
transactionSchema.index({ timestamp: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;
export const Transaction = model("Transaction", transactionSchema);
