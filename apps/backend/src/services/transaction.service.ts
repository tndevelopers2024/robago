// src/services/transaction.service.ts
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { deltaForEditedTransaction, deltaForNewTransaction } from "../utils/transactionMath.js";
import type { CreateTransactionInput, TransactionType, UpdateTransactionInput } from "@robago/shared";

export async function listTransactionsForInventory(inventoryId: string, limit = 50) {
    return Transaction.find({ inventoryId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("producedBy consumedBy");
}

export async function listRecentTransactions(limit = 20) {
    return Transaction.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate({ path: "inventoryId", populate: { path: "productId" } })
        .populate("producedBy consumedBy");
}

export async function createTransaction(input: CreateTransactionInput, createdBy: string) {
    const session = await mongoose.startSession();
    try {
        let created;
        await session.withTransaction(async () => {
            const inventory = await Inventory.findById(input.inventoryId).session(session);
            if (!inventory) throw ApiError.notFound("Inventory item not found");

            const delta = deltaForNewTransaction(input.transactionType, input.quantity);
            const newQuantity = inventory.quantity + delta;
            if (newQuantity < 0) {
                throw ApiError.badRequest("This would take stock below zero", {
                    quantity: "This would take stock below zero",
                });
            }

            inventory.quantity = newQuantity;
            await inventory.save({ session });

            const [txn] = await Transaction.create(
                [{ ...input, createdBy, timestamp: new Date() }],
                { session },
            );
            created = txn;
        });
        return created;
    } finally {
        await session.endSession();
    }
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
    const session = await mongoose.startSession();
    try {
        let updated;
        await session.withTransaction(async () => {
            const existing = await Transaction.findById(id).session(session);
            if (!existing) throw ApiError.notFound("Transaction not found");

            // Editing a transaction only makes sense against the same inventory item —
            // robago-prd.md §4.3 doesn't describe moving a transaction to a different item.
            const inventory = await Inventory.findById(existing.inventoryId).session(session);
            if (!inventory) throw ApiError.notFound("Inventory item not found");

            const newType = (input.transactionType ?? existing.transactionType) as TransactionType;
            const newQty = input.quantity ?? existing.quantity;

            const delta = deltaForEditedTransaction(
                existing.transactionType as TransactionType,
                existing.quantity,
                newType,
                newQty,
            );
            const newInventoryQuantity = inventory.quantity + delta;
            if (newInventoryQuantity < 0) {
                throw ApiError.badRequest("This would take stock below zero", {
                    quantity: "This would take stock below zero",
                });
            }

            inventory.quantity = newInventoryQuantity;
            await inventory.save({ session });

            Object.assign(existing, input);
            await existing.save({ session });
            updated = existing;
        });
        return updated;
    } finally {
        await session.endSession();
    }
}
