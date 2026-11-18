// Live Staff + Expenses cards. Only mounted for admins, because those APIs are admin-only.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { addMonths, format } from "date-fns";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Users, Wallet } from "lucide-react";
import DonutChart from "@/components/charts/DonutChart";
import { Skeleton } from "@/components/ui/skeleton";
import { monthKey, monthRange, pctChange, rupees, spendByItem, toSlices } from "@/lib/expenses/calc";
import { useExpenseItems, useExpenses, useExpenseTotals } from "@/lib/expenses/store";
import { daysOfMonth, formatINR, isoDate, pairKey, salarySummary, weeksOfMonth } from "@/lib/staff/calc";
import { monthKey as staffMonthKey, useStaff } from "@/lib/staff/staffStore";
import { cn } from "@/lib/utils";
import AnimatedNumber from "./AnimatedNumber";
import GlassCard from "./GlassCard";
import Ring from "./Ring";
import Sparkline from "./Sparkline";

const TODAY = () => new Date();

/** Label + big figure + footer — the shape every KPI card shares. */
export function KpiCard({
    to,
    label,
    icon: Icon,
    delay,
    children,
    tint = "bg-primary/10 text-primary",
}: {
    to: string;
    label: string;
    icon: typeof Users;
    delay: number;
    children: React.ReactNode;
    tint?: string;
}) {
    return (
        <GlassCard to={to} lift delay={delay} className="block p-5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
                <span className={cn("grid size-8 place-items-center rounded-xl", tint)}>
                    <Icon className="size-4" />
                </span>
            </div>
            {children}
            <ArrowRight className="absolute right-4 bottom-4 size-4 -translate-x-1 text-primary opacity-0 transition-all duration-300 group-hover/glass:translate-x-0 group-hover/glass:opacity-100" />
        </GlassCard>
    );
}

export function AdminKpis() {
    const now = TODAY();
    const month = monthKey(now);
    const months = useMemo(() => monthRange(now, 6), [month]); // eslint-disable-line react-hooks/exhaustive-deps
    const entriesQ = useExpenses(month);
    const totalsQ = useExpenseTotals(months[0] as string, months[5] as string);
    const staff = useStaff(now);

    // ---- spending
    const spent = (entriesQ.data ?? []).reduce((s, e) => s + e.amount, 0);
    const byMonth = useMemo(() => {
        const acc = new Map(months.map((m) => [m, 0]));
        for (const t of totalsQ.data ?? []) acc.set(t.month, (acc.get(t.month) ?? 0) + t.total);
        return months.map((m) => acc.get(m) ?? 0);
    }, [totalsQ.data, months]);
    const prev = byMonth[byMonth.length - 2] ?? 0;
    const change = pctChange(spent, prev);

    // ---- staff today + payroll
    const active = staff.employees.filter((e) => e.active);
    const todayIso = isoDate(now);
    let present = 0;
    let absent = 0;
    const absentNames: string[] = [];
    for (const e of active) {
        const m = staff.attendance[pairKey(e.id, todayIso)];
        if (m === "P" || m === "H") present++;
        else if (m === "A" || m === "L") {
            absent++;
            absentNames.push(e.name);
        }
    }
    const weeks = weeksOfMonth(now);
    const days = daysOfMonth(now);
    let paid = 0;
    let remaining = 0;
    for (const e of active) {
        if (staff.payments[`${e.id}|${staffMonthKey(now)}`]) paid++;
        else remaining += salarySummary(e, staff.advances, weeks, staff.attendance, days).balance;
    }

    const loadingStaff = staff.isLoading;
    return (
        <>
            <KpiCard to="/expenses/overview" label={`Spent in ${format(now, "MMMM")}`} icon={Wallet} delay={60}>
                {entriesQ.isPending ? (
                    <Skeleton className="mt-3 h-9 w-32" />
                ) : (
                    <>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">
                            <AnimatedNumber value={spent} format={rupees} />
                        </p>
                        <div className="mt-2 flex items-end justify-between gap-2">
                            <p
                                className={cn(
                                    "flex items-center gap-1 text-xs font-medium",
                                    change === null
                                        ? "text-muted-foreground"
                                        : change > 0
                                          ? "text-destructive"
                                          : "text-success",
                                )}
                            >
                                {change === null ? (
                                    "no earlier month to compare"
                                ) : (
                                    <>
                                        {change > 0 ? (
                                            <ArrowUpRight className="size-3.5" />
                                        ) : (
                                            <ArrowDownRight className="size-3.5" />
                                        )}
                                        {Math.abs(Math.round(change))}% vs {format(addMonths(now, -1), "MMM")}
                                    </>
                                )}
                            </p>
                            <Sparkline
                                values={byMonth}
                                width={96}
                                height={34}
                                ariaLabel={`Monthly spending, last ${byMonth.length} months`}
                            />
                        </div>
                    </>
                )}
            </KpiCard>

            <KpiCard
                to="/staff/attendance"
                label="Staff today"
                icon={Users}
                delay={120}
                tint="bg-success-soft text-success"
            >
                {loadingStaff ? (
                    <Skeleton className="mt-3 h-24 w-full" />
                ) : (
                    <div className="mt-3 flex items-center gap-4">
                        <Ring
                            value={active.length ? present / active.length : 0}
                            ariaLabel={`${present} of ${active.length} staff present today`}
                        >
                            <div className="leading-none">
                                <p className="text-2xl font-semibold">
                                    <AnimatedNumber value={present} />
                                </p>
                                <p className="mt-1 text-[10px] font-medium text-muted-foreground">of {active.length}</p>
                            </div>
                        </Ring>
                        <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
                            <p>
                                <b className="text-foreground">{absent}</b> absent ·{" "}
                                <b className="text-foreground">{active.length - present - absent}</b> not marked
                            </p>
                            {absentNames.length > 0 && (
                                <p className="mt-1 truncate">
                                    Out: {absentNames.slice(0, 3).join(", ")}
                                    {absentNames.length > 3 ? ` +${absentNames.length - 3}` : ""}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </KpiCard>

            <KpiCard
                to="/staff/salary"
                label={`${format(now, "MMM")} payroll`}
                icon={Wallet}
                delay={180}
                tint="bg-warning-soft text-warning"
            >
                {loadingStaff ? (
                    <Skeleton className="mt-3 h-9 w-32" />
                ) : (
                    <>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">
                            <AnimatedNumber value={paid} />{" "}
                            <span className="text-lg font-medium text-muted-foreground">of {active.length} paid</span>
                        </p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-brand to-primary shadow-[0_0_10px_rgba(14,165,233,0.55)] transition-[width] duration-1000"
                                style={{ width: `${active.length ? (paid / active.length) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            <b className="text-foreground">{formatINR(Math.max(0, remaining))}</b> still to pay
                        </p>
                    </>
                )}
            </KpiCard>
        </>
    );
}

export function SpendingCard({ delay = 0 }: { delay?: number }) {
    const now = TODAY();
    const itemsQ = useExpenseItems();
    const entriesQ = useExpenses(monthKey(now));
    const spend = useMemo(() => spendByItem(entriesQ.data ?? [], itemsQ.data ?? []), [entriesQ.data, itemsQ.data]);
    const slices = useMemo(() => toSlices(spend, 4), [spend]);
    const total = spend.reduce((s, r) => s + r.total, 0);

    return (
        <GlassCard lift delay={delay} className="p-5">
            <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">Where the money went</h3>
                <Link
                    to="/expenses/overview"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5"
                >
                    Details <ArrowRight className="size-3.5" />
                </Link>
            </div>
            {itemsQ.isPending || entriesQ.isPending ? (
                <Skeleton className="mt-4 h-44 w-full" />
            ) : total <= 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    No spending recorded in {format(now, "MMMM")} yet.
                </p>
            ) : (
                <div className="mt-3 grid items-center gap-4 sm:grid-cols-[10.5rem_1fr]">
                    <DonutChart
                        slices={slices}
                        total={total}
                        active={null}
                        onActive={() => {}}
                        centerLabel="This month"
                        ariaLabel={`Spending split: ${slices.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(", ")}`}
                    />
                    <ul className="space-y-1.5 text-sm">
                        {slices.map((s) => (
                            <li key={s.id} className="flex items-center gap-2.5">
                                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                                <b className="tabular-nums">{rupees(s.value)}</b>
                                <span className="w-9 text-right text-xs text-muted-foreground">
                                    {Math.round(s.share * 100)}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </GlassCard>
    );
}
