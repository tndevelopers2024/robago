// src/pages/inventory/InventoryAlertsPage.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import { useInventoryAlertsQuery } from "@/hooks/queries/useInventoryQueries";
import { warehouseQueries } from "@/hooks/queries/taggedEntityInstances";
import { AlertTriangle, Building2, Factory, Layers, ArrowRight } from "lucide-react";
import type { InventoryDTO } from "@/types";

type WarehouseFilter = "all" | "godown" | "factory";

function getItemWarehouseName(item: InventoryDTO, warehouseMap: Map<string, string>): string {
    if (typeof item.warehouseId === "object" && item.warehouseId !== null) {
        return item.warehouseId.name;
    }
    if (typeof item.warehouseId === "string") {
        return warehouseMap.get(item.warehouseId) ?? "Unknown Location";
    }
    return "Unknown Location";
}

function isFactoryItem(item: InventoryDTO, warehouseMap: Map<string, string>): boolean {
    const name = getItemWarehouseName(item, warehouseMap);
    return /factory|workshop|floor|stitching|unit/i.test(name);
}

function AlertSection({
    title,
    description,
    items,
    emptyMessage,
    warehouseMap,
}: {
    title: string;
    description: string;
    items: InventoryDTO[];
    emptyMessage: string;
    warehouseMap: Map<string, string>;
}) {
    return (
        <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Badge variant={items.length > 0 ? "destructive" : "secondary"}>
                        {items.length} {items.length === 1 ? "deficit" : "deficits"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-3">
                {items.length === 0 ? (
                    <EmptyState message={emptyMessage} />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {items.map((item) => {
                            const whName = getItemWarehouseName(item, warehouseMap);
                            const unit = item.productId?.unit ?? "units";
                            const deficit = Math.max(0, (item.alertThreshold ?? 0) - item.quantity);

                            return (
                                <li key={item._id}>
                                    <Link
                                        to={`/inventory/${item._id}`}
                                        className="group flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                                    {item.productId?.name ?? "—"}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    ({item.location})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                                                    {isFactoryItem(item, warehouseMap) ? (
                                                        <Factory className="size-3 text-emerald-600" />
                                                    ) : (
                                                        <Building2 className="size-3 text-blue-600" />
                                                    )}
                                                    {whName}
                                                </span>
                                                <span>•</span>
                                                <span className="text-amber-700 font-medium">
                                                    Deficit: {deficit} {unit}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="border-red-200 bg-red-50 text-red-700 font-semibold px-2.5 py-1"
                                            >
                                                {item.quantity} / {item.alertThreshold} {unit} threshold
                                            </Badge>
                                            <ArrowRight className="size-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function InventoryAlertsPage() {
    const [warehouseFilter, setWarehouseFilter] = useState<WarehouseFilter>("all");
    const { data: alerts, isLoading: alertsLoading } = useInventoryAlertsQuery();
    const { data: warehouses, isLoading: warehousesLoading } = warehouseQueries.useList();

    const warehouseMap = useMemo(() => {
        const map = new Map<string, string>();
        if (warehouses) {
            for (const w of warehouses) {
                map.set(w._id, w.name);
            }
        }
        return map;
    }, [warehouses]);

    const filteredAlerts = useMemo(() => {
        const raw = alerts?.rawMaterials ?? [];
        const finished = alerts?.finishedProducts ?? [];

        if (warehouseFilter === "all") {
            return { rawMaterials: raw, finishedProducts: finished };
        }

        const isFactoryTarget = warehouseFilter === "factory";
        const filterFn = (item: InventoryDTO) =>
            isFactoryItem(item, warehouseMap) === isFactoryTarget;

        return {
            rawMaterials: raw.filter(filterFn),
            finishedProducts: finished.filter(filterFn),
        };
    }, [alerts, warehouseFilter, warehouseMap]);

    // Counts for filter badges
    const counts = useMemo(() => {
        const allItems = [...(alerts?.rawMaterials ?? []), ...(alerts?.finishedProducts ?? [])];
        const godownCount = allItems.filter((i) => !isFactoryItem(i, warehouseMap)).length;
        const factoryCount = allItems.filter((i) => isFactoryItem(i, warehouseMap)).length;

        return {
            all: allItems.length,
            godown: godownCount,
            factory: factoryCount,
        };
    }, [alerts, warehouseMap]);

    if (alertsLoading || warehousesLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-12 w-80" />
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-44 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header & Filter Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-6 text-amber-500" />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Inventory Alerts Console
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Stock deficits across raw material bolts, lining rolls, and finished bag inventory
                    </p>
                </div>

                {/* Warehouse Filter Tabs */}
                <Tabs
                    value={warehouseFilter}
                    onValueChange={(val) => setWarehouseFilter(val as WarehouseFilter)}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                        <TabsTrigger value="all" className="flex items-center gap-1.5">
                            <Layers className="size-3.5" />
                            <span>All</span>
                            <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                                {counts.all}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="godown" className="flex items-center gap-1.5">
                            <Building2 className="size-3.5" />
                            <span>Godown</span>
                            <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                                {counts.godown}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="factory" className="flex items-center gap-1.5">
                            <Factory className="size-3.5" />
                            <span>Factory</span>
                            <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                                {counts.factory}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Alert Sections */}
            <div className="space-y-6">
                <AlertSection
                    title="Raw Materials Low Stock"
                    description="Fabrics, mesh, and trim stock below minimum safety threshold (meters/rolls)"
                    items={filteredAlerts.rawMaterials}
                    emptyMessage={`No raw materials are low in stock ${warehouseFilter !== "all" ? `at the ${warehouseFilter}` : ""}.`}
                    warehouseMap={warehouseMap}
                />

                <AlertSection
                    title="Finished Products Low Stock"
                    description="Ready-to-dispatch backpacks and executive bags below buffer threshold (units/pieces)"
                    items={filteredAlerts.finishedProducts}
                    emptyMessage={`No finished products are low in stock ${warehouseFilter !== "all" ? `at the ${warehouseFilter}` : ""}.`}
                    warehouseMap={warehouseMap}
                />
            </div>
        </div>
    );
}
