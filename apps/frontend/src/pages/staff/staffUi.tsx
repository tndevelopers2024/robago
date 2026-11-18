// src/pages/staff/staffUi.tsx — small presentational pieces shared across the Staff views.
import { PhoneCall, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarHue, initials } from "@/lib/staff/calc";
import { ATTENDANCE_LABEL, type AttendanceStatus, type PhoneStatus } from "@/lib/staff/types";

export function EmployeeAvatar({ name, className }: { name: string; className?: string }) {
    const hue = avatarHue(name);
    return (
        <span
            aria-hidden
            className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                className,
            )}
            style={{
                background: `oklch(0.93 0.05 ${hue})`,
                color: `oklch(0.38 0.1 ${hue})`,
            }}
        >
            {initials(name)}
        </span>
    );
}

export function PhonePill({ status }: { status: PhoneStatus }) {
    if (status === "unknown") return <span className="text-muted-foreground">—</span>;
    const yes = status === "yes";
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                yes ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
            )}
        >
            {yes ? <PhoneCall className="size-3" /> : <PhoneOff className="size-3" />}
            {yes ? "Yes" : "No"}
        </span>
    );
}

export const ATTENDANCE_STYLE: Record<AttendanceStatus, string> = {
    P: "bg-success-soft text-success",
    A: "bg-danger-soft text-destructive",
    H: "bg-warning-soft text-warning",
    L: "bg-accent text-accent-foreground",
};

export function AttendanceChip({ status, className }: { status: AttendanceStatus | undefined; className?: string }) {
    if (!status) {
        return (
            <span
                className={cn(
                    "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
                    className,
                )}
            >
                Not marked
            </span>
        );
    }
    return (
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ATTENDANCE_STYLE[status], className)}>
            {ATTENDANCE_LABEL[status]}
        </span>
    );
}

/** Thin bar showing how much of the salary has already been taken as advance. */
export function UsageBar({ ratio, className }: { ratio: number; className?: string }) {
    const pct = Math.max(0, Math.min(1, ratio)) * 100;
    const over = ratio > 1;
    return (
        <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
            <div
                className={cn(
                    "h-full rounded-full transition-all",
                    over ? "bg-destructive" : ratio > 0.6 ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}
