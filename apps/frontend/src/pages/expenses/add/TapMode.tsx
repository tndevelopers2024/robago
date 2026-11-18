// ▦ Tap: big buttons for what you buy most; one tap on a usual amount saves it, or use the keypad.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Delete, Search } from "lucide-react";
import type { ExpenseItemDTO, ExpenseType } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { rupees, TYPE_COLOR, TYPES } from "@/lib/expenses/calc";
import type { ItemUsage } from "@/lib/expenses/usage";
import { cn } from "@/lib/utils";
import type { SaveFn } from "./types";

interface Props {
    items: ExpenseItemDTO[];
    usage: Map<string, ItemUsage>;
    date: string;
    save: SaveFn;
}

const PRESETS = [50, 100, 200, 500, 1000];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"];

export default function TapMode({ items, usage, date, save }: Props) {
    const [type, setType] = useState<"All" | ExpenseType>("All");
    const [query, setQuery] = useState("");
    const [picked, setPicked] = useState<ExpenseItemDTO | null>(null);
    const [amount, setAmount] = useState("");
    const [busy, setBusy] = useState(false);
    const [justSaved, setJustSaved] = useState<string | null>(null);
    const pad = useRef<HTMLDivElement>(null);

    const tiles = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items
            .filter((i) => (type === "All" || i.type === type) && (!q || i.name.toLowerCase().includes(q)))
            .sort((a, b) => (usage.get(b.id)?.count ?? 0) - (usage.get(a.id)?.count ?? 0));
    }, [items, type, query, usage]);

    useEffect(() => {
        if (picked) pad.current?.focus();
    }, [picked]);

    const commit = async (item: ExpenseItemDTO, value: number) => {
        if (!(value > 0) || busy) return;
        setBusy(true);
        const ok = await save([{ date, itemId: item.id, amount: value }], `Added ${item.name}`);
        setBusy(false);
        if (ok) {
            setJustSaved(item.id);
            setTimeout(() => setJustSaved(null), 1400);
            setPicked(null);
            setAmount("");
        }
    };

    const press = (k: string) => {
        if (k === "⌫") setAmount((a) => a.slice(0, -1));
        else if (amount.length < 9) setAmount((a) => (a === "" && (k === "0" || k === "00") ? "" : a + k));
    };

    if (picked) {
        const u = usage.get(picked.id);
        const value = Number(amount) || 0;
        return (
            <div
                ref={pad}
                tabIndex={-1}
                className="space-y-4 outline-none"
                onKeyDown={(e) => {
                    if (/^\d$/.test(e.key)) press(e.key);
                    else if (e.key === "Backspace") press("⌫");
                    else if (e.key === "Enter") void commit(picked, value);
                    else if (e.key === "Escape") {
                        e.stopPropagation();
                        setPicked(null);
                        setAmount("");
                    }
                }}
            >
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Back to items"
                        onClick={() => {
                            setPicked(null);
                            setAmount("");
                        }}
                    >
                        <ArrowLeft />
                    </Button>
                    <div>
                        <p className="flex items-center gap-2 text-lg font-semibold">
                            <span className="size-2.5 rounded-full" style={{ background: TYPE_COLOR[picked.type] }} />
                            {picked.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{picked.type} expense</p>
                    </div>
                </div>

                {u && u.amounts.length > 0 && (
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                            Tap a usual amount to save it right away
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {u.amounts.map((a) => (
                                <button
                                    key={a}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void commit(picked, a)}
                                    className="rounded-2xl border-2 border-primary/30 bg-accent/60 px-5 py-2.5 text-lg font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
                                >
                                    {rupees(a)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl bg-muted/60 px-4 py-3 text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p
                        className={cn(
                            "text-4xl font-semibold tracking-tight tabular-nums",
                            !value && "text-muted-foreground/40",
                        )}
                    >
                        {value ? rupees(value) : "₹0"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setAmount(String(p))}
                            className="rounded-full border bg-card px-3 py-1 text-sm hover:border-primary/40"
                        >
                            {rupees(p)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {KEYS.map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => press(k)}
                            aria-label={k === "⌫" ? "Backspace" : k}
                            className="grid h-14 place-items-center rounded-2xl border bg-card text-2xl font-medium transition-all hover:bg-muted active:scale-95"
                        >
                            {k === "⌫" ? <Delete className="size-6" /> : k}
                        </button>
                    ))}
                </div>

                <Button
                    onClick={() => void commit(picked, value)}
                    disabled={!value || busy}
                    className="h-12 w-full text-base"
                >
                    {busy ? "Saving…" : value ? `Add ${rupees(value)} · ${picked.name}` : "Enter an amount"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border p-0.5" role="group" aria-label="Type">
                    {(["All", ...TYPES] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            aria-pressed={type === t}
                            onClick={() => setType(t)}
                            className={cn(
                                "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
                                type === t
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Find an item…"
                        className="h-9 w-full rounded-xl border bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tiles.map((i) => {
                    const u = usage.get(i.id);
                    const saved = justSaved === i.id;
                    return (
                        <button
                            key={i.id}
                            type="button"
                            onClick={() => setPicked(i)}
                            className={cn(
                                "group relative flex min-h-20 flex-col justify-between rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.97]",
                                saved && "border-success bg-success-soft",
                            )}
                        >
                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="size-2 rounded-full" style={{ background: TYPE_COLOR[i.type] }} />
                                {saved ? "Saved ✓" : i.type}
                            </span>
                            <span className="mt-1 text-sm leading-tight font-semibold">{i.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                                {u?.amounts[0] ? `usually ${rupees(u.amounts[0])}` : " "}
                            </span>
                        </button>
                    );
                })}
                {tiles.length === 0 && (
                    <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                        No item matches — try the ⚡ Type tab to add a new one.
                    </p>
                )}
            </div>
        </div>
    );
}
