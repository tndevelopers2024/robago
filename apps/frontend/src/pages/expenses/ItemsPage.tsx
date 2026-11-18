// src/pages/expenses/ItemsPage.tsx — the list of things you spend on; add new ones, rename, archive.
import { useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Archive, ArchiveRestore, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { ExpenseItemDTO, ExpenseType } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { monthKey, rupees, spendByItem, TYPE_COLOR, TYPES } from "@/lib/expenses/calc";
import { expenseActions, useExpenseItems, useExpenses } from "@/lib/expenses/store";
import { cn } from "@/lib/utils";
import { useExpensesContext } from "./expensesContext";

export default function ItemsPage() {
    const { month } = useExpensesContext();
    const itemsQ = useExpenseItems();
    const entriesQ = useExpenses(monthKey(month));
    const items = useMemo(() => itemsQ.data ?? [], [itemsQ.data]);
    const spend = useMemo(
        () => new Map(spendByItem(entriesQ.data ?? [], items).map((r) => [r.item.id, r.total])),
        [entriesQ.data, items],
    );

    if (itemsQ.isPending) return <Skeleton className="h-96 w-full rounded-2xl" />;

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {TYPES.map((t) => (
                <Column
                    key={t}
                    type={t}
                    items={items.filter((i) => i.type === t)}
                    spend={spend}
                    monthLabel={format(month, "MMM")}
                />
            ))}
        </div>
    );
}

function Column({
    type,
    items,
    spend,
    monthLabel,
}: {
    type: ExpenseType;
    items: ExpenseItemDTO[];
    spend: Map<string, number>;
    monthLabel: string;
}) {
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const add = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await expenseActions.createItem({ name: name.trim(), type });
            setName("");
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't add that item."));
        }
    };

    const sorted = [...items].sort((a, b) => Number(b.active) - Number(a.active));
    return (
        <section className="rounded-2xl border bg-card shadow-xs">
            <header className="flex items-center gap-2 border-b px-4 py-3.5">
                <span className="size-3 rounded-[3px]" style={{ background: TYPE_COLOR[type] }} />
                <h2 className="font-heading text-base font-semibold">{type} expenses</h2>
                <span className="ml-auto text-xs text-muted-foreground">
                    {items.filter((i) => i.active).length} items
                </span>
            </header>
            <form onSubmit={add} className="flex gap-2 border-b p-3">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`New ${type.toLowerCase()} item, e.g. ${type === "General" ? "Biscuits" : "Insurance"}`}
                    className="h-10"
                />
                <Button type="submit" className="h-10 gap-1.5">
                    <Plus /> Add
                </Button>
            </form>
            {error && (
                <p
                    role="alert"
                    className="mx-3 mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive"
                >
                    {error}
                </p>
            )}
            <ul className="divide-y">
                {sorted.map((i) => (
                    <ItemRow key={i.id} item={i} amount={spend.get(i.id) ?? 0} monthLabel={monthLabel} />
                ))}
            </ul>
        </section>
    );
}

function ItemRow({ item, amount, monthLabel }: { item: ExpenseItemDTO; amount: number; monthLabel: string }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(item.name);
    const [confirm, setConfirm] = useState(false);

    const fail = (err: unknown, fallback: string) => toast.error(getErrorMessage(err, fallback));
    const rename = async () => {
        const next = text.trim();
        if (!next || next === item.name) return setEditing(false);
        try {
            await expenseActions.updateItem(item.id, { name: next });
            setEditing(false);
        } catch (err) {
            fail(err, "Couldn't rename.");
        }
    };

    return (
        <li className={cn("flex items-center gap-2 px-4 py-2.5", !item.active && "bg-muted/30")}>
            {editing ? (
                <Input
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") void rename();
                        if (e.key === "Escape") setEditing(false);
                    }}
                    className="h-9 flex-1"
                />
            ) : (
                <span
                    className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium",
                        !item.active && "text-muted-foreground",
                    )}
                >
                    {item.name}
                    {!item.active && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            Archived
                        </span>
                    )}
                </span>
            )}
            {!editing && (
                <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {amount > 0 ? (
                        <>
                            <b className="text-sm font-semibold text-foreground">{rupees(amount)}</b> in {monthLabel}
                        </>
                    ) : (
                        "—"
                    )}
                </span>
            )}
            <div className="flex shrink-0 items-center">
                {editing ? (
                    <>
                        <IconBtn label="Save name" onClick={() => void rename()}>
                            <Check />
                        </IconBtn>
                        <IconBtn
                            label="Cancel"
                            onClick={() => {
                                setEditing(false);
                                setText(item.name);
                            }}
                        >
                            <X />
                        </IconBtn>
                    </>
                ) : confirm ? (
                    <>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() =>
                                void expenseActions.deleteItem(item.id).catch((err) => {
                                    setConfirm(false);
                                    fail(err, "Couldn't delete.");
                                })
                            }
                        >
                            Delete
                        </Button>
                        <IconBtn label="Cancel" onClick={() => setConfirm(false)}>
                            <X />
                        </IconBtn>
                    </>
                ) : (
                    <>
                        <IconBtn label="Rename" onClick={() => setEditing(true)}>
                            <Pencil />
                        </IconBtn>
                        <IconBtn
                            label={item.active ? "Archive" : "Restore"}
                            onClick={() =>
                                void expenseActions
                                    .updateItem(item.id, { active: !item.active })
                                    .catch((err) => fail(err, "Couldn't update."))
                            }
                        >
                            {item.active ? <Archive /> : <ArchiveRestore />}
                        </IconBtn>
                        <IconBtn label="Delete (only if unused)" onClick={() => setConfirm(true)}>
                            <Trash2 />
                        </IconBtn>
                    </>
                )}
            </div>
        </li>
    );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
        >
            {children}
        </button>
    );
}
