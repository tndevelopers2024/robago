// src/lib/staff/calc.ts
import { addDays, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { ATTENDANCE_VALUE, type AttendanceStatus, type Employee } from "./types";

export const isoDate = (d: Date) => format(d, "yyyy-MM-dd");
export const pairKey = (employeeId: string, iso: string) => `${employeeId}|${iso}`;

/** Every Sunday in the month, as ISO dates — these are the weekly advance columns. */
export function weeksOfMonth(month: Date): string[] {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    const out: string[] = [];
    let d = addDays(first, (7 - getDay(first)) % 7);
    while (d <= last) {
        out.push(isoDate(d));
        d = addDays(d, 7);
    }
    return out;
}

export function daysOfMonth(month: Date): Date[] {
    const first = startOfMonth(month);
    const count = endOfMonth(month).getDate();
    return Array.from({ length: count }, (_, i) => addDays(first, i));
}

/** Salary is split over 30 days to price one day of leave, whatever the month's length. */
export const PAY_DAYS_PER_MONTH = 30;

/** How much of a day's pay is lost for each attendance mark. */
export const LOSS_OF_PAY_WEIGHT: Record<AttendanceStatus, number> = {
    P: 0,
    H: 0.5,
    A: 1,
    L: 1,
};

export interface SalarySummary {
    salary: number;
    advanceTotal: number;
    /** Days of pay lost: leave + absent days, plus half days at 0.5. */
    leaveDays: number;
    /** One day's pay (salary ÷ 30). */
    perDay: number;
    /** Money cut for those days, rounded to the rupee. */
    leaveDeduction: number;
    /** Still to pay = salary − advances − leave deduction. Negative means over-advanced. */
    balance: number;
    /** 0–1+ share of salary already taken as advance. */
    usedRatio: number;
}

export function salarySummary(
    emp: Employee,
    advances: Record<string, number>,
    weeks: string[],
    attendance: Record<string, AttendanceStatus>,
    days: Date[],
): SalarySummary {
    const advanceTotal = weeks.reduce((sum, w) => sum + (advances[pairKey(emp.id, w)] ?? 0), 0);
    let leaveDays = 0;
    for (const d of days) {
        const mark = attendance[pairKey(emp.id, isoDate(d))];
        if (mark) leaveDays += LOSS_OF_PAY_WEIGHT[mark];
    }
    const perDay = emp.monthlySalary / PAY_DAYS_PER_MONTH;
    const leaveDeduction = Math.round(perDay * leaveDays);
    return {
        salary: emp.monthlySalary,
        advanceTotal,
        leaveDays,
        perDay,
        leaveDeduction,
        balance: emp.monthlySalary - advanceTotal - leaveDeduction,
        usedRatio: emp.monthlySalary > 0 ? advanceTotal / emp.monthlySalary : advanceTotal > 0 ? 1 : 0,
    };
}

export interface AttendanceSummary {
    present: number;
    half: number;
    absent: number;
    leave: number;
    /** Worked days: present + half days counted as 0.5. */
    workedDays: number;
}

export function attendanceSummary(
    emp: Employee,
    attendance: Record<string, AttendanceStatus>,
    days: Date[],
): AttendanceSummary {
    const s: AttendanceSummary = {
        present: 0,
        half: 0,
        absent: 0,
        leave: 0,
        workedDays: 0,
    };
    for (const d of days) {
        const mark = attendance[pairKey(emp.id, isoDate(d))];
        if (!mark) continue;
        if (mark === "P") s.present++;
        else if (mark === "H") s.half++;
        else if (mark === "A") s.absent++;
        else s.leave++;
        s.workedDays += ATTENDANCE_VALUE[mark];
    }
    return s;
}

/** Parses what a person types or pastes into an amount cell. `""` → null (clear), junk → undefined. */
export function parseAmount(text: string): number | null | undefined {
    const cleaned = text.replace(/[₹,\s]/g, "");
    if (cleaned === "") return null;
    if (!/^-?\d*\.?\d+$/.test(cleaned)) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}

export function parseAttendance(text: string): AttendanceStatus | null | undefined {
    const t = text.trim().toUpperCase();
    if (t === "") return null;
    if (t === "P" || t === "PRESENT") return "P";
    if (t === "A" || t === "ABSENT") return "A";
    if (t === "H" || t === "HALF" || t === "HALF DAY") return "H";
    if (t === "L" || t === "LEAVE") return "L";
    return undefined;
}

const inrFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** ₹1,23,456 — Indian digit grouping, with a leading minus for negatives. */
export function formatINR(n: number): string {
    const abs = inrFormat.format(Math.abs(n));
    return `${n < 0 ? "-" : ""}₹${abs}`;
}

export function formatNumber(n: number): string {
    return inrFormat.format(n);
}

export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    const first = parts[0]?.[0] ?? "";
    const lastInitial = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + lastInitial).toUpperCase();
}

/** Stable pastel-ish hue from a name so each person keeps the same avatar colour. */
export function avatarHue(name: string): number {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}
