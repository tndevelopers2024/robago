// src/pages/accounts/ActivityPage.tsx — the log: who did what, to which account, and when.
import { useState } from "react";
import { Download, Radio } from "lucide-react";
import { AuditAction, type AuditDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ago, exactTime, money } from "@/lib/accounts/format";
import { useAccounts, useActivity } from "@/lib/accounts/store";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "@/pages/staff/staffUi";

const ACTION_STYLE: Record<AuditAction, { label: string; cls: string }> = {
    "entry.payment": { label: "Payment", cls: "bg-success-soft text-success" },
    "entry.charge": { label: "Bill / amount", cls: "bg-warning-soft text-warning" },
    "entry.void": { label: "Voided", cls: "bg-danger-soft text-destructive" },
    "account.create": { label: "Added", cls: "bg-accent text-accent-foreground" },
    "account.update": { label: "Edited", cls: "bg-muted text-muted-foreground" },
    "account.archive": { label: "Archived", cls: "bg-muted text-muted-foreground" },
    "account.restore": { label: "Restored", cls: "bg-muted text-muted-foreground" },
    "reminder.email": { label: "Email reminder", cls: "bg-violet-100 text-violet-700" },
    "reminder.whatsapp": { label: "WhatsApp reminder", cls: "bg-violet-100 text-violet-700" },
};

/** One entry of the log. Shared by this page and the per-account Activity tab. */
export function ActivityLine({ item: a, compact }: { item: AuditDTO; compact?: boolean }) {
    const d = a.data as Record<string, unknown>;
    const style = ACTION_STYLE[a.action];
    const chips: string[] = [];
    if (typeof d.method === "string" && d.method) chips.push(String(d.method).toUpperCase());
    if (typeof d.reference === "string" && d.reference) chips.push(`ref ${d.reference}`);
    if (typeof d.balanceAfter === "number") chips.push(`balance after ${money(d.balanceAfter)}`);
    if (typeof d.to === "string" && d.to) chips.push(`to ${d.to}`);
    if (d.status === "failed") chips.push("FAILED");
    const note = typeof d.note === "string" && d.note ? d.note : "";

    return (
        <li className={cn("flex gap-3 px-4 py-3", !compact && "px-5")}>
            <EmployeeAvatar name={a.actor.name || "?"} className="mt-0.5 size-9 text-xs" />
            <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                    <b className="font-semibold" title={a.actor.phone}>
                        {a.actor.name}
                    </b>{" "}
                    {a.summary}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                        className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", style?.cls ?? "bg-muted")}
                    >
                        {style?.label ?? a.action}
                    </span>
                    {chips.map((c) => (
                        <span
                            key={c}
                            className={cn(
                                "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
                                c === "FAILED" && "bg-danger-soft text-destructive",
                            )}
                        >
                            {c}
                        </span>
                    ))}
                </div>
                {note && <p className="mt-1 text-xs text-muted-foreground">“{note}”</p>}
            </div>
            <time className="shrink-0 text-right text-xs text-muted-foreground" dateTime={a.at} title={exactTime(a.at)}>
                <span className="block font-medium text-foreground/70">{ago(a.at)}</span>
                <span className="hidden sm:block">{exactTime(a.at)}</span>
            </time>
        </li>
    );
}

const selectCls =
    "h-10 rounded-xl border bg-card px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

export default function ActivityPage() {
    const [user, setUser] = useState("");
    const [action, setAction] = useState("");
    const [accountId, setAccountId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [limit, setLimit] = useState(50);

    const filters = {
        ...(user ? { user } : {}),
        ...(action ? { action: action as AuditAction } : {}),
        ...(accountId ? { accountId } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        limit,
    };
    const q = useActivity(filters);
    const { data: accounts = [] } = useAccounts(undefined, true);
    const anyFilter = Boolean(user || action || accountId || from || to);

    const exportCsv = () => {
        const rows = (q.data?.items ?? []).map((a) =>
            [a.at, a.actor.name, a.action, a.accountName, a.summary]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(","),
        );
        const url = URL.createObjectURL(
            new Blob([["When,Who,Action,Account,What", ...rows].join("\n")], { type: "text/csv;charset=utf-8" }),
        );
        const el = document.createElement("a");
        el.href = url;
        el.download = "activity-log.csv";
        el.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <select
                    className={selectCls}
                    value={user}
                    onChange={(e) => {
                        setUser(e.target.value);
                        setLimit(50);
                    }}
                    aria-label="Filter by person"
                >
                    <option value="">Everyone</option>
                    {(q.data?.actors ?? []).map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
                <select
                    className={selectCls}
                    value={action}
                    onChange={(e) => {
                        setAction(e.target.value);
                        setLimit(50);
                    }}
                    aria-label="Filter by action"
                >
                    <option value="">Every action</option>
                    {Object.values(AuditAction).map((a) => (
                        <option key={a} value={a}>
                            {ACTION_STYLE[a].label}
                        </option>
                    ))}
                </select>
                <select
                    className={cn(selectCls, "max-w-52")}
                    value={accountId}
                    onChange={(e) => {
                        setAccountId(e.target.value);
                        setLimit(50);
                    }}
                    aria-label="Filter by account"
                >
                    <option value="">Every account</option>
                    <optgroup label="Creditors">
                        {accounts
                            .filter((a) => a.kind === "creditor")
                            .map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                    </optgroup>
                    <optgroup label="Debtors">
                        {accounts
                            .filter((a) => a.kind === "debtor")
                            .map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                    </optgroup>
                </select>
                <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={selectCls}
                    aria-label="From date"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={selectCls}
                    aria-label="To date"
                />
                {anyFilter && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setUser("");
                            setAction("");
                            setAccountId("");
                            setFrom("");
                            setTo("");
                        }}
                    >
                        Clear
                    </Button>
                )}
                <span
                    className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"
                    title="Refreshes by itself every 15 seconds"
                >
                    <Radio className="size-3.5 text-success" /> Live
                </span>
                <Button variant="outline" className="h-10 gap-1.5 rounded-xl" onClick={exportCsv}>
                    <Download /> <span className="hidden sm:inline">Export</span>
                </Button>
            </div>

            <section
                className={cn(
                    "rounded-2xl border bg-card shadow-xs transition-opacity",
                    q.isFetching && q.isPlaceholderData && "opacity-60",
                )}
            >
                {q.isPending ? (
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : q.data && q.data.items.length > 0 ? (
                    <>
                        <ul className="divide-y">
                            {q.data.items.map((a) => (
                                <ActivityLine key={a.id} item={a} />
                            ))}
                        </ul>
                        {q.data.nextBefore && limit < 200 && (
                            <div className="border-t p-3 text-center">
                                <Button variant="outline" onClick={() => setLimit((l) => Math.min(200, l + 50))}>
                                    Show older
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="px-6 py-14 text-center text-sm text-muted-foreground">
                        {anyFilter ? "Nothing matches these filters." : "Nothing has been recorded yet."}
                    </p>
                )}
            </section>
        </div>
    );
}
