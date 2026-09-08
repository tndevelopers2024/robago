import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  useInventoryList,
  useCreateStock,
} from "@/hooks/useInventory";
import {
  useProducts,
  useWarehouses,
  useSuppliers,
} from "@/hooks/useMasterData";
import { formatCurrencyINR, formatUnitQuantity } from "@/lib/utils";
import type { ProductType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  Plus,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Building2,
  Boxes,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStockSchema, type CreateStockInput } from "@/schemas/inventory.schema";

export function InventoryExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as ProductType) || undefined;

  const [activeTab, setActiveTab] = useState<ProductType | "ALL">(
    initialType || "ALL"
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Queries
  const { data: inventory = [], isLoading } = useInventoryList({
    type: activeTab === "ALL" ? undefined : activeTab,
    warehouseId: warehouseFilter === "all" ? undefined : warehouseFilter,
    search: searchQuery,
  });

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: suppliers = [] } = useSuppliers();

  // Mutations
  const createStockMutation = useCreateStock();

  // Create Stock Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStockInput>({
    resolver: zodResolver(createStockSchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      supplierId: "",
      price: 0,
      quantity: 0,
      alertThreshold: 50,
      location: "Rack A",
    },
  });

  const handleTabChange = (tab: ProductType | "ALL") => {
    setActiveTab(tab);
    if (tab === "ALL") {
      searchParams.delete("type");
    } else {
      searchParams.set("type", tab);
    }
    setSearchParams(searchParams);
  };

  const onSubmitCreate = async (data: CreateStockInput) => {
    await createStockMutation.mutateAsync({
      productId: data.productId,
      warehouseId: data.warehouseId,
      supplierId: data.supplierId || null,
      price: data.price,
      quantity: data.quantity,
      alertThreshold: data.alertThreshold,
      location: data.location,
    });
    reset();
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Inventory Explorer
          </h1>
          <p className="text-sm text-slate-500">
            Search, inspect valuation, and initiate warehouse movements
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-10 gap-2 font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Stock SKU</span>
        </Button>
      </div>

      {/* Control Bar: Tabs, Search, Warehouse Filter, View Toggle */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Classification Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-slate-500">
            <button
              onClick={() => handleTabChange("ALL")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              All SKUs
            </button>
            <button
              onClick={() => handleTabChange("RawMaterial")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "RawMaterial"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Raw Materials
            </button>
            <button
              onClick={() => handleTabChange("FinishedProduct")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "FinishedProduct"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Finished Bags
            </button>
          </div>

          {/* Search, Filter & Layout Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search model, SKU, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            {/* Warehouse Filter */}
            <div className="w-36">
              <Select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="all">All Godowns</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Table View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Items Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <div className="rounded-full bg-indigo-50 p-4 text-indigo-600 mb-3">
            <Boxes className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            No stock records found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            No inventory matches the current search or filters. Try adjusting your query or create a new stock entry.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add First Stock SKU
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inventory.map((item) => {
            const isLowStock = item.quantity <= item.alertThreshold;
            const valuation = item.quantity * item.price;

            return (
              <Link
                key={item.id}
                to={`/inventory/${item.id}`}
                className="group block focus:outline-none"
              >
                <Card className="h-full border-slate-200/80 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
                  <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        {item.category && (
                          <Badge
                            colorHex={item.category.tagColor}
                            className="truncate max-w-[150px]"
                          >
                            {item.category.title}
                          </Badge>
                        )}
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Building2 className="h-3 w-3" />
                            {item.warehouse?.name || "Godown"}
                          </span>
                        )}
                      </div>

                      {/* Product Name & Colorway */}
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.product?.name}
                      </h3>

                      {item.product?.colorVariant && (
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                          Colorway:{" "}
                          <span className="font-semibold text-slate-700">
                            {item.product.colorVariant}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stock Metrics Box */}
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Stock On-Hand
                        </span>
                        <span
                          className={`text-lg font-bold tracking-tight ${
                            isLowStock ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {formatUnitQuantity(
                            item.quantity,
                            item.product?.unit || "Piece"
                          )}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                        <span className="text-slate-500">
                          Rate: {formatCurrencyINR(item.price)}/
                          {item.product?.unit || "unit"}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatCurrencyINR(valuation)}
                        </span>
                      </div>
                    </div>

                    {/* Footer Location & Action */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="truncate">
                        Loc: <strong>{item.location}</strong>
                      </span>
                      <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Transact <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/80">
                <tr>
                  <th className="py-3 px-4">Item SKU / Model</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Godown</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Valuation</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const isLowStock = item.quantity <= item.alertThreshold;
                  const valuation = item.quantity * item.price;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/inventory/${item.id}`}
                            className="font-semibold text-slate-900 hover:text-indigo-600"
                          >
                            {item.product?.name}
                          </Link>
                          {isLowStock && (
                            <span className="flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                          )}
                        </div>
                        {item.product?.colorVariant && (
                          <div className="text-xs text-slate-400">
                            {item.product.colorVariant}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.category && (
                          <Badge colorHex={item.category.tagColor}>
                            {item.category.title}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                        {item.warehouse?.name}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                          isLowStock ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {formatUnitQuantity(
                          item.quantity,
                          item.product?.unit || "Piece"
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-600 whitespace-nowrap">
                        {formatCurrencyINR(item.price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrencyINR(valuation)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {item.location}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link to={`/inventory/${item.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Stock SKU Dialog Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Stock Inventory Entry</DialogTitle>
            <DialogDescription>
              Assign a catalog product to a godown warehouse with initial balance and price.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="productId">Product / Model</Label>
              <Select id="productId" {...register("productId")}>
                <option value="">Select a Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.colorVariant ? `(${p.colorVariant})` : ""} [
                    {p.unit}]
                  </option>
                ))}
              </Select>
              {errors.productId && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.productId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="warehouseId">Warehouse Godown</Label>
                <Select id="warehouseId" {...register("warehouseId")}>
                  <option value="">Select Godown</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
                {errors.warehouseId && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.warehouseId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplierId">Supplier / Vendor</Label>
                <Select id="supplierId" {...register("supplierId")}>
                  <option value="">None (In-House)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Opening Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price">Unit Cost Rate (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="alertThreshold">Low Stock Alert Level</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  placeholder="50"
                  {...register("alertThreshold", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Godown Bay / Rack</Label>
                <Input
                  id="location"
                  placeholder="Bay 3-A"
                  {...register("location")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createStockMutation.isPending}>
                {createStockMutation.isPending ? "Saving..." : "Create SKU Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
