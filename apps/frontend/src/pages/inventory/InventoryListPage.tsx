// src/pages/inventory/InventoryListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useInventoryQuery } from "@/hooks/queries/useInventoryQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ProductType } from "@robago/shared";
import type { InventoryDTO } from "@/types";

export default function InventoryListPage() {
    const navigate = useNavigate();
    const [type, setType] = useState<string>("all");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { data: inventory, isLoading } = useInventoryQuery({
        type: type === "all" ? undefined : type,
        search: debouncedSearch || undefined,
    });

    const columns: ColumnDef<InventoryDTO>[] = [
        { id: "product", header: "Product", accessorFn: (row) => row.productId?.name ?? "—" },
        {
            id: "type",
            header: "Type",
            cell: ({ row }) => <Badge variant="secondary">{row.original.productId?.type}</Badge>,
        },
        { accessorKey: "location", header: "Location" },
        { accessorKey: "quantity", header: "Quantity" },
        {
            id: "price",
            header: "Price",
            cell: ({ row }) => `₹${row.original.price.toFixed(2)}`,
        },
    ];

    return (
        <div className="space-y-4 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={type} onValueChange={setType}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value={ProductType.RawMaterial}>Raw Materials</TabsTrigger>
                        <TabsTrigger value={ProductType.FinishedProduct}>Finished Products</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search products…"
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={inventory ?? []}
                isLoading={isLoading}
                emptyMessage="No inventory items match your filters."
                onRowClick={(row) => navigate(`/inventory/${row._id}`)}
            />
        </div>
    );
}
