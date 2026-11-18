// src/expenseSample.ts
// Believable SAMPLE spending (six months ending "now") for trying the charts. Used by the
// optional `seed:expenses --sample` script and by the offline demo mode. Every row is tagged
// with the note "Sample" so it can never be mistaken for real entries.

// [every N days | "monthly", usual amount]
const PATTERNS: Record<string, { every: number | "monthly"; amount: number }> = {
    Tea: { every: 1, amount: 120 },
    Porter: { every: 3, amount: 400 },
    Tempo: { every: 6, amount: 1800 },
    Transport: { every: 4, amount: 900 },
    Vegetables: { every: 2, amount: 350 },
    Chicken: { every: 7, amount: 900 },
    Pulses: { every: 15, amount: 1500 },
    Courier: { every: 5, amount: 250 },
    Cylinder: { every: 20, amount: 1900 },
    Electricity: { every: "monthly", amount: 18500 },
    Internet: { every: "monthly", amount: 1180 },
    "Auditor fees": { every: "monthly", amount: 5000 },
    "BNI subscription": { every: "monthly", amount: 2500 },
    "Office rent": { every: "monthly", amount: 25000 },
    "Godown rent": { every: "monthly", amount: 32000 },
    "Mobile expenses": { every: "monthly", amount: 1800 },
    RO: { every: "monthly", amount: 450 },
    "Washroom cleaning": { every: "monthly", amount: 1500 },
    "Corporation waste collection": { every: "monthly", amount: 600 },
    "Marketing expenses": { every: "monthly", amount: 8000 },
    "Machine service charges": { every: 45, amount: 6500 },
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Small deterministic wobble (0.8–1.3×) so the sample doesn't look machine-made. */
const wobble = (seed: number) => 0.8 + ((((Math.sin(seed * 12.9898) * 43758.5453) % 1) + 1) % 1) * 0.5;

export interface SampleExpense {
    date: string;
    month: string;
    itemId: string;
    amount: number;
    note: string;
}

export function buildSampleExpenses(items: { id: string; name: string }[], now: Date = new Date()): SampleExpense[] {
    const out: SampleExpense[] = [];
    for (let back = 5; back >= 0; back--) {
        const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const lastDay = back === 0 ? now.getDate() : new Date(y, m + 1, 0).getDate();
        for (const item of items) {
            const p = PATTERNS[item.name];
            if (!p) continue;
            const every = p.every;
            const days =
                every === "monthly"
                    ? [1 + (item.name.length % 5)]
                    : Array.from({ length: Math.floor(lastDay / every) }, (_, i) => (i + 1) * every - (item.name.length % every));
            for (const day of days) {
                if (day < 1 || day > lastDay) continue;
                const amount = Math.round((p.amount * wobble(day + m * 31 + item.name.length)) / 10) * 10;
                out.push({ date: `${y}-${pad(m + 1)}-${pad(day)}`, month: `${y}-${pad(m + 1)}`, itemId: item.id, amount, note: "Sample" });
            }
        }
    }
    return out;
}
