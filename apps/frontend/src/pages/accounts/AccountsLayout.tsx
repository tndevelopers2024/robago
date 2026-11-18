// src/pages/accounts/AccountsLayout.tsx — sub-navigation for Accounts, plus the drawer and dialogs every page can open.
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine, History, LayoutDashboard, type LucideIcon } from "lucide-react";
import type { AccountKind, EntryType } from "@robago/shared";
import Aurora from "@/components/dashboard/Aurora";
import { cn } from "@/lib/utils";
import AccountDrawer from "./AccountDrawer";
import AccountFormDialog from "./AccountFormDialog";
import EntryDialog from "./EntryDialog";
import ReminderDialog from "./ReminderDialog";
import type { AccountsOutletContext } from "./accountsContext";

const VIEWS: { to: string; label: string; icon: LucideIcon }[] = [
    { to: "/accounts/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/accounts/creditors", label: "Creditors · to pay", icon: ArrowUpFromLine },
    { to: "/accounts/debtors", label: "Debtors · to collect", icon: ArrowDownToLine },
    { to: "/accounts/activity", label: "Activity log", icon: History },
];

export default function AccountsLayout() {
    const [openId, setOpenId] = useState<string | null>(null);
    const [entry, setEntry] = useState<{ accountId: string; type: EntryType } | null>(null);
    const [reminderId, setReminderId] = useState<string | null>(null);
    const [form, setForm] = useState<{ open: boolean; kind: AccountKind; id: string | null }>({
        open: false,
        kind: "creditor",
        id: null,
    });

    const ctx: AccountsOutletContext = {
        openAccount: setOpenId,
        openEntry: (accountId, type = "payment") => setEntry({ accountId, type }),
        openReminder: setReminderId,
        addAccount: (kind) => setForm({ open: true, kind, id: null }),
    };

    return (
        <div className="relative isolate min-h-full">
            <Aurora />
            <div className="w-full space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
                <nav
                    aria-label="Accounts views"
                    className="glass grid grid-cols-2 gap-1 rounded-2xl p-1 sm:grid-cols-4 md:inline-grid"
                >
                    {VIEWS.map((v) => (
                        <NavLink
                            key={v.to}
                            to={v.to}
                            replace
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )
                            }
                        >
                            <v.icon className="size-4" />
                            {v.label}
                        </NavLink>
                    ))}
                </nav>

                <Outlet context={ctx} />

                <AccountDrawer
                    accountId={openId}
                    onClose={() => setOpenId(null)}
                    onEntry={(accountId, type) => setEntry({ accountId, type })}
                    onRemind={setReminderId}
                    onEdit={(id) => setForm({ open: true, kind: "creditor", id })}
                />
                <EntryDialog entry={entry} onClose={() => setEntry(null)} />
                <ReminderDialog
                    accountId={reminderId}
                    onClose={() => setReminderId(null)}
                    onEdit={(id) => setForm({ open: true, kind: "debtor", id })}
                />
                <AccountFormDialog
                    open={form.open}
                    kind={form.kind}
                    accountId={form.id}
                    onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
                />
            </div>
        </div>
    );
}
