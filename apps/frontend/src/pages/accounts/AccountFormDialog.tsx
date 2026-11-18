// src/pages/accounts/AccountFormDialog.tsx — add a creditor/debtor, or edit one's details.
import { useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import type { AccountDTO, AccountKind } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { accountActions, useAccountDetail, useAccounts } from "@/lib/accounts/store";
import { parseAmount } from "@/lib/staff/calc";
import { cn } from "@/lib/utils";
import { KIND_COLOR, KIND_LABEL } from "./accountsUi";

interface Props {
    open: boolean;
    kind: AccountKind;
    /** null = add a new one. */
    accountId: string | null;
    onOpenChange: (o: boolean) => void;
}

export default function AccountFormDialog({ open, kind, accountId, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && (
                <Body key={accountId ?? `new-${kind}`} kind={kind} accountId={accountId} onOpenChange={onOpenChange} />
            )}
        </Dialog>
    );
}

interface FormState {
    name: string;
    group: string;
    phone: string;
    email: string;
    dueDate: string;
    notes: string;
}
const fromAccount = (a: AccountDTO): FormState => ({
    name: a.name,
    group: a.group,
    phone: a.phone,
    email: a.email,
    dueDate: a.dueDate,
    notes: a.notes,
});

function Body({
    kind: initialKind,
    accountId,
    onOpenChange,
}: {
    kind: AccountKind;
    accountId: string | null;
    onOpenChange: (o: boolean) => void;
}) {
    const detail = useAccountDetail(accountId);
    const { data: all = [] } = useAccounts(undefined, true);
    if (accountId && !detail.data) return null;
    return (
        <Form
            initialKind={initialKind}
            existing={detail.data?.account ?? null}
            groups={[...new Set(all.map((a) => a.group).filter(Boolean))]}
            reload={async () => (await detail.refetch()).data?.account ?? null}
            onOpenChange={onOpenChange}
        />
    );
}

function Form({
    initialKind,
    existing,
    groups,
    reload,
    onOpenChange,
}: {
    initialKind: AccountKind;
    existing: AccountDTO | null;
    groups: string[];
    reload: () => Promise<AccountDTO | null>;
    onOpenChange: (o: boolean) => void;
}) {
    const [kind, setKind] = useState<AccountKind>(existing?.kind ?? initialKind);
    const [form, setForm] = useState<FormState>(
        existing ? fromAccount(existing) : { name: "", group: "", phone: "", email: "", dueDate: "", notes: "" },
    );
    const [stamp, setStamp] = useState(existing?.updatedAt ?? "");
    const [opening, setOpening] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [conflict, setConflict] = useState(false);
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return setErrors({ name: "Name is required" });
        setSaving(true);
        setErrors({});
        setMessage(null);
        try {
            if (existing) await accountActions.updateAccount(existing.id, { ...form, expectedUpdatedAt: stamp });
            else {
                const ob = parseAmount(opening);
                await accountActions.createAccount({ ...form, kind, ...(ob && ob > 0 ? { openingBalance: ob } : {}) });
            }
            onOpenChange(false);
        } catch (err) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setErrors(getFieldErrors(err) ?? {});
            setMessage(getErrorMessage(err, "Couldn't save. Please try again."));
            setConflict(Boolean(existing) && status === 409 && !getFieldErrors(err));
        } finally {
            setSaving(false);
        }
    };

    const loadLatest = async () => {
        const fresh = await reload();
        if (fresh) {
            setForm(fromAccount(fresh));
            setStamp(fresh.updatedAt);
            setConflict(false);
            setMessage(null);
        }
    };

    return (
        <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
            <form onSubmit={submit}>
                <DialogHeader className="space-y-1 border-b px-5 py-4 text-left">
                    <DialogTitle>
                        {existing ? `Edit ${existing.name}` : `Add ${kind === "creditor" ? "a creditor" : "a debtor"}`}
                    </DialogTitle>
                    <DialogDescription>
                        {existing ? (
                            <>
                                Last changed by <b>{existing.updatedBy.name}</b>.
                            </>
                        ) : kind === "creditor" ? (
                            "Someone you owe money to."
                        ) : (
                            "Someone who owes you money."
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-5 py-4">
                    {!existing && (
                        <div className="grid grid-cols-2 rounded-xl border p-0.5" role="group" aria-label="Type">
                            {(["creditor", "debtor"] as const).map((k) => (
                                <button
                                    key={k}
                                    type="button"
                                    aria-pressed={kind === k}
                                    onClick={() => setKind(k)}
                                    className={cn(
                                        "flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium",
                                        kind === k
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    <span className="size-2 rounded-full" style={{ background: KIND_COLOR[k] }} />
                                    {KIND_LABEL[k].title} · {KIND_LABEL[k].short.toLowerCase()}
                                </button>
                            ))}
                        </div>
                    )}
                    <Field label="Name *" error={errors.name}>
                        <Input autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Phone / WhatsApp" error={errors.phone}>
                            <Input
                                type="tel"
                                inputMode="tel"
                                value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                                placeholder="98765 43210"
                            />
                        </Field>
                        <Field label="Email" error={errors.email}>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => set("email", e.target.value)}
                                placeholder="accounts@company.com"
                            />
                        </Field>
                        <Field label={kind === "creditor" ? "Pay by (due date)" : "Expect payment by"}>
                            <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
                        </Field>
                        <Field label="Group / company (optional)">
                            <Input
                                list="acc-groups"
                                value={form.group}
                                onChange={(e) => set("group", e.target.value)}
                                placeholder="e.g. Robago, S A Impex"
                            />
                            <datalist id="acc-groups">
                                {groups.map((g) => (
                                    <option key={g} value={g} />
                                ))}
                            </datalist>
                        </Field>
                    </div>
                    {!existing && (
                        <Field label="Amount outstanding today (₹)" hint="Becomes the first entry in their ledger.">
                            <Input
                                value={opening}
                                onChange={(e) => setOpening(e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                                className="text-lg font-semibold"
                            />
                        </Field>
                    )}
                    <Field label="Notes">
                        <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                    </Field>

                    {message && (
                        <div
                            role="alert"
                            className="space-y-2 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive"
                        >
                            <p>{message}</p>
                            {conflict && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 bg-card"
                                    onClick={() => void loadLatest()}
                                >
                                    <RefreshCw className="size-3.5" /> Load their changes
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background px-5 py-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving || conflict}>
                        {saving ? "Saving…" : existing ? "Save changes" : "Add"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

function Field({
    label,
    error,
    hint,
    children,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
            {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
            {error && <span className="text-xs font-medium text-destructive">{error}</span>}
        </label>
    );
}
