// src/pages/expenses/AddExpenseDialog.tsx
// Three fast ways to record spending, one panel. The date applies to all of them; the last mode you
// used is remembered; every save can be undone.
import { useMemo, useState } from "react";
import { addDays, format, isSameMonth } from "date-fns";
import { LayoutGrid, ListChecks, Zap, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { rupees } from "@/lib/expenses/calc";
import { expenseActions, useExpenseItems } from "@/lib/expenses/store";
import { useExpenseUsage } from "@/lib/expenses/usage";
import { cn } from "@/lib/utils";
import DaySheetMode from "./add/DaySheetMode";
import QuickTypeMode from "./add/QuickTypeMode";
import TapMode from "./add/TapMode";
import type { SaveFn } from "./add/types";

type Mode = "type" | "tap" | "day";
const MODES: { id: Mode; label: string; hint: string; icon: LucideIcon }[] = [
    { id: "type", label: "Type", hint: "tea 120, porter 400", icon: Zap },
    { id: "tap", label: "Tap", hint: "big buttons", icon: LayoutGrid },
    { id: "day", label: "Whole day", hint: "fill a list", icon: ListChecks },
];
const MODE_KEY = "robago_expense_add_mode";

function savedMode(): Mode {
    try {
        const m = localStorage.getItem(MODE_KEY);
        if (m === "type" || m === "tap" || m === "day") return m;
    } catch {
        // storage blocked — fall back
    }
    return "type";
}

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    /** The month being viewed — new entries default into it. */
    month: Date;
}

export default function AddExpenseDialog({ open, onOpenChange, month }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && <Body onOpenChange={onOpenChange} month={month} />}
        </Dialog>
    );
}

function Body({ onOpenChange, month }: { onOpenChange: (o: boolean) => void; month: Date }) {
    const { data: allItems = [] } = useExpenseItems();
    const items = useMemo(() => allItems.filter((i) => i.active), [allItems]);
    const usage = useExpenseUsage();

    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");
    // Viewing another month? Default to that month's first day so entries land where you're looking.
    const [date, setDate] = useState(() => (isSameMonth(month, new Date()) ? today : format(month, "yyyy-MM-dd")));
    const [mode, setModeState] = useState<Mode>(savedMode);
    const [added, setAdded] = useState(0);

    const setMode = (m: Mode) => {
        setModeState(m);
        try {
            localStorage.setItem(MODE_KEY, m);
        } catch {
            // ignore
        }
    };

    const save: SaveFn = async (entries, label) => {
        try {
            const created = await expenseActions.addExpenses(entries);
            setAdded((n) => n + created.length);
            toast.success(`${label} · ${rupees(created.reduce((s, e) => s + e.amount, 0))}`, {
                action: {
                    label: "Undo",
                    onClick: () => {
                        created.forEach((e) => void expenseActions.deleteExpense(e));
                        setAdded((n) => Math.max(0, n - created.length));
                    },
                },
            });
            return true;
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save. Please try again."));
            return false;
        }
    };

    const common = { items, usage, date, save };
    return (
        <DialogContent
            className={cn(
                "flex max-h-[94dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl",
                // on a phone it slides up from the bottom like a sheet
                "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl",
            )}
        >
            <DialogHeader className="space-y-3 border-b px-5 pt-5 pb-4 text-left">
                <div className="flex items-start justify-between gap-3 pr-6">
                    <div>
                        <DialogTitle className="text-xl">Add expenses</DialogTitle>
                        <DialogDescription>
                            {added > 0 ? (
                                <b className="text-success">{added} added this session</b>
                            ) : (
                                "Pick the way that's quickest for you"
                            )}
                        </DialogDescription>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Date</span>
                    {[
                        ["Today", today],
                        ["Yesterday", yesterday],
                    ].map(([label, value]) => (
                        <button
                            key={label}
                            type="button"
                            aria-pressed={date === value}
                            onClick={() => setDate(value as string)}
                            className={cn(
                                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                                date === value
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "bg-card hover:border-primary/40",
                            )}
                        >
                            {label}
                        </button>
                    ))}
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => e.target.value && setDate(e.target.value)}
                        aria-label="Pick a date"
                        className={cn(
                            "h-8 rounded-full border bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                            date !== today && date !== yesterday && "border-primary",
                        )}
                    />
                </div>

                <div
                    className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/70 p-1"
                    role="tablist"
                    aria-label="How to add"
                >
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            role="tab"
                            aria-selected={mode === m.id}
                            onClick={() => setMode(m.id)}
                            className={cn(
                                "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition-all",
                                mode === m.id
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                                <m.icon className="size-4" />
                                {m.label}
                            </span>
                            <span className="hidden text-[11px] sm:block">{m.hint}</span>
                        </button>
                    ))}
                </div>
            </DialogHeader>

            <div className="scrollbar-thin min-h-[20rem] flex-1 overflow-y-auto px-5 py-4">
                {mode === "type" && <QuickTypeMode {...common} />}
                {mode === "tap" && <TapMode {...common} />}
                {mode === "day" && <DaySheetMode {...common} />}
            </div>

            <div className="flex items-center justify-between gap-2 border-t bg-background px-5 py-3">
                <p className="text-xs text-muted-foreground">Every save has an Undo.</p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Done
                </Button>
            </div>
        </DialogContent>
    );
}
