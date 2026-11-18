// src/pages/staff/StaffPage.tsx
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { format, isSameMonth } from "date-fns";
import {
    CalendarCheck2,
    Contact,
    Download,
    Search,
    Table2,
    UserRoundPlus,
    Users,
    Wallet,
    HandCoins,
    CalendarX2,
    CircleCheckBig,
    BadgeIndianRupee,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gridToCSV } from "@/components/sheet/SheetGrid";
import MonthPicker from "@/components/shared/MonthPicker";
import {
    attendanceSummary,
    daysOfMonth,
    formatINR,
    formatNumber,
    isoDate,
    pairKey,
    salarySummary,
    weeksOfMonth,
} from "@/lib/staff/calc";
import { monthKey, useStaff } from "@/lib/staff/staffStore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import EmployeeDrawer from "./EmployeeDrawer";
import EmployeeFormDialog from "./EmployeeFormDialog";
import { buildSalaryColumns, type SalaryRow } from "./SalarySheet";
import type { StaffOutletContext } from "./staffContext";

type View = "salary" | "attendance" | "people";

const VIEWS: { id: View; label: string; short: string; icon: typeof Table2 }[] = [
    { id: "salary", label: "Salary sheet", short: "Salary", icon: Table2 },
    {
        id: "attendance",
        label: "Attendance",
        short: "Attendance",
        icon: CalendarCheck2,
    },
    { id: "people", label: "People", short: "People", icon: Contact },
];

function download(filename: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function StaffLayout() {
    const { pathname } = useLocation();
    const view: View = pathname.endsWith("/attendance")
        ? "attendance"
        : pathname.endsWith("/people")
          ? "people"
          : "salary";

    const [month, setMonth] = useState(() => new Date());
    const { employees, advances, attendance, payments, isLoading, refreshing, error, refetch } = useStaff(month);
    const [query, setQuery] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [form, setForm] = useState<{ open: boolean; id: string | null }>({
        open: false,
        id: null,
    });

    const weeks = useMemo(() => weeksOfMonth(month), [month]);
    const days = useMemo(() => daysOfMonth(month), [month]);
    const isCurrentMonth = isSameMonth(month, new Date());

    const active = useMemo(() => employees.filter((e) => e.active), [employees]);
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return employees.filter((e) => {
            if (!showInactive && !e.active) return false;
            if (!q) return true;
            return [e.name, e.designation, e.department, e.phone].some((f) => f.toLowerCase().includes(q));
        });
    }, [employees, query, showInactive]);

    // Headline numbers cover everyone currently working, regardless of the search box.
    const totals = useMemo(() => {
        let payroll = 0;
        let advance = 0;
        let leave = 0;
        let leaveDays = 0;
        let over = 0;
        let paidCount = 0;
        let paidAmount = 0;
        let advanceCount = 0;
        let remaining = 0;
        for (const e of active) {
            const s = salarySummary(e, advances, weeks, attendance, days);
            const pay = payments[`${e.id}|${monthKey(month)}`];
            if (pay) {
                paidCount++;
                paidAmount += pay.amount;
            } else remaining += s.balance;
            if (s.advanceTotal > 0) advanceCount++;
            payroll += s.salary;
            advance += s.advanceTotal;
            leave += s.leaveDeduction;
            leaveDays += s.leaveDays;
            if (s.balance < 0) over++;
        }
        const todayIso = isoDate(new Date());
        let present = 0;
        let absent = 0;
        for (const e of active) {
            const m = attendance[pairKey(e.id, todayIso)];
            if (m === "P" || m === "H") present++;
            else if (m === "A" || m === "L") absent++;
        }
        return {
            payroll,
            advance,
            leave,
            leaveDays,
            balance: payroll - advance - leave,
            over,
            paidCount,
            paidAmount,
            advanceCount,
            remaining,
            present,
            absent,
            unmarked: active.length - present - absent,
        };
    }, [active, advances, attendance, payments, weeks, days, month]);

    const outletContext: StaffOutletContext = {
        employees: visible,
        advances,
        attendance,
        payments,
        month,
        openEmployee: setOpenId,
        editEmployee: (id) => setForm({ open: true, id }),
        addEmployee: () => setForm({ open: true, id: null }),
    };

    const exportCsv = () => {
        const stamp = format(month, "yyyy-MM");
        if (view === "attendance") {
            const head = ["Name", "Days worked", ...days.map((d) => format(d, "d MMM"))];
            const lines = visible.map((e) => {
                const s = attendanceSummary(e, attendance, days);
                return [e.name, s.workedDays, ...days.map((d) => attendance[pairKey(e.id, isoDate(d))] ?? "")];
            });
            const esc = (v: string | number) =>
                /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
            download(`attendance-${stamp}.csv`, [head, ...lines].map((l) => l.map(esc).join(",")).join("\n"));
            return;
        }
        const rows: SalaryRow[] = visible.map((emp) => ({
            emp,
            sum: salarySummary(emp, advances, weeks, attendance, days),
            paid: payments[`${emp.id}|${monthKey(month)}`],
        }));
        download(
            `salary-${stamp}.csv`,
            gridToCSV(
                buildSalaryColumns(month, advances, () => {}),
                rows,
            ),
        );
    };

    return (
        <div className="w-full space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
            {/* Headline numbers — swipeable row on phones, grid from tablet up */}
            <div className="scrollbar-none -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-6">
                <Kpi
                    icon={Users}
                    label="Active staff"
                    value={String(active.length)}
                    sub={
                        isCurrentMonth
                            ? `${totals.present} present · ${totals.absent} absent · ${totals.unmarked} unmarked today`
                            : `${employees.length - active.length} inactive`
                    }
                />
                <Kpi
                    icon={Wallet}
                    label="Monthly payroll"
                    value={formatINR(totals.payroll)}
                    sub={`Gross for ${format(month, "MMM yyyy")}`}
                />
                <Kpi
                    icon={HandCoins}
                    label="Advance given"
                    value={formatINR(totals.advance)}
                    tone="warn"
                    sub={`${totals.payroll ? Math.round((totals.advance / totals.payroll) * 100) : 0}% of payroll`}
                    bar={totals.payroll ? totals.advance / totals.payroll : 0}
                />
                <Kpi
                    icon={CircleCheckBig}
                    label={`${format(month, "MMM")} payment status`}
                    value={`${totals.paidCount} of ${active.length} paid`}
                    tone="good"
                    sub={`${active.length - totals.paidCount} yet to pay · ${totals.advanceCount} took advance`}
                    bar={active.length ? totals.paidCount / active.length : 0}
                />
                <Kpi
                    icon={CalendarX2}
                    label="Leave deduction"
                    value={formatINR(totals.leave)}
                    tone="bad"
                    sub={`${formatNumber(totals.leaveDays)} days of pay cut`}
                />
                <Kpi
                    icon={BadgeIndianRupee}
                    label="Balance to pay"
                    value={formatINR(totals.balance)}
                    hero
                    sub={`Paid ${formatINR(totals.paidAmount)} · left ${formatINR(totals.remaining)}`}
                />
            </div>

            {/* Toolbar */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <MonthPicker value={month} onChange={setMonth} />
                        {!isCurrentMonth && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl"
                                onClick={() => setMonth(new Date())}
                            >
                                This month
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {view !== "people" && (
                            <Button
                                variant="outline"
                                onClick={exportCsv}
                                className="h-10 gap-1.5 rounded-xl"
                                aria-label="Export CSV"
                            >
                                <Download />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        )}
                        <Button onClick={() => setForm({ open: true, id: null })} className="h-10 gap-1.5 rounded-xl">
                            <UserRoundPlus />
                            <span className="sm:hidden">Add</span>
                            <span className="hidden sm:inline">Add employee</span>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <nav
                        aria-label="Staff views"
                        className="grid grid-cols-3 rounded-xl border bg-card p-1 shadow-xs md:inline-grid"
                    >
                        {VIEWS.map((v) => (
                            <NavLink
                                key={v.id}
                                to={`/staff/${v.id}`}
                                replace
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground",
                                    )
                                }
                            >
                                <v.icon className="size-4" />
                                <span className="sm:hidden">{v.short}</span>
                                <span className="hidden sm:inline">{v.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex flex-1 items-center gap-2">
                        <div className="relative min-w-0 flex-1 md:max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search staff…"
                                className="h-10 rounded-xl bg-card pr-9 pl-9"
                            />
                            {query && (
                                <button
                                    aria-label="Clear search"
                                    onClick={() => setQuery("")}
                                    className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <label className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border bg-card px-3 text-sm shadow-xs">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="size-4 accent-[var(--primary)]"
                            />
                            <span className="whitespace-nowrap text-muted-foreground">
                                <span className="sm:hidden">Inactive</span>
                                <span className="hidden sm:inline">Show inactive</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Views (Salary sheet / Attendance / People are separate pages) */}
            {error && !employees.length ? (
                <LoadError error={error} onRetry={refetch} />
            ) : isLoading ? (
                <Skeleton className="h-[28rem] w-full rounded-2xl" />
            ) : (
                <div className={cn("transition-opacity duration-200", refreshing && "pointer-events-none opacity-60")}>
                    <Outlet context={outletContext} />
                </div>
            )}

            <EmployeeDrawer
                employeeId={openId}
                month={month}
                onClose={() => setOpenId(null)}
                onEdit={(id) => setForm({ open: true, id })}
            />
            <EmployeeFormDialog
                open={form.open}
                employeeId={form.id}
                onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
            />
        </div>
    );
}

function Kpi({
    icon: Icon,
    label,
    value,
    sub,
    tone,
    hero,
    bar,
}: {
    icon: typeof Users;
    label: string;
    value: string;
    sub?: string;
    tone?: "warn" | "bad" | "good";
    hero?: boolean;
    bar?: number;
}) {
    return (
        <div
            className={cn(
                "rise-in relative w-[62%] shrink-0 snap-start overflow-hidden rounded-2xl border p-3 shadow-xs sm:w-auto sm:px-4 sm:py-3",
                hero
                    ? "border-transparent bg-linear-to-br from-sidebar via-sidebar to-primary text-white shadow-lg shadow-primary/20"
                    : "bg-card",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p
                    className={cn(
                        "text-[11px] font-semibold tracking-wide uppercase",
                        hero ? "text-white/70" : "text-muted-foreground",
                    )}
                >
                    {label}
                </p>
                <span
                    className={cn(
                        "grid size-7 place-items-center rounded-lg",
                        hero
                            ? "bg-white/15 text-brand"
                            : tone === "warn"
                              ? "bg-warning-soft text-warning"
                              : tone === "bad"
                                ? "bg-danger-soft text-destructive"
                                : tone === "good"
                                  ? "bg-success-soft text-success"
                                  : "bg-primary/10 text-primary",
                    )}
                >
                    <Icon className="size-4" />
                </span>
            </div>
            <p className="font-heading mt-1 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
                {value}
            </p>
            {bar !== undefined && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn("h-full rounded-full", tone === "good" ? "bg-success" : "bg-warning")}
                        style={{ width: `${Math.min(100, bar * 100)}%` }}
                    />
                </div>
            )}
            {sub && (
                <p className={cn("mt-1 text-xs leading-snug", hero ? "text-white/60" : "text-muted-foreground")}>
                    {sub}
                </p>
            )}
        </div>
    );
}

function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const message =
        status === 403
            ? "Only admins can view staff and salary details."
            : status === 401
              ? "Your session has expired. Please sign in again."
              : "Couldn't load staff data. Check that the backend is running, then try again.";
    return (
        <div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
            <p className="font-medium">{message}</p>
            <Button className="mt-4" variant="outline" onClick={onRetry}>
                Try again
            </Button>
        </div>
    );
}
