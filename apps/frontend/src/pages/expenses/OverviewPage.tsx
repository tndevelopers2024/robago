// src/pages/expenses/OverviewPage.tsx — "where did my money go this month?"
import { useMemo, useState, type ReactNode } from "react";
import { addMonths, format, getDaysInMonth, isSameMonth } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Lightbulb, Plus, ReceiptText } from "lucide-react";
import type { ExpenseDTO, ExpenseItemDTO, ExpenseType } from "@robago/shared";
import ChartCard from "@/components/charts/ChartCard";
import DonutChart from "@/components/charts/DonutChart";
import RankedBars from "@/components/charts/RankedBars";
import StackedColumns, { SeriesLegend, type ColumnDatum, type ColumnSeries } from "@/components/charts/StackedColumns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    buildInsights,
    dailyByType,
    monthKey,
    monthlyByType,
    monthRange,
    pctChange,
    rupees,
    spendByItem,
    toSlices,
    totalsByType,
    TYPE_COLOR,
    TYPES,
} from "@/lib/expenses/calc";
import { useExpenseItems, useExpenses, useExpenseTotals } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";
import { useExpensesContext } from "./expensesContext";

const NO_ITEMS: ExpenseItemDTO[] = [];
const NO_ENTRIES: ExpenseDTO[] = [];
type Filter = "All" | ExpenseType;

export default function OverviewPage() {
    const { month, setMonth, openAdd } = useExpensesContext();
    const monthStr = monthKey(month);
    const prevDate = addMonths(month, -1);
    const prevStr = monthKey(prevDate);
    const months = useMemo(() => monthRange(month, 6), [month]);

    const itemsQ = useExpenseItems();
    const entriesQ = useExpenses(monthStr);
    const totalsQ = useExpenseTotals(months[0] as string, months[5] as string);
    const items = itemsQ.data ?? NO_ITEMS;
    const entries = entriesQ.data ?? NO_ENTRIES;

    const [filter, setFilter] = useState<Filter>("All");
    const [active, setActive] = useState<string | null>(null);

    const monthLabel = format(month, "MMMM yyyy");
    const prevLabel = format(prevDate, "MMMM");
    const isCurrent = isSameMonth(month, new Date());
    const dayCount = getDaysInMonth(month);

    const typeOf = useMemo(() => new Map(items.map((i) => [i.id, i.type])), [items]);
    const total = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);
    const byType = useMemo(() => totalsByType(entries, items), [entries, items]);
    const trend = useMemo(() => monthlyByType(totalsQ.data ?? [], items, months), [totalsQ.data, items, months]);
    const prevRow = trend.find((t) => t.month === prevStr);
    const prevTotal = prevRow ? prevRow.General + prevRow.Operational : 0;
    const prevSpend = useMemo(() => {
        const m = new Map<string, number>();
        for (const t of totalsQ.data ?? []) if (t.month === prevStr) m.set(t.itemId, t.total);
        return m;
    }, [totalsQ.data, prevStr]);

    // Everything below the filter row follows the filter.
    const filtered = useMemo(
        () => (filter === "All" ? entries : entries.filter((e) => typeOf.get(e.itemId) === filter)),
        [entries, filter, typeOf],
    );
    const spend = useMemo(() => spendByItem(filtered, items), [filtered, items]);
    const filteredTotal = spend.reduce((s, r) => s + r.total, 0);
    const slices = useMemo(() => toSlices(spend, 5), [spend]);
    const series: ColumnSeries[] = TYPES.filter((t) => filter === "All" || filter === t).map((t) => ({
        id: t,
        label: t,
        color: TYPE_COLOR[t],
    }));

    const dailyData: ColumnDatum[] = useMemo(
        () =>
            dailyByType(filtered, items, dayCount, monthStr).map((d) => ({
                key: d.date,
                label: d.day === 1 || d.day % 5 === 0 ? String(d.day) : "",
                title: format(new Date(`${d.date}T00:00:00`), "EEE, d MMM"),
                values: { General: d.General, Operational: d.Operational },
            })),
        [filtered, items, dayCount, monthStr],
    );
    const trendData: ColumnDatum[] = trend.map((t) => ({
        key: t.month,
        label: format(new Date(`${t.month}-01T00:00:00`), "MMM"),
        title: format(new Date(`${t.month}-01T00:00:00`), "MMMM yyyy"),
        values: { General: t.General, Operational: t.Operational },
    }));

    const insights = useMemo(
        () =>
            buildInsights({
                monthLabel,
                prevLabel,
                total,
                prevTotal,
                spend: spendByItem(entries, items),
                prevSpend,
                typeTotals: byType,
            }),
        [monthLabel, prevLabel, total, prevTotal, entries, items, prevSpend, byType],
    );

    if (itemsQ.isPending || entriesQ.isPending) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
        );
    }
    if (itemsQ.error || entriesQ.error) {
        return (
            <div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
                <p className="font-medium">
                    Couldn't load expenses. Check that the backend is running, then try again.
                </p>
                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                        void itemsQ.refetch();
                        void entriesQ.refetch();
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    }
    if (entries.length === 0) {
        return (
            <div className="grid place-items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <ReceiptText className="size-7" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">No expenses in {monthLabel}</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Add what you spend — tea, transport, rent — and this page turns it into charts of where the money
                    went.
                </p>
                <Button className="mt-5 gap-1.5" onClick={openAdd}>
                    <Plus /> Add the first expense
                </Button>
            </div>
        );
    }

    const change = pctChange(total, prevTotal);
    const elapsed = isCurrent ? new Date().getDate() : dayCount;
    const biggest = entries.reduce<ExpenseDTO | null>((m, e) => (!m || e.amount > m.amount ? e : m), null);
    const biggestName = biggest ? items.find((i) => i.id === biggest.itemId)?.name : undefined;
    const refreshing = entriesQ.isFetching || totalsQ.isFetching;

    return (
        <div className="space-y-4">
            {/* Headline: one hero figure, the split between the two types, and a few stat tiles */}
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
                    <p className="text-sm font-medium text-muted-foreground">Spent in {monthLabel}</p>
                    <p className="mt-1 text-5xl font-semibold tracking-tight sm:text-6xl">{rupees(total)}</p>
                    {change !== null && Math.abs(change) >= 0.5 ? (
                        <p
                            className={cn(
                                "mt-2 flex items-center gap-1 text-sm font-medium",
                                change > 0 ? "text-destructive" : "text-success",
                            )}
                        >
                            {change > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                            {Math.abs(Math.round(change))}% {change > 0 ? "more" : "less"} than {prevLabel}
                            <span className="font-normal text-muted-foreground">({rupees(prevTotal)})</span>
                        </p>
                    ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {prevTotal ? `About the same as ${prevLabel}` : `No ${prevLabel} spending to compare with`}
                        </p>
                    )}

                    {/* tall segmented bar: General vs Operational share */}
                    <div className="mt-5">
                        <div
                            className="flex h-7 gap-0.5"
                            role="img"
                            aria-label={`General ${rupees(byType.General)}, Operational ${rupees(byType.Operational)}`}
                        >
                            {TYPES.map((t) =>
                                byType[t] > 0 ? (
                                    <div
                                        key={t}
                                        title={`${t}: ${rupees(byType[t])}`}
                                        className="flex min-w-0 items-center rounded-[4px] px-2 text-xs font-semibold text-white"
                                        style={{ width: `${(byType[t] / total) * 100}%`, background: TYPE_COLOR[t] }}
                                    >
                                        {byType[t] / total >= 0.12 && `${Math.round((byType[t] / total) * 100)}%`}
                                    </div>
                                ) : null,
                            )}
                        </div>
                        <SeriesLegend
                            className="mt-2"
                            series={TYPES.map((t) => ({ id: t, label: t, color: TYPE_COLOR[t] }))}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                    <Tile
                        label="General"
                        value={rupees(byType.General)}
                        sub={deltaText(byType.General, prevRow?.General ?? 0, prevLabel)}
                        dot={TYPE_COLOR.General}
                    />
                    <Tile
                        label="Operational"
                        value={rupees(byType.Operational)}
                        sub={deltaText(byType.Operational, prevRow?.Operational ?? 0, prevLabel)}
                        dot={TYPE_COLOR.Operational}
                    />
                    <Tile
                        label="Daily average"
                        value={rupees(total / elapsed)}
                        sub={`over ${elapsed} ${elapsed === 1 ? "day" : "days"}`}
                    />
                    <Tile
                        label="Biggest single expense"
                        value={biggest ? rupees(biggest.amount) : "—"}
                        sub={biggestName}
                    />
                </div>
            </div>

            {insights.length > 0 && (
                <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
                    <h3 className="font-heading flex items-center gap-2 text-base font-semibold">
                        <span className="grid size-7 place-items-center rounded-lg bg-warning-soft text-warning">
                            <Lightbulb className="size-4" />
                        </span>
                        Highlights
                    </h3>
                    <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
                        {insights.map((t) => (
                            <li key={t} className="flex gap-2">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                                <span>{t}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* One filter row, above everything it scopes */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Show</span>
                <div
                    className="flex rounded-xl border bg-card p-1 shadow-xs"
                    role="group"
                    aria-label="Expense type filter"
                >
                    {(["All", ...TYPES] as Filter[]).map((f) => (
                        <button
                            key={f}
                            aria-pressed={filter === f}
                            onClick={() => {
                                setFilter(f);
                                setActive(null);
                            }}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                                filter === f
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
                <span className="text-xs text-muted-foreground">The charts below follow this filter</span>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard
                    title="Where your money went"
                    subtitle={`${filter === "All" ? "All expenses" : `${filter} expenses`} · top 5 items, the rest grouped as Other`}
                    refreshing={refreshing}
                    table={{
                        head: ["Item", "Amount", "Share"],
                        rows: spend.map((r) => [
                            r.item.name,
                            rupees(r.total),
                            `${Math.round((r.total / filteredTotal) * 100)}%`,
                        ]),
                        numeric: [1, 2],
                    }}
                >
                    <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,17rem)_1fr]">
                        <DonutChart
                            slices={slices}
                            total={filteredTotal}
                            active={active}
                            onActive={setActive}
                            centerLabel={filter === "All" ? "Total spent" : `${filter} spent`}
                            ariaLabel={`Spending split: ${slices.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(", ")}`}
                        />
                        <ul className="space-y-1">
                            {slices.map((s) => (
                                <li
                                    key={s.id}
                                    onPointerEnter={() => setActive(s.id)}
                                    onPointerLeave={() => setActive(null)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                                        active === s.id && "bg-muted/70",
                                    )}
                                >
                                    <span className="size-3 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                                    <span className="min-w-0 flex-1 truncate font-medium">{s.label}</span>
                                    <b className="font-semibold tabular-nums">{rupees(s.value)}</b>
                                    <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                                        {Math.round(s.share * 100)}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Every item, biggest first"
                    subtitle={
                        <SeriesLegend
                            series={TYPES.filter((t) => filter === "All" || filter === t).map((t) => ({
                                id: t,
                                label: t,
                                color: TYPE_COLOR[t],
                            }))}
                        />
                    }
                    refreshing={refreshing}
                    table={{
                        head: ["Item", "Type", "Entries", "Amount"],
                        rows: spend.map((r) => [r.item.name, r.item.type, r.count, rupees(r.total)]),
                        numeric: [2, 3],
                    }}
                >
                    <div className="scrollbar-thin max-h-[22rem] overflow-y-auto pr-1">
                        <RankedBars
                            rows={spend.map((r) => ({
                                id: r.item.id,
                                label: r.item.name,
                                value: r.total,
                                color: TYPE_COLOR[r.item.type],
                                note: `${r.count} ${r.count === 1 ? "entry" : "entries"}`,
                            }))}
                            total={filteredTotal}
                            active={active}
                            onActive={setActive}
                        />
                    </div>
                </ChartCard>

                <ChartCard
                    title="Day by day"
                    subtitle={<SeriesLegend series={series} />}
                    refreshing={refreshing}
                    table={{
                        head: ["Date", ...series.map((s) => s.label), ...(series.length > 1 ? ["Total"] : [])],
                        rows: dailyData
                            .filter((d) => series.some((s) => (d.values[s.id] ?? 0) > 0))
                            .map((d) => [
                                d.title,
                                ...series.map((s) => rupees(d.values[s.id] ?? 0)),
                                ...(series.length > 1
                                    ? [rupees(series.reduce((a, s) => a + (d.values[s.id] ?? 0), 0))]
                                    : []),
                            ]),
                        numeric: series.map((_, i) => i + 1).concat(series.length > 1 ? [series.length + 1] : []),
                    }}
                >
                    <StackedColumns
                        data={dailyData}
                        series={series}
                        ariaLabel={`Spending for each day of ${monthLabel}`}
                    />
                </ChartCard>

                <ChartCard
                    title="Last 6 months"
                    subtitle={<SeriesLegend series={series} />}
                    refreshing={refreshing}
                    table={{
                        head: ["Month", ...series.map((s) => s.label), ...(series.length > 1 ? ["Total"] : [])],
                        rows: trendData.map((d) => [
                            d.title,
                            ...series.map((s) => rupees(d.values[s.id] ?? 0)),
                            ...(series.length > 1
                                ? [rupees(series.reduce((a, s) => a + (d.values[s.id] ?? 0), 0))]
                                : []),
                        ]),
                        numeric: series.map((_, i) => i + 1).concat(series.length > 1 ? [series.length + 1] : []),
                    }}
                >
                    <StackedColumns
                        data={trendData}
                        series={series}
                        annotateKey={monthStr}
                        selectedKey={monthStr}
                        onSelect={(k) => setMonth(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1))}
                        ariaLabel="Spending in each of the last six months"
                    />
                    <p className="mt-1 text-center text-xs text-muted-foreground">Click a month to open it</p>
                </ChartCard>
            </div>
        </div>
    );
}

function deltaText(curr: number, prev: number, prevLabel: string): string {
    const c = pctChange(curr, prev);
    if (c === null) return `no ${prevLabel} figure`;
    if (Math.abs(c) < 0.5) return `same as ${prevLabel}`;
    return `${c > 0 ? "▲" : "▼"} ${Math.abs(Math.round(c))}% vs ${prevLabel}`;
}

function Tile({ label, value, sub, dot }: { label: string; value: string; sub?: ReactNode; dot?: string }) {
    return (
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {dot && <span className="size-2 rounded-full" style={{ background: dot }} />}
                {label}
            </p>
            <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}
