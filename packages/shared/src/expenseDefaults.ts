// src/expenseDefaults.ts
// Starting list of expense heads. The backend creates these the first time expenses are opened
// (only when no items exist yet) and the offline demo mode uses the same list. New heads can be
// added any time from the app.
import type { ExpenseType } from "./enums.js";

export const EXPENSE_DEFAULT_ITEMS: { type: ExpenseType; names: string[] }[] = [
    {
        type: "General",
        names: ["Tea", "Porter", "Tempo", "Transport", "Vegetables", "Chicken", "Pulses", "Courier", "Cylinder"],
    },
    {
        type: "Operational",
        names: [
            "Electricity",
            "Internet",
            "Auditor fees",
            "BNI subscription",
            "Rotary subscription",
            "Office rent",
            "Godown rent",
            "Chamber",
            "Mobile expenses",
            "RO",
            "Washroom cleaning",
            "Corporation waste collection",
            "Marketing expenses",
            "Business trip expenses",
            "Machine service charges",
        ],
    },
];
