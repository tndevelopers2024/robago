// src/pages/DashboardPage.tsx
// One screen for the whole business: stock, staff, payroll and spending — over a soft aurora, in frosted glass.
import { useMemo } from "react";
import Aurora from "@/components/dashboard/Aurora";
import { AdminKpis, SpendingCard } from "@/components/dashboard/AdminWidgets";
import HeroPanel from "@/components/dashboard/HeroPanel";
import LedgerCard from "@/components/dashboard/LedgerCard";
import { LowStockKpi, LowStockList, StockSplitCard } from "@/components/dashboard/StockWidgets";
import { useAuth } from "@/context/AuthProvider";
import { warehouseQueries } from "@/hooks/queries/taggedEntityInstances";
import { useInventoryAlertsQuery, useInventoryQuery } from "@/hooks/queries/useInventoryQueries";
import { Permission, ProductType } from "@robago/shared";

interface Split {
    raw: number;
    finished: number;
    total: number;
    skus: number;
}
const EMPTY: Split = { raw: 0, finished: 0, total: 0, skus: 0 };

export default function DashboardPage() {
    const { user, can } = useAuth();
    // The staff / payroll / spending cards read admin-only data, so only people allowed to see it get them.
    const showMoney = can(Permission.StaffManage) && can(Permission.ExpensesManage);
    const { data: inventory, isLoading: inventoryLoading } = useInventoryQuery();
    const { data: warehouses, isLoading: warehousesLoading } = warehouseQueries.useList();
    const { data: alerts, isLoading: alertsLoading } = useInventoryAlertsQuery();

    const lowItems = useMemo(() => [...(alerts?.rawMaterials ?? []), ...(alerts?.finishedProducts ?? [])], [alerts]);

    // Godown vs factory valuation (a warehouse whose name says factory/workshop/floor counts as the factory).
    const { godown, factory } = useMemo(() => {
        const names = new Map((warehouses ?? []).map((w) => [w._id, w.name]));
        const g: Split = { ...EMPTY };
        const f: Split = { ...EMPTY };
        for (const item of inventory ?? []) {
            const value = (item.price ?? 0) * (item.quantity ?? 0);
            const wh = item.warehouseId;
            const name = typeof wh === "object" && wh !== null ? wh.name : (names.get(wh) ?? "");
            const bucket = /factory|workshop|floor|stitching|unit/i.test(name) ? f : g;
            bucket.skus++;
            bucket.total += value;
            if (item.productId?.type === ProductType.RawMaterial) bucket.raw += value;
            else bucket.finished += value;
        }
        return { godown: g, factory: f };
    }, [inventory, warehouses]);

    const total = godown.total + factory.total;
    const loading = inventoryLoading || warehousesLoading;

    return (
        <div className="relative isolate min-h-full">
            <Aurora />
            <div className="space-y-4 p-3 sm:space-y-5 sm:p-6">
                <HeroPanel
                    name={user?.name}
                    can={can}
                    loading={loading}
                    totalValuation={total}
                    skuCount={inventory?.length ?? 0}
                    godownShare={total > 0 ? Math.round((godown.total / total) * 100) : 0}
                    alertCount={lowItems.length}
                />

                {showMoney && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminKpis />
                        <LowStockKpi count={lowItems.length} loading={alertsLoading} delay={240} />
                    </div>
                )}

                <div className={showMoney ? "grid gap-4 lg:grid-cols-2 xl:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>
                    {can(Permission.ExpensesManage) && <SpendingCard delay={160} />}
                    <StockSplitCard godown={godown} factory={factory} loading={loading} delay={200} />
                    <LowStockList items={lowItems} loading={alertsLoading} delay={240} />
                </div>

                <LedgerCard delay={280} />
            </div>
        </div>
    );
}
