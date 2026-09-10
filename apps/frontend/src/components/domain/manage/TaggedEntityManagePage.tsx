// src/components/domain/manage/TaggedEntityManagePage.tsx
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import DataTable from "@/components/shared/DataTable";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import ColorTagPicker from "@/components/shared/ColorTagPicker";
import InputField from "@/components/InputField";
import TextareaField from "@/components/TextareaField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { TagColor } from "@robago/shared";
import type { TaggedEntityDTO } from "@/types";

interface TaggedEntityInput {
    name: string;
    description?: string;
    tagColor: string;
}

// Warehouse/Supplier/ProductionUnit's three real schemas are byte-identical
// (robago-prd.md §5/§9.1: taggedEntityBaseSchema, reused verbatim by all three) — this
// fixed shape is that schema's *input* type (description has a `.default("")`, so it's
// optional pre-parse). Hardcoding it here, instead of trying to keep this component
// generic over TCreate's input/output distinction, sidesteps a genuinely hairy
// react-hook-form + Zod v4 generic-variance mismatch (see CategoryForm.tsx's comment for
// the same issue in a non-generic form) while staying accurate for every real caller.
interface TaggedEntityFormValues {
    name: string;
    description?: string;
    tagColor: TagColor;
}

interface TaggedEntityQueries<TCreate, TUpdate> {
    useList: () => { data: TaggedEntityDTO[] | undefined; isLoading: boolean };
    useCreate: () => { mutateAsync: (input: TCreate) => Promise<unknown> };
    useUpdate: () => { mutateAsync: (vars: { id: string; input: TUpdate }) => Promise<unknown> };
    useDelete: () => { mutateAsync: (id: string) => Promise<unknown> };
}

interface TaggedEntityManagePageProps<TCreate extends TaggedEntityInput, TUpdate> {
    resourceLabel: string; // e.g. "warehouse"
    resourceLabelPlural: string; // e.g. "warehouses"
    schema: ZodType<TCreate>;
    queries: TaggedEntityQueries<TCreate, TUpdate>;
}

/** One generic implementation shared by Warehouses/Suppliers/Production Units — their
 *  form and table are byte-identical (robago-prd.md §5), so this is written once and
 *  parameterized rather than copy-pasted three times (see the manage-CRUD phase note in
 *  frontend-implementation-plan.md §5 Phase 3). */
export function TaggedEntityManagePage<TCreate extends TaggedEntityInput, TUpdate>({
    resourceLabel,
    resourceLabelPlural,
    schema,
    queries,
}: TaggedEntityManagePageProps<TCreate, TUpdate>) {
    const { data, isLoading } = queries.useList();
    const createMutation = queries.useCreate();
    const updateMutation = queries.useUpdate();
    const deleteMutation = queries.useDelete();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<TaggedEntityDTO | null>(null);

    const columns: ColumnDef<TaggedEntityDTO>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <span className="flex items-center gap-2">
                    <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: row.original.tagColor }}
                    />
                    {row.original.name}
                </span>
            ),
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
                            <Plus className="size-4" /> New {resourceLabel}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New {resourceLabel}</DialogTitle>
                        </DialogHeader>
                        <TaggedEntityFormBody
                            schema={schema}
                            onSubmit={async (values) => {
                                await createMutation.mutateAsync(values as unknown as TCreate);
                                setCreateOpen(false);
                            }}
                            onCancel={() => setCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={data ?? []}
                isLoading={isLoading}
                emptyMessage={`No ${resourceLabelPlural} yet — create one to get started.`}
            />

            <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit {resourceLabel}</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <TaggedEntityFormBody
                            schema={schema}
                            initial={editing}
                            onSubmit={async (values) => {
                                await updateMutation.mutateAsync({
                                    id: editing._id,
                                    input: values as unknown as TUpdate,
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

function TaggedEntityFormBody<TCreate extends TaggedEntityInput>({
    schema,
    initial,
    onSubmit,
    onCancel,
}: {
    schema: ZodType<TCreate>;
    initial?: TaggedEntityDTO;
    onSubmit: (values: TaggedEntityFormValues) => Promise<unknown>;
    onCancel: () => void;
}) {
    const form = useForm<TaggedEntityFormValues>({
        // Safe cast: every real caller's schema is taggedEntityBaseSchema verbatim (see
        // the interface comment above), whose input type is exactly TaggedEntityFormValues.
        // zodResolver's overload set can't be satisfied through an abstract `ZodType<TCreate>`
        // generic no matter how it's narrowed, so this drops to `any` at the one call site
        // rather than fighting the overload resolution further — the resulting Resolver is
        // still cast back to the concrete `Resolver<TaggedEntityFormValues>` type below.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema as any) as unknown as Resolver<TaggedEntityFormValues>,
        defaultValues: {
            name: initial?.name ?? "",
            description: initial?.description ?? "",
            tagColor: initial?.tagColor as TagColor | undefined,
        },
    });

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <InputField<TaggedEntityFormValues> name="name" type="text" label="Name" required />
                <TextareaField<TaggedEntityFormValues> name="description" label="Description" rows={2} />
                <FormField
                    control={form.control}
                    name="tagColor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Tag color<span className="text-red-500">*</span>
                            </FormLabel>
                            <ColorTagPicker value={field.value} onChange={field.onChange} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {initial ? "Save changes" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}

export default TaggedEntityManagePage;
