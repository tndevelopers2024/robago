// src/pages/accounts/PartiesSheet.tsx — the spreadsheet-style view of creditors / debtors (the alternative to the card list).
import { useMemo } from "react";
import { BellRing, Eye } from "lucide-react";
import type { AccountDTO, AccountKind } from "@robago/shared";
import SheetGrid, { type SheetColumn } from "@/components/sheet/SheetGrid";
import { ago, daysOverdue, isOverdue, money, niceDate } from "@/lib/accounts/format";
import { cn } from "@/lib/utils";
import { KIND_COLOR } from "./accountsUi";

interface Props {
    kind: AccountKind;
    rows: AccountDTO[];
    onOpen: (id: string) => void;
    onPay: (id: string) => void;
    onRemind: (id: string) => void;
    heightClass?: string;
}

export default function PartiesSheet({ heightClass, kind, rows, onOpen, onPay, onRemind }: Props) {
    const creditor = kind === "creditor";
    const openAccount = onOpen;
    const openEntry = (id: string) => onPay(id);
    const openReminder = onRemind;
    const columns = useMemo<SheetColumn<AccountDTO>[]>(
        () => [
            {
                id: "name",
                label: "Name",
                header: "Name",
                width: 250,
                grow: true,
                sticky: true,
                getValue: (r) => r.name,
                render: (r) => (
                    <span className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[r.kind] }} />
                        <span
                            className={cn("truncate font-semibold", !r.active && "text-muted-foreground line-through")}
                        >
                            {r.name}
                        </span>
                        {r.group && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                {r.group}
                            </span>
                        )}
                    </span>
                ),
                footer: (rs) => <span className="text-muted-foreground">Total · {rs.length} accounts</span>,
            },
            {
                id: "due",
                label: "Due date",
                header: "Due date",
                width: 160,
                getValue: (r) => r.dueDate,
                render: (r) =>
                    r.dueDate ? (
                        <span
                            className={cn(
                                "flex items-center gap-1.5",
                                isOverdue(r.dueDate, r.balance) && "font-semibold text-destructive",
                            )}
                        >
                            {niceDate(r.dueDate)}
                            {isOverdue(r.dueDate, r.balance) && (
                                <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px]">
                                    {daysOverdue(r.dueDate)}d late
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-muted-foreground/50">—</span>
                    ),
            },
            {
                id: "billed",
                label: "Total billed",
                header: "Total",
                subHeader: "ever owed",
                width: 120,
                align: "right",
                getValue: (r) => r.billed,
                render: (r) => money(r.billed),
                footer: (rs) => money(rs.reduce((s, r) => s + r.billed, 0)),
            },
            {
                id: "paid",
                label: creditor ? "Paid so far" : "Received so far",
                header: creditor ? "Paid" : "Received",
                subHeader: "so far",
                width: 120,
                align: "right",
                getValue: (r) => r.paid,
                render: (r) => <span className="text-success">{r.paid ? money(r.paid) : ""}</span>,
                footer: (rs) => money(rs.reduce((s, r) => s + r.paid, 0)),
            },
            {
                id: "balance",
                label: "Pending",
                header: "Pending",
                subHeader: creditor ? "still to pay" : "still to collect",
                width: 125,
                align: "right",
                getValue: (r) => r.balance,
                render: (r) => (
                    <span className={cn("font-bold", r.balance <= 0 && "text-muted-foreground")}>
                        {money(r.balance)}
                    </span>
                ),
                cellClassName: (r) =>
                    isOverdue(r.dueDate, r.balance) ? "bg-danger-soft" : r.balance > 0 ? "bg-primary/5" : undefined,
                footer: (rs) => money(rs.reduce((s, r) => s + r.balance, 0)),
            },
            {
                id: "last",
                label: "Last payment",
                header: creditor ? "Last paid" : "Last received",
                subHeader: "amount · date · by whom",
                width: 230,
                getValue: (r) =>
                    r.lastPayment
                        ? `${money(r.lastPayment.amount)} on ${r.lastPayment.date} by ${r.lastPayment.by.name}`
                        : "",
                render: (r) =>
                    r.lastPayment ? (
                        <span
                            className="truncate text-xs"
                            title={`${r.lastPayment.by.name} · ${ago(r.lastPayment.at)}`}
                        >
                            <b className="text-sm">{money(r.lastPayment.amount)}</b> · {niceDate(r.lastPayment.date)} ·{" "}
                            <span className="text-muted-foreground">{r.lastPayment.by.name}</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground/50">none yet</span>
                    ),
            },
            {
                id: "actions",
                label: "",
                header: "",
                width: creditor ? 290 : 330,
                stickyRight: true,
                getValue: () => null,
                render: (r) => (
                    <span className="flex items-center gap-2 pr-1" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => openAccount(r.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white/70 px-3 text-[13px] font-medium whitespace-nowrap text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            <Eye className="size-3.5" /> View details
                        </button>
                        <button
                            type="button"
                            disabled={!r.active}
                            onClick={() => openEntry(r.id)}
                            className="inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-[13px] font-semibold whitespace-nowrap text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                        >
                            {creditor ? "Make payment" : "Record receipt"}
                        </button>
                        {!creditor && (
                            <button
                                type="button"
                                disabled={r.balance <= 0}
                                onClick={() => openReminder(r.id)}
                                title="Send a payment reminder"
                                aria-label="Remind"
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white/70 text-muted-foreground shadow-xs transition-colors hover:border-warning/50 hover:bg-warning/10 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                            >
                                <BellRing className="size-3.5" />
                            </button>
                        )}
                    </span>
                ),
            },
        ],
        [creditor, openAccount, openEntry, openReminder],
    );

    return (
        <SheetGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            formatStat={money}
            emptyMessage="No accounts match."
            heightClass={heightClass}
            storageKey={`robago_sheet_widths_accounts_${kind}`}
            className="glass border-white/75 bg-transparent shadow-none"
        />
    );
}
