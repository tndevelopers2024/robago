// src/pages/inventory/InventoryAlertsPage.tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useInventoryAlertsQuery } from "@/hooks/queries/useInventoryQueries";
import type { InventoryDTO } from "@/types";

function AlertSection({
    title,
    items,
    emptyMessage,
}: {
    title: string;
    items: InventoryDTO[];
    emptyMessage: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <EmptyState message={emptyMessage} />
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li key={item._id}>
                                <Link
                                    to={`/inventory/${item._id}`}
                                    className="flex items-center justify-between py-3 text-sm hover:bg-slate-50"
                                >
                                    <span className="font-medium text-slate-800">
                                        {item.productId?.name ?? "—"}
                                    </span>
                                    <Badge variant="destructive">
                                        {item.quantity} / {item.alertThreshold} threshold
                                    </Badge>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function InventoryAlertsPage() {
    const { data, isLoading } = useInventoryAlertsQuery();

    if (isLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-6">
            <AlertSection
                title="Raw Materials"
                items={data?.rawMaterials ?? []}
                emptyMessage="No raw materials are low in stock!"
            />
            <AlertSection
                title="Finished Products"
                items={data?.finishedProducts ?? []}
                emptyMessage="No finished products are low in stock!"
            />
        </div>
    );
}
