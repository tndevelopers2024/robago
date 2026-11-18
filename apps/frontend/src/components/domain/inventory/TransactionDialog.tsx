// src/components/domain/inventory/TransactionDialog.tsx
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createTransactionSchema,
    TransactionType,
    ProductType,
    type CreateTransactionInput,
} from "@robago/shared";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import TextareaField from "@/components/TextareaField";
import { useCreateTransactionMutation } from "@/hooks/queries/useTransactionsQueries";
import { productionUnitQueries } from "@/hooks/queries/taggedEntityInstances";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";

interface TransactionDialogProps {
    inventoryId: string;
    productType: ProductType;
    trigger: React.ReactNode;
    currentAvailableQty?: number;
}

interface MovementOption {
    type: TransactionType;
    label: string;
    subtitle: string;
    icon: typeof ArrowDownLeft;
    isOutward: boolean;
}

const RAW_MATERIAL_MOVEMENTS: MovementOption[] = [
    {
        type: TransactionType.Purchase,
        label: "Purchase",
        subtitle: "Inward from vendor",
        icon: ArrowDownLeft,
        isOutward: false,
    },
    {
        type: TransactionType.Consumption,
        label: "Consumption",
        subtitle: "Outward to factory unit",
        icon: ArrowUpRight,
        isOutward: true,
    },
    {
        type: TransactionType.Adjustment,
        label: "Adjustment",
        subtitle: "Audit delta",
        icon: RefreshCw,
        isOutward: false,
    },
];

const FINISHED_PRODUCT_MOVEMENTS: MovementOption[] = [
    {
        type: TransactionType.Production,
        label: "Production",
        subtitle: "Inward from stitching unit",
        icon: ArrowDownLeft,
        isOutward: false,
    },
    {
        type: TransactionType.Sale,
        label: "Sale",
        subtitle: "Outward client dispatch",
        icon: ArrowUpRight,
        isOutward: true,
    },
    {
        type: TransactionType.Adjustment,
        label: "Adjustment",
        subtitle: "Audit delta",
        icon: RefreshCw,
        isOutward: false,
    },
];

const NOTES_REQUIRED_TYPES: TransactionType[] = [
    TransactionType.Purchase,
    TransactionType.Sale,
    TransactionType.Adjustment,
];

export function TransactionDialog({
    inventoryId,
    productType,
    trigger,
    currentAvailableQty,
}: TransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const { data: productionUnits } = productionUnitQueries.useList();
    const createMutation = useCreateTransactionMutation(inventoryId);

    const movementOptions =
        productType === ProductType.RawMaterial
            ? RAW_MATERIAL_MOVEMENTS
            : FINISHED_PRODUCT_MOVEMENTS;

    const defaultType =
        productType === ProductType.RawMaterial
            ? TransactionType.Purchase
            : TransactionType.Production;

    const form = useForm<CreateTransactionInput>({
        resolver: zodResolver(createTransactionSchema),
        defaultValues: {
            inventoryId,
            transactionType: defaultType,
            quantity: 1,
            notes: "",
        },
    });

    const transactionType = form.watch("transactionType");
    const quantity = Number(form.watch("quantity") ?? 0);

    const activeOption = movementOptions.find((o) => o.type === transactionType);
    const isOutward = Boolean(activeOption?.isOutward);
    const isOverdraft =
        isOutward && currentAvailableQty != null && quantity > currentAvailableQty;

    const needsProductionUnit =
        transactionType === TransactionType.Production ||
        transactionType === TransactionType.Consumption;
    const isNotesRequired = NOTES_REQUIRED_TYPES.includes(transactionType);

    async function handleSubmit(values: CreateTransactionInput) {
        if (isOverdraft) return;
        const cleanedValues: CreateTransactionInput = {
            ...values,
            notes: values.notes?.trim() ? values.notes.trim() : undefined,
        };
        await createMutation.mutateAsync(cleanedValues);
        setOpen(false);
        form.reset({
            inventoryId,
            transactionType: defaultType,
            quantity: 1,
            notes: "",
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Log Inventory Transaction</DialogTitle>
                    <DialogDescription>
                        {productType === ProductType.RawMaterial
                            ? "Record fabric/raw material procurement, stitching floor consumption, or audit adjustments."
                            : "Record finished bag production inwards, client dispatch sales, or stock audit adjustments."}
                    </DialogDescription>
                </DialogHeader>

                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
                        {/* Movement Type Selector */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Movement Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {movementOptions.map((opt) => {
                                    const isSelected = transactionType === opt.type;
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            type="button"
                                            key={opt.type}
                                            onClick={() => form.setValue("transactionType", opt.type)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer",
                                                isSelected
                                                    ? "border-primary bg-accent/60 text-primary ring-1 ring-primary font-semibold"
                                                    : "border-slate-200 hover:bg-slate-50 text-slate-700",
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "size-4 mb-1",
                                                    isSelected
                                                        ? "text-primary"
                                                        : opt.isOutward
                                                          ? "text-amber-600"
                                                          : "text-emerald-600",
                                                )}
                                            />
                                            <span className="text-xs">{opt.label}</span>
                                            <span className="text-[10px] text-slate-400 font-normal line-clamp-1">
                                                {opt.subtitle}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantity with available stock hint */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700">
                                    Quantity <span className="text-red-500">*</span>
                                </label>
                                {currentAvailableQty != null && (
                                    <span className="text-xs text-slate-500">
                                        Available: <strong className="text-slate-800">{currentAvailableQty}</strong>
                                    </span>
                                )}
                            </div>
                            <InputField<CreateTransactionInput>
                                name="quantity"
                                type="number"
                                required
                                min={1}
                                onChange={(e) => form.setValue("quantity", Number(e.target.value))}
                            />
                        </div>

                        {/* Overdraft Warning Banner */}
                        {isOverdraft && (
                            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200 flex items-start gap-2 animate-in fade-in duration-200">
                                <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong>Overdraft Warning:</strong> Available stock is{" "}
                                    <strong>{currentAvailableQty}</strong>. You cannot dispatch or consume{" "}
                                    <strong>{quantity}</strong> units.
                                </div>
                            </div>
                        )}

                        {/* Production Unit Selector (Production or Consumption) */}
                        {needsProductionUnit && (
                            <SelectField<CreateTransactionInput>
                                name={
                                    transactionType === TransactionType.Production
                                        ? "producedBy"
                                        : "consumedBy"
                                }
                                label={
                                    transactionType === TransactionType.Production
                                        ? "Produced By (Stitching Unit)"
                                        : "Consumed By (Factory Unit)"
                                }
                                required
                                options={(productionUnits ?? []).map((u) => ({
                                    value: u._id,
                                    label: u.name,
                                }))}
                            />
                        )}

                        {/* Notes / Reference PO / Batch Details */}
                        <TextareaField<CreateTransactionInput>
                            name="notes"
                            label={
                                isNotesRequired
                                    ? "Notes / Reference PO / Batch Details"
                                    : "Notes / Reference PO / Batch Details (Optional)"
                            }
                            required={isNotesRequired}
                            placeholder={
                                transactionType === TransactionType.Consumption
                                    ? "e.g. Issued 2 rolls for Parrys school bag"
                                    : transactionType === TransactionType.Production
                                      ? "e.g. Batch 45 completed by S A IMPEX"
                                      : transactionType === TransactionType.Sale
                                        ? "e.g. Dispatched to Dealer PO #1042"
                                        : "e.g. PO reference or physical audit adjustment reason"
                            }
                            rows={2}
                        />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting || isOverdraft}
                                className="bg-primary hover:bg-primary/90"
                            >
                                Log Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}

export default TransactionDialog;
