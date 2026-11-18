// src/lib/expenses/calc.ts — everything the expense charts and sheets derive from raw entries.
import { addMonths, format } from "date-fns";
import type { ExpenseDTO, ExpenseItemDTO, ExpenseTotalDTO, ExpenseType } from "@robago/shared";

export const monthKey = (d: Date) => format(d, "yyyy-MM");

/** `count` month keys ending at (and including) `end`, oldest first. */
export function monthRange(end: Date, count: number): string[] {
    return Array.from({ length: count }, (_, i) => monthKey(addMonths(end, i - (count - 1))));
}

export const TYPES: ExpenseType[] = ["General", "Operational"];

/** One colour per expense type, the same on every chart. */
export const TYPE_COLOR: Record<ExpenseType, string> = {
    General: "var(--viz-general)",
    Operational: "var(--viz-operational)",
};

/** Colours for the donut, strongest spender first. Past five, items fold into "Other". */
export const SLICE_COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)"];
export const OTHER_COLOR = "var(--viz-other)";

const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const rupees = (n: number) => `${n < 0 ? "-" : ""}₹${inrFmt.format(Math.abs(Math.round(n)))}`;

/** Axis-friendly: ₹950, ₹12K, ₹1.5L, ₹2Cr. */
export function compactRupees(n: number): string {
    const a = Math.abs(n);
    const trim = (v: number) => String(Math.round(v * 10) / 10).replace(/\.0$/, "");
    if (a >= 1e7) return `₹${trim(n / 1e7)}Cr`;
    if (a >= 1e5) return `₹${trim(n / 1e5)}L`;
    if (a >= 1e4) return `₹${trim(n / 1e3)}K`;
    return `₹${inrFmt.format(n)}`;
}

/** A tidy axis maximum and tick step for a chart whose largest value is `max`. */
export function niceScale(max: number, ticks = 4): { top: number; step: number } {
    if (max <= 0) return { top: 4, step: 1 };
    const raw = max / ticks;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    return { top: Math.ceil(max / step) * step, step };
}

export interface ItemSpend {
    item: ExpenseItemDTO;
    total: number;
    count: number;
}

/** Spending per item for a set of entries, biggest first (items with no spending are left out). */
export function spendByItem(entries: ExpenseDTO[], items: ExpenseItemDTO[]): ItemSpend[] {
    const byId = new Map(items.map((i) => [i.id, i]));
    const acc = new Map<string, ItemSpend>();
    for (const e of entries) {
        const item = byId.get(e.itemId);
        if (!item) continue;
        const row = acc.get(item.id) ?? { item, total: 0, count: 0 };
        row.total += e.amount;
        row.count += 1;
        acc.set(item.id, row);
    }
    return [...acc.values()].sort((a, b) => b.total - a.total);
}

export interface Slice {
    id: string;
    label: string;
    value: number;
    share: number; // 0–1
    color: string;
    /** For "Other": the items folded into it. */
    members?: ItemSpend[];
}

/** Top `max` items as slices; everything else folds into one grey "Other". */
export function toSlices(rows: ItemSpend[], max = 5): Slice[] {
    const total = rows.reduce((s, r) => s + r.total, 0);
    if (total <= 0) return [];
    const head = rows.slice(0, max);
    const tail = rows.slice(max);
    const slices: Slice[] = head.map((r, i) => ({
        id: r.item.id,
        label: r.item.name,
        value: r.total,
        share: r.total / total,
        color: SLICE_COLORS[i] ?? OTHER_COLOR,
    }));
    const rest = tail.reduce((s, r) => s + r.total, 0);
    if (rest > 0)
        slices.push({
            id: "other",
            label: `Other (${tail.length})`,
            value: rest,
            share: rest / total,
            color: OTHER_COLOR,
            members: tail,
        });
    return slices;
}

export function totalsByType(entries: ExpenseDTO[], items: ExpenseItemDTO[]): Record<ExpenseType, number> {
    const typeOf = new Map(items.map((i) => [i.id, i.type]));
    const out: Record<ExpenseType, number> = { General: 0, Operational: 0 };
    for (const e of entries) {
        const t = typeOf.get(e.itemId);
        if (t) out[t] += e.amount;
    }
    return out;
}

/** Month × type totals from the server's per-item monthly totals. */
export function monthlyByType(
    totals: ExpenseTotalDTO[],
    items: ExpenseItemDTO[],
    months: string[],
): { month: string; General: number; Operational: number }[] {
    const typeOf = new Map(items.map((i) => [i.id, i.type]));
    const acc = new Map(months.map((m) => [m, { month: m, General: 0, Operational: 0 }]));
    for (const t of totals) {
        const row = acc.get(t.month);
        const type = typeOf.get(t.itemId);
        if (row && type) row[type] += t.total;
    }
    return months.map((m) => acc.get(m) as { month: string; General: number; Operational: number });
}

export function dailyByType(
    entries: ExpenseDTO[],
    items: ExpenseItemDTO[],
    dayCount: number,
    month: string,
): { day: number; date: string; General: number; Operational: number }[] {
    const typeOf = new Map(items.map((i) => [i.id, i.type]));
    const rows = Array.from({ length: dayCount }, (_, i) => ({
        day: i + 1,
        date: `${month}-${String(i + 1).padStart(2, "0")}`,
        General: 0,
        Operational: 0,
    }));
    for (const e of entries) {
        const day = Number(e.date.slice(8, 10));
        const type = typeOf.get(e.itemId);
        const row = rows[day - 1];
        if (row && type) row[type] += e.amount;
    }
    return rows;
}

/** Percent change from `prev` to `curr`; null when there is nothing to compare with. */
export function pctChange(curr: number, prev: number): number | null {
    return prev > 0 ? ((curr - prev) / prev) * 100 : null;
}

/** "Rent is 41% of this month's spending"-style sentences, most notable first. */
export function buildInsights(args: {
    monthLabel: string;
    prevLabel: string;
    total: number;
    prevTotal: number;
    spend: ItemSpend[];
    prevSpend: Map<string, number>;
    typeTotals: Record<ExpenseType, number>;
}): string[] {
    const { monthLabel, prevLabel, total, prevTotal, spend, prevSpend, typeTotals } = args;
    const out: string[] = [];
    if (total <= 0) return out;
    const top = spend[0];
    if (top)
        out.push(
            `${top.item.name} is your biggest expense — ${rupees(top.total)}, ${Math.round((top.total / total) * 100)}% of ${monthLabel}.`,
        );
    const top3 = spend.slice(0, 3).reduce((s, r) => s + r.total, 0);
    if (spend.length > 3) out.push(`Your top 3 items make up ${Math.round((top3 / total) * 100)}% of all spending.`);
    const change = pctChange(total, prevTotal);
    if (change !== null && Math.abs(change) >= 1) {
        out.push(
            `Spending is ${change > 0 ? "up" : "down"} ${Math.abs(Math.round(change))}% on ${prevLabel} (${rupees(Math.abs(total - prevTotal))} ${change > 0 ? "more" : "less"}).`,
        );
    }
    let mover: { name: string; diff: number } | null = null;
    for (const r of spend) {
        const diff = r.total - (prevSpend.get(r.item.id) ?? 0);
        if (prevTotal > 0 && (!mover || Math.abs(diff) > Math.abs(mover.diff))) mover = { name: r.item.name, diff };
    }
    if (mover && Math.abs(mover.diff) >= total * 0.03)
        out.push(
            `Biggest change: ${mover.name} is ${mover.diff > 0 ? "up" : "down"} ${rupees(Math.abs(mover.diff))} vs ${prevLabel}.`,
        );
    const gShare = Math.round((typeTotals.General / total) * 100);
    out.push(`${gShare}% went on general expenses and ${100 - gShare}% on operational.`);
    return out;
}
