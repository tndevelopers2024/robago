// src/pages/manage/CategoriesPage.tsx
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/shared/DataTable";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import CategoryForm from "@/components/domain/manage/CategoryForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
    useCategoriesQuery,
    useCreateCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation,
} from "@/hooks/queries/useCategoriesQueries";
import type { CategoryDTO } from "@/types";

export default function CategoriesPage() {
    const { data: categories, isLoading } = useCategoriesQuery();
    const createMutation = useCreateCategoryMutation();
    const updateMutation = useUpdateCategoryMutation();
    const deleteMutation = useDeleteCategoryMutation();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryDTO | null>(null);

    const columns: ColumnDef<CategoryDTO>[] = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => (
                <span className="flex items-center gap-2">
                    <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: row.original.tagColor }}
                    />
                    {row.original.title}
                </span>
            ),
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
        },
        { accessorKey: "description", header: "Description" },
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
                        title={`Delete "${row.original.title}"?`}
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
                            <Plus className="size-4" /> New category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New category</DialogTitle>
                        </DialogHeader>
                        <CategoryForm
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
                data={categories ?? []}
                isLoading={isLoading}
                emptyMessage="No categories yet — create one to get started."
            />

            <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit category</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <CategoryForm
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
