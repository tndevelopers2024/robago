import { Link } from "react-router-dom";
import { useInventoryAlerts } from "@/hooks/useInventory";
import { formatCurrencyINR, formatUnitQuantity } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Loader2,
  Package,
} from "lucide-react";

export function InventoryAlertsPage() {
  const { data: alerts = [], isLoading } = useInventoryAlerts();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Low Stock Alert Center
            </h1>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-2 text-xs font-bold text-white">
              {alerts.length}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time monitoring of SKUs below critical replenishment levels
          </p>
        </div>

        <Link to="/inventory">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Package className="h-4 w-4" />
            <span>All Inventory</span>
          </Button>
        </Link>
      </div>

      {alerts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-emerald-200 bg-emerald-50/40">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            All Stocks Healthy & Optimum
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Zero SKUs are currently below their defined alert thresholds across all godown facilities.
          </p>
          <Link to="/inventory">
            <Button size="sm">Explore Inventory</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Critical Warning Banner */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Replenishment Action Required: </span>
              There are {alerts.length} inventory items requiring procurement or factory production orders.
            </div>
          </div>

          {/* Alert Item Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((item) => {
              const deficit = Math.max(0, item.alertThreshold - item.quantity);

              return (
                <Card
                  key={item.id}
                  className="border-rose-200 shadow-xs hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      {item.category && (
                        <Badge colorHex={item.category.tagColor}>
                          {item.category.title}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        <AlertTriangle className="h-3 w-3" />
                        Deficit: {deficit} {item.product?.unit}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                      {item.product?.name}
                    </CardTitle>
                    {item.product?.colorVariant && (
                      <CardDescription className="text-xs text-slate-500">
                        Colorway: {item.product.colorVariant}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Urgency Balance Box */}
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                          Current Stock
                        </span>
                        <span className="text-xl font-extrabold text-rose-600">
                          {formatUnitQuantity(
                            item.quantity,
                            item.product?.unit || "Piece"
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                          Minimum Threshold
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {item.alertThreshold} {item.product?.unit}
                        </span>
                      </div>
                    </div>

                    {/* Godown & Supplier Info */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {item.warehouse?.name}
                        </span>
                        <span>Bay: {item.location}</span>
                      </div>
                      {item.supplier && (
                        <div className="flex items-center justify-between font-medium text-slate-700 pt-1 border-t border-slate-100">
                          <span>Vendor: {item.supplier.name}</span>
                          <span>{formatCurrencyINR(item.price)}/unit</span>
                        </div>
                      )}
                    </div>

                    {/* Direct Action Link */}
                    <Link to={`/inventory/${item.id}`} className="block pt-1">
                      <Button
                        className="w-full h-9 text-xs font-semibold gap-1.5"
                        variant="default"
                      >
                        <span>Add Restock Transaction</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
