// src/utils/transactionMath.ts
import { TransactionType } from "@robago/shared";

/** Purchase/Production/Adjustment increase stock; Sale/Consumption decrease it.
 *  robago-prd.md §4.3 — matches the legacy app's convention exactly. */
export function signForTransactionType(type: TransactionType): 1 | -1 {
    return type === TransactionType.Consumption || type === TransactionType.Sale ? -1 : 1;
}

/** Signed quantity change to apply to `inventory.quantity` for a brand-new transaction. */
export function deltaForNewTransaction(type: TransactionType, quantity: number): number {
    return signForTransactionType(type) * quantity;
}

/**
 * Signed quantity change to apply when an existing transaction is edited in place —
 * the *difference* between the new and old signed quantities, so editing never
 * double-applies the original movement (robago-prd.md §4.3 point 6).
 */
export function deltaForEditedTransaction(
    oldType: TransactionType,
    oldQuantity: number,
    newType: TransactionType,
    newQuantity: number,
): number {
    const oldSigned = signForTransactionType(oldType) * oldQuantity;
    const newSigned = signForTransactionType(newType) * newQuantity;
    return newSigned - oldSigned;
}
