// src/pages/accounts/OverviewPage.tsx — what you owe, what you're owed, and what's slipping.
import { Link } from "react-router-dom";
import { ArrowRight, History, TriangleAlert } from "lucide-react";
import RankedBars from "@/components/charts/RankedBars";
import { Skeleton } from "@/components/ui/skeleton";
import { daysOverdue, isOverdue, money } from "@/lib/accounts/format";
import { useAccounts, useAccountsSummary, useActivity } from "@/lib/accounts/store";
import { cn } from "@/lib/utils";
import { useAccountsContext } from "./accountsContext";
import { ActivityLine } from "./ActivityPage";
import { KIND_COLOR } from "./accountsUi";

export default function OverviewPage() {
    const { openAccount } = useAccountsContext();
    const summary = useAccountsSummary();
    const accounts = useAccounts();
    const activity = useActivity({ limit: 8 });

    if (summary.isPending || accounts.isPending || !summary.data) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
        );
    }
    const s = summary.data;
    const all = accounts.data ?? [];
    const top = (kind: "creditor" | "debtor") =>
        all
            .filter((a) => a.kind === kind && a.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 8);
    const overdue = all
        .filter((a) => isOverdue(a.dueDate, a.balance))
        .sort((a, b) => daysOverdue(b.dueDate) - daysOverdue(a.dueDate));
    const gross = s.receivable.total + s.payable.total || 1;

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
                <p className="text-sm font-medium text-muted-foreground">
                    Net position — what you're owed, minus what you owe
                </p>
                <p
                    className={cn(
                        "mt-1 text-5xl font-semibold tracking-tight sm:text-6xl",
                        s.net < 0 && "text-destructive",
                    )}
                >
                    {money(s.net)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    {s.net >= 0 ? "You are owed more than you owe." : "You owe more than you are owed."}
                </p>
                <div className="mt-5">
                    <div
                        className="flex h-7 gap-0.5"
                        role="img"
                        aria-label={`To collect ${money(s.receivable.total)}, to pay ${money(s.payable.total)}`}
                    >
                        <div
                            className="flex min-w-0 items-center rounded-[4px] px-2 text-xs font-semibold text-white"
                            style={{ width: `${(s.receivable.total / gross) * 100}%`, background: KIND_COLOR.debtor }}
                        >
                            {Math.round((s.receivable.total / gross) * 100)}%
                        </div>
                        <div
                            className="flex min-w-0 items-center rounded-[4px] px-2 text-xs font-semibold text-white"
                            style={{ width: `${(s.payable.total / gross) * 100}%`, background: KIND_COLOR.creditor }}
                        >
                            {Math.round((s.payable.total / gross) * 100)}%
                        </div>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-[3px]" style={{ background: KIND_COLOR.debtor }} />
                            To collect (debtors)
                        </li>
                        <li className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-[3px]" style={{ background: KIND_COLOR.creditor }} />
                            To pay (creditors)
                        </li>
                    </ul>
                </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card
                    to="/accounts/debtors"
                    label="To collect"
                    value={money(s.receivable.total)}
                    sub={`${s.receivable.count} debtors${s.receivable.overdue ? ` · ${money(s.receivable.overdue)} overdue` : ""}`}
                    accent={KIND_COLOR.debtor}
                />
                <Card
                    to="/accounts/creditors"
                    label="To pay"
                    value={money(s.payable.total)}
                    sub={`${s.payable.count} creditors${s.payable.overdue ? ` · ${money(s.payable.overdue)} overdue` : ""}`}
                    accent={KIND_COLOR.creditor}
                />
                <Card label="Collected this month" value={money(s.thisMonth.collected)} sub="payments received" good />
                <Card label="Paid out this month" value={money(s.thisMonth.paidOut)} sub="payments made" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Who owes you the most" link="/accounts/debtors">
                    <RankedBars
                        rows={top("debtor").map((a) => ({
                            id: a.id,
                            label: a.name,
                            value: a.balance,
                            color: KIND_COLOR.debtor,
                        }))}
                        total={s.receivable.total}
                    />
                </Panel>
                <Panel title="Who you owe the most" link="/accounts/creditors">
                    <RankedBars
                        rows={top("creditor").map((a) => ({
                            id: a.id,
                            label: a.name,
                            value: a.balance,
                            color: KIND_COLOR.creditor,
                        }))}
                        total={s.payable.total}
                    />
                </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-2xl border bg-card shadow-xs">
                    <header className="flex items-center gap-2 border-b px-5 py-3.5">
                        <span className="grid size-7 place-items-center rounded-lg bg-danger-soft text-destructive">
                            <TriangleAlert className="size-4" />
                        </span>
                        <h3 className="font-heading text-base font-semibold">Past their due date</h3>
                        <span className="ml-auto text-xs text-muted-foreground">{overdue.length} accounts</span>
                    </header>
                    {overdue.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing is overdue. 🎉</p>
                    ) : (
                        <ul className="divide-y">
                            {overdue.slice(0, 8).map((a) => (
                                <li key={a.id}>
                                    <button
                                        type="button"
                                        onClick={() => openAccount(a.id)}
                                        className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/50"
                                    >
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{ background: KIND_COLOR[a.kind] }}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold">{a.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {a.kind === "creditor" ? "you owe" : "owes you"} ·{" "}
                                                {daysOverdue(a.dueDate)} days late
                                            </span>
                                        </span>
                                        <b className="tabular-nums">{money(a.balance)}</b>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-2xl border bg-card shadow-xs">
                    <header className="flex items-center gap-2 border-b px-5 py-3.5">
                        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                            <History className="size-4" />
                        </span>
                        <h3 className="font-heading text-base font-semibold">Latest activity</h3>
                        <Link
                            to="/accounts/activity"
                            className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5"
                        >
                            Full log <ArrowRight className="size-3.5" />
                        </Link>
                    </header>
                    <ul className="divide-y">
                        {(activity.data?.items ?? []).map((a) => (
                            <ActivityLine key={a.id} item={a} compact />
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

function Card({
    label,
    value,
    sub,
    accent,
    good,
    to,
}: {
    label: string;
    value: string;
    sub: string;
    accent?: string;
    good?: boolean;
    to?: string;
}) {
    const body = (
        <>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {accent && <span className="size-2 rounded-full" style={{ background: accent }} />}
                {label}
            </p>
            <p className={cn("mt-1 truncate text-2xl font-semibold tracking-tight", good && "text-success")}>{value}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
        </>
    );
    const cls = "rounded-2xl border bg-card p-4 shadow-xs";
    return to ? (
        <Link
            to={to}
            className={cn(cls, "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md")}
        >
            {body}
        </Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

function Panel({ title, link, children }: { title: string; link: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
            <header className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">{title}</h3>
                <Link to={link} className="flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5">
                    See all <ArrowRight className="size-3.5" />
                </Link>
            </header>
            {children}
        </section>
    );
}
