// src/schemas/transaction.schema.ts
import { z } from "zod";
import { TransactionType } from "../enums.js";
import { objectIdSchema } from "./common.schema.js";

const transactionTypeSchema = z.enum(
    Object.values(TransactionType) as [TransactionType, ...TransactionType[]],
);

const baseTransactionShape = {
    inventoryId: z
        .string({ error: "Inventory item is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "Inventory item is required"),
    transactionType: transactionTypeSchema,
    quantity: z.number({ error: "Quantity is required" }).int().min(1, "Quantity is required"),
    producedBy: objectIdSchema.nullable().optional(),
    consumedBy: objectIdSchema.nullable().optional(),
    notes: z.string().trim().nullable().optional(),
};

// robago-prd.md §8 Transactions:
//  - Production/Consumption require a Production Unit → "Select a Production Unit!"
//  - Purchase/Sale/Adjustment require non-empty notes → "Enter some notes!"
// `createdBy` is deliberately NOT part of this schema — robago-prd.md §6 requires it be
// set from the authenticated request context server-side, never accepted from the client.
export const createTransactionSchema = z
    .object(baseTransactionShape)
    .superRefine((data, ctx) => {
        if (data.transactionType === TransactionType.Production) {
            if (!data.producedBy) {
                ctx.addIssue({
                    code: "custom",
                    path: ["producedBy"],
                    message: "Select a Production Unit!",
                });
            }
        }
        if (data.transactionType === TransactionType.Consumption) {
            if (!data.consumedBy) {
                ctx.addIssue({
                    code: "custom",
                    path: ["consumedBy"],
                    message: "Select a Production Unit!",
                });
            }
        }
        const notesRequiredTypes: TransactionType[] = [
            TransactionType.Purchase,
            TransactionType.Sale,
            TransactionType.Adjustment,
        ];
        if (notesRequiredTypes.includes(data.transactionType)) {
            if (!data.notes || data.notes.trim().length === 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["notes"],
                    message: "Enter some notes!",
                });
            }
        }
    });
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// Edits carry the same conditional rules; transactionId is path-supplied, not body-supplied.
export const updateTransactionSchema = createTransactionSchema;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
