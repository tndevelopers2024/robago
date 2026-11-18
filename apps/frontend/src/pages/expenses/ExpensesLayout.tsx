// src/pages/expenses/ExpensesLayout.tsx — month picker, sub-navigation and "Add expense" for every expenses page.
import { useEffect, useState } from "react";
import { NavLink, Outlet, useSearchParams } from "react-router-dom";
import { LayoutDashboard, ListPlus, Plus, Table2, Tags, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MonthPicker from "@/components/shared/MonthPicker";
import { cn } from "@/lib/utils";
import AddExpenseDialog from "./AddExpenseDialog";
import type { ExpensesOutletContext } from "./expensesContext";

const VIEWS: { to: string; label: string; short: string; icon: LucideIcon }[] = [
    { to: "/expenses/overview", label: "Overview", short: "Overview", icon: LayoutDashboard },
    { to: "/expenses/entries", label: "Entries", short: "Entries", icon: ListPlus },
    { to: "/expenses/monthly", label: "Month by month", short: "Monthly", icon: Table2 },
    { to: "/expenses/items", label: "Items", short: "Items", icon: Tags },
];

export default function ExpensesLayout() {
    const [month, setMonth] = useState(() => new Date());
    const [adding, setAdding] = useState(false);
    const [params, setParams] = useSearchParams();

    // The dashboard's "Add expense" shortcut arrives as ?add=1 — open the dialog, then tidy the URL.
    useEffect(() => {
        if (params.get("add") === "1") {
            setAdding(true);
            setParams({}, { replace: true });
        }
    }, [params, setParams]);
    // Press N anywhere on these pages to start adding (but never while typing, in a sheet cell, or in a dialog).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="grid"]'))
                return;
            e.preventDefault();
            setAdding(true);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
    const ctx: ExpensesOutletContext = { month, setMonth, openAdd: () => setAdding(true) };

    return (
        <div className="w-full space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <MonthPicker value={month} onChange={setMonth} />
                <Button onClick={() => setAdding(true)} className="h-10 gap-1.5 rounded-xl">
                    <Plus />
                    Add expense
                    <kbd className="ml-1 hidden rounded border border-white/40 px-1.5 text-[10px] font-medium text-white/80 lg:inline">
                        N
                    </kbd>
                </Button>
            </div>

            <nav
                aria-label="Expense views"
                className="grid grid-cols-4 rounded-xl border bg-card p-1 shadow-xs md:inline-grid"
            >
                {VIEWS.map((v) => (
                    <NavLink
                        key={v.to}
                        to={v.to}
                        replace
                        className={({ isActive }) =>
                            cn(
                                "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium whitespace-nowrap transition-all sm:px-4",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )
                        }
                    >
                        <v.icon className="size-4" />
                        <span className="hidden sm:inline">{v.label}</span>
                        <span className="sm:hidden">{v.short}</span>
                    </NavLink>
                ))}
            </nav>

            <Outlet context={ctx} />

            {/* Phones and tablets: a thumb-reachable + that is always one tap away */}
            <button
                type="button"
                onClick={() => setAdding(true)}
                aria-label="Add expense"
                className="fixed right-4 bottom-20 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-90 md:hidden"
            >
                <Plus className="size-6" />
            </button>

            <AddExpenseDialog open={adding} onOpenChange={setAdding} month={month} />
        </div>
    );
}
