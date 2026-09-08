import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import { useTransactionsList } from "@/hooks/useTransactions";
import { formatCurrencyINR, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransactionType } from "@/types";
import {
  TrendingUp,
  Package,
  Layers,
  AlertTriangle,
  Factory,
  ShoppingBag,
  Sliders,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics();
  const [selectedType, setSelectedType] = useState<TransactionType | "All">("All");
  const [page, setPage] = useState(1);

  const {
    data: transactionsData,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useTransactionsList({
    page,
    limit: 8,
    type: selectedType === "All" ? undefined : selectedType,
  });

  const getTransactionBadge = (type: TransactionType) => {
    switch (type) {
      case "Purchase":
        return <Badge variant="success">Purchase</Badge>;
      case "Production":
        return <Badge variant="default">Production</Badge>;
      case "Sale":
        return <Badge variant="secondary">Sale</Badge>;
      case "Consumption":
        return <Badge variant="warning">Consumed</Badge>;
      case "Adjustment":
        return <Badge variant="outline">Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getQuantityDisplay = (type: TransactionType, quantity: number) => {
    const isCredit =
      type === "Purchase" || type === "Production" || type === "KitAssembly";
    return (
      <span
        className={`font-semibold text-sm ${
          isCredit ? "text-emerald-600" : "text-slate-800"
        }`}
      >
        {isCredit ? `+${quantity}` : `-${quantity}`}
      </span>
    );
  };

  const refreshAll = () => {
    refetchMetrics();
    refetchTx();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Operational Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time godown valuation, inventory status, and production ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="h-9 gap-1.5"
            title="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Sync Data</span>
          </Button>

          <Link to="/inventory">
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Manage Stock</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {metricsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-32 bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Raw Materials Valuation */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Raw Materials Valuation
              </CardTitle>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrencyINR(metrics?.rawMaterialsValue || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Across <strong>{metrics?.totalRawMaterialCount}</strong> raw material SKUs
              </p>
            </CardContent>
          </Card>

          {/* Finished Goods Valuation */}
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Finished Stock Valuation
              </CardTitle>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrencyINR(metrics?.finishedProductsValue || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Across <strong>{metrics?.totalFinishedProductCount}</strong> catalog bag models
              </p>
            </CardContent>
          </Card>

          {/* Total Combined Godown Value */}
          <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Godown Asset Value
              </CardTitle>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700 tracking-tight">
                {formatCurrencyINR(
                  (metrics?.rawMaterialsValue || 0) +
                    (metrics?.finishedProductsValue || 0)
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Central Godown + Factory Units
              </p>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Link to="/inventory/alerts">
            <Card className="border-l-4 border-l-rose-500 shadow-sm hover:border-rose-600 transition-colors cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Critical Low Stock
                </CardTitle>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-rose-600 tracking-tight">
                    {metrics?.lowStockAlertCount || 0}
                  </div>
                  <span className="text-xs font-medium text-rose-600">
                    SKUs Below Threshold
                  </span>
                </div>
                <p className="text-xs text-indigo-600 group-hover:underline mt-1">
                  View alert items &rarr;
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Operational Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/inventory?type=RawMaterial">
          <Card className="p-3.5 hover:bg-slate-50 transition-colors border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Raw Fabrics</div>
                <div className="text-[11px] text-slate-500">Rolls & Trims</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/inventory?type=FinishedProduct">
          <Card className="p-3.5 hover:bg-slate-50 transition-colors border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Finished Bags</div>
                <div className="text-[11px] text-slate-500">BB-STOCK Catalog</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/manage?tab=productionUnits">
          <Card className="p-3.5 hover:bg-slate-50 transition-colors border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <Factory className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Production Units</div>
                <div className="text-[11px] text-slate-500">S A IMPEX, Parrys</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/manage">
          <Card className="p-3.5 hover:bg-slate-50 transition-colors border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Master Hub</div>
                <div className="text-[11px] text-slate-500">Categories & Vendors</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions Activity Feed */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Live Godown Transactions Ledger
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Real-time audit log of stock movements, receipts, and factory disbursements
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                "All",
                "Purchase",
                "Production",
                "Sale",
                "Consumption",
                "Adjustment",
              ] as const
            ).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedType(t);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedType === t
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : !transactionsData?.transactions.length ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No transactions recorded for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/70">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Item / Model</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3">Unit / Godown</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionsData.transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-3">
                        {getTransactionBadge(tx.transactionType)}
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          to={`/inventory/${tx.inventoryId}`}
                          className="font-semibold text-indigo-600 hover:underline"
                        >
                          {tx.productName}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {getQuantityDisplay(tx.transactionType, tx.quantity)}{" "}
                        <span className="text-xs text-slate-500">
                          {tx.productUnit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        {tx.productionUnitName ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <Factory className="h-3 w-3 text-slate-400" />
                            {tx.productionUnitName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 max-w-xs truncate">
                        {tx.notes || "—"}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 text-right whitespace-nowrap">
                        {formatRelativeTime(tx.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2 text-xs text-slate-500">
                <span>
                  Showing {transactionsData.transactions.length} of{" "}
                  {transactionsData.total} transactions
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2 text-xs"
                  >
                    Previous
                  </Button>
                  <span>Page {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 8 >= transactionsData.total}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 px-2 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
