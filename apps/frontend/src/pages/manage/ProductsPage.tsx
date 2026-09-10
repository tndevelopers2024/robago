// src/pages/manage/ProductsPage.tsx
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/shared/DataTable";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import ProductForm from "@/components/domain/manage/ProductForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
    useCreateProductMutation,
    useDeleteProductMutation,
    useProductsQuery,
    useUpdateProductMutation,
} from "@/hooks/queries/useProductsQueries";
import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQueries";
import type { CategoryDTO, ProductDTO } from "@/types";

export default function ProductsPage() {
    const { data: products, isLoading } = useProductsQuery();
    const { data: categories } = useCategoriesQuery();
    const createMutation = useCreateProductMutation();
    const updateMutation = useUpdateProductMutation();
    const deleteMutation = useDeleteProductMutation();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<ProductDTO | null>(null);

    const categoryTitle = (cat: string | CategoryDTO) => {
        if (typeof cat === "object" && cat !== null) return cat.title;
        return categories?.find((c) => c._id === cat)?.title ?? "—";
    };

    const columns: ColumnDef<ProductDTO>[] = [
        { accessorKey: "name", header: "Name" },
        {
            id: "category",
            header: "Category",
            cell: ({ row }) => categoryTitle(row.original.categoryId),
        },
        { accessorKey: "unit", header: "Unit" },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(row.original)}>
                        <Pencil className="size-4" />
                    </Button>
                    <ConfirmDeleteDialog
                        trigger={
                            <Button variant="ghost" size="icon-sm">
                                <Trash2 className="size-4 text-red-600" />
                            </Button>
                        }
                        title={`Delete "${row.original.name}"?`}
                        onConfirm={() => deleteMutation.mutateAsync(row.original._id)}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div />
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="size-4" /> New product
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New product</DialogTitle>
                        </DialogHeader>
                        <ProductForm
                            onSubmit={async (values) => {
                                await createMutation.mutateAsync(values);
                                setCreateOpen(false);
                            }}
                            onCancel={() => setCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={products ?? []}
                isLoading={isLoading}
                emptyMessage="No products yet — create one to get started."
            />

            <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit product</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <ProductForm
                            initial={editing}
                            onSubmit={async (values) => {
                                await updateMutation.mutateAsync({ id: editing._id, input: values });
                                setEditing(null);
                            }}
                            onCancel={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
