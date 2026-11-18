// The live stock-movement ledger: type filters, paging and the table — same behaviour as before, now glass.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TransactionType } from "@robago/shared";
import EmptyState from "@/components/shared/EmptyState";
import TransactionTypeBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { warehouseQueries } from "@/hooks/queries/taggedEntityInstances";
import { useRecentTransactionsQuery } from "@/hooks/queries/useTransactionsQueries";
import type { TransactionDTO } from "@/types";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";

const FILTER_PILLS: Array<"All" | TransactionType> = [
    "All",
    TransactionType.Purchase,
    TransactionType.Production,
    TransactionType.Sale,
    TransactionType.Consumption,
    TransactionType.Adjustment,
];

const isFactoryName = (n: string) => /factory|workshop|floor|stitching|unit/i.test(n);

function relativeTime(dateStr: string): string {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : formatDistanceToNow(d, { addSuffix: true });
}

function QuantityDelta({ txn, unit }: { txn: TransactionDTO; unit?: string }) {
    const plus = txn.transactionType === TransactionType.Purchase || txn.transactionType === TransactionType.Production;
    const minus = txn.transactionType === TransactionType.Sale || txn.transactionType === TransactionType.Consumption;
    const sign = plus ? "+" : minus ? "-" : txn.quantity > 0 ? "+" : "";
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold",
                plus
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : minus
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-slate-100 text-slate-700",
            )}
        >
            {sign}
            {txn.quantity}
            {unit ? ` ${unit}` : ""}
        </span>
    );
}

export default function LedgerCard({ delay = 0 }: { delay?: number }) {
    const { data: recent, isLoading } = useRecentTransactionsQuery(100);
    const { data: warehouses } = warehouseQueries.useList();
    const [typeFilter, setTypeFilter] = useState<string>("All");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const warehouseMap = useMemo(() => new Map((warehouses ?? []).map((w) => [w._id, w.name])), [warehouses]);
    const filtered = useMemo(
        () => (typeFilter === "All" ? (recent ?? []) : (recent ?? []).filter((t) => t.transactionType === typeFilter)),
        [recent, typeFilter],
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const rows = useMemo(
        () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
        [filtered, safePage, pageSize],
    );

    return (
        <GlassCard delay={delay}>
            <header className="flex flex-col gap-3 border-b border-white/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="font-heading text-lg font-semibold">Live stock movements</h3>
                    <p className="text-xs text-muted-foreground">
                        Materials in, production out, and dispatches — newest first
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {FILTER_PILLS.map((pill) => (
                        <button
                            key={pill}
                            type="button"
                            aria-pressed={typeFilter === pill}
                            onClick={() => {
                                setTypeFilter(pill);
                                setPage(1);
                            }}
                            className={cn(
                                "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all duration-300",
                                typeFilter === pill
                                    ? "bg-primary font-semibold text-primary-foreground shadow-[0_0_16px_-2px_rgba(14,165,233,0.6)]"
                                    : "bg-white/60 text-muted-foreground ring-1 ring-white/70 hover:bg-white hover:text-foreground",
                            )}
                        >
                            {pill}
                        </button>
                    ))}
                </div>
            </header>

            {isLoading ? (
                <div className="space-y-3 p-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="p-6">
                    <EmptyState message="No transactions found matching this filter." />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-white/60 bg-white/30 hover:bg-white/30">
                            {["Type", "Item / model", "Quantity", "Unit / godown", "Notes"].map((h) => (
                                <TableHead
                                    key={h}
                                    className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                >
                                    {h}
                                </TableHead>
                            ))}
                            <TableHead className="text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                When
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((txn) => {
                            const inv =
                                typeof txn.inventoryId === "object" && txn.inventoryId !== null
                                    ? txn.inventoryId
                                    : null;
                            const invId = inv ? inv._id : typeof txn.inventoryId === "string" ? txn.inventoryId : "";
                            const itemName = inv?.productId?.name ?? (invId ? `Stock #${invId.slice(-4)}` : "—");

                            let place: string;
                            let placeStyle: string;
                            if (txn.producedBy?.name || txn.consumedBy?.name) {
                                place = (txn.producedBy?.name ?? txn.consumedBy?.name) as string;
                                placeStyle = "bg-purple-50 text-purple-700 border-purple-200";
                            } else {
                                const wh = inv?.warehouseId;
                                const whName =
                                    typeof wh === "object" && wh !== null
                                        ? wh.name
                                        : typeof wh === "string"
                                          ? (warehouseMap.get(wh) ?? "")
                                          : "";
                                const factory = isFactoryName(whName);
                                place = factory ? "Factory" : "Godown";
                                placeStyle = factory
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-accent text-primary border-primary/20";
                            }

                            return (
                                <TableRow
                                    key={txn._id}
                                    className="border-white/50 transition-colors duration-200 hover:bg-white/50"
                                >
                                    <TableCell className="py-3">
                                        <TransactionTypeBadge type={txn.transactionType} />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        {invId ? (
                                            <Link
                                                to={`/inventory/${invId}`}
                                                className="font-semibold hover:text-primary hover:underline"
                                            >
                                                {itemName}
                                            </Link>
                                        ) : (
                                            <span className="font-semibold">{itemName}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <QuantityDelta txn={txn} unit={inv?.productId?.unit} />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                                                placeStyle,
                                            )}
                                        >
                                            {place}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-xs py-3 text-xs text-muted-foreground">
                                        <span title={txn.notes ?? ""}>{txn.notes || "—"}</span>
                                    </TableCell>
                                    <TableCell className="py-3 text-right text-xs whitespace-nowrap text-muted-foreground">
                                        <span title={format(new Date(txn.timestamp), "d MMM yyyy, HH:mm")}>
                                            {relativeTime(txn.timestamp)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            <footer className="flex flex-col gap-3 border-t border-white/60 bg-white/25 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                        Showing{" "}
                        <b className="text-foreground">{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</b>–
                        <b className="text-foreground">{Math.min(safePage * pageSize, filtered.length)}</b> of{" "}
                        <b className="text-foreground">{filtered.length}</b>
                    </span>
                    <span className="flex items-center gap-1.5 border-l pl-3">
                        Rows
                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => {
                                setPageSize(Number(v));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-7 w-16 bg-white/70 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="mr-1 text-xs text-muted-foreground">
                        Page <b className="text-foreground">{safePage}</b> of{" "}
                        <b className="text-foreground">{totalPages}</b>
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-white/70 px-2.5 text-xs"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                    >
                        <ChevronLeft className="mr-1 size-3.5" /> Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-white/70 px-2.5 text-xs"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                    >
                        Next <ChevronRight className="ml-1 size-3.5" />
                    </Button>
                </div>
            </footer>
        </GlassCard>
    );
}
