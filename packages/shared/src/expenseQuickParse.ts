// src/expenseQuickParse.ts
//
// Turns a line of plain text into expense entries so they can be typed as fast as a chat message:
//     "tea 120, porter 400, godown rent 32k, tempo 1.8k yesterday"
// Lives in the shared package so the rules are tested in one place and behave the same everywhere.
import type { ExpenseType } from "./enums.js";

export interface QuickItem {
    id: string;
    name: string;
    type: ExpenseType;
    active: boolean;
}

export type QuickMatch =
    | { kind: "found"; item: QuickItem; exact: boolean }
    /** Several items fit (e.g. "rent" → Office rent / Godown rent): the person picks. */
    | { kind: "ambiguous"; options: QuickItem[] }
    /** Nothing fits: offer to create a new item with this name. */
    | { kind: "new"; name: string }
    | { kind: "empty" };

export interface QuickLine {
    raw: string;
    /** null when no amount was written. */
    amount: number | null;
    match: QuickMatch;
    /** YYYY-MM-DD — today's/base date unless the line says "yesterday" or a date like 12/11. */
    date: string;
    note: string;
}

const norm = (s: string) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

function levenshtein(a: string, b: string): number {
    const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0] as number;
        prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j] as number;
            prev[j] = Math.min((prev[j] as number) + 1, (prev[j - 1] as number) + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prev[b.length] as number;
}

/** Finds the item a few typed words most likely mean. */
export function matchItem(text: string, items: QuickItem[]): QuickMatch {
    const q = norm(text);
    if (!q) return { kind: "empty" };
    const pool = items.filter((i) => i.active);

    const exact = pool.filter((i) => norm(i.name) === q);
    if (exact.length === 1) return { kind: "found", item: exact[0] as QuickItem, exact: true };
    if (exact.length > 1) return { kind: "ambiguous", options: exact };

    // From most to least specific; the first tier with any hit decides.
    const tiers: ((i: QuickItem) => boolean)[] = [
        (i) => norm(i.name).startsWith(q), // "veg" → Vegetables
        (i) => norm(i.name).length >= 3 && q.startsWith(norm(i.name)), // "tea stall" → Tea
        (i) => norm(i.name).split(" ").some((w) => w.startsWith(q)), // "rent" → Office rent, Godown rent
        (i) => norm(i.name).includes(q),
    ];
    for (const tier of tiers) {
        const hits = pool.filter(tier);
        if (hits.length === 1) return { kind: "found", item: hits[0] as QuickItem, exact: false };
        if (hits.length > 1) return { kind: "ambiguous", options: hits.slice(0, 6) };
    }

    // Typos: "tempoo" → Tempo, "vegtables" → Vegetables.
    if (q.length >= 4) {
        const limit = Math.max(1, Math.floor(q.length / 4));
        const scored = pool
            .map((item) => ({ item, d: levenshtein(norm(item.name), q) }))
            .filter((s) => s.d <= limit)
            .sort((a, b) => a.d - b.d);
        const best = scored[0];
        if (best && scored.filter((s) => s.d === best.d).length === 1) return { kind: "found", item: best.item, exact: false };
    }
    return { kind: "new", name: text.trim().replace(/\s+/g, " ") };
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** A real calendar date or null (rejects 31/2). */
function makeDate(y: number, m: number, d: number): string | null {
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? iso(dt) : null;
}

const AMOUNT = /^(?:₹|rs\.?|inr)?(\d[\d,]*(?:\.\d+)?)(k)?$/i;
const SLASH_DATE = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/;

/**
 * Parse free text into entries. Lines are separated by commas, semicolons or new lines.
 * `baseDate` is the date to use when a line doesn't say otherwise.
 */
export function parseQuickEntries(text: string, items: QuickItem[], baseDate: string, today: Date = new Date()): QuickLine[] {
    const out: QuickLine[] = [];
    // "1,800" and "1,23,456" are one number, not two entries: drop thousands commas before splitting on commas.
    let flat = text;
    while (/(\d),(\d{2,3})(?!\d)/.test(flat)) flat = flat.replace(/(\d),(\d{2,3})(?!\d)/g, "$1$2");
    for (const raw of flat.split(/[,;\n]+/)) {
        let seg = raw.trim();
        if (!seg) continue;

        // (note in brackets)
        let note = "";
        seg = seg.replace(/\(([^)]*)\)/g, (_, n: string) => {
            note = n.trim();
            return " ";
        });

        let date = baseDate;
        const words: string[] = [];
        const tokens = seg.split(/\s+/).filter(Boolean);

        // dates
        const rest: string[] = [];
        for (const t of tokens) {
            const low = t.toLowerCase();
            const slash = low.match(SLASH_DATE);
            if (low === "today") date = iso(today);
            else if (low === "yesterday" || low === "yday" || low === "yd") {
                const y = new Date(today);
                y.setDate(y.getDate() - 1);
                date = iso(y);
            } else if (slash) {
                let year = slash[3] ? Number(slash[3]) : today.getFullYear();
                if (year < 100) year += 2000;
                date = makeDate(year, Number(slash[2]), Number(slash[1])) ?? date;
            } else rest.push(t);
        }

        // amount = the LAST number-looking token
        let amount: number | null = null;
        let amountAt = -1;
        rest.forEach((t, i) => {
            const m = t.match(AMOUNT);
            if (m) {
                amount = Number((m[1] as string).replace(/,/g, "")) * (m[2] ? 1000 : 1);
                amountAt = i;
            }
        });
        rest.forEach((t, i) => i !== amountAt && words.push(t));

        out.push({
            raw: raw.trim(),
            amount: amount !== null && amount > 0 ? Math.round((amount as number) * 100) / 100 : null,
            match: matchItem(words.join(" "), items),
            date,
            note,
        });
    }
    return out;
}
