// src/pages/expenses/EntriesPage.tsx — every expense of the month in an Excel-style sheet you can edit in place.
import { useMemo, useState } from "react";
import { format, getDaysInMonth, parseISO } from "date-fns";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ExpenseDTO, ExpenseItemDTO, ExpenseType } from "@robago/shared";
import SheetGrid, { type CellEdit, type SheetColumn } from "@/components/sheet/SheetGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { monthKey, rupees, TYPE_COLOR, TYPES } from "@/lib/expenses/calc";
import { expenseActions, useExpenseItems, useExpenses } from "@/lib/expenses/store";
import { parseAmount } from "@/lib/staff/calc";
import { cn } from "@/lib/utils";
import { useExpensesContext } from "./expensesContext";

interface Row {
    e: ExpenseDTO;
    item?: ExpenseItemDTO;
}

/** Accepts 2026-11-08, 8/11/2026, 8-11, or just a day number (inside the month being viewed). */
function parseDateInput(text: string, month: Date): string | null {
    const t = text.trim();
    let y = month.getFullYear();
    let m = month.getMonth() + 1;
    let d: number;
    let match: RegExpMatchArray | null;
    if ((match = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))
        [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    else if ((match = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)))
        [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    else if ((match = t.match(/^(\d{1,2})[/-](\d{1,2})$/))) [d, m] = [Number(match[1]), Number(match[2])];
    else if ((match = t.match(/^(\d{1,2})$/))) d = Number(match[1]);
    else return null;
    if (m < 1 || m > 12 || d < 1 || d > getDaysInMonth(new Date(y, m - 1, 1))) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function EntriesPage() {
    const { month, openAdd } = useExpensesContext();
    const itemsQ = useExpenseItems();
    const entriesQ = useExpenses(monthKey(month));
    const [type, setType] = useState<"All" | ExpenseType>("All");
    const [query, setQuery] = useState("");

    const items = itemsQ.data;
    const rows = useMemo<Row[]>(() => {
        const byId = new Map((items ?? []).map((i) => [i.id, i]));
        const q = query.trim().toLowerCase();
        return (entriesQ.data ?? [])
            .map((e) => ({ e, item: byId.get(e.itemId) }))
            .filter(
                (r) =>
                    (type === "All" || r.item?.type === type) &&
                    (!q || `${r.item?.name} ${r.e.note}`.toLowerCase().includes(q)),
            );
    }, [entriesQ.data, items, type, query]);
    const total = rows.reduce((s, r) => s + r.e.amount, 0);

    const columns = useMemo<SheetColumn<Row>[]>(
        () => [
            {
                id: "date",
                label: "Date",
                header: "Date",
                subHeader: "click · type to edit",
                width: 150,
                sticky: true,
                editable: true,
                getValue: (r) => r.e.date,
                render: (r) => <span className="font-medium">{format(parseISO(r.e.date), "EEE, d MMM")}</span>,
                footer: (rs) => <span className="text-muted-foreground">Total · {rs.length} entries</span>,
            },
            {
                id: "type",
                label: "Type",
                header: "Type",
                width: 120,
                getValue: (r) => r.item?.type ?? "",
                render: (r) =>
                    r.item ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className="size-2 rounded-full" style={{ background: TYPE_COLOR[r.item.type] }} />
                            {r.item.type}
                        </span>
                    ) : null,
            },
            {
                id: "item",
                label: "Item",
                header: "Item",
                width: 220,
                editable: true,
                getValue: (r) => r.item?.name ?? "(removed item)",
                render: (r) => <span className="font-semibold">{r.item?.name ?? "(removed item)"}</span>,
            },
            {
                id: "amount",
                label: "Amount",
                header: "Amount",
                width: 140,
                align: "right",
                editable: true,
                getValue: (r) => r.e.amount,
                render: (r) => <span className="font-semibold">{rupees(r.e.amount)}</span>,
                footer: (rs) => rupees(rs.reduce((s, r) => s + r.e.amount, 0)),
            },
            {
                id: "note",
                label: "Note",
                header: "Note",
                width: 280,
                editable: true,
                getValue: (r) => r.e.note,
                render: (r) => <span className="text-muted-foreground">{r.e.note}</span>,
            },
            {
                id: "delete",
                label: "",
                header: "",
                width: 64,
                align: "center",
                getValue: () => null,
                render: (r) => (
                    <button
                        type="button"
                        aria-label="Delete expense"
                        onMouseDown={(ev) => ev.stopPropagation()}
                        onClick={() => {
                            void expenseActions.deleteExpense(r.e);
                            toast(`Deleted ${rupees(r.e.amount)} · ${r.item?.name ?? "expense"}`, {
                                action: {
                                    label: "Undo",
                                    onClick: () =>
                                        void expenseActions.addExpense({
                                            date: r.e.date,
                                            itemId: r.e.itemId,
                                            amount: r.e.amount,
                                            note: r.e.note || undefined,
                                        }),
                                },
                            });
                        }}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-destructive"
                    >
                        <Trash2 className="size-4" />
                    </button>
                ),
            },
        ],
        [],
    );

    const handleEdit = (edits: CellEdit<Row>[]) => {
        for (const { row, colId, text } of edits) {
            if (colId === "date") {
                const iso = parseDateInput(text, month);
                if (iso) void expenseActions.updateExpense(row.e, { date: iso });
                else toast.error("Use a date like 8/11/2026, 2026-11-08, or just the day number.");
            } else if (colId === "amount") {
                const n = parseAmount(text);
                if (n && n > 0) void expenseActions.updateExpense(row.e, { amount: n });
                else toast.error("Amount must be a number greater than 0.");
            } else if (colId === "item") {
                const wanted = text.trim().toLowerCase();
                const found = (items ?? []).find((i) => i.name.toLowerCase() === wanted);
                if (found) void expenseActions.updateExpense(row.e, { itemId: found.id });
                else
                    toast.error(
                        `No item called "${text.trim()}". Add it with “Add expense” or on the Items page first.`,
                    );
            } else if (colId === "note") {
                void expenseActions.updateExpense(row.e, { note: text.trim() });
            }
        }
    };

    if (itemsQ.isPending || entriesQ.isPending) return <Skeleton className="h-[28rem] w-full rounded-2xl" />;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <div
                    className="flex rounded-xl border bg-card p-1 shadow-xs"
                    role="group"
                    aria-label="Expense type filter"
                >
                    {(["All", ...TYPES] as const).map((f) => (
                        <button
                            key={f}
                            aria-pressed={type === f}
                            onClick={() => setType(f)}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                                type === f
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {f !== "All" && (
                                <span className="size-2 rounded-full" style={{ background: TYPE_COLOR[f] }} />
                            )}
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search item or note…"
                        className="h-10 rounded-xl bg-card pl-9"
                    />
                </div>
                <p className="ml-auto text-sm text-muted-foreground">
                    {rows.length} {rows.length === 1 ? "entry" : "entries"} ·{" "}
                    <b className="text-foreground">{rupees(total)}</b>
                </p>
            </div>

            <div
                className={cn(
                    "transition-opacity duration-200",
                    entriesQ.isPlaceholderData && "pointer-events-none opacity-60",
                )}
            >
                <SheetGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(r) => r.e.id}
                    onEdit={handleEdit}
                    formatStat={rupees}
                    emptyMessage={
                        <span className="inline-flex flex-col items-center gap-3">
                            No expenses match.
                            <Button size="sm" onClick={openAdd} className="gap-1.5">
                                <Plus /> Add expense
                            </Button>
                        </span>
                    }
                />
            </div>
        </div>
    );
}
