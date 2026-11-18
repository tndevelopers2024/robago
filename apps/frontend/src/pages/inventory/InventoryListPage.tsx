// src/pages/inventory/InventoryListPage.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Tag, AlertTriangle, AlertCircle } from "lucide-react";
import { useInventoryQuery } from "@/hooks/queries/useInventoryQueries";
import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQueries";
import { warehouseQueries } from "@/hooks/queries/taggedEntityInstances";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ProductType } from "@robago/shared";
import CreateStockDialog from "@/components/domain/inventory/CreateStockDialog";
import type { CategoryDTO, InventoryDTO } from "@/types";

export default function InventoryListPage() {
    const navigate = useNavigate();
    const [type, setType] = useState<string>("all");
    const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [stockStatusFilter, setStockStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { data: warehouses } = warehouseQueries.useList();
    const { data: categories } = useCategoriesQuery();

    const { data: inventory, isLoading } = useInventoryQuery({
        type: type === "all" ? undefined : type,
        warehouseId: warehouseFilter === "all" ? undefined : warehouseFilter,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        search: debouncedSearch || undefined,
    });

    // Client-side stock status filter (low stock / in stock / all)
    const filteredInventory = useMemo(() => {
        if (!inventory) return [];
        return inventory.filter((item) => {
            const isLowStock =
                item.alertThreshold != null && item.quantity < item.alertThreshold;
            if (stockStatusFilter === "low") {
                return isLowStock;
            }
            if (stockStatusFilter === "in_stock") {
                return item.quantity > 0;
            }
            if (stockStatusFilter === "out_of_stock") {
                return item.quantity <= 0;
            }
            return true;
        });
    }, [inventory, stockStatusFilter]);

    // Categories filtered by the active product type tab (if raw or finished is chosen)
    const availableCategories = useMemo(() => {
        if (!categories) return [];
        if (type === "all") return categories;
        return categories.filter((c) => c.type === type);
    }, [categories, type]);

    const columns: ColumnDef<InventoryDTO>[] = [
        {
            id: "product",
            header: "Product / Model",
            accessorFn: (row) => row.productId?.name ?? "—",
            cell: ({ row }) => {
                const isLowStock =
                    row.original.alertThreshold != null &&
                    row.original.quantity < row.original.alertThreshold;

                return (
                    <div className="flex items-start gap-2">
                        {isLowStock && (
                            <span
                                className="mt-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0"
                                title="Low stock alert"
                            />
                        )}
                        <div>
                            <div className="font-bold text-slate-900 hover:text-primary transition-colors">
                                {row.original.productId?.name ?? "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                                Unit: {row.original.productId?.unit ?? "Piece"}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "category",
            header: "Category",
            cell: ({ row }) => {
                const cat = row.original.productId?.categoryId;
                const category: CategoryDTO | null =
                    typeof cat === "object" && cat !== null
                        ? cat
                        : categories?.find((c) => c._id === cat) ?? null;

                if (!category) {
                    return <span className="text-xs text-slate-400">—</span>;
                }

                return (
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border"
                        style={{
                            backgroundColor: `${category.tagColor}20`,
                            borderColor: `${category.tagColor}50`,
                            color: "#1e293b",
                        }}
                    >
                        <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: category.tagColor }}
                        />
                        {category.title}
                    </span>
                );
            },
        },
        {
            id: "type",
            header: "Type",
            cell: ({ row }) => {
                const isRaw = row.original.productId?.type === ProductType.RawMaterial;
                return (
                    <Badge
                        variant="secondary"
                        className={
                            isRaw
                                ? "bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                                : "bg-accent text-primary border border-primary/20 font-medium"
                        }
                    >
                        {isRaw ? "Raw Material" : "Finished Bag"}
                    </Badge>
                );
            },
        },
        {
            id: "warehouse",
            header: "Warehouse / Location",
            cell: ({ row }) => {
                const wh = row.original.warehouseId;
                const whName = typeof wh === "object" && wh !== null ? wh.name : "—";
                const whColor = typeof wh === "object" && wh !== null ? wh.tagColor : undefined;

                return (
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                            {whColor && (
                                <span
                                    className="size-2 rounded-full shrink-0"
                                    style={{ backgroundColor: whColor }}
                                />
                            )}
                            <span className="font-medium text-slate-800 text-xs">{whName}</span>
                        </div>
                        <div className="text-xs text-slate-500">{row.original.location || "—"}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "quantity",
            header: "Stock Quantity",
            cell: ({ row }) => {
                const isLowStock =
                    row.original.alertThreshold != null &&
                    row.original.quantity < row.original.alertThreshold;
                const isOutOfStock = row.original.quantity <= 0;

                return (
                    <div className="space-y-0.5">
                        <div
                            className={`flex items-center gap-1 font-semibold ${
                                isOutOfStock || isLowStock ? "text-rose-600 font-bold" : "text-slate-900"
                            }`}
                        >
                            <span>{row.original.quantity}</span>
                            <span className="text-xs font-normal text-slate-500">
                                {row.original.productId?.unit}
                            </span>
                        </div>
                        {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                Out of stock
                            </span>
                        ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="size-2.5" />
                                Low &lt; {row.original.alertThreshold}
                            </span>
                        ) : null}
                    </div>
                );
            },
        },
        {
            id: "price",
            header: "Unit Price",
            cell: ({ row }) => (
                <div className="font-medium text-slate-900">
                    ₹{row.original.price.toFixed(2)}
                </div>
            ),
        },
        {
            id: "valuation",
            header: "Total Valuation",
            cell: ({ row }) => {
                const totalVal = row.original.quantity * row.original.price;
                return (
                    <div className="font-semibold text-slate-900">
                        ₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Top Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Inventory Explorer
                    </h1>
                    <p className="text-sm text-slate-500">
                        Track raw materials and finished products across Godown and Factory Floor
                    </p>
                </div>
                <CreateStockDialog defaultWarehouseId={warehouseFilter !== "all" ? warehouseFilter : undefined} />
            </div>

            {/* Filter Bar: Product Type Tabs + Multi-Filter Dropdowns + Search */}
            <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs
                        value={type}
                        onValueChange={(val) => {
                            setType(val);
                            // Reset category filter if it doesn't belong to the newly selected type
                            setCategoryFilter("all");
                        }}
                    >
                        <TabsList className="bg-slate-100">
                            <TabsTrigger value="all">All Items</TabsTrigger>
                            <TabsTrigger value={ProductType.RawMaterial}>Raw Materials</TabsTrigger>
                            <TabsTrigger value={ProductType.FinishedProduct}>Finished Products</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Search Input */}
                    <div className="relative w-full lg:w-72">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search product name…"
                            className="pl-8 h-9 text-xs bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Multi-Filters: Warehouse, Category, and Stock Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                    {/* Warehouse Filter */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Warehouse / Godown
                        </label>
                        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                            <SelectTrigger className="w-full bg-white h-8 text-xs">
                                <Building2 className="size-3.5 text-slate-400 mr-1.5 shrink-0" />
                                <SelectValue placeholder="All Warehouses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Warehouses & Floor</SelectItem>
                                {warehouses?.map((w) => (
                                    <SelectItem key={w._id} value={w._id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: w.tagColor }}
                                            />
                                            <span>{w.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Category
                        </label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full bg-white h-8 text-xs">
                                <Tag className="size-3.5 text-slate-400 mr-1.5 shrink-0" />
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {availableCategories.map((c) => (
                                    <SelectItem key={c._id} value={c._id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: c.tagColor }}
                                            />
                                            <span>{c.title}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stock Status Filter */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Stock Level
                        </label>
                        <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                            <SelectTrigger className="w-full bg-white h-8 text-xs">
                                <AlertTriangle className="size-3.5 text-slate-400 mr-1.5 shrink-0" />
                                <SelectValue placeholder="All Stock Levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock Levels</SelectItem>
                                <SelectItem value="low">
                                    <span className="text-rose-600 font-medium">⚠️ Low Stock Alert</span>
                                </SelectItem>
                                <SelectItem value="in_stock">In Stock (&gt; 0)</SelectItem>
                                <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredInventory}
                isLoading={isLoading}
                emptyMessage="No inventory items match your filters."
                onRowClick={(row) => navigate(`/inventory/${row._id}`)}
            />
        </div>
    );
}
