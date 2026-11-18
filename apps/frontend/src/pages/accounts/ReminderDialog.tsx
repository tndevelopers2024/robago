// src/pages/accounts/ReminderDialog.tsx — remind a debtor by WhatsApp or email. Every reminder is logged with who sent it.
import { useState } from "react";
import { MessageCircle, Mail, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { buildReminderMessage, buildReminderSubject, type AccountDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { ago, money } from "@/lib/accounts/format";
import { accountActions, useAccountsSummary, useAccounts } from "@/lib/accounts/store";
import { cn } from "@/lib/utils";

interface Props {
    accountId: string | null;
    onClose: () => void;
    onEdit: (id: string) => void;
}

export default function ReminderDialog({ accountId, onClose, onEdit }: Props) {
    return (
        <Dialog open={Boolean(accountId)} onOpenChange={(o) => !o && onClose()}>
            {accountId && <Body key={accountId} accountId={accountId} onClose={onClose} onEdit={onEdit} />}
        </Dialog>
    );
}

const COMPANY = "Robago";

function Body({
    accountId,
    onClose,
    onEdit,
}: {
    accountId: string;
    onClose: () => void;
    onEdit: (id: string) => void;
}) {
    const { user } = useAuth();
    const { data: accounts = [] } = useAccounts();
    const { data: summary } = useAccountsSummary();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return null;
    return (
        <Form
            account={account}
            senderName={user?.name ?? "Robago Accounts"}
            emailConfigured={summary?.emailConfigured ?? true}
            onClose={onClose}
            onEdit={onEdit}
        />
    );
}

function Form({
    account,
    senderName,
    emailConfigured,
    onClose,
    onEdit,
}: {
    account: AccountDTO;
    senderName: string;
    emailConfigured: boolean;
    onClose: () => void;
    onEdit: (id: string) => void;
}) {
    const [channel, setChannel] = useState<"whatsapp" | "email">(
        account.phone || !account.email ? "whatsapp" : "email",
    );
    const [message, setMessage] = useState(() =>
        buildReminderMessage({
            name: account.name,
            balance: account.balance,
            dueDate: account.dueDate,
            senderName,
            company: COMPANY,
            lastPayment: account.lastPayment
                ? { date: account.lastPayment.date, amount: account.lastPayment.amount }
                : null,
        }),
    );
    const [subject, setSubject] = useState(() => buildReminderSubject({ balance: account.balance, company: COMPANY }));
    const [quick, setQuick] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const recentlyReminded =
        account.lastReminder && Date.now() - new Date(account.lastReminder.at).getTime() < 24 * 3600 * 1000;
    const contact = channel === "whatsapp" ? account.phone : account.email;

    const saveContact = async () => {
        if (!quick.trim()) return;
        try {
            await accountActions.updateAccount(
                account.id,
                channel === "whatsapp" ? { phone: quick.trim() } : { email: quick.trim() },
            );
            setQuick("");
            setError(null);
        } catch (err) {
            setError(
                getFieldErrors(err)?.[channel === "whatsapp" ? "phone" : "email"] ??
                    getErrorMessage(err, "Couldn't save."),
            );
        }
    };

    const send = async () => {
        setSending(true);
        setError(null);
        try {
            const r = await accountActions.sendReminder(account.id, {
                channel,
                message,
                ...(channel === "email" ? { subject } : {}),
            });
            if (channel === "whatsapp" && r.url) {
                window.open(r.url, "_blank", "noopener,noreferrer");
                toast.success(`WhatsApp opened for ${account.name}`, {
                    description: "Press send in WhatsApp. This reminder is saved in the activity log.",
                });
            } else
                toast.success(`Reminder emailed to ${account.name}`, {
                    description: `${r.to} · saved in the activity log`,
                });
            onClose();
        } catch (err) {
            setError(
                getFieldErrors(err)?.email ??
                    getFieldErrors(err)?.phone ??
                    getErrorMessage(err, "Couldn't send the reminder."),
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
            <DialogHeader className="space-y-1 border-b px-5 py-4 text-left">
                <DialogTitle>Remind {account.name}</DialogTitle>
                <DialogDescription>
                    Pending: <b className="text-foreground">{money(account.balance)}</b>
                    {account.dueDate && (
                        <>
                            {" "}
                            · due{" "}
                            {new Date(account.dueDate + "T00:00:00").toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </>
                    )}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-5 py-4">
                {recentlyReminded && account.lastReminder && (
                    <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <b>{account.lastReminder.by.name}</b> already sent a {account.lastReminder.channel} reminder{" "}
                            {ago(account.lastReminder.at)}. Send another only if needed.
                        </span>
                    </p>
                )}

                <div
                    className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1"
                    role="tablist"
                    aria-label="How to remind"
                >
                    {(
                        [
                            ["whatsapp", "WhatsApp", MessageCircle],
                            ["email", "Email", Mail],
                        ] as const
                    ).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={channel === id}
                            onClick={() => {
                                setChannel(id);
                                setError(null);
                            }}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all",
                                channel === id ? "bg-card shadow-sm" : "text-muted-foreground",
                            )}
                        >
                            <Icon className="size-4" /> {label}
                        </button>
                    ))}
                </div>

                <div className="rounded-xl border px-3 py-2.5 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        {channel === "whatsapp" ? "Will open WhatsApp for" : "Will be emailed to"}
                    </p>
                    {contact ? (
                        <div className="flex items-center justify-between gap-2">
                            <b>{contact}</b>
                            <button
                                type="button"
                                onClick={() => onEdit(account.id)}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div className="mt-1.5 flex gap-2">
                            <Input
                                value={quick}
                                onChange={(e) => setQuick(e.target.value)}
                                placeholder={
                                    channel === "whatsapp" ? "Add their mobile number" : "Add their email address"
                                }
                                type={channel === "email" ? "email" : "tel"}
                                className="h-9"
                            />
                            <Button type="button" size="sm" className="h-9" onClick={() => void saveContact()}>
                                Save
                            </Button>
                        </div>
                    )}
                </div>

                {channel === "email" && !emailConfigured && (
                    <p className="rounded-xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
                        Email isn't set up on this server yet, so it can't be sent from here. Use WhatsApp, or ask
                        whoever manages the server to add the email settings.
                    </p>
                )}

                {channel === "email" && (
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Subject</span>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </label>
                )}
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                        Message — edit it however you like
                    </span>
                    <Textarea
                        rows={9}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="text-sm leading-relaxed"
                    />
                </label>

                {error && (
                    <p
                        role="alert"
                        className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive"
                    >
                        {error}
                    </p>
                )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t bg-background px-5 py-3">
                <p className="text-xs text-muted-foreground">
                    {channel === "whatsapp"
                        ? "WhatsApp opens with this ready — you press send."
                        : "Sent from the company mailbox."}{" "}
                    Logged under your name.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void send()}
                        disabled={
                            sending ||
                            !contact ||
                            message.trim().length < 5 ||
                            (channel === "email" && !emailConfigured)
                        }
                        className="gap-1.5"
                    >
                        <Send className="size-4" />{" "}
                        {sending ? "Sending…" : channel === "whatsapp" ? "Open WhatsApp" : "Send email"}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}
