// src/pages/inventory/InventoryDetailPage.tsx
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import TransactionTypeBadge from "@/components/shared/StatusBadge";
import TransactionDialog from "@/components/domain/inventory/TransactionDialog";
import { useInventoryDetailQuery } from "@/hooks/queries/useInventoryQueries";
import { ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { ProductType, TransactionType } from "@robago/shared";
import type { TransactionDTO } from "@/types";

function formatINR(val: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(val);
}

export default function InventoryDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading } = useInventoryDetailQuery(id);
    const [typeFilter, setTypeFilter] = useState<string>("All");

    const { inventory, transactions } = data ?? {};

    const isRaw = inventory?.productId?.type === ProductType.RawMaterial;

    const filterOptions: Array<"All" | TransactionType> = useMemo(() => {
        if (isRaw) {
            return [
                "All",
                TransactionType.Purchase,
                TransactionType.Consumption,
                TransactionType.Adjustment,
            ];
        }
        return [
            "All",
            TransactionType.Production,
            TransactionType.Sale,
            TransactionType.Adjustment,
        ];
    }, [isRaw]);

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        if (typeFilter === "All") return transactions;
        return transactions.filter((txn) => txn.transactionType === typeFilter);
    }, [transactions, typeFilter]);

    if (isLoading || !data || !inventory) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const warehouseName =
        typeof inventory.warehouseId === "object" && inventory.warehouseId !== null
            ? inventory.warehouseId.name
            : "—";

    const warehouseColor =
        typeof inventory.warehouseId === "object" && inventory.warehouseId !== null
            ? inventory.warehouseId.tagColor
            : undefined;

    function renderQuantityDelta(txn: TransactionDTO, unit?: string) {
        const isPositive =
            txn.transactionType === TransactionType.Purchase ||
            txn.transactionType === TransactionType.Production;
        const isNegative =
            txn.transactionType === TransactionType.Sale ||
            txn.transactionType === TransactionType.Consumption;

        const sign = isPositive ? "+" : isNegative ? "-" : txn.quantity > 0 ? "+" : "";
        const unitText = unit ? ` ${unit}` : "";

        const colorClass = isPositive
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : isNegative
              ? "text-rose-700 bg-rose-50 border-rose-200"
              : "text-slate-700 bg-slate-100 border-slate-200";

        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${colorClass}`}
            >
                {sign}
                {txn.quantity}
                {unitText}
            </span>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Prominent Back Link / Breadcrumb */}
            <div className="flex items-center justify-between">
                <Link
                    to="/inventory"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1565C0] hover:text-[#0D47A1] transition-colors"
                >
                    <ArrowLeft className="size-4" /> Back to Inventory
                </Link>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {isRaw ? "Raw Material" : "Finished Product"}
                    </Badge>
                    {warehouseColor && (
                        <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                            style={{
                                backgroundColor: `${warehouseColor}20`,
                                color: warehouseColor,
                                borderColor: warehouseColor,
                            }}
                        >
                            {warehouseName}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Inventory SKU Overview Card */}
            <Card className="border-slate-200 shadow-xs">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <CardTitle className="text-2xl font-bold text-slate-900">
                                {inventory.productId?.name ?? "—"}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm text-slate-500 mt-1">
                            Location:{" "}
                            <span className="font-medium text-slate-700">
                                {inventory.location || "Unspecified"}
                            </span>{" "}
                            • Warehouse:{" "}
                            <span className="font-medium text-slate-700">
                                {warehouseName}
                            </span>
                        </CardDescription>
                    </div>

                    <TransactionDialog
                        inventoryId={inventory._id}
                        productType={inventory.productId.type}
                        currentAvailableQty={inventory.quantity}
                        trigger={
                            <Button className="bg-[#1565C0] hover:bg-[#0D47A1] shadow-xs">
                                <Plus className="size-4 mr-1.5" /> Log Transaction
                            </Button>
                        }
                    />
                </CardHeader>

                <CardContent className="pt-6">
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Current Stock
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-slate-900">
                                {inventory.quantity}{" "}
                                <span className="text-xs font-normal text-slate-500">
                                    {inventory.productId?.unit}
                                </span>
                            </dd>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Unit Cost Rate
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-slate-900">
                                {formatINR(inventory.price)}
                            </dd>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Valuation
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-[#1565C0]">
                                {formatINR(inventory.price * inventory.quantity)}
                            </dd>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Low Stock Alert
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-slate-800">
                                {inventory.alertThreshold != null ? (
                                    <span
                                        className={
                                            inventory.quantity < inventory.alertThreshold
                                                ? "text-red-600 font-bold"
                                                : "text-slate-800"
                                        }
                                    >
                                        &lt; {inventory.alertThreshold} {inventory.productId?.unit}
                                    </span>
                                ) : (
                                    "—"
                                )}
                            </dd>
                        </div>

                        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Last Updated
                            </dt>
                            <dd className="mt-1 text-xs text-slate-600 font-medium pt-1">
                                {format(new Date(inventory.lastUpdated), "d MMM yyyy, HH:mm")}
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            {/* Transaction History Card with Filter Pills */}
            <Card className="border-slate-200 shadow-xs">
                <CardHeader className="flex flex-col gap-3 pb-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg">Transaction History</CardTitle>
                        <CardDescription>
                            All inward, outward, and adjustment records logged for this SKU
                        </CardDescription>
                    </div>

                    {/* Contextual Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {filterOptions.map((pill) => {
                            const isSelected = typeFilter === pill;
                            return (
                                <button
                                    key={pill}
                                    type="button"
                                    onClick={() => setTypeFilter(pill)}
                                    className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-[#1565C0] text-white shadow-xs font-semibold"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
                                    }`}
                                >
                                    {pill}
                                </button>
                            );
                        })}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {filteredTransactions.length === 0 ? (
                        <div className="p-6">
                            <EmptyState message="No transactions match this filter." />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/75 hover:bg-slate-50/75 border-b border-slate-200">
                                    <TableHead className="w-[120px] font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        TYPE
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        QTY DELTA
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        ATTRIBUTED UNIT / PARTY
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        NOTES / REMARKS
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        TIMESTAMP
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((txn) => {
                                    let attributedParty = "—";
                                    if (txn.producedBy?.name) {
                                        attributedParty = txn.producedBy.name;
                                    } else if (txn.consumedBy?.name) {
                                        attributedParty = txn.consumedBy.name;
                                    } else if (warehouseName) {
                                        attributedParty = warehouseName;
                                    }

                                    return (
                                        <TableRow key={txn._id} className="hover:bg-slate-50/60">
                                            <TableCell className="py-3">
                                                <TransactionTypeBadge type={txn.transactionType} />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {renderQuantityDelta(txn, inventory.productId?.unit)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200">
                                                    {attributedParty}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 max-w-sm text-xs text-slate-600">
                                                {txn.notes || "—"}
                                            </TableCell>
                                            <TableCell className="py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                                                {format(new Date(txn.timestamp), "d MMM yyyy, HH:mm")}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
