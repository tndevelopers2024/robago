// src/pages/accounts/AccountDrawer.tsx — one account: balance, ledger (with who/when on every row), activity.
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Archive,
    ArchiveRestore,
    ArrowDownLeft,
    ArrowUpRight,
    BellRing,
    Mail,
    MessageCircle,
    Pencil,
    Phone,
    Plus,
    Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type { AccountDTO, AuditDTO, EntryDTO, EntryType } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { ago, daysOverdue, exactTime, isOverdue, money, niceDate } from "@/lib/accounts/format";
import { accountActions, useAccountDetail } from "@/lib/accounts/store";
import { cn } from "@/lib/utils";
import { ActorChip, KIND_COLOR, KIND_LABEL } from "./accountsUi";
import { ActivityLine } from "./ActivityPage";

interface Props {
    accountId: string | null;
    onClose: () => void;
    onEntry: (accountId: string, type: EntryType) => void;
    onRemind: (accountId: string) => void;
    onEdit: (accountId: string) => void;
}

export default function AccountDrawer({ accountId, onClose, onEntry, onRemind, onEdit }: Props) {
    const q = useAccountDetail(accountId);
    return (
        <Sheet open={Boolean(accountId)} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto bg-background p-0 sm:max-w-xl [&>button]:z-10 [&>button]:text-white [&>button]:opacity-80"
            >
                <SheetDescription className="sr-only">Balance, payments and activity</SheetDescription>
                {q.data ? (
                    <Body
                        account={q.data.account}
                        entries={q.data.entries}
                        activity={q.data.activity}
                        onEntry={onEntry}
                        onRemind={onRemind}
                        onEdit={onEdit}
                    />
                ) : (
                    <div className="space-y-4 p-6">
                        <SheetTitle className="sr-only">Loading account</SheetTitle>
                        <Skeleton className="h-40 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Body({
    account,
    entries,
    activity,
    onEntry,
    onRemind,
    onEdit,
}: {
    account: AccountDTO;
    entries: EntryDTO[];
    activity: AuditDTO[];
    onEntry: Props["onEntry"];
    onRemind: Props["onRemind"];
    onEdit: Props["onEdit"];
}) {
    const [tab, setTab] = useState<"ledger" | "activity">("ledger");
    const creditor = account.kind === "creditor";
    const overdue = isOverdue(account.dueDate, account.balance);
    const pct = account.billed > 0 ? Math.min(100, (account.paid / account.billed) * 100) : 0;

    const toggleArchive = async () => {
        try {
            await accountActions.updateAccount(account.id, { active: !account.active });
            toast.success(account.active ? `Archived ${account.name}` : `Restored ${account.name}`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update."));
        }
    };

    return (
        <div className="space-y-4 pb-6">
            <div className="relative overflow-hidden bg-sidebar px-5 pt-6 pb-5 text-white">
                <div className="pointer-events-none absolute -top-20 -right-10 size-60 rounded-full bg-brand/30 blur-3xl" />
                <div className="relative">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
                        <span className="size-2 rounded-full" style={{ background: KIND_COLOR[account.kind] }} />
                        {KIND_LABEL[account.kind].title.slice(0, -1)} · {KIND_LABEL[account.kind].short.toLowerCase()}
                        {account.group && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 normal-case">{account.group}</span>
                        )}
                        {!account.active && (
                            <span className="rounded-full bg-destructive/40 px-2 py-0.5 normal-case">Archived</span>
                        )}
                    </p>
                    <SheetTitle className="font-heading mt-1 pr-8 text-2xl font-semibold text-white">
                        {account.name}
                    </SheetTitle>
                    <p className="mt-3 text-xs font-medium text-white/50 uppercase">Pending</p>
                    <p
                        className={cn(
                            "text-4xl font-semibold tracking-tight",
                            account.balance < 0 && "text-emerald-300",
                        )}
                    >
                        {money(account.balance)}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-brand to-primary"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="mt-1.5 flex flex-wrap justify-between gap-x-4 text-xs text-white/60">
                        <span>
                            {creditor ? "Paid" : "Received"} {money(account.paid)} of {money(account.billed)}
                        </span>
                        {account.dueDate && (
                            <span className={overdue ? "font-semibold text-red-300" : ""}>
                                {overdue ? `Overdue by ${daysOverdue(account.dueDate)} days · ` : "Due "}
                                {niceDate(account.dueDate)}
                            </span>
                        )}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            disabled={!account.active}
                            onClick={() => onEntry(account.id, "payment")}
                            className="gap-1.5 bg-brand text-sidebar hover:bg-brand/90"
                        >
                            <ArrowDownLeft className="size-4" /> {creditor ? "Record payment" : "Record receipt"}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={!account.active}
                            onClick={() => onEntry(account.id, "charge")}
                            className="gap-1.5"
                        >
                            <Plus className="size-4" /> {creditor ? "New bill" : "New amount"}
                        </Button>
                        {!creditor && (
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={account.balance <= 0}
                                onClick={() => onRemind(account.id)}
                                className="gap-1.5"
                            >
                                <BellRing className="size-4" /> Remind
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-4 sm:px-5">
                <section className="rounded-2xl border bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h3 className="font-heading text-base font-semibold">Contact</h3>
                        <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onEdit(account.id)}>
                                <Pencil className="size-3.5" /> Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => void toggleArchive()}>
                                {account.active ? (
                                    <Archive className="size-3.5" />
                                ) : (
                                    <ArchiveRestore className="size-3.5" />
                                )}
                                {account.active ? "Archive" : "Restore"}
                            </Button>
                        </div>
                    </div>
                    <dl className="mt-2 space-y-1.5 text-sm">
                        <Row
                            icon={Phone}
                            value={account.phone}
                            empty="No phone yet"
                            href={account.phone ? `tel:${account.phone}` : undefined}
                        />
                        <Row
                            icon={MessageCircle}
                            value={account.phone ? "WhatsApp reminders go to this number" : ""}
                            empty="Add a phone to send WhatsApp reminders"
                        />
                        <Row
                            icon={Mail}
                            value={account.email}
                            empty="No email yet"
                            href={account.email ? `mailto:${account.email}` : undefined}
                        />
                    </dl>
                    {account.notes && (
                        <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                            {account.notes}
                        </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                        Added by <ActorChip actor={account.createdBy} at={account.createdAt} /> · last changed by{" "}
                        <ActorChip actor={account.updatedBy} at={account.updatedAt} /> {ago(account.updatedAt)}
                        {account.lastReminder && (
                            <>
                                {" "}
                                · last reminder {ago(account.lastReminder.at)} by{" "}
                                <ActorChip actor={account.lastReminder.by} /> ({account.lastReminder.channel})
                            </>
                        )}
                    </p>
                </section>

                <div className="flex rounded-xl border bg-card p-1" role="tablist">
                    {(["ledger", "activity"] as const).map((t) => (
                        <button
                            key={t}
                            role="tab"
                            aria-selected={tab === t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors",
                                tab === t
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {t === "ledger"
                                ? `Payments & bills (${entries.length})`
                                : `Activity log (${activity.length})`}
                        </button>
                    ))}
                </div>

                {tab === "ledger" ? (
                    <ul className="space-y-2">
                        {entries.map((e) => (
                            <EntryRow key={e.id} entry={e} creditor={creditor} />
                        ))}
                        {entries.length === 0 && (
                            <li className="py-8 text-center text-sm text-muted-foreground">No entries yet.</li>
                        )}
                    </ul>
                ) : (
                    <ul className="divide-y rounded-2xl border bg-card">
                        {activity.map((a) => (
                            <ActivityLine key={a.id} item={a} compact />
                        ))}
                        {activity.length === 0 && (
                            <li className="py-8 text-center text-sm text-muted-foreground">Nothing recorded yet.</li>
                        )}
                    </ul>
                )}
                <p className="text-center text-xs text-muted-foreground">
                    <Link to="/accounts/activity" className="font-medium text-primary hover:underline">
                        Open the full activity log
                    </Link>
                </p>
            </div>
        </div>
    );
}

function Row({ icon: Icon, value, empty, href }: { icon: typeof Phone; value: string; empty: string; href?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            {value ? (
                href ? (
                    <a href={href} className="font-medium hover:text-primary hover:underline">
                        {value}
                    </a>
                ) : (
                    <span>{value}</span>
                )
            ) : (
                <span className="text-muted-foreground/70">{empty}</span>
            )}
        </div>
    );
}

const METHOD_LABEL: Record<string, string> = {
    cash: "Cash",
    bank: "Bank transfer",
    upi: "UPI",
    cheque: "Cheque",
    other: "Other",
};

function EntryRow({ entry: e, creditor }: { entry: EntryDTO; creditor: boolean }) {
    const [voiding, setVoiding] = useState(false);
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const payment = e.type === "payment";
    const isVoid = Boolean(e.void);

    const confirmVoid = async () => {
        setBusy(true);
        setError(null);
        try {
            await accountActions.voidEntry(e.id, { reason });
            toast.success("Entry voided — it stays in the history.");
            setVoiding(false);
        } catch (err) {
            setError(getFieldErrors(err)?.reason ?? getErrorMessage(err, "Couldn't void."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <li className={cn("rounded-2xl border bg-card p-3.5 shadow-xs", isVoid && "bg-muted/40")}>
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                        payment ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                        isVoid && "opacity-50",
                    )}
                >
                    {payment ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                        <p className={cn("text-sm font-semibold", isVoid && "text-muted-foreground line-through")}>
                            {payment
                                ? creditor
                                    ? "Payment made"
                                    : "Payment received"
                                : creditor
                                  ? "New bill"
                                  : "New amount owed"}
                        </p>
                        <p
                            className={cn(
                                "text-base font-bold tabular-nums",
                                isVoid
                                    ? "text-muted-foreground line-through"
                                    : payment
                                      ? "text-success"
                                      : "text-foreground",
                            )}
                        >
                            {payment ? "−" : "+"}
                            {money(e.amount)}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {niceDate(e.date)}
                        {e.method && ` · ${METHOD_LABEL[e.method] ?? e.method}`}
                        {e.reference && ` · ref ${e.reference}`}
                    </p>
                    {e.note && <p className="mt-1 text-sm text-foreground/80">“{e.note}”</p>}
                    <p className="mt-1.5 text-xs text-muted-foreground" title={exactTime(e.createdAt)}>
                        Recorded by <ActorChip actor={e.createdBy} /> · {ago(e.createdAt)}
                    </p>
                    {isVoid && e.void && (
                        <p
                            className="mt-2 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs text-destructive"
                            title={exactTime(e.void.at)}
                        >
                            <b>Voided</b> by {e.void.by.name} · {ago(e.void.at)} — “{e.void.reason}”
                        </p>
                    )}
                </div>
                {!isVoid && !voiding && (
                    <button
                        type="button"
                        title="Void this entry"
                        aria-label="Void this entry"
                        onClick={() => setVoiding(true)}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-destructive"
                    >
                        <Undo2 className="size-4" />
                    </button>
                )}
            </div>
            {voiding && (
                <div className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3">
                    <p className="text-xs font-medium">
                        Why is this being voided? It stays visible, struck through, with your name.
                    </p>
                    <input
                        autoFocus
                        value={reason}
                        onChange={(ev) => setReason(ev.target.value)}
                        onKeyDown={(ev) => ev.key === "Enter" && void confirmVoid()}
                        placeholder="e.g. typed in the wrong account"
                        className="h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    />
                    {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setVoiding(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy || reason.trim().length < 3}
                            onClick={() => void confirmVoid()}
                        >
                            Void entry
                        </Button>
                    </div>
                </div>
            )}
        </li>
    );
}
