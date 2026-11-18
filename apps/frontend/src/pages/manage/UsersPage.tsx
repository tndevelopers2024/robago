// src/pages/manage/UsersPage.tsx
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/shared/DataTable";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { Permission, roleLabel } from "@robago/shared";
import UserForm from "@/components/domain/manage/UserForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
    useCreateUserMutation,
    useDeleteUserMutation,
    useUpdateUserMutation,
    useUsersQuery,
} from "@/hooks/queries/useUsersQueries";
import type { UserDTO } from "@/types";

export default function UsersPage() {
    const { data: users, isLoading } = useUsersQuery();
    const createMutation = useCreateUserMutation();
    const updateMutation = useUpdateUserMutation();
    const deleteMutation = useDeleteUserMutation();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<UserDTO | null>(null);

    const columns: ColumnDef<UserDTO>[] = [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "phoneNumber", header: "Phone number" },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <Badge variant={row.original.role === "superadmin" ? "default" : "secondary"}>
                    {roleLabel(row.original.role)}
                </Badge>
            ),
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
                        permission={Permission.UsersManage}
                        trigger={
                            <Button variant="ghost" size="icon-sm">
                                <Trash2 className="size-4 text-red-600" />
                            </Button>
                        }
                        title={`Delete "${row.original.name}"?`}
                        onConfirm={() => deleteMutation.mutateAsync(row.original.phoneNumber)}
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
                            <Plus className="size-4" /> New user
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New user</DialogTitle>
                        </DialogHeader>
                        <UserForm
                            onSubmit={async (values) => {
                                await createMutation.mutateAsync(values as never);
                                setCreateOpen(false);
                            }}
                            onCancel={() => setCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={users ?? []}
                isLoading={isLoading}
                emptyMessage="No users yet — create one to get started."
            />

            <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit user</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <UserForm
                            initial={editing}
                            onSubmit={async (values) => {
                                await updateMutation.mutateAsync({
                                    phoneNumber: editing.phoneNumber,
                                    input: values as never,
                                });
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
