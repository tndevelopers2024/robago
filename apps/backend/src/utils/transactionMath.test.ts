// src/utils/transactionMath.test.ts
import { describe, expect, it } from "vitest";
import { TransactionType } from "@robago/shared";
import {
    deltaForEditedTransaction,
    deltaForNewTransaction,
    signForTransactionType,
} from "./transactionMath.js";

describe("signForTransactionType", () => {
    it("Purchase/Production/Adjustment are positive", () => {
        expect(signForTransactionType(TransactionType.Purchase)).toBe(1);
        expect(signForTransactionType(TransactionType.Production)).toBe(1);
        expect(signForTransactionType(TransactionType.Adjustment)).toBe(1);
    });
    it("Sale/Consumption are negative", () => {
        expect(signForTransactionType(TransactionType.Sale)).toBe(-1);
        expect(signForTransactionType(TransactionType.Consumption)).toBe(-1);
    });
});

describe("deltaForNewTransaction", () => {
    it("Purchase of 10 increases quantity by 10", () => {
        expect(deltaForNewTransaction(TransactionType.Purchase, 10)).toBe(10);
    });
    it("Sale of 4 decreases quantity by 4", () => {
        expect(deltaForNewTransaction(TransactionType.Sale, 4)).toBe(-4);
    });
});

describe("deltaForEditedTransaction — never double-applies (robago-prd.md §4.3)", () => {
    it("editing a Consumption of 5 up to a Consumption of 8 applies only the extra -3", () => {
        const delta = deltaForEditedTransaction(
            TransactionType.Consumption,
            5,
            TransactionType.Consumption,
            8,
        );
        expect(delta).toBe(-3);
    });
    it("changing a Purchase of 10 into a Sale of 10 applies -20 (undo +10, apply -10)", () => {
        const delta = deltaForEditedTransaction(
            TransactionType.Purchase,
            10,
            TransactionType.Sale,
            10,
        );
        expect(delta).toBe(-20);
    });
    it("editing with no change produces a zero delta", () => {
        const delta = deltaForEditedTransaction(
            TransactionType.Production,
            7,
            TransactionType.Production,
            7,
        );
        expect(delta).toBe(0);
    });
});
