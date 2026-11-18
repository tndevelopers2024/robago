// src/lib/accounts/format.ts
import { formatDistanceToNowStrict, format, parseISO } from "date-fns";

const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const paise = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,05,02,310.55 — paise only when there are any, so round amounts stay tidy. */
export function money(n: number): string {
    const abs = Math.abs(n);
    const body =
        Number.isInteger(Math.round(abs * 100) / 100) && Math.round(abs * 100) % 100 === 0
            ? whole.format(abs)
            : paise.format(abs);
    return `${n < 0 ? "-" : ""}₹${body}`;
}

export const todayIso = () => format(new Date(), "yyyy-MM-dd");

export const isOverdue = (dueDate: string, balance: number) => balance > 0 && Boolean(dueDate) && dueDate < todayIso();

export function daysOverdue(dueDate: string): number {
    if (!dueDate) return 0;
    return Math.max(0, Math.floor((Date.parse(todayIso()) - Date.parse(dueDate)) / 86_400_000));
}

export const niceDate = (iso: string) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");

/** "2 hours ago" — exact time is in the tooltip wherever this is used. */
export const ago = (iso: string) => `${formatDistanceToNowStrict(new Date(iso))} ago`;
export const exactTime = (iso: string) => format(new Date(iso), "d MMM yyyy, h:mm a");
