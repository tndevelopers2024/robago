// src/pages/accounts/PartiesPage.tsx — Creditors (to pay) / Debtors (to collect): a clear list, grouped by urgency.
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, LayoutList, Plus, Radio, Search, Table2, X } from "lucide-react";
import { Popover } from "radix-ui";
import type { AccountDTO, AccountKind } from "@robago/shared";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/dashboard/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isOverdue, money } from "@/lib/accounts/format";
import { useAccounts, useAccountsSummary } from "@/lib/accounts/store";
import { cn } from "@/lib/utils";
import { useAccountsContext } from "./accountsContext";
import { KIND_COLOR, KIND_LABEL } from "./accountsUi";
import PartiesSheet from "./PartiesSheet";
import PartyCard from "./PartyCard";

type Filter = "all" | "overdue" | "pending" | "settled";
type Sort = "balance" | "due" | "name" | "recent";
type View = "list" | "sheet";

const SORTS: [Sort, string][] = [
    ["balance", "Biggest amount first"],
    ["due", "Due soonest"],
    ["recent", "Recently paid"],
    ["name", "Name A–Z"],
];
const SUMMARY_KEY = "robago_accounts_summary";
const VIEW_KEY = "robago_accounts_view_v2";

const statusOf = (a: AccountDTO): Exclude<Filter, "all"> =>
    a.balance <= 0 ? "settled" : isOverdue(a.dueDate, a.balance) ? "overdue" : "pending";

function sorter(sort: Sort) {
    return (a: AccountDTO, b: AccountDTO) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "due") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999") || b.balance - a.balance;
        if (sort === "recent")
            return (b.lastPayment?.date ?? "").localeCompare(a.lastPayment?.date ?? "") || b.balance - a.balance;
        return b.balance - a.balance;
    };
}

export default function PartiesPage({ kind }: { kind: AccountKind }) {
    const { openAccount, openEntry, openReminder, addAccount } = useAccountsContext();
    const creditor = kind === "creditor";
    const [filter, setFilter] = useState<Filter>("all");
    const [sort, setSort] = useState<Sort>("balance");
    const [query, setQuery] = useState("");
    const [archived, setArchived] = useState(false);
    const [showSettled, setShowSettled] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState<boolean>(() => {
        try {
            return localStorage.getItem(SUMMARY_KEY) === "open";
        } catch {
            return false;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(SUMMARY_KEY, summaryOpen ? "open" : "closed");
        } catch {
            // ignore
        }
    }, [summaryOpen]);
    const [view, setView] = useState<View>(() => {
        try {
            return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "sheet";
        } catch {
            return "sheet";
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(VIEW_KEY, view);
        } catch {
            // ignore
        }
    }, [view]);

    const q = useAccounts(kind, archived);
    const summary = useAccountsSummary();
    const side = creditor ? summary.data?.payable : summary.data?.receivable;
    const all = useMemo(() => q.data ?? [], [q.data]);

    const counts = useMemo(() => {
        const c = { all: all.length, overdue: 0, pending: 0, settled: 0 };
        for (const a of all) c[statusOf(a)]++;
        return c;
    }, [all]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return all
            .filter(
                (a) =>
                    (!needle || `${a.name} ${a.group} ${a.phone} ${a.email}`.toLowerCase().includes(needle)) &&
                    (filter === "all" || statusOf(a) === filter),
            )
            .sort(sorter(sort));
    }, [all, query, filter, sort]);

    const groups = useMemo(() => {
        if (filter !== "all") return [{ key: filter, title: "", rows: visible }];
        const by = (s: Exclude<Filter, "all">) => visible.filter((a) => statusOf(a) === s);
        return [
            { key: "overdue", title: "Needs attention — past the due date", rows: by("overdue") },
            { key: "pending", title: creditor ? "To pay" : "To collect", rows: by("pending") },
            { key: "settled", title: "Settled", rows: by("settled") },
        ].filter((g) => g.rows.length);
    }, [visible, filter, creditor]);

    if (q.isPending) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-36 w-full rounded-3xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
        );
    }

    const largest = [...all].filter((a) => a.balance > 0).sort((a, b) => b.balance - a.balance)[0];
    const overdueAmt = side?.overdue ?? 0;
    const total = side?.total ?? 0;
    const FILTERS: [Filter, string][] = [
        ["all", "All"],
        ["overdue", "Overdue"],
        ["pending", "Pending"],
        ["settled", "Settled"],
    ];

    const exportCsv = () => {
        const header = "Name,Group,Due date,Total,Paid,Pending,Last payment";
        const rows = visible.map((a) =>
            [
                a.name,
                a.group,
                a.dueDate,
                a.billed,
                a.paid,
                a.balance,
                a.lastPayment ? `${a.lastPayment.amount} on ${a.lastPayment.date}` : "",
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(","),
        );
        const url = URL.createObjectURL(new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" }));
        const el = document.createElement("a");
        el.href = url;
        el.download = `${kind}s.csv`;
        el.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* ---- the big picture: one frosted card that folds down to a single line ---- */}
            <GlassCard className="p-0">
                <button
                    type="button"
                    onClick={() => setSummaryOpen((o) => !o)}
                    aria-expanded={summaryOpen}
                    aria-label={summaryOpen ? "Collapse summary" : "Expand summary"}
                    className="flex w-full flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-6"
                >
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <span className="size-2.5 rounded-full" style={{ background: KIND_COLOR[kind] }} />
                        {creditor ? "Total you have to pay" : "Total you have to collect"}
                    </span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                        {money(total)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        across <b className="text-foreground">{side?.count ?? 0}</b>{" "}
                        {creditor ? "creditors" : "debtors"}
                    </span>
                    {overdueAmt > 0 && (
                        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                            {money(overdueAmt)} overdue
                        </span>
                    )}
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {summaryOpen ? "Hide details" : "Show details"}
                        <ChevronDown
                            className={cn("size-4 transition-transform duration-300", summaryOpen && "rotate-180")}
                        />
                    </span>
                </button>
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        summaryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                >
                    <div className="overflow-hidden">
                        <div className="grid gap-3 border-t border-white/70 p-4 sm:p-5 lg:grid-cols-[1.6fr_1fr_1fr]">
                            <div className="glass-soft rounded-2xl p-4">
                                <p className="text-xs font-medium text-muted-foreground">How much is already late</p>
                                {total > 0 ? (
                                    <div className="mt-3">
                                        <div
                                            className="flex h-2.5 gap-0.5"
                                            role="img"
                                            aria-label={`Overdue ${money(overdueAmt)} of ${money(total)}`}
                                        >
                                            {overdueAmt > 0 && (
                                                <div
                                                    className="rounded-full bg-destructive"
                                                    style={{ width: `${(overdueAmt / total) * 100}%` }}
                                                />
                                            )}
                                            <div
                                                className="flex-1 rounded-full"
                                                style={{ background: KIND_COLOR[kind] }}
                                            />
                                        </div>
                                        <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            {overdueAmt > 0 && (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full bg-destructive" />
                                                    <b className="text-destructive">{money(overdueAmt)}</b> overdue
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <span
                                                    className="size-2 rounded-full"
                                                    style={{ background: KIND_COLOR[kind] }}
                                                />
                                                {money(total - overdueAmt)} not yet due
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-muted-foreground">Nothing pending.</p>
                                )}
                            </div>
                            <Stat
                                label={creditor ? "Paid out this month" : "Collected this month"}
                                value={money(
                                    creditor
                                        ? (summary.data?.thisMonth.paidOut ?? 0)
                                        : (summary.data?.thisMonth.collected ?? 0),
                                )}
                                tone="good"
                            />
                            <Stat
                                label={largest ? `Biggest: ${largest.name}` : "Biggest balance"}
                                value={largest ? money(largest.balance) : "—"}
                                sub={
                                    counts.overdue
                                        ? `${counts.overdue} overdue account${counts.overdue === 1 ? "" : "s"}`
                                        : "nothing overdue"
                                }
                                danger={counts.overdue > 0}
                            />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* ---- one calm toolbar: find + add on top, narrow down below ---- */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${creditor ? "creditors" : "debtors"}…`}
                            aria-label="Search"
                            className="glass-soft h-11 w-full rounded-2xl pr-9 pl-10 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        />
                        {query && (
                            <button
                                aria-label="Clear search"
                                onClick={() => setQuery("")}
                                className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={() => addAccount(kind)}
                        className="h-11 shrink-0 gap-1.5 rounded-2xl px-4 font-semibold"
                    >
                        <Plus /> Add {creditor ? "creditor" : "debtor"}
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className="scrollbar-none -mx-1 flex max-w-full gap-1 overflow-x-auto px-1"
                        role="group"
                        aria-label="Show"
                    >
                        {FILTERS.map(([id, label]) => (
                            <button
                                key={id}
                                aria-pressed={filter === id}
                                onClick={() => setFilter(id)}
                                className={cn(
                                    "flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-transparent px-3.5 text-sm font-medium transition-all",
                                    filter === id
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "glass-soft text-muted-foreground hover:text-foreground",
                                    id === "overdue" && filter !== id && counts.overdue > 0 && "text-destructive",
                                )}
                            >
                                {label}
                                <span
                                    className={cn(
                                        "rounded-full px-1.5 text-xs tabular-nums",
                                        filter === id ? "bg-white/20" : "bg-muted",
                                    )}
                                >
                                    {counts[id]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as Sort)}
                            aria-label="Sort by"
                            className="glass-soft h-11 rounded-2xl px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        >
                            {SORTS.map(([id, label]) => (
                                <option key={id} value={id}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <div className="glass-soft flex rounded-2xl p-1" role="group" aria-label="View">
                            {(
                                [
                                    ["sheet", Table2, "Sheet"],
                                    ["list", LayoutList, "Cards"],
                                ] as const
                            ).map(([id, Icon, label]) => (
                                <button
                                    key={id}
                                    aria-pressed={view === id}
                                    onClick={() => setView(id)}
                                    title={`${label} view`}
                                    className={cn(
                                        "flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
                                        view === id
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    <Icon className="size-4" /> <span className="hidden lg:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <Button
                                    variant="outline"
                                    className="glass-soft h-11 rounded-2xl border-0 px-3"
                                    aria-label="More options"
                                >
                                    More
                                </Button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    align="end"
                                    sideOffset={8}
                                    className="z-50 w-60 rounded-2xl border bg-popover p-2 shadow-xl"
                                >
                                    <button
                                        onClick={exportCsv}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
                                    >
                                        <Download className="size-4 text-muted-foreground" /> Download as CSV
                                    </button>
                                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
                                        <input
                                            type="checkbox"
                                            checked={archived}
                                            onChange={(e) => setArchived(e.target.checked)}
                                            className="size-4 accent-[var(--primary)]"
                                        />
                                        Show archived accounts
                                    </label>
                                    <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                                        <Radio className="size-3.5 text-success" /> Updates by itself every 15 seconds
                                    </p>
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>
            </div>

            {/* ---- the accounts ---- */}
            {view === "sheet" ? (
                <PartiesSheet
                    kind={kind}
                    heightClass={
                        summaryOpen ? "max-h-[max(22rem,calc(100dvh-40rem))]" : "max-h-[max(24rem,calc(100dvh-28rem))]"
                    }
                    rows={visible}
                    onOpen={openAccount}
                    onPay={(id) => openEntry(id, "payment")}
                    onRemind={openReminder}
                />
            ) : all.length === 0 ? (
                <div className="glass grid place-items-center rounded-3xl px-6 py-16 text-center">
                    <h2 className="text-xl font-semibold">No {KIND_LABEL[kind].title.toLowerCase()} yet</h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {creditor
                            ? "Add the people and businesses you owe money to."
                            : "Add the people and businesses who owe you money."}
                    </p>
                    <Button className="mt-5 gap-1.5" onClick={() => addAccount(kind)}>
                        <Plus /> Add {creditor ? "creditor" : "debtor"}
                    </Button>
                </div>
            ) : visible.length === 0 ? (
                <p className="glass rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground">
                    Nothing matches. Try a different search or filter.
                </p>
            ) : (
                <div className="space-y-5">
                    {groups.map((g) => {
                        const collapsed = g.key === "settled" && filter === "all" && !showSettled;
                        const subtotal = g.rows.reduce((s, a) => s + Math.max(a.balance, 0), 0);
                        return (
                            <section key={g.key} aria-label={g.title || "Accounts"}>
                                {g.title && (
                                    <header className="mb-2 flex items-center gap-2 px-1">
                                        <h2
                                            className={cn(
                                                "text-sm font-semibold",
                                                g.key === "overdue" && "text-destructive",
                                            )}
                                        >
                                            {g.title}
                                        </h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {g.rows.length}
                                        </span>
                                        {g.key !== "settled" && (
                                            <span className="ml-auto text-sm font-semibold tabular-nums text-muted-foreground">
                                                {money(subtotal)}
                                            </span>
                                        )}
                                        {g.key === "settled" && filter === "all" && (
                                            <button
                                                onClick={() => setShowSettled((s) => !s)}
                                                className="ml-auto text-xs font-medium text-primary hover:underline"
                                            >
                                                {showSettled ? "Hide" : "Show"}
                                            </button>
                                        )}
                                    </header>
                                )}
                                {!collapsed && (
                                    <ul className="space-y-2.5">
                                        {g.rows.map((a, i) => (
                                            <PartyCard
                                                key={a.id}
                                                account={a}
                                                delay={i}
                                                onOpen={() => openAccount(a.id)}
                                                onPay={() => openEntry(a.id, "payment")}
                                                onRemind={() => openReminder(a.id)}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
            <p className="pt-1 text-center text-xs text-muted-foreground">
                Tap any card to see its full history, contact details and activity.
            </p>
        </div>
    );
}

function Stat({
    label,
    value,
    sub,
    tone,
    danger,
}: {
    label: string;
    value: string;
    sub?: string;
    tone?: "good";
    danger?: boolean;
}) {
    return (
        <div className="glass-soft min-w-0 rounded-2xl p-4">
            <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "mt-1 text-2xl font-semibold tracking-tight break-words tabular-nums",
                    tone === "good" && "text-success",
                    danger && "text-destructive",
                )}
            >
                {value}
            </p>
            {sub && (
                <p className={cn("mt-0.5 text-sm", danger ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {sub}
                </p>
            )}
        </div>
    );
}
