// src/pages/DashboardPage.tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthProvider";
import { useInventoryAlertsQuery, useInventoryQuery } from "@/hooks/queries/useInventoryQueries";
import { useRecentTransactionsQuery } from "@/hooks/queries/useTransactionsQueries";
import TransactionTypeBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { AlertTriangle, Package, PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: inventory, isLoading: inventoryLoading } = useInventoryQuery();
    const { data: alerts, isLoading: alertsLoading } = useInventoryAlertsQuery();
    const { data: recent, isLoading: recentLoading } = useRecentTransactionsQuery(10);

    const alertCount = (alerts?.rawMaterials.length ?? 0) + (alerts?.finishedProducts.length ?? 0);

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome{user ? `, ${user.name}` : ""}
                </h1>
                <p className="text-sm text-slate-500">Here's what's happening in your inventory.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total SKUs</CardTitle>
                        <Package className="size-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        {inventoryLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">{inventory?.length ?? 0}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Low Stock</CardTitle>
                        <AlertTriangle className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {alertsLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <Link to="/inventory/alerts" className="text-2xl font-bold hover:underline">
                                {alertCount}
                            </Link>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Quick Action</CardTitle>
                        <PlusCircle className="size-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <Link to="/inventory" className="text-sm font-medium text-[#1565C0] hover:underline">
                            Log a transaction →
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : !recent || recent.length === 0 ? (
                        <EmptyState message="No transactions logged yet." />
                    ) : (
                        <ul className="divide-y">
                            {recent.map((txn) => (
                                <li key={txn._id} className="flex items-center justify-between py-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <TransactionTypeBadge type={txn.transactionType} />
                                        <span className="text-slate-600">
                                            Qty {txn.quantity}
                                            {txn.notes ? ` — ${txn.notes}` : ""}
                                        </span>
                                    </div>
                                    <span className="text-slate-400">
                                        {format(new Date(txn.timestamp), "d MMM, HH:mm")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
