// src/models/Expense.model.ts
import { Schema, model } from "mongoose";
import { ExpenseType } from "@robago/shared";

// An expense "head" such as Tea or Electricity. Entries point at it by id, so renaming a head
// updates every past entry, and archiving one hides it without losing history.
const expenseItemSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        // Lower-cased name, used only to keep names unique within a type ("Tea" vs "tea").
        nameKey: { type: String, required: true },
        type: { type: String, enum: Object.values(ExpenseType), required: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);
expenseItemSchema.index({ type: 1, nameKey: 1 }, { unique: true });

const expenseSchema = new Schema(
    {
        date: { type: String, required: true }, // YYYY-MM-DD
        month: { type: String, required: true }, // YYYY-MM, derived from date; makes monthly totals cheap
        itemId: { type: Schema.Types.ObjectId, ref: "ExpenseItem", required: true },
        amount: { type: Number, required: true, min: 0 },
        note: { type: String, default: "" },
    },
    { timestamps: true },
);
expenseSchema.index({ month: 1, itemId: 1 });
expenseSchema.index({ date: 1 });

export const ExpenseItem = model("ExpenseItem", expenseItemSchema);
export const Expense = model("Expense", expenseSchema);
