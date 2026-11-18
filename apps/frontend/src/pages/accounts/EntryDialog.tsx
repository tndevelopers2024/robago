// src/pages/accounts/EntryDialog.tsx — record a payment (or add a new bill/advance) in a few seconds.
import { useState, type FormEvent } from "react";
import { addDays, format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod, type EntryType } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import { money } from "@/lib/accounts/format";
import { accountActions, useAccounts } from "@/lib/accounts/store";
import { parseAmount } from "@/lib/staff/calc";
import { cn } from "@/lib/utils";
import { KIND_LABEL } from "./accountsUi";

interface Props {
    entry: { accountId: string; type: EntryType } | null;
    onClose: () => void;
}

export default function EntryDialog({ entry, onClose }: Props) {
    return (
        <Dialog open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}>
            {entry && (
                <Body
                    key={`${entry.accountId}:${entry.type}`}
                    accountId={entry.accountId}
                    initialType={entry.type}
                    onClose={onClose}
                />
            )}
        </Dialog>
    );
}

const METHODS: { id: PaymentMethod; label: string }[] = [
    { id: "upi", label: "UPI" },
    { id: "bank", label: "Bank transfer" },
    { id: "cash", label: "Cash" },
    { id: "cheque", label: "Cheque" },
    { id: "other", label: "Other" },
];

function Body({ accountId, initialType, onClose }: { accountId: string; initialType: EntryType; onClose: () => void }) {
    const { data: accounts = [] } = useAccounts();
    const account = accounts.find((a) => a.id === accountId);
    const [type, setType] = useState<EntryType>(initialType);
    const [amountText, setAmountText] = useState("");
    const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const [method, setMethod] = useState<PaymentMethod | "">("");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    if (!account) return null;
    const isCreditor = account.kind === "creditor";
    const amount = parseAmount(amountText) ?? 0;
    const balanceAfter = type === "payment" ? account.balance - amount : account.balance + amount;
    const over = type === "payment" && amount > account.balance && account.balance >= 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!(amount > 0)) return setError("Enter an amount greater than 0.");
        setSaving(true);
        setError(null);
        try {
            await accountActions.addEntry(account.id, {
                type,
                amount,
                date,
                method: method || undefined,
                reference: reference.trim() || undefined,
                note: note.trim() || undefined,
            });
            const verb = type === "payment" ? (isCreditor ? "Paid" : "Received") : "Added";
            toast.success(`${verb} ${money(amount)} ${isCreditor ? "to" : "from"} ${account.name}`, {
                description: `Still ${money(Math.max(balanceAfter, 0))} pending. Saved in the activity log.`,
            });
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't save. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
            <form onSubmit={submit}>
                <DialogHeader className="space-y-1 border-b px-5 py-4 text-left">
                    <DialogTitle>
                        {type === "payment"
                            ? isCreditor
                                ? "Record a payment to"
                                : "Record money received from"
                            : isCreditor
                              ? "Add a new bill from"
                              : "Add a new amount owed by"}{" "}
                        {account.name}
                    </DialogTitle>
                    <DialogDescription>
                        Pending now: <b className="text-foreground">{money(account.balance)}</b>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-5 py-4">
                    <div className="grid grid-cols-2 rounded-xl border p-0.5" role="group" aria-label="Entry type">
                        {(["payment", "charge"] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                aria-pressed={type === t}
                                onClick={() => setType(t)}
                                className={cn(
                                    "h-9 rounded-lg text-sm font-medium transition-colors",
                                    type === t
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {t === "payment"
                                    ? isCreditor
                                        ? "Payment made"
                                        : "Payment received"
                                    : isCreditor
                                      ? "New bill"
                                      : "New advance / amount"}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="amt">
                            Amount (₹)
                        </label>
                        <Input
                            id="amt"
                            autoFocus
                            value={amountText}
                            onChange={(e) => setAmountText(e.target.value)}
                            inputMode="decimal"
                            placeholder="0"
                            className="mt-1 h-14 text-3xl font-semibold"
                        />
                        {type === "payment" && account.balance > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setAmountText(String(account.balance))}
                                    className="rounded-full border bg-card px-3 py-1 text-sm hover:border-primary/40"
                                >
                                    Full {money(account.balance)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAmountText(String(Math.round((account.balance / 2) * 100) / 100))}
                                    className="rounded-full border bg-card px-3 py-1 text-sm hover:border-primary/40"
                                >
                                    Half {money(Math.round((account.balance / 2) * 100) / 100)}
                                </button>
                            </div>
                        )}
                    </div>

                    {amount > 0 && (
                        <p
                            className={cn(
                                "rounded-xl px-3 py-2 text-sm",
                                over ? "bg-warning-soft text-warning" : "bg-muted/60 text-muted-foreground",
                            )}
                        >
                            {over && <AlertTriangle className="mr-1.5 mb-0.5 inline size-4" />}
                            {over ? (
                                <>
                                    This is <b>{money(amount - account.balance)}</b> more than what's pending — the
                                    balance will go to <b>{money(balanceAfter)}</b> (an advance).
                                </>
                            ) : (
                                <>
                                    Balance after this: <b className="text-foreground">{money(balanceAfter)}</b>
                                </>
                            )}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Date</span>
                        {[
                            ["Today", today],
                            ["Yesterday", yesterday],
                        ].map(([l, v]) => (
                            <button
                                key={l}
                                type="button"
                                aria-pressed={date === v}
                                onClick={() => setDate(v as string)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-sm font-medium",
                                    date === v
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-card hover:border-primary/40",
                                )}
                            >
                                {l}
                            </button>
                        ))}
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => e.target.value && setDate(e.target.value)}
                            aria-label="Pick a date"
                            className="h-8 rounded-full border bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        />
                    </div>

                    {type === "payment" && (
                        <div>
                            <span className="text-xs font-medium text-muted-foreground">How was it paid?</span>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {METHODS.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        aria-pressed={method === m.id}
                                        onClick={() => setMethod(method === m.id ? "" : m.id)}
                                        className={cn(
                                            "rounded-full border px-3 py-1 text-sm",
                                            method === m.id
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "bg-card hover:border-primary/40",
                                        )}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Reference / cheque no.</span>
                            <Input
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="optional"
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Note</span>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. part payment, as discussed"
                            />
                        </label>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive"
                        >
                            {error}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {KIND_LABEL[account.kind].title.slice(0, -1)} entries can't be edited or deleted — if something
                        is wrong you void it with a reason, and the history stays.
                    </p>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background px-5 py-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving || !(amount > 0)}>
                        {saving
                            ? "Saving…"
                            : type === "payment"
                              ? isCreditor
                                  ? "Record payment"
                                  : "Record receipt"
                              : "Add"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
