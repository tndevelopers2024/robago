// src/lib/expenses/store.ts
// Expense data from the API via TanStack Query. Edits show instantly (optimistic) and are saved in
// the background; a failed save is undone by refetching, with a toast saying why.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
    CreateExpenseInput,
    CreateExpenseItemInput,
    ExpenseDTO,
    ExpenseItemDTO,
    UpdateExpenseInput,
    UpdateExpenseItemInput,
} from "@robago/shared";
import * as api from "@/api/expenses";
import queryClient from "@/lib/queryClient";
import { getErrorMessage } from "@/lib/errors";

export const expenseKeys = {
    all: ["expenses"] as const,
    items: () => ["expenses", "items"] as const,
    months: () => ["expenses", "month"] as const,
    month: (m: string) => ["expenses", "month", m] as const,
    totals: () => ["expenses", "totals"] as const,
    range: (from: string, to: string) => ["expenses", "totals", from, to] as const,
};

export function useExpenseItems() {
    return useQuery({ queryKey: expenseKeys.items(), queryFn: api.getItems });
}
export function useExpenses(month: string) {
    // Keep the previous month on screen (dimmed) while the next one loads — no skeleton flash.
    return useQuery({
        queryKey: expenseKeys.month(month),
        queryFn: () => api.getExpenses(month),
        placeholderData: keepPreviousData,
    });
}
export function useExpenseTotals(from: string, to: string) {
    return useQuery({
        queryKey: expenseKeys.range(from, to),
        queryFn: () => api.getTotals(from, to),
        placeholderData: keepPreviousData,
    });
}

const byDateDesc = (a: ExpenseDTO, b: ExpenseDTO) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1);
const refreshTotals = () => void queryClient.invalidateQueries({ queryKey: expenseKeys.totals() });

/** Put (or move) an entry into whichever month lists are loaded, and drop it from the others. */
function placeInCache(e: ExpenseDTO) {
    const month = e.date.slice(0, 7);
    for (const [key, data] of queryClient.getQueriesData<ExpenseDTO[]>({ queryKey: expenseKeys.months() })) {
        if (!data) continue;
        const keyMonth = key[2] as string;
        const without = data.filter((x) => x.id !== e.id);
        queryClient.setQueryData(key, keyMonth === month ? [...without, e].sort(byDateDesc) : without);
    }
}

function removeFromCache(id: string) {
    queryClient.setQueriesData<ExpenseDTO[]>({ queryKey: expenseKeys.months() }, (old) =>
        old?.filter((x) => x.id !== id),
    );
}

export const expenseActions = {
    async addExpense(input: CreateExpenseInput): Promise<ExpenseDTO> {
        const created = await api.createExpense(input);
        placeInCache(created);
        refreshTotals();
        return created;
    },

    /** Several entries in one request (quick-add panel). Returns what was created, so it can be undone. */
    async addExpenses(inputs: CreateExpenseInput[]): Promise<ExpenseDTO[]> {
        const created = await api.createExpensesBulk(inputs);
        created.forEach(placeInCache);
        refreshTotals();
        return created;
    },

    /** Inline edit from the sheet: applied at once, saved in the background. */
    async updateExpense(current: ExpenseDTO, patch: UpdateExpenseInput) {
        const next: ExpenseDTO = {
            ...current,
            ...(patch.date !== undefined ? { date: patch.date } : {}),
            ...(patch.itemId !== undefined ? { itemId: patch.itemId } : {}),
            ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
            ...(patch.note !== undefined ? { note: patch.note } : {}),
        };
        await queryClient.cancelQueries({ queryKey: expenseKeys.all });
        placeInCache(next);
        try {
            await api.updateExpense(current.id, patch);
            refreshTotals();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save that change. It was undone."));
            void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        }
    },

    async deleteExpense(e: ExpenseDTO) {
        await queryClient.cancelQueries({ queryKey: expenseKeys.all });
        removeFromCache(e.id);
        try {
            await api.deleteExpense(e.id);
            refreshTotals();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't delete that expense."));
            void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        }
    },

    async createItem(input: CreateExpenseItemInput): Promise<ExpenseItemDTO> {
        const created = await api.createItem(input);
        queryClient.setQueryData<ExpenseItemDTO[]>(expenseKeys.items(), (old) => [...(old ?? []), created]);
        return created;
    },

    async updateItem(id: string, patch: UpdateExpenseItemInput): Promise<ExpenseItemDTO> {
        const updated = await api.updateItem(id, patch);
        queryClient.setQueryData<ExpenseItemDTO[]>(expenseKeys.items(), (old) =>
            old?.map((i) => (i.id === id ? updated : i)),
        );
        return updated;
    },

    async deleteItem(id: string) {
        await api.deleteItem(id);
        queryClient.setQueryData<ExpenseItemDTO[]>(expenseKeys.items(), (old) => old?.filter((i) => i.id !== id));
    },
};
