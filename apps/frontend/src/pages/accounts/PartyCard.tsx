// src/pages/accounts/PartyCard.tsx — one creditor / debtor as a clear, self-contained card.
import { Bell, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import type { AccountDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { ago, daysOverdue, isOverdue, money, niceDate } from "@/lib/accounts/format";
import { cn } from "@/lib/utils";
import { KIND_COLOR } from "./accountsUi";

interface Props {
    account: AccountDTO;
    onOpen: () => void;
    onPay: () => void;
    onRemind: () => void;
    delay?: number;
}

const initials = (name: string) =>
    name
        .replace(/[^\p{L}\p{N} ]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("") || "?";

export default function PartyCard({ account: a, onOpen, onPay, onRemind, delay = 0 }: Props) {
    const creditor = a.kind === "creditor";
    const overdue = isOverdue(a.dueDate, a.balance);
    const settled = a.balance <= 0;
    const pct = a.billed > 0 ? Math.min(100, (a.paid / a.billed) * 100) : 0;
    const stop = (fn: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        fn();
    };

    return (
        <li
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" && e.target === e.currentTarget) onOpen();
            }}
            style={{ animationDelay: `${Math.min(delay, 10) * 25}ms` }}
            className={cn(
                "rise-in glass glass-lift group relative grid cursor-pointer gap-x-5 gap-y-3 overflow-hidden rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_9.5rem] md:items-center xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_9.5rem_auto]",
                overdue && "ring-1 ring-destructive/30",
                settled && "opacity-75",
            )}
        >
            {/* a thin red edge makes late accounts impossible to miss */}
            {overdue && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-destructive" />}

            {/* who */}
            <div className="flex min-w-0 items-center gap-3">
                <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-bold"
                    style={{
                        background: `color-mix(in oklab, ${KIND_COLOR[a.kind]} 16%, white)`,
                        color: `color-mix(in oklab, ${KIND_COLOR[a.kind]} 70%, black)`,
                    }}
                >
                    {initials(a.name)}
                </span>
                <div className="min-w-0">
                    <p
                        className={cn(
                            "truncate text-[15px] font-semibold",
                            !a.active && "text-muted-foreground line-through",
                        )}
                    >
                        {a.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {a.group && <span className="rounded-full bg-muted px-2 py-0.5">{a.group}</span>}
                        {overdue ? (
                            <span className="rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-destructive">
                                {daysOverdue(a.dueDate)} days late · due {niceDate(a.dueDate)}
                            </span>
                        ) : a.dueDate && !settled ? (
                            <span>Due {niceDate(a.dueDate)}</span>
                        ) : settled ? (
                            <span className="flex items-center gap-1 font-medium text-success">
                                <CheckCircle2 className="size-3.5" /> All settled
                            </span>
                        ) : (
                            <span>No due date</span>
                        )}
                        {!a.active && <span className="rounded-full bg-muted px-2 py-0.5">Archived</span>}
                    </p>
                    {(a.lastPayment || a.lastReminder) && (
                        <p className="mt-1 hidden truncate text-[11px] text-muted-foreground/80 sm:block">
                            {a.lastPayment && (
                                <>
                                    {creditor ? "Last paid" : "Last received"} {money(a.lastPayment.amount)} ·{" "}
                                    {niceDate(a.lastPayment.date)}
                                </>
                            )}
                            {a.lastPayment && a.lastReminder && " · "}
                            {a.lastReminder && (
                                <span className="inline-flex items-center gap-1">
                                    <Bell className="size-3" /> reminded {ago(a.lastReminder.at)} by{" "}
                                    {a.lastReminder.by.name}
                                </span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* how far along */}
            <div className="min-w-0">
                <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${Math.round(pct)}% ${creditor ? "paid" : "received"}`}
                >
                    <div
                        className="h-full rounded-full bg-linear-to-r from-success to-emerald-400 transition-[width] duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                    {a.paid > 0 ? (
                        <>
                            {creditor ? "Paid" : "Received"}{" "}
                            <b className="font-semibold text-foreground">{money(a.paid)}</b> of {money(a.billed)}
                        </>
                    ) : (
                        <>{creditor ? "Nothing paid yet" : "Nothing received yet"}</>
                    )}
                </p>
            </div>

            {/* the number that matters */}
            <div className="md:text-right">
                <p
                    className={cn(
                        "text-[22px] leading-none font-semibold tracking-tight tabular-nums",
                        settled && "text-muted-foreground",
                        overdue && "text-destructive",
                    )}
                >
                    {settled ? "₹0" : money(a.balance)}
                </p>
                <p className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {settled ? "nothing pending" : creditor ? "still to pay" : "still to collect"}
                </p>
            </div>

            {/* what to do: one clear action, one optional */}
            <div className="flex flex-wrap items-center gap-2 md:col-span-3 md:justify-end xl:col-span-1">
                <Button
                    onClick={stop(onOpen)}
                    variant="outline"
                    className="h-10 gap-1.5 rounded-xl px-3.5"
                    title="See the full history and details"
                >
                    <Eye className="size-4" /> View details
                </Button>
                {!settled && a.active && (
                    <Button onClick={stop(onPay)} className="h-10 flex-1 rounded-xl px-4 font-semibold md:flex-none">
                        {creditor ? "Make payment" : "Record receipt"}
                    </Button>
                )}
                {!creditor && !settled && a.active && (
                    <Button
                        onClick={stop(onRemind)}
                        variant="outline"
                        className="h-10 gap-1.5 rounded-xl px-3.5"
                        title="Send a payment reminder"
                    >
                        <Bell className="size-4" /> Remind
                    </Button>
                )}
                <ChevronRight
                    className="hidden size-5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:block"
                    aria-hidden
                />
            </div>
        </li>
    );
}
