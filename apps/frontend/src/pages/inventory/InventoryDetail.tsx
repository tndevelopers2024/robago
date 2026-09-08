import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useInventoryDetail,
  useUpdateStock,
} from "@/hooks/useInventory";
import {
  useTransactionsList,
  useCreateTransaction,
} from "@/hooks/useTransactions";
import {
  useProductionUnits,
  useSuppliers,
  useWarehouses,
} from "@/hooks/useMasterData";
import { formatCurrencyINR, formatUnitQuantity, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  PlusCircle,
  Edit,
  AlertTriangle,
  Building2,
  Factory,
  History,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema, type CreateTransactionInput } from "@/schemas/transaction.schema";
import { editStockSchema, type EditStockInput } from "@/schemas/inventory.schema";

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [txSheetOpen, setTxSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Queries
  const { data: item, isLoading, error } = useInventoryDetail(id || "");
  const { data: txData, isLoading: txLoading } = useTransactionsList({
    inventoryId: id,
    limit: 20,
  });
  const { data: productionUnits = [] } = useProductionUnits();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();

  // Mutations
  const createTxMutation = useCreateTransaction();
  const updateStockMutation = useUpdateStock();

  // Transaction Sheet Form
  const {
    register: registerTx,
    handleSubmit: handleTxSubmit,
    watch: watchTx,
    reset: resetTx,
    formState: { errors: txErrors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      transactionType: "Purchase",
      quantity: 1,
      unitId: "",
      notes: "",
    },
  });

  // Edit Stock Sheet Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
  } = useForm<EditStockInput>({
    resolver: zodResolver(editStockSchema),
    values: item
      ? {
          price: item.price,
          alertThreshold: item.alertThreshold,
          location: item.location,
          warehouseId: item.warehouseId,
          supplierId: item.supplierId || "",
        }
      : undefined,
  });

  const selectedTxType = watchTx("transactionType");
  const enteredQty = watchTx("quantity") || 0;

  // Live Overdraft Check for UI Warning
  const isOverdraftWarning =
    item &&
    (selectedTxType === "Sale" || selectedTxType === "Consumption") &&
    enteredQty > item.quantity;

  const onPostTransaction = async (data: CreateTransactionInput) => {
    if (!item) return;

    const isProduction = data.transactionType === "Production";
    const isConsumption = data.transactionType === "Consumption";

    await createTxMutation.mutateAsync({
      inventoryId: item.id,
      transactionType: data.transactionType,
      quantity: Number(data.quantity),
      producedBy: isProduction ? data.unitId || null : null,
      consumedBy: isConsumption ? data.unitId || null : null,
      notes: data.notes || null,
    });

    resetTx();
    setTxSheetOpen(false);
  };

  const onSaveStockParams = async (data: EditStockInput) => {
    if (!item) return;

    await updateStockMutation.mutateAsync({
      id: item.id,
      payload: {
        price: data.price,
        alertThreshold: data.alertThreshold,
        location: data.location,
        warehouseId: data.warehouseId,
        supplierId: data.supplierId || null,
      },
    });

    setEditSheetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">SKU Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          The requested inventory item could not be retrieved.
        </p>
        <Button onClick={() => navigate("/inventory")}>Return to Inventory</Button>
      </div>
    );
  }

  const isLowStock = item.quantity <= item.alertThreshold;
  const valuation = item.quantity * item.price;

  return (
    <div className="space-y-6">
      {/* Back Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Inventory Explorer</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditSheetOpen(true)}
            className="gap-1.5 text-xs h-9"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Parameters</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setTxSheetOpen(true)}
            className="gap-1.5 text-xs h-9 font-semibold shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Hero SKU Card */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {item.category && (
                  <Badge colorHex={item.category.tagColor}>
                    {item.category.title}
                  </Badge>
                )}
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 uppercase">
                  {item.product?.type === "RawMaterial"
                    ? "Raw Material"
                    : "Finished Product"}
                </span>
                {isLowStock ? (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Low Stock Alert
                  </Badge>
                ) : (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Healthy Stock
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {item.product?.name}
              </h1>

              {item.product?.colorVariant && (
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Colorway:{" "}
                  <strong className="text-slate-800">
                    {item.product.colorVariant}
                  </strong>
                </p>
              )}
            </div>

            {/* Current Stock Banner */}
            <div className="flex flex-col md:items-end rounded-2xl bg-slate-50 p-4 border border-slate-100 min-w-[200px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Godown Balance
              </span>
              <div
                className={`text-3xl font-extrabold tracking-tight mt-0.5 ${
                  isLowStock ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {formatUnitQuantity(
                  item.quantity,
                  item.product?.unit || "Piece"
                )}
              </div>
              <span className="text-xs text-slate-400 mt-1">
                Threshold: {item.alertThreshold} {item.product?.unit}
              </span>
            </div>
          </div>

          {/* Operational Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-5 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Unit Cost Rate</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrencyINR(item.price)}
              </span>
              <span className="text-xs text-slate-400">
                {" "}
                / {item.product?.unit}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Total Valuation</span>
              <span className="text-base font-bold text-indigo-700">
                {formatCurrencyINR(valuation)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Location Godown</span>
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {item.warehouse?.name} ({item.location})
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Primary Supplier</span>
              <span className="text-sm font-semibold text-slate-800 truncate block mt-0.5">
                {item.supplier?.name || "In-House Manufacturing"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Ledger for this SKU */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Stock Movement History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit log of all inward and outward transactions for this SKU
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setTxSheetOpen(true)}
            className="gap-1 text-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Record Movement
          </Button>
        </CardHeader>

        <CardContent>
          {txLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : !txData?.transactions.length ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No historical transactions recorded yet for this SKU.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/70">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3">Production Unit</th>
                    <th className="py-2.5 px-3">Authorized By</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txData.transactions.map((tx) => {
                    const isCredit =
                      tx.transactionType === "Purchase" ||
                      tx.transactionType === "Production" ||
                      tx.transactionType === "KitAssembly";

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              isCredit
                                ? "success"
                                : tx.transactionType === "Consumption"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {tx.transactionType}
                          </Badge>
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                            isCredit ? "text-emerald-600" : "text-slate-800"
                          }`}
                        >
                          {isCredit ? `+${tx.quantity}` : `-${tx.quantity}`}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            {item.product?.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-700">
                          {tx.productionUnitName ? (
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Factory className="h-3 w-3 text-slate-400" />
                              {tx.productionUnitName}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600">
                          {tx.createdByName || "System"}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500 max-w-xs truncate">
                          {tx.notes || "—"}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-400 text-right whitespace-nowrap">
                          {formatRelativeTime(tx.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-Over: Add Stock Transaction Sheet */}
      <Sheet open={txSheetOpen} onOpenChange={setTxSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Record Stock Movement</SheetTitle>
            <SheetDescription>
              Post inward receipt, production output, consumption, or outward dispatch for{" "}
              <strong>{item.product?.name}</strong>.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleTxSubmit(onPostTransaction)}
            className="space-y-4 mt-2"
          >
            {/* Current Stock Banner in Drawer */}
            <div className="rounded-xl bg-slate-100 p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Available Godown Stock:
              </span>
              <span className="text-sm font-bold text-slate-900">
                {formatUnitQuantity(
                  item.quantity,
                  item.product?.unit || "Piece"
                )}
              </span>
            </div>

            {/* Transaction Type */}
            <div className="space-y-1.5">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select id="transactionType" {...registerTx("transactionType")}>
                <option value="Purchase">Purchase (Inward Delivery)</option>
                <option value="Production">Production (Completed Stitching)</option>
                <option value="Sale">Sale (Outward Customer Dispatch)</option>
                <option value="Consumption">Consumption (Fabric Used in Cutting)</option>
                <option value="Adjustment">Adjustment (Audit Correction)</option>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="txQuantity">
                Quantity ({item.product?.unit || "Units"})
              </Label>
              <Input
                id="txQuantity"
                type="number"
                step="0.01"
                placeholder="Enter quantity"
                className={isOverdraftWarning ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                {...registerTx("quantity", { valueAsNumber: true })}
              />
              {txErrors.quantity && (
                <p className="text-xs text-rose-500 font-medium">
                  {txErrors.quantity.message}
                </p>
              )}

              {/* Strict Overdraft Warning Alert */}
              {isOverdraftWarning && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-2.5 border border-rose-200 text-rose-800 text-xs mt-1">
                  <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Overdraft Alert:</strong> Cannot deduct {enteredQty}{" "}
                    {item.product?.unit}. Only {item.quantity} are currently available
                    in the godown.
                  </div>
                </div>
              )}
            </div>

            {/* Production / Consumption Unit */}
            {(selectedTxType === "Production" ||
              selectedTxType === "Consumption") && (
              <div className="space-y-1.5">
                <Label htmlFor="unitId">Production Unit / Stitching Contractor</Label>
                <Select id="unitId" {...registerTx("unitId")}>
                  <option value="">Select Production Unit</option>
                  {productionUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Notes / Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes / Bill / Batch Reference</Label>
              <Input
                id="notes"
                placeholder="e.g. S A IMPEX cutting order, Inv #1042"
                {...registerTx("notes")}
              />
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTxSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={Boolean(isOverdraftWarning) || createTxMutation.isPending}
              >
                {createTxMutation.isPending ? "Recording..." : "Confirm Movement"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Slide-Over: Edit Stock Parameters Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit Stock Parameters</SheetTitle>
            <SheetDescription>
              Update rate valuation, alert limits, or storage bay for this SKU.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleEditSubmit(onSaveStockParams)}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="editPrice">Unit Rate (₹)</Label>
              <Input
                id="editPrice"
                type="number"
                step="0.01"
                {...registerEdit("price", { valueAsNumber: true })}
              />
              {editErrors.price && (
                <p className="text-xs text-rose-500 font-medium">
                  {editErrors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editThreshold">Low Stock Alert Level</Label>
              <Input
                id="editThreshold"
                type="number"
                {...registerEdit("alertThreshold", { valueAsNumber: true })}
              />
              {editErrors.alertThreshold && (
                <p className="text-xs text-rose-500 font-medium">
                  {editErrors.alertThreshold.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editLocation">Godown Bay / Rack</Label>
              <Input id="editLocation" {...registerEdit("location")} />
              {editErrors.location && (
                <p className="text-xs text-rose-500 font-medium">
                  {editErrors.location.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editWarehouse">Storage Godown</Label>
              <Select id="editWarehouse" {...registerEdit("warehouseId")}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editSupplier">Vendor / Supplier</Label>
              <Select id="editSupplier" {...registerEdit("supplierId")}>
                <option value="">None (In-House)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateStockMutation.isPending}>
                {updateStockMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
