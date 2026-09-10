// src/pages/inventory/InventoryDetailPage.tsx
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import TransactionTypeBadge from "@/components/shared/StatusBadge";
import TransactionDialog from "@/components/domain/inventory/TransactionDialog";
import { useInventoryDetailQuery } from "@/hooks/queries/useInventoryQueries";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function InventoryDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading } = useInventoryDetailQuery(id);

    if (isLoading || !data) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const { inventory, transactions } = data;

    return (
        <div className="space-y-4 p-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">{inventory.productId?.name ?? "—"}</CardTitle>
                        <p className="text-sm text-slate-500">{inventory.location}</p>
                    </div>
                    <TransactionDialog
                        inventoryId={inventory._id}
                        productType={inventory.productId.type}
                        trigger={
                            <Button>
                                <Plus className="size-4" /> Log transaction
                            </Button>
                        }
                    />
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <dt className="text-xs text-slate-500">Quantity</dt>
                            <dd className="text-lg font-semibold">{inventory.quantity}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Price</dt>
                            <dd className="text-lg font-semibold">₹{inventory.price.toFixed(2)}</dd>
                        </div>
                        {inventory.alertThreshold != null && (
                            <div>
                                <dt className="text-xs text-slate-500">Alert threshold</dt>
                                <dd className="text-lg font-semibold">{inventory.alertThreshold}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-xs text-slate-500">Last updated</dt>
                            <dd className="text-sm">{format(new Date(inventory.lastUpdated), "d MMM yyyy, HH:mm")}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction history</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <EmptyState message="No transactions logged for this item yet." />
                    ) : (
                        <ul className="divide-y">
                            {transactions.map((txn) => (
                                <li key={txn._id} className="flex items-center justify-between py-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <TransactionTypeBadge type={txn.transactionType} />
                                        <span>
                                            Qty {txn.quantity}
                                            {txn.producedBy ? ` — ${txn.producedBy.name}` : ""}
                                            {txn.consumedBy ? ` — ${txn.consumedBy.name}` : ""}
                                            {txn.notes ? ` — ${txn.notes}` : ""}
                                        </span>
                                    </div>
                                    <span className="text-slate-400">
                                        {format(new Date(txn.timestamp), "d MMM yyyy, HH:mm")}
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
