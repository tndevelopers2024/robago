// ☰ Whole day: your usual items in a list with an amount box each — fill what you spent, save all at once.
import { useMemo, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import type { CreateExpenseInput, ExpenseItemDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { rupees, TYPE_COLOR, TYPES } from "@/lib/expenses/calc";
import type { ItemUsage } from "@/lib/expenses/usage";
import { parseAmount } from "@/lib/staff/calc";
import type { SaveFn } from "./types";

interface Props {
    items: ExpenseItemDTO[];
    usage: Map<string, ItemUsage>;
    date: string;
    save: SaveFn;
}

export default function DaySheetMode({ items, usage, date, save }: Props) {
    const [showAll, setShowAll] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    const usual = useMemo(() => items.filter((i) => (usage.get(i.id)?.count ?? 0) > 0), [items, usage]);
    // Nothing recorded yet? Start with the general items so the list is never empty.
    const base = !showAll && usual.length > 0 ? usual : showAll ? items : items.filter((i) => i.type === "General");
    const rows = useMemo(
        () =>
            [...base].sort(
                (a, b) =>
                    TYPES.indexOf(a.type) - TYPES.indexOf(b.type) ||
                    (usage.get(b.id)?.count ?? 0) - (usage.get(a.id)?.count ?? 0),
            ),
        [base, usage],
    );

    const filled = rows
        .map((i) => ({ item: i, amount: parseAmount(values[i.id] ?? "") }))
        .filter((r): r is { item: ExpenseItemDTO; amount: number } => typeof r.amount === "number" && r.amount > 0);
    const total = filled.reduce((s, r) => s + r.amount, 0);

    const fillUsual = () =>
        setValues((v) => {
            const next = { ...v };
            for (const i of rows) if (!next[i.id]) next[i.id] = String(usage.get(i.id)?.amounts[0] ?? "") || "";
            return next;
        });

    const submit = async () => {
        if (!filled.length || busy) return;
        setBusy(true);
        const entries: CreateExpenseInput[] = filled.map((r) => ({ date, itemId: r.item.id, amount: r.amount }));
        const ok = await save(entries, `Added ${filled.length} ${filled.length === 1 ? "expense" : "expenses"}`);
        setBusy(false);
        if (ok) setValues({});
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Type an amount next to each thing you spent on.{" "}
                    <kbd className="rounded border bg-muted px-1.5 text-xs">Enter</kbd> moves to the next.
                </p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={fillUsual} className="gap-1.5">
                        <Wand2 className="size-3.5" /> Use usual amounts
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                        {showAll ? "Show usual only" : `Show all ${items.length}`}
                    </Button>
                </div>
            </div>

            <div className="divide-y rounded-2xl border bg-card">
                {rows.map((i, idx) => {
                    const head = idx === 0 || rows[idx - 1]?.type !== i.type;
                    const u = usage.get(i.id);
                    return (
                        <div key={i.id}>
                            {head && (
                                <p className="flex items-center gap-2 bg-muted/50 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                    <span className="size-2 rounded-full" style={{ background: TYPE_COLOR[i.type] }} />
                                    {i.type}
                                </p>
                            )}
                            <label className="flex items-center gap-3 px-4 py-2">
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.name}</span>
                                <span className="flex items-center gap-1 rounded-xl border bg-background px-3 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/30">
                                    <span className="text-sm text-muted-foreground">₹</span>
                                    <input
                                        ref={(el) => {
                                            refs.current[idx] = el;
                                        }}
                                        inputMode="decimal"
                                        value={values[i.id] ?? ""}
                                        placeholder={u?.amounts[0] ? String(u.amounts[0]) : "0"}
                                        onChange={(e) => setValues((v) => ({ ...v, [i.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                const next = refs.current[idx + 1];
                                                if (next) next.focus();
                                                else void submit();
                                            }
                                        }}
                                        className="h-10 w-28 bg-transparent text-right text-base font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/40"
                                    />
                                </span>
                            </label>
                        </div>
                    );
                })}
            </div>

            <Button onClick={() => void submit()} disabled={!filled.length || busy} className="h-11 w-full text-base">
                {busy
                    ? "Saving…"
                    : filled.length
                      ? `Save ${filled.length} ${filled.length === 1 ? "expense" : "expenses"} · ${rupees(total)}`
                      : "Fill in at least one amount"}
            </Button>
        </div>
    );
}
