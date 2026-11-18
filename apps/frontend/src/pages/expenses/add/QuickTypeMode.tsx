// ⚡ Type: write what you spent like a message — "tea 120, porter 400, godown rent 32k" — and press Enter.
import { useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CornerDownLeft, Plus } from "lucide-react";
import { parseQuickEntries, type CreateExpenseInput, type ExpenseType } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { rupees, TYPE_COLOR, TYPES } from "@/lib/expenses/calc";
import { expenseActions } from "@/lib/expenses/store";
import type { ItemUsage } from "@/lib/expenses/usage";
import type { ExpenseItemDTO } from "@robago/shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { format, parseISO } from "date-fns";
import type { SaveFn } from "./types";

interface Props {
    items: ExpenseItemDTO[];
    usage: Map<string, ItemUsage>;
    date: string;
    save: SaveFn;
}

type Pick = { itemId?: string; type?: ExpenseType };
type Resolved =
    | {
          ok: true;
          name: string;
          amount: number;
          date: string;
          note: string;
          itemId?: string;
          newItem?: { name: string; type: ExpenseType };
      }
    | { ok: false; reason: string };

export default function QuickTypeMode({ items, usage, date, save }: Props) {
    const [text, setText] = useState("");
    const [picks, setPicks] = useState<Record<string, Pick>>({});
    const [busy, setBusy] = useState(false);
    const box = useRef<HTMLTextAreaElement>(null);

    const lines = useMemo(() => parseQuickEntries(text, items, date), [text, items, date]);
    const keyOf = (i: number, raw: string) => `${i}:${raw}`;

    const resolved: Resolved[] = lines.map((l, i) => {
        const pick = picks[keyOf(i, l.raw)];
        if (l.amount === null) return { ok: false, reason: "add an amount" };
        const base = { amount: l.amount, date: l.date, note: l.note };
        if (l.match.kind === "found") return { ok: true, name: l.match.item.name, itemId: l.match.item.id, ...base };
        if (l.match.kind === "ambiguous") {
            const chosen = l.match.options.find((o) => o.id === pick?.itemId);
            return chosen
                ? { ok: true, name: chosen.name, itemId: chosen.id, ...base }
                : { ok: false, reason: "which one?" };
        }
        if (l.match.kind === "new") {
            const type = pick?.type ?? "General";
            return { ok: true, name: l.match.name, newItem: { name: l.match.name, type }, ...base };
        }
        return { ok: false, reason: "which item?" };
    });
    const valid = resolved.filter((r): r is Extract<Resolved, { ok: true }> => r.ok);
    const total = valid.reduce((s, r) => s + r.amount, 0);
    const allGood = lines.length > 0 && valid.length === lines.length;

    const frequent = useMemo(
        () =>
            [...items]
                .filter((i) => (usage.get(i.id)?.count ?? 0) > 0)
                .sort((a, b) => (usage.get(b.id)?.count ?? 0) - (usage.get(a.id)?.count ?? 0))
                .slice(0, 8),
        [items, usage],
    );

    const submit = async () => {
        if (!allGood || busy) return;
        setBusy(true);
        try {
            // create any brand-new items first (one per distinct name + type)
            const created = new Map<string, string>();
            for (const r of valid) {
                if (!r.newItem) continue;
                const k = `${r.newItem.type}|${r.newItem.name.toLowerCase()}`;
                if (!created.has(k)) created.set(k, (await expenseActions.createItem(r.newItem)).id);
            }
            const entries: CreateExpenseInput[] = valid.map((r) => ({
                date: r.date,
                itemId: r.itemId ?? (created.get(`${r.newItem!.type}|${r.newItem!.name.toLowerCase()}`) as string),
                amount: r.amount,
                note: r.note || undefined,
            }));
            const label = valid.length === 1 ? `Added ${valid[0]!.name}` : `Added ${valid.length} expenses`;
            if (await save(entries, label)) {
                setText("");
                setPicks({});
                box.current?.focus();
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't add that item."));
        } finally {
            setBusy(false);
        }
    };

    const addWord = (name: string) => {
        setText((t) => (t.trim() && !/[,;\n]\s*$/.test(t) ? `${t.trimEnd()}, ` : t) + `${name.toLowerCase()} `);
        box.current?.focus();
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <textarea
                    ref={box}
                    autoFocus
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void submit();
                        }
                    }}
                    placeholder="tea 120, porter 400, tempo 1.8k"
                    aria-label="Type your expenses"
                    className="w-full resize-none rounded-2xl border bg-card px-4 py-3 pr-12 text-lg shadow-xs outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
                <CornerDownLeft className="pointer-events-none absolute top-3.5 right-4 size-5 text-muted-foreground/50" />
            </div>

            {!lines.length && (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        Write <b className="text-foreground">item and amount</b>, separate several with commas. Press{" "}
                        <kbd className="rounded border bg-muted px-1.5 text-xs">Enter</kbd> to save.
                    </p>
                    <ul className="grid gap-1 text-xs sm:grid-cols-2">
                        <li>
                            <code className="rounded bg-muted px-1.5 py-0.5">godown rent 32k</code> → ₹32,000
                        </li>
                        <li>
                            <code className="rounded bg-muted px-1.5 py-0.5">tea 120 yesterday</code> → yesterday's date
                        </li>
                        <li>
                            <code className="rounded bg-muted px-1.5 py-0.5">porter 400 12/11</code> → 12 November
                        </li>
                        <li>
                            <code className="rounded bg-muted px-1.5 py-0.5">veg 350 (for guests)</code> → with a note
                        </li>
                    </ul>
                    {frequent.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-xs font-medium">Your usual items — tap to add</p>
                            <div className="flex flex-wrap gap-1.5">
                                {frequent.map((i) => (
                                    <button
                                        key={i.id}
                                        type="button"
                                        onClick={() => addWord(i.name)}
                                        className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent/50"
                                    >
                                        <span
                                            className="size-2 rounded-full"
                                            style={{ background: TYPE_COLOR[i.type] }}
                                        />
                                        {i.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {lines.length > 0 && (
                <ul className="space-y-2">
                    {lines.map((l, i) => {
                        const r = resolved[i]!;
                        const k = keyOf(i, l.raw);
                        return (
                            <li
                                key={k}
                                className={cn(
                                    "rounded-xl border p-3 transition-colors",
                                    r.ok
                                        ? "bg-success-soft/40 border-success/20"
                                        : "bg-warning-soft/50 border-warning/25",
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className={cn(
                                            "grid size-6 shrink-0 place-items-center rounded-full",
                                            r.ok ? "bg-success text-white" : "bg-warning text-white",
                                        )}
                                    >
                                        {r.ok ? (
                                            <Check className="size-3.5" strokeWidth={3} />
                                        ) : (
                                            <AlertCircle className="size-3.5" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {r.ok ? r.name : l.raw}
                                            {r.ok && r.newItem && (
                                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                                                    new item
                                                </span>
                                            )}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {format(parseISO(l.date), "EEE, d MMM")}
                                            {l.note && ` · ${l.note}`}
                                            {!r.ok && <span className="font-medium text-warning"> · {r.reason}</span>}
                                        </p>
                                    </div>
                                    <b className="shrink-0 text-base tabular-nums">
                                        {l.amount !== null ? rupees(l.amount) : "—"}
                                    </b>
                                </div>

                                {l.match.kind === "ambiguous" && (
                                    <div className="mt-2 flex flex-wrap gap-1.5 pl-8.5">
                                        {l.match.options.map((o) => (
                                            <button
                                                key={o.id}
                                                type="button"
                                                onClick={() => setPicks((p) => ({ ...p, [k]: { itemId: o.id } }))}
                                                className={cn(
                                                    "rounded-full border px-3 py-1 text-sm",
                                                    picks[k]?.itemId === o.id
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "bg-card hover:border-primary/40",
                                                )}
                                            >
                                                {o.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {l.match.kind === "new" && (
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-8.5 text-xs text-muted-foreground">
                                        <Plus className="size-3.5" /> New item — add it under:
                                        {TYPES.map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setPicks((p) => ({ ...p, [k]: { type: t } }))}
                                                className={cn(
                                                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm",
                                                    (picks[k]?.type ?? "General") === t
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "bg-card text-foreground",
                                                )}
                                            >
                                                <span
                                                    className="size-2 rounded-full"
                                                    style={{ background: TYPE_COLOR[t] }}
                                                />
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {lines.length > 0 && (
                <Button
                    onClick={() => void submit()}
                    disabled={!allGood || busy}
                    className="h-11 w-full gap-2 text-base"
                >
                    {busy
                        ? "Saving…"
                        : allGood
                          ? `Add ${valid.length} ${valid.length === 1 ? "expense" : "expenses"} · ${rupees(total)}`
                          : `Fix ${lines.length - valid.length} line${lines.length - valid.length === 1 ? "" : "s"} to continue`}
                </Button>
            )}
        </div>
    );
}
