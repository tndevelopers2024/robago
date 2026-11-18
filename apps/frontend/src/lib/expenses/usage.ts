// src/lib/expenses/usage.ts — what you spend on most, and the amounts you usually pay (last two months).
import { useMemo } from "react";
import { addMonths } from "date-fns";
import { monthKey } from "./calc";
import { useExpenses } from "./store";

export interface ItemUsage {
    /** How many times it was recorded recently. */
    count: number;
    /** Distinct recent amounts, newest first (max 3). */
    amounts: number[];
}

export function useExpenseUsage(): Map<string, ItemUsage> {
    const now = new Date();
    const cur = useExpenses(monthKey(now));
    const prev = useExpenses(monthKey(addMonths(now, -1)));
    return useMemo(() => {
        const all = [...(prev.data ?? []), ...(cur.data ?? [])].sort((a, b) =>
            a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
        );
        const usage = new Map<string, ItemUsage>();
        for (const e of all) {
            const u = usage.get(e.itemId) ?? { count: 0, amounts: [] };
            u.count++;
            u.amounts = [e.amount, ...u.amounts.filter((a) => a !== e.amount)].slice(0, 3); // newest first
            usage.set(e.itemId, u);
        }
        return usage;
    }, [cur.data, prev.data]);
}
