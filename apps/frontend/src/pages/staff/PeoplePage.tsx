// src/pages/staff/PeoplePage.tsx — directory on the left, full profile on the right.
import { useMemo, useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysOfMonth, formatINR, isoDate, pairKey, salarySummary, weeksOfMonth } from "@/lib/staff/calc";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { monthKey } from "@/lib/staff/staffStore";
import EmployeeProfile from "./EmployeeProfile";
import { useStaffContext } from "./staffContext";
import { EmployeeAvatar } from "./staffUi";
import { ATTENDANCE_STYLE } from "./staffUi";

export default function PeoplePage() {
    const { employees, advances, attendance, payments, month, openEmployee, editEmployee, addEmployee } =
        useStaffContext();
    const wide = useMediaQuery("(min-width: 1024px)");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const weeks = useMemo(() => weeksOfMonth(month), [month]);
    const days = useMemo(() => daysOfMonth(month), [month]);
    const todayIso = isoDate(new Date());
    const current = employees.find((e) => e.id === selectedId) ?? employees[0] ?? null;

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[21rem_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-2xl border bg-card shadow-xs lg:sticky lg:top-4">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <p className="text-sm font-semibold">
                        {employees.length} {employees.length === 1 ? "person" : "people"}
                    </p>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={addEmployee}>
                        <UserRoundPlus className="size-3.5" /> Add
                    </Button>
                </div>
                <ul className="scrollbar-thin max-h-[70dvh] divide-y overflow-y-auto lg:max-h-[calc(100dvh-11rem)]">
                    {employees.map((emp) => {
                        const sum = salarySummary(emp, advances, weeks, attendance, days);
                        const today = attendance[pairKey(emp.id, todayIso)];
                        const selected = wide && current?.id === emp.id;
                        const subtitle = [emp.designation, emp.department].filter(Boolean).join(" · ");
                        return (
                            <li key={emp.id}>
                                <button
                                    type="button"
                                    onClick={() => (wide ? setSelectedId(emp.id) : openEmployee(emp.id))}
                                    className={cn(
                                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                                        selected &&
                                            "bg-accent/70 shadow-[inset_3px_0_0_var(--primary)] hover:bg-accent/70",
                                        !emp.active && "opacity-55",
                                    )}
                                >
                                    <EmployeeAvatar name={emp.name} className="size-10 text-xs" />
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                                            {emp.name}
                                            {today && (
                                                <span
                                                    className={cn(
                                                        "grid size-4 shrink-0 place-items-center rounded text-[9px] font-bold",
                                                        ATTENDANCE_STYLE[today],
                                                    )}
                                                >
                                                    {today}
                                                </span>
                                            )}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {subtitle || (emp.active ? "No designation yet" : "Inactive")}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p
                                            className={cn(
                                                "text-sm font-bold tabular-nums",
                                                sum.balance < 0 ? "text-destructive" : "text-foreground",
                                            )}
                                        >
                                            {formatINR(sum.balance)}
                                        </p>
                                        {payments[`${emp.id}|${monthKey(month)}`] ? (
                                            <p className="text-[10px] font-semibold tracking-wide text-success uppercase">
                                                ✓ paid
                                            </p>
                                        ) : (
                                            <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                                                to pay
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                    {employees.length === 0 && (
                        <li className="p-6 text-center text-sm text-muted-foreground">No staff match your search.</li>
                    )}
                </ul>
            </aside>

            {wide && current && (
                <EmployeeProfile
                    key={current.id}
                    emp={current}
                    month={month}
                    advances={advances}
                    attendance={attendance}
                    payment={payments[`${current.id}|${monthKey(month)}`]}
                    onEdit={() => editEmployee(current.id)}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
}
