// src/lib/expenses/mockExpenses.ts
// Offline demo mode only: the same /expenses routes as the real backend, kept in localStorage,
// pre-filled with sample spending so the charts have something to show.
import {
    EXPENSE_DEFAULT_ITEMS,
    buildSampleExpenses,
    type ExpenseDTO,
    type ExpenseItemDTO,
    type ExpenseTotalDTO,
} from "@robago/shared";

const KEY = "robago_expenses_demo_v1";

interface Db {
    items: ExpenseItemDTO[];
    expenses: ExpenseDTO[];
}

function seed(): Db {
    const items: ExpenseItemDTO[] = EXPENSE_DEFAULT_ITEMS.flatMap(({ type, names }) =>
        names.map((name, i) => ({ id: `item-${type[0]}${i + 1}`, name, type, active: true })),
    );
    const expenses = buildSampleExpenses(items).map((e, i) => ({
        id: `exp-${i + 1}`,
        date: e.date,
        itemId: e.itemId,
        amount: e.amount,
        note: e.note,
    }));
    return { items, expenses };
}

function load(): Db {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw) as Db;
    } catch {
        // fall through
    }
    const db = seed();
    save(db);
    return db;
}
function save(db: Db) {
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
        // storage blocked/full — demo data just won't persist
    }
}

export type MockResult = { status: number; data?: unknown; error?: string };

export function handleExpenseMock(
    method: string,
    path: string,
    params: Record<string, string | undefined>,
    body: Record<string, unknown>,
): MockResult | null {
    if (path !== "/expenses" && !path.startsWith("/expenses/")) return null;
    const db = load();
    const rest = path.slice("/expenses".length).replace(/^\//, "");

    // ---- items
    if (rest === "items" && method === "GET") return { status: 200, data: db.items };
    if (rest === "items" && method === "POST") {
        const name = String(body.name ?? "").trim();
        const type = body.type as ExpenseItemDTO["type"];
        if (!name) return { status: 400, error: "Name is required" };
        if (db.items.some((i) => i.type === type && i.name.toLowerCase() === name.toLowerCase())) {
            return { status: 409, error: `"${name}" already exists under ${type} expenses` };
        }
        const item = { id: `item-${crypto.randomUUID().slice(0, 8)}`, name, type, active: true };
        db.items.push(item);
        save(db);
        return { status: 201, data: item };
    }
    if (rest.startsWith("items/")) {
        const id = rest.slice(6);
        const idx = db.items.findIndex((i) => i.id === id);
        const item = db.items[idx];
        if (!item) return { status: 404, error: "Item not found" };
        if (method === "PATCH") {
            const updated = {
                ...item,
                ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
                ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
            };
            db.items[idx] = updated;
            save(db);
            return { status: 200, data: updated };
        }
        if (method === "DELETE") {
            if (db.expenses.some((e) => e.itemId === id))
                return { status: 409, error: "This item has expenses recorded. Archive it instead of deleting." };
            db.items.splice(idx, 1);
            save(db);
            return { status: 204 };
        }
    }

    // ---- totals
    if (rest === "totals" && method === "GET") {
        const from = params.from ?? "";
        const to = params.to ?? "";
        const acc = new Map<string, ExpenseTotalDTO>();
        for (const e of db.expenses) {
            const month = e.date.slice(0, 7);
            if (month < from || month > to) continue;
            const k = `${month}|${e.itemId}`;
            const row = acc.get(k) ?? { month, itemId: e.itemId, total: 0 };
            row.total += e.amount;
            acc.set(k, row);
        }
        return { status: 200, data: [...acc.values()] };
    }

    // ---- entries
    if (rest === "" && method === "GET") {
        const month = params.month ?? "";
        return {
            status: 200,
            data: db.expenses.filter((e) => e.date.startsWith(month)).sort((a, b) => (a.date < b.date ? 1 : -1)),
        };
    }
    if (rest === "bulk" && method === "POST") {
        const list = (body.entries as { date: string; itemId: string; amount: number; note?: string }[]) ?? [];
        if (!list.length || list.some((e) => !(Number(e.amount) > 0)))
            return { status: 400, error: "Validation failed" };
        const created: ExpenseDTO[] = list.map((e) => ({
            id: `exp-${crypto.randomUUID().slice(0, 8)}`,
            date: String(e.date),
            itemId: String(e.itemId),
            amount: Number(e.amount),
            note: String(e.note ?? ""),
        }));
        db.expenses.push(...created);
        save(db);
        return { status: 201, data: created };
    }
    if (rest === "" && method === "POST") {
        const amount = Number(body.amount);
        if (!(amount > 0)) return { status: 400, error: "Amount must be more than 0" };
        const created: ExpenseDTO = {
            id: `exp-${crypto.randomUUID().slice(0, 8)}`,
            date: String(body.date),
            itemId: String(body.itemId),
            amount,
            note: String(body.note ?? ""),
        };
        db.expenses.push(created);
        save(db);
        return { status: 201, data: created };
    }
    const idx = db.expenses.findIndex((e) => e.id === rest);
    const current = db.expenses[idx];
    if (method === "PATCH") {
        if (!current) return { status: 404, error: "Expense not found" };
        const updated = { ...current, ...(body as Partial<ExpenseDTO>), id: current.id };
        db.expenses[idx] = updated;
        save(db);
        return { status: 200, data: updated };
    }
    if (method === "DELETE") {
        if (!current) return { status: 404, error: "Expense not found" };
        db.expenses.splice(idx, 1);
        save(db);
        return { status: 204 };
    }
    return { status: 404, error: "Not found" };
}
