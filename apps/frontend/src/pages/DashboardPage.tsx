// src/pages/DashboardPage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthProvider";
import { useInventoryAlertsQuery, useInventoryQuery } from "@/hooks/queries/useInventoryQueries";
import { useRecentTransactionsQuery } from "@/hooks/queries/useTransactionsQueries";
import { warehouseQueries } from "@/hooks/queries/taggedEntityInstances";
import TransactionTypeBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import {
    AlertTriangle,
    Package,
    Building2,
    Factory,
    TrendingUp,
    Boxes,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ProductType, TransactionType } from "@robago/shared";
import type { TransactionDTO } from "@/types";

function formatINR(val: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(val);
}

const FILTER_PILLS: Array<"All" | TransactionType> = [
    "All",
    TransactionType.Purchase,
    TransactionType.Production,
    TransactionType.Sale,
    TransactionType.Consumption,
    TransactionType.Adjustment,
];

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: inventory, isLoading: inventoryLoading } = useInventoryQuery();
    const { data: warehouses, isLoading: warehousesLoading } = warehouseQueries.useList();
    const { data: alerts, isLoading: alertsLoading } = useInventoryAlertsQuery();
    const { data: recent, isLoading: recentLoading } = useRecentTransactionsQuery(100);

    const [typeFilter, setTypeFilter] = useState<string>("All");
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const alertCount = (alerts?.rawMaterials.length ?? 0) + (alerts?.finishedProducts.length ?? 0);

    const warehouseMap = useMemo(() => {
        const map = new Map<string, string>();
        if (warehouses) {
            for (const w of warehouses) {
                map.set(w._id, w.name);
            }
        }
        return map;
    }, [warehouses]);

    // Dynamic warehouse-wise valuation breakdown
    const metrics = useMemo(() => {
        if (!inventory) {
            return {
                totalValuation: 0,
                godown: { rawValuation: 0, finishedValuation: 0, totalValuation: 0, skuCount: 0 },
                factory: { rawValuation: 0, finishedValuation: 0, totalValuation: 0, skuCount: 0 },
            };
        }

        let godownRaw = 0;
        let godownFinished = 0;
        let godownSkus = 0;

        let factoryRaw = 0;
        let factoryFinished = 0;
        let factorySkus = 0;

        for (const item of inventory) {
            const val = (item.price ?? 0) * (item.quantity ?? 0);
            const isRaw = item.productId?.type === ProductType.RawMaterial;

            // Resolve warehouse name
            let whName = "";
            if (typeof item.warehouseId === "object" && item.warehouseId !== null) {
                whName = item.warehouseId.name;
            } else if (typeof item.warehouseId === "string") {
                whName = warehouseMap.get(item.warehouseId) ?? "";
            }

            const isFactoryWarehouse = /factory|workshop|floor|stitching|unit/i.test(whName);

            if (isFactoryWarehouse) {
                factorySkus++;
                if (isRaw) {
                    factoryRaw += val;
                } else {
                    factoryFinished += val;
                }
            } else {
                godownSkus++;
                if (isRaw) {
                    godownRaw += val;
                } else {
                    godownFinished += val;
                }
            }
        }

        const godownTotal = godownRaw + godownFinished;
        const factoryTotal = factoryRaw + factoryFinished;
        const combined = godownTotal + factoryTotal;

        return {
            totalValuation: combined,
            godown: {
                rawValuation: godownRaw,
                finishedValuation: godownFinished,
                totalValuation: godownTotal,
                skuCount: godownSkus,
            },
            factory: {
                rawValuation: factoryRaw,
                finishedValuation: factoryFinished,
                totalValuation: factoryTotal,
                skuCount: factorySkus,
            },
        };
    }, [inventory, warehouseMap]);

    // Filter and paginate transactions
    const filteredTransactions = useMemo(() => {
        if (!recent) return [];
        if (typeFilter === "All") return recent;
        return recent.filter((txn) => txn.transactionType === typeFilter);
    }, [recent, typeFilter]);

    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedTransactions = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredTransactions.slice(start, start + pageSize);
    }, [filteredTransactions, safeCurrentPage, pageSize]);

    const isLoading = inventoryLoading || warehousesLoading;

    function handleFilterChange(filter: string) {
        setTypeFilter(filter);
        setCurrentPage(1);
    }

    function handlePageSizeChange(sizeStr: string) {
        setPageSize(Number(sizeStr));
        setCurrentPage(1);
    }

    function formatRelativeTime(dateStr: string): string {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return formatDistanceToNow(d, { addSuffix: true });
        } catch {
            return dateStr;
        }
    }

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
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Welcome{user ? `, ${user.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Enterprise Bag Manufacturing & Warehouse Operations Overview
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-slate-600 bg-white">
                        Live Sync
                    </Badge>
                </div>
            </div>

            {/* Top Summary Banner: Combined Total Valuation */}
            <Card className="border-0 bg-gradient-to-br from-[#1565C0] via-[#1E88E5] to-[#0D47A1] text-white shadow-lg">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white/80">
                                <TrendingUp className="size-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">
                                    Total Inventory Valuation
                                </span>
                            </div>
                            {isLoading ? (
                                <Skeleton className="h-12 w-64 bg-white/20" />
                            ) : (
                                <div className="text-3xl font-extrabold sm:text-5xl tracking-tight">
                                    {formatINR(metrics.totalValuation)}
                                </div>
                            )}
                            <p className="text-xs text-white/80">
                                Aggregated financial asset value across Parrys Central Godown and Factory Floor
                            </p>
                        </div>

                        {/* Quick Stats in Banner */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 border-t border-white/15 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                                <div className="flex items-center gap-1.5 text-xs text-white/70">
                                    <Package className="size-3.5" />
                                    <span>Active SKUs</span>
                                </div>
                                <div className="mt-1 text-xl font-bold">
                                    {isLoading ? "—" : inventory?.length ?? 0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                                <div className="flex items-center gap-1.5 text-xs text-white/70">
                                    <Building2 className="size-3.5" />
                                    <span>Godown Share</span>
                                </div>
                                <div className="mt-1 text-xl font-bold">
                                    {isLoading
                                        ? "—"
                                        : metrics.totalValuation > 0
                                          ? `${Math.round((metrics.godown.totalValuation / metrics.totalValuation) * 100)}%`
                                          : "0%"}
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                                <div className="flex items-center gap-1.5 text-xs text-amber-200">
                                    <AlertTriangle className="size-3.5 text-amber-300" />
                                    <span>Low Stock</span>
                                </div>
                                <div className="mt-1 text-xl font-bold">
                                    {alertsLoading ? (
                                        "—"
                                    ) : (
                                        <Link
                                            to="/inventory/alerts"
                                            className="hover:underline text-amber-300 flex items-center gap-1"
                                        >
                                            {alertCount} alert{alertCount === 1 ? "" : "s"}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Warehouse-Wise Valuation Split Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* 1. Godown Card (Parrys Storage Hub) */}
                <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#1565C0]">
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Parrys Central Godown</CardTitle>
                                    <CardDescription>Primary Storage & Bulk Dispatch Hub</CardDescription>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-blue-50 text-[#1565C0] font-semibold">
                                {metrics.godown.skuCount} SKUs
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Godown Valuation
                            </span>
                            <div className="text-2xl font-bold text-slate-900 mt-0.5">
                                {isLoading ? <Skeleton className="h-8 w-32" /> : formatINR(metrics.godown.totalValuation)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Boxes className="size-3.5 text-emerald-600" />
                                    <span>Raw Materials</span>
                                </div>
                                <div className="mt-1 text-lg font-semibold text-slate-800">
                                    {isLoading ? <Skeleton className="h-6 w-20" /> : formatINR(metrics.godown.rawValuation)}
                                </div>
                                <span className="text-[11px] text-slate-400">Rolls & Fabrics</span>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Package className="size-3.5 text-blue-600" />
                                    <span>Finished Goods</span>
                                </div>
                                <div className="mt-1 text-lg font-semibold text-slate-800">
                                    {isLoading ? <Skeleton className="h-6 w-20" /> : formatINR(metrics.godown.finishedValuation)}
                                </div>
                                <span className="text-[11px] text-slate-400">Bags Ready for Dispatch</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <Link
                                to="/inventory"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:underline"
                            >
                                View Godown Inventory <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Factory Card (Production Units / Workshop Floor) */}
                <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Factory className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Factory Workshop Floor</CardTitle>
                                    <CardDescription>Cutting, Stitching & Assembly Units</CardDescription>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-semibold">
                                {metrics.factory.skuCount} SKUs
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Factory Floor Valuation
                            </span>
                            <div className="text-2xl font-bold text-slate-900 mt-0.5">
                                {isLoading ? <Skeleton className="h-8 w-32" /> : formatINR(metrics.factory.totalValuation)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Boxes className="size-3.5 text-amber-600" />
                                    <span>Raw Materials on Floor</span>
                                </div>
                                <div className="mt-1 text-lg font-semibold text-slate-800">
                                    {isLoading ? <Skeleton className="h-6 w-20" /> : formatINR(metrics.factory.rawValuation)}
                                </div>
                                <span className="text-[11px] text-slate-400">Issued for Stitching</span>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Package className="size-3.5 text-purple-600" />
                                    <span>Finished Bags Ready</span>
                                </div>
                                <div className="mt-1 text-lg font-semibold text-slate-800">
                                    {isLoading ? <Skeleton className="h-6 w-20" /> : formatINR(metrics.factory.finishedValuation)}
                                </div>
                                <span className="text-[11px] text-slate-400">Fresh from Stitching Line</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <Link
                                to="/inventory"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                            >
                                View Factory Inventory <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Transactions Ledger Table */}
            <Card className="border-slate-200 shadow-xs">
                <CardHeader className="flex flex-col gap-3 pb-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg">Live Transactions Ledger</CardTitle>
                        <CardDescription>
                            Real-time materials intake, production output, and dispatch audit logs
                        </CardDescription>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {FILTER_PILLS.map((pill) => {
                            const isSelected = typeFilter === pill;
                            return (
                                <button
                                    key={pill}
                                    type="button"
                                    onClick={() => handleFilterChange(pill)}
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
                    {recentLoading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : paginatedTransactions.length === 0 ? (
                        <div className="p-6">
                            <EmptyState message="No transactions found matching this filter." />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/75 hover:bg-slate-50/75 border-b border-slate-200">
                                    <TableHead className="w-[120px] font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        TYPE
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        ITEM / MODEL
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        QUANTITY
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        UNIT / GODOWN
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        NOTES
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                        TIMESTAMP
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTransactions.map((txn) => {
                                    const inv =
                                        typeof txn.inventoryId === "object" && txn.inventoryId !== null
                                            ? txn.inventoryId
                                            : null;
                                    const invId = inv
                                        ? inv._id
                                        : typeof txn.inventoryId === "string"
                                          ? txn.inventoryId
                                          : "";
                                    const itemName =
                                        inv?.productId?.name ?? (invId ? `Stock #${invId.slice(-4)}` : "—");
                                    const itemUnit = inv?.productId?.unit;

                                    let unitOrGodown = "Godown";
                                    let unitBadgeStyle = "bg-blue-50 text-[#1565C0] border-blue-200 font-semibold";

                                    if (txn.producedBy?.name) {
                                        unitOrGodown = txn.producedBy.name;
                                        unitBadgeStyle = "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
                                    } else if (txn.consumedBy?.name) {
                                        unitOrGodown = txn.consumedBy.name;
                                        unitBadgeStyle = "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
                                    } else {
                                        let whName = "";
                                        if (inv?.warehouseId) {
                                            if (
                                                typeof inv.warehouseId === "object" &&
                                                inv.warehouseId !== null
                                            ) {
                                                whName = inv.warehouseId.name;
                                            } else if (typeof inv.warehouseId === "string") {
                                                whName =
                                                    warehouseMap.get(inv.warehouseId) ?? "";
                                            }
                                        }
                                        const isFactory = /factory|workshop|floor|stitching|unit/i.test(whName);
                                        if (isFactory) {
                                            unitOrGodown = "Factory";
                                            unitBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
                                        } else {
                                            unitOrGodown = "Godown";
                                            unitBadgeStyle = "bg-blue-50 text-[#1565C0] border-blue-200 font-semibold";
                                        }
                                    }

                                    return (
                                        <TableRow key={txn._id} className="hover:bg-slate-50/60">
                                            <TableCell className="py-3">
                                                <TransactionTypeBadge type={txn.transactionType} />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {invId ? (
                                                    <Link
                                                        to={`/inventory/${invId}`}
                                                        className="font-bold text-slate-900 hover:text-[#1565C0] hover:underline"
                                                    >
                                                        {itemName}
                                                    </Link>
                                                ) : (
                                                    <span className="font-bold text-slate-900">
                                                        {itemName}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {renderQuantityDelta(txn, itemUnit)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${unitBadgeStyle}`}>
                                                    {unitOrGodown}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 max-w-xs text-xs text-slate-600">
                                                <span title={txn.notes ?? ""}>
                                                    {txn.notes || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                                                <span title={format(new Date(txn.timestamp), "d MMM yyyy, HH:mm")}>
                                                    {formatRelativeTime(txn.timestamp)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span>
                                Showing{" "}
                                <strong className="font-semibold text-slate-900">
                                    {totalTransactions === 0
                                        ? 0
                                        : (safeCurrentPage - 1) * pageSize + 1}
                                </strong>{" "}
                                to{" "}
                                <strong className="font-semibold text-slate-900">
                                    {Math.min(safeCurrentPage * pageSize, totalTransactions)}
                                </strong>{" "}
                                of{" "}
                                <strong className="font-semibold text-slate-900">
                                    {totalTransactions}
                                </strong>{" "}
                                transactions
                            </span>

                            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                                <span className="text-slate-500">Rows:</span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={handlePageSizeChange}
                                >
                                    <SelectTrigger className="h-7 w-16 text-xs bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 mr-1">
                                Page <strong className="font-semibold text-slate-800">{safeCurrentPage}</strong> of{" "}
                                <strong className="font-semibold text-slate-800">{totalPages}</strong>
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs bg-white"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={safeCurrentPage <= 1}
                            >
                                <ChevronLeft className="size-3.5 mr-1" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs bg-white"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safeCurrentPage >= totalPages}
                            >
                                Next <ChevronRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
