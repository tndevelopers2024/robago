// src/components/domain/inventory/TransactionDialog.tsx
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema, TransactionType, type CreateTransactionInput } from "@robago/shared";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import TextareaField from "@/components/TextareaField";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useCreateTransactionMutation } from "@/hooks/queries/useTransactionsQueries";
import { productionUnitQueries } from "@/hooks/queries/taggedEntityInstances";
import type { ProductType } from "@robago/shared";

interface TransactionDialogProps {
    inventoryId: string;
    productType: ProductType;
    trigger: React.ReactNode;
}

// robago-prd.md §4.3: which pair of types is offered depends on whether the product is
// RawMaterial (Purchase/Consumption) or FinishedProduct (Production/Sale).
function typesForProductType(type: ProductType): TransactionType[] {
    return type === "RawMaterial"
        ? [TransactionType.Purchase, TransactionType.Consumption, TransactionType.Adjustment]
        : [TransactionType.Production, TransactionType.Sale, TransactionType.Adjustment];
}

const NOTES_REQUIRED_TYPES: TransactionType[] = [
    TransactionType.Purchase,
    TransactionType.Sale,
    TransactionType.Adjustment,
];

export function TransactionDialog({ inventoryId, productType, trigger }: TransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const { data: productionUnits } = productionUnitQueries.useList();
    const createMutation = useCreateTransactionMutation(inventoryId);

    const form = useForm<CreateTransactionInput>({
        resolver: zodResolver(createTransactionSchema),
        defaultValues: {
            inventoryId,
            transactionType: typesForProductType(productType)[0],
            quantity: 1,
            notes: "",
        },
    });

    const transactionType = form.watch("transactionType");
    const needsProductionUnit =
        transactionType === TransactionType.Production || transactionType === TransactionType.Consumption;
    const needsNotes = NOTES_REQUIRED_TYPES.includes(transactionType);

    async function handleSubmit(values: CreateTransactionInput) {
        await createMutation.mutateAsync(values);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log transaction</DialogTitle>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="transactionType"
                            render={({ field }) => (
                                <FormItem>
                                    <ToggleGroup
                                        type="single"
                                        variant="outline"
                                        value={field.value}
                                        onValueChange={(v) => v && field.onChange(v)}
                                        className="w-full"
                                    >
                                        {typesForProductType(productType).map((t) => (
                                            <ToggleGroupItem key={t} value={t}>
                                                {t}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <InputField<CreateTransactionInput>
                            name="quantity"
                            type="number"
                            label="Quantity"
                            required
                            min={1}
                            onChange={(e) => form.setValue("quantity", Number(e.target.value))}
                        />

                        {needsProductionUnit && (
                            <SelectField<CreateTransactionInput>
                                name={transactionType === TransactionType.Production ? "producedBy" : "consumedBy"}
                                label="Production Unit"
                                required
                                options={(productionUnits ?? []).map((u) => ({ value: u._id, label: u.name }))}
                            />
                        )}

                        {needsNotes && (
                            <TextareaField<CreateTransactionInput> name="notes" label="Notes" required rows={2} />
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                Log transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}

export default TransactionDialog;
