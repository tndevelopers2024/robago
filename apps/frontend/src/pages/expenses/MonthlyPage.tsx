// src/pages/expenses/MonthlyPage.tsx — every item against every month of the year, Excel-style.
import { useMemo, useState } from "react";
import { addYears } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SheetGrid, { type SheetColumn } from "@/components/sheet/SheetGrid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { rupees, TYPE_COLOR } from "@/lib/expenses/calc";
import { useExpenseItems, useExpenseTotals } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";
import { useExpensesContext } from "./expensesContext";
import type { ExpenseItemDTO } from "@robago/shared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Row {
    item: ExpenseItemDTO;
    /** 12 values, Jan → Dec. */
    months: number[];
    total: number;
}

export default function MonthlyPage() {
    const { month, setMonth } = useExpensesContext();
    const year = month.getFullYear();
    const itemsQ = useExpenseItems();
    const totalsQ = useExpenseTotals(`${year}-01`, `${year}-12`);
    const [hideEmpty, setHideEmpty] = useState(true);

    const rows = useMemo<Row[]>(() => {
        const per = new Map<string, number[]>();
        for (const t of totalsQ.data ?? []) {
            const arr = per.get(t.itemId) ?? Array<number>(12).fill(0);
            arr[Number(t.month.slice(5, 7)) - 1] = t.total;
            per.set(t.itemId, arr);
        }
        return (itemsQ.data ?? [])
            .map((item) => {
                const months = per.get(item.id) ?? Array<number>(12).fill(0);
                return { item, months, total: months.reduce((s, v) => s + v, 0) };
            })
            .filter((r) => (r.item.active || r.total > 0) && (!hideEmpty || r.total > 0))
            .sort((a, b) => (a.item.type === b.item.type ? 0 : a.item.type === "General" ? -1 : 1));
    }, [itemsQ.data, totalsQ.data, hideEmpty]);

    const maxCell = Math.max(1, ...rows.flatMap((r) => r.months));
    const grand = rows.reduce((s, r) => s + r.total, 0);
    const byType = (t: ExpenseItemDTO["type"]) =>
        rows.filter((r) => r.item.type === t).reduce((s, r) => s + r.total, 0);

    const columns = useMemo<SheetColumn<Row>[]>(
        () => [
            {
                id: "item",
                label: "Item",
                header: "Item",
                width: 220,
                sticky: true,
                getValue: (r) => r.item.name,
                render: (r) => (
                    <span className="flex items-center gap-2">
                        <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: TYPE_COLOR[r.item.type] }}
                        />
                        <span
                            className={cn(
                                "truncate font-semibold",
                                !r.item.active && "text-muted-foreground line-through",
                            )}
                        >
                            {r.item.name}
                        </span>
                    </span>
                ),
                footer: () => <span className="text-muted-foreground">Total</span>,
            },
            {
                id: "type",
                label: "Type",
                header: "Type",
                width: 112,
                getValue: (r) => r.item.type,
                render: (r) => <span className="text-xs text-muted-foreground">{r.item.type}</span>,
            },
            ...MONTHS.map((name, i): SheetColumn<Row> => ({
                id: `m${i}`,
                label: `${name} ${year}`,
                header: name,
                subHeader: String(year),
                width: 96,
                align: "right",
                getValue: (r) => r.months[i] || null,
                render: (r) => (r.months[i] ? <span>{rupees(r.months[i] ?? 0)}</span> : null),
                // One-hue wash: the darker the cell, the more money went there.
                cellClassName: (r) => {
                    const v = (r.months[i] ?? 0) / maxCell;
                    return v > 0.6
                        ? "bg-primary/25"
                        : v > 0.3
                          ? "bg-primary/15"
                          : v > 0.1
                            ? "bg-primary/10"
                            : v > 0
                              ? "bg-primary/5"
                              : undefined;
                },
                footer: (rs) => {
                    const s = rs.reduce((a, r) => a + (r.months[i] ?? 0), 0);
                    return s ? rupees(s) : "";
                },
            })),
            {
                id: "total",
                label: "Year total",
                header: "Year total",
                width: 130,
                align: "right",
                getValue: (r) => r.total,
                render: (r) => <span className="font-bold">{rupees(r.total)}</span>,
                cellClassName: () => "bg-muted/60",
                footer: (rs) => rupees(rs.reduce((s, r) => s + r.total, 0)),
            },
        ],
        [year, maxCell],
    );

    if (itemsQ.isPending || totalsQ.isPending) return <Skeleton className="h-[28rem] w-full rounded-2xl" />;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-xl border bg-card p-1 shadow-xs">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Previous year"
                        onClick={() => setMonth(addYears(month, -1))}
                    >
                        <ChevronLeft />
                    </Button>
                    <span className="font-heading min-w-16 text-center text-base font-semibold tabular-nums">
                        {year}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Next year"
                        onClick={() => setMonth(addYears(month, 1))}
                    >
                        <ChevronRight />
                    </Button>
                </div>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border bg-card px-3 text-sm shadow-xs">
                    <input
                        type="checkbox"
                        checked={hideEmpty}
                        onChange={(e) => setHideEmpty(e.target.checked)}
                        className="size-4 accent-[var(--primary)]"
                    />
                    <span className="whitespace-nowrap text-muted-foreground">Hide items with no spending</span>
                </label>
                <p className="ml-auto text-sm text-muted-foreground">
                    General <b className="text-foreground">{rupees(byType("General"))}</b> · Operational{" "}
                    <b className="text-foreground">{rupees(byType("Operational"))}</b> · {year} total{" "}
                    <b className="text-foreground">{rupees(grand)}</b>
                </p>
            </div>
            <div
                className={cn(
                    "transition-opacity duration-200",
                    totalsQ.isPlaceholderData && "pointer-events-none opacity-60",
                )}
            >
                <SheetGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(r) => r.item.id}
                    formatStat={rupees}
                    emptyMessage={`No spending recorded in ${year}.`}
                    heightClass="max-h-[min(76dvh,64rem)]"
                />
            </div>
        </div>
    );
}
