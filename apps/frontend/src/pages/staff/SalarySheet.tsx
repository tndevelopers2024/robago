// src/pages/staff/SalarySheet.tsx — the Excel-style salary & weekly-advance sheet.
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import SheetGrid, { type CellEdit, type SheetColumn } from "@/components/sheet/SheetGrid";
import type { PaymentEntry } from "@robago/shared";
import {
    daysOfMonth,
    formatINR,
    formatNumber,
    pairKey,
    parseAmount,
    salarySummary,
    weeksOfMonth,
    type SalarySummary,
} from "@/lib/staff/calc";
import { monthKey, staffActions } from "@/lib/staff/staffStore";
import type { AttendanceStatus, Employee, EmployeeInput, PaymentRecord } from "@/lib/staff/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { EmployeeAvatar, UsageBar } from "./staffUi";

export interface SalaryRow {
    emp: Employee;
    sum: SalarySummary;
    /** Set when this month's salary is marked paid. */
    paid?: PaymentRecord;
}

export function buildSalaryColumns(
    month: Date,
    advances: Record<string, number>,
    onOpen: (id: string) => void,
): SheetColumn<SalaryRow>[] {
    const weeks = weeksOfMonth(month);
    const money = (n: number | null | undefined) => (n ? formatINR(n) : "");

    return [
        {
            id: "name",
            label: "Name",
            header: "Name",
            width: 200,
            sticky: true,
            editable: true,
            getValue: (r) => r.emp.name,
            render: (r) => (
                <span className="flex items-center gap-2">
                    <EmployeeAvatar
                        name={r.emp.name}
                        className={cn("size-6 text-[9px]", !r.emp.active && "opacity-50")}
                    />
                    <span
                        className={cn("truncate font-semibold", !r.emp.active && "text-muted-foreground line-through")}
                    >
                        {r.emp.name}
                    </span>
                    <button
                        type="button"
                        aria-label={`Open ${r.emp.name}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onOpen(r.emp.id)}
                        className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                        <ArrowUpRight className="size-3.5" />
                    </button>
                </span>
            ),
            footer: (rows) => <span className="text-muted-foreground">Total · {rows.length} staff</span>,
        },
        {
            id: "salary",
            label: "Salary",
            header: "Salary",
            subHeader: "per month",
            width: 118,
            align: "right",
            editable: true,
            getValue: (r) => r.emp.monthlySalary,
            render: (r) => <span className="font-medium">{money(r.emp.monthlySalary)}</span>,
            footer: (rows) => formatINR(rows.reduce((s, r) => s + r.emp.monthlySalary, 0)),
        },
        ...weeks.map((iso, i): SheetColumn<SalaryRow> => ({
            id: `w:${iso}`,
            label: `Advance ${format(parseISO(iso), "d MMM")}`,
            header: format(parseISO(iso), "d MMM"),
            subHeader: `Week ${i + 1} advance`,
            width: 108,
            align: "right",
            editable: true,
            getValue: (r) => advances[pairKey(r.emp.id, iso)] ?? null,
            render: (r) => <span className="text-foreground/80">{money(advances[pairKey(r.emp.id, iso)])}</span>,
            footer: (rows) => formatINR(rows.reduce((s, r) => s + (advances[pairKey(r.emp.id, iso)] ?? 0), 0)),
        })),
        {
            id: "advance",
            label: "Advance given",
            header: "Advance given",
            subHeader: "this month",
            width: 128,
            align: "right",
            getValue: (r) => r.sum.advanceTotal,
            render: (r) => <span className="font-semibold text-warning">{money(r.sum.advanceTotal)}</span>,
            cellClassName: () => "bg-warning-soft/40",
            footer: (rows) => formatINR(rows.reduce((s, r) => s + r.sum.advanceTotal, 0)),
        },
        {
            id: "leaveDays",
            label: "Leave days",
            header: "Leave days",
            subHeader: "leave · absent · ½ day",
            width: 132,
            align: "right",
            getValue: (r) => r.sum.leaveDays,
            render: (r) => (
                <span className={r.sum.leaveDays ? "font-semibold text-destructive" : "text-muted-foreground"}>
                    {r.sum.leaveDays ? formatNumber(r.sum.leaveDays) : ""}
                </span>
            ),
            footer: (rows) => formatNumber(rows.reduce((s, r) => s + r.sum.leaveDays, 0)),
        },
        {
            id: "leaveCut",
            label: "Leave deduction",
            header: "Leave deduction",
            subHeader: "salary ÷ 30 × days",
            width: 138,
            align: "right",
            getValue: (r) => r.sum.leaveDeduction,
            render: (r) => <span className="font-semibold text-destructive">{money(r.sum.leaveDeduction)}</span>,
            cellClassName: (r) => (r.sum.leaveDeduction ? "bg-danger-soft/60" : undefined),
            footer: (rows) => formatINR(rows.reduce((s, r) => s + r.sum.leaveDeduction, 0)),
        },
        {
            id: "balance",
            label: "Balance to pay",
            header: "Balance to pay",
            subHeader: "salary − advance − leave",
            width: 150,
            align: "right",
            getValue: (r) => r.sum.balance,
            render: (r) => (
                <span className={cn("font-bold", r.sum.balance < 0 ? "text-destructive" : "text-foreground")}>
                    {formatINR(r.sum.balance)}
                </span>
            ),
            cellClassName: (r) => (r.sum.balance < 0 ? "bg-danger-soft" : "bg-success-soft/50"),
            footer: (rows) => {
                const total = rows.reduce((s, r) => s + r.sum.balance, 0);
                return <span className={total < 0 ? "text-destructive" : undefined}>{formatINR(total)}</span>;
            },
        },
        {
            id: "paid",
            label: "Salary paid",
            header: "Salary paid",
            subHeader: "click · or type Y / N",
            width: 128,
            align: "center",
            editable: true,
            instantKeys: true,
            getValue: (r) => (r.paid ? "Paid" : "Pending"),
            getNumber: () => null,
            render: (r) =>
                r.paid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold text-success">
                        <Check className="size-3" strokeWidth={3} /> Paid
                    </span>
                ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Pending
                    </span>
                ),
            cellClassName: (r) => (r.paid ? "bg-success-soft/40" : undefined),
            footer: (rows) => `${rows.filter((r) => r.paid).length} / ${rows.length}`,
        },
        {
            id: "used",
            label: "Advance used",
            header: "Advance used",
            subHeader: "% of salary",
            width: 118,
            getValue: (r) => (r.emp.monthlySalary > 0 ? `${Math.round(r.sum.usedRatio * 100)}%` : ""),
            getNumber: () => null,
            render: (r) =>
                r.emp.monthlySalary > 0 ? (
                    <span className="flex items-center gap-2">
                        <UsageBar ratio={r.sum.usedRatio} />
                        <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground">
                            {Math.round(r.sum.usedRatio * 100)}%
                        </span>
                    </span>
                ) : null,
        },
    ];
}

interface Props {
    employees: Employee[];
    advances: Record<string, number>;
    attendance: Record<string, AttendanceStatus>;
    payments: Record<string, PaymentRecord>;
    month: Date;
    onOpen: (id: string) => void;
}

export default function SalarySheet({ employees, advances, attendance, payments, month, onOpen }: Props) {
    const weeks = useMemo(() => weeksOfMonth(month), [month]);
    const days = useMemo(() => daysOfMonth(month), [month]);
    const rows = useMemo<SalaryRow[]>(
        () =>
            employees.map((emp) => ({
                emp,
                sum: salarySummary(emp, advances, weeks, attendance, days),
                paid: payments[`${emp.id}|${monthKey(month)}`],
            })),
        [employees, advances, weeks, attendance, days, payments, month],
    );
    const columns = useMemo(() => buildSalaryColumns(month, advances, onOpen), [month, advances, onOpen]);

    const handleEdit = (edits: CellEdit<SalaryRow>[]) => {
        const patches: Record<string, Partial<EmployeeInput>> = {};
        const adv: { key: string; amount: number | null }[] = [];
        const pay: PaymentEntry[] = [];
        for (const { row, colId, text } of edits) {
            const id = row.emp.id;
            if (colId === "name") {
                const name = text.trim();
                if (name) patches[id] = { ...patches[id], name };
            } else if (colId === "salary") {
                const n = parseAmount(text);
                if (n !== undefined && (n === null || n >= 0)) patches[id] = { ...patches[id], monthlySalary: n ?? 0 };
            } else if (colId === "paid") {
                const t = text.trim().toLowerCase();
                if (t === "y" || t === "yes" || t === "paid") {
                    pay.push({
                        employeeId: id,
                        month: monthKey(month),
                        paid: true,
                        amount: row.sum.balance,
                    });
                } else if (t === "n" || t === "no" || t === "" || t === "pending") {
                    pay.push({ employeeId: id, month: monthKey(month), paid: false });
                }
            } else if (colId.startsWith("w:")) {
                const n = parseAmount(text);
                if (n !== undefined) adv.push({ key: pairKey(id, colId.slice(2)), amount: n });
            }
        }
        if (Object.keys(patches).length) staffActions.patchEmployees(patches);
        if (adv.length) staffActions.setAdvances(adv);
        if (pay.length) void staffActions.setPayments(pay);
    };

    /** Clicking a "Salary paid" cell flips it between Paid and Pending. */
    const handleClick = (row: SalaryRow, colId: string) => {
        if (colId !== "paid") return;
        void staffActions.setPayments([
            row.paid
                ? { employeeId: row.emp.id, month: monthKey(month), paid: false }
                : {
                      employeeId: row.emp.id,
                      month: monthKey(month),
                      paid: true,
                      amount: row.sum.balance,
                  },
        ]);
    };

    return (
        <SheetGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.emp.id}
            onEdit={handleEdit}
            onCellClick={handleClick}
            formatStat={formatINR}
            emptyMessage="No staff match your search."
        />
    );
}
