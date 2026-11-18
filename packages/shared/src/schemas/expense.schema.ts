// src/schemas/expense.schema.ts
import { z } from "zod";
import { ExpenseType } from "../enums.js";
import { objectIdSchema } from "./common.schema.js";
import { isoDateSchema, monthSchema } from "./staff.schema.js";

export const expenseTypeSchema = z.enum(Object.values(ExpenseType) as [ExpenseType, ...ExpenseType[]]);

// ---- expense heads ("Tea", "Electricity"…) ----------------------------------------------------

export const createExpenseItemSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    type: expenseTypeSchema,
});
export type CreateExpenseItemInput = z.infer<typeof createExpenseItemSchema>;

export const updateExpenseItemSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(80).optional(),
    active: z.boolean().optional(),
});
export type UpdateExpenseItemInput = z.infer<typeof updateExpenseItemSchema>;

export interface ExpenseItemDTO {
    id: string;
    name: string;
    type: ExpenseType;
    active: boolean;
}

// ---- dated expense entries ----------------------------------------------------------------------

export const createExpenseSchema = z.object({
    date: isoDateSchema,
    itemId: objectIdSchema,
    amount: z.number({ error: "Amount must be a number" }).positive("Amount must be more than 0").max(100_000_000),
    note: z.string().trim().max(300).optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/** Several entries at once (the quick-add panel's "whole day" and multi-item typing). */
export const createExpensesBulkSchema = z.object({
    entries: z.array(createExpenseSchema).min(1, "Nothing to save").max(200),
});
export type CreateExpensesBulkInput = z.infer<typeof createExpensesBulkSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export interface ExpenseDTO {
    id: string;
    date: string; // YYYY-MM-DD
    itemId: string;
    amount: number;
    note: string;
}

export const expenseMonthQuerySchema = z.object({ month: monthSchema });
export type ExpenseMonthQuery = z.infer<typeof expenseMonthQuerySchema>;

export const expenseRangeQuerySchema = z
    .object({ from: monthSchema, to: monthSchema })
    .refine((q) => q.from <= q.to, { message: "'from' must not be after 'to'", path: ["from"] })
    .refine(
        (q) => {
            const [fy, fm] = q.from.split("-").map(Number) as [number, number];
            const [ty, tm] = q.to.split("-").map(Number) as [number, number];
            return (ty - fy) * 12 + (tm - fm) < 36;
        },
        { message: "Range can be at most 36 months", path: ["to"] },
    );
export type ExpenseRangeQuery = z.infer<typeof expenseRangeQuerySchema>;

/** One row per month × item that has spending: what the charts and the month-by-month sheet read. */
export interface ExpenseTotalDTO {
    month: string; // YYYY-MM
    itemId: string;
    total: number;
}
