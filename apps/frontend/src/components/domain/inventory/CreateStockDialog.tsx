// src/components/domain/inventory/CreateStockDialog.tsx
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import InputField from "@/components/InputField";
import { useProductsQuery } from "@/hooks/queries/useProductsQueries";
import { useCreateInventoryMutation } from "@/hooks/queries/useInventoryQueries";
import { warehouseQueries, supplierQueries } from "@/hooks/queries/taggedEntityInstances";
import { ProductType, type CreateInventoryInput } from "@robago/shared";
import { Plus, PackagePlus } from "lucide-react";

interface CreateStockDialogProps {
    trigger?: React.ReactNode;
    defaultWarehouseId?: string;
}

interface FormValues {
    productId: string;
    warehouseId: string;
    supplierId: string;
    quantity: number;
    price: number;
    alertThreshold?: number | "";
    location: string;
}

export function CreateStockDialog({ trigger, defaultWarehouseId }: CreateStockDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: products, isLoading: productsLoading } = useProductsQuery();
    const { data: warehouses, isLoading: warehousesLoading } = warehouseQueries.useList();
    const { data: suppliers, isLoading: suppliersLoading } = supplierQueries.useList();

    const createMutation = useCreateInventoryMutation();

    const form = useForm<FormValues>({
        defaultValues: {
            productId: "",
            warehouseId: defaultWarehouseId ?? "",
            supplierId: "none",
            quantity: 0,
            price: 100,
            alertThreshold: 20,
            location: "",
        },
    });

    const selectedProductId = form.watch("productId");
    const selectedProduct = products?.find((p) => p._id === selectedProductId);
    const isRaw = selectedProduct?.type === ProductType.RawMaterial;

    async function handleSubmit(values: FormValues) {
        if (!values.productId) {
            toast.error("Please select a product / model.");
            return;
        }
        if (!values.warehouseId) {
            toast.error("Please select a warehouse / godown.");
            return;
        }
        if (!values.location.trim()) {
            toast.error("Please enter a storage location.");
            return;
        }
        if (values.price <= 0) {
            toast.error("Please enter a valid unit cost rate (price).");
            return;
        }
        if (isRaw) {
            if (!values.supplierId || values.supplierId === "none") {
                toast.error("Select a supplier for raw materials.");
                return;
            }
            if (values.alertThreshold === "" || values.alertThreshold == null) {
                toast.error("Alert threshold is required for raw materials.");
                return;
            }
        }

        const payload: CreateInventoryInput = {
            productId: values.productId,
            warehouseId: values.warehouseId,
            location: values.location.trim(),
            price: Number(values.price),
            quantity: Number(values.quantity ?? 0),
            ...(values.alertThreshold !== "" && values.alertThreshold != null
                ? { alertThreshold: Number(values.alertThreshold) }
                : {}),
            ...(values.supplierId && values.supplierId !== "none"
                ? { supplierId: values.supplierId }
                : {}),
        };

        try {
            await createMutation.mutateAsync(payload);
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setOpen(false);
            form.reset({
                productId: "",
                warehouseId: defaultWarehouseId ?? "",
                supplierId: "none",
                quantity: 0,
                price: 100,
                alertThreshold: 20,
                location: "",
            });
        } catch {
            // Error toast handled by createMutation.onError
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="bg-primary hover:bg-primary/90 shadow-xs">
                        <Plus className="size-4 mr-1.5" /> + New Stock SKU
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                            <PackagePlus className="size-5" />
                        </div>
                        <div>
                            <DialogTitle>Create Stock Inventory Entry</DialogTitle>
                            <DialogDescription>
                                Add a catalog product to a warehouse or factory floor location with initial stock.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-1">
                        {/* 1. Product / Model Combobox/Select */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Product / Model <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={form.watch("productId")}
                                onValueChange={(val) => {
                                    form.setValue("productId", val);
                                    const p = products?.find((prod) => prod._id === val);
                                    if (p?.type === ProductType.RawMaterial) {
                                        if (form.getValues("supplierId") === "none") {
                                            form.setValue("supplierId", "");
                                        }
                                        if (!form.getValues("alertThreshold")) {
                                            form.setValue("alertThreshold", 50);
                                        }
                                    } else {
                                        form.setValue("supplierId", "none");
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue
                                        placeholder={
                                            productsLoading
                                                ? "Loading catalog products…"
                                                : "Select catalog product / model"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    {products?.map((p) => (
                                        <SelectItem key={p._id} value={p._id} textValue={p.name}>
                                            <div className="flex flex-col text-left py-0.5">
                                                <span className="font-semibold text-slate-900">
                                                    {p.name}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    {p.type === ProductType.RawMaterial
                                                        ? "Raw Material"
                                                        : "Finished Product"}{" "}
                                                    • Unit: {p.unit}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedProduct && (
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>
                                        Type:{" "}
                                        <strong className="text-slate-700">
                                            {selectedProduct.type === ProductType.RawMaterial
                                                ? "Raw Material (Fabric/Trim)"
                                                : "Finished Product (Bag)"}
                                        </strong>
                                    </span>
                                    •
                                    <span>
                                        Tracking Unit:{" "}
                                        <strong className="text-slate-700">
                                            {selectedProduct.unit}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 2. Warehouse / Godown */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Warehouse / Godown <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={form.watch("warehouseId")}
                                onValueChange={(val) => form.setValue("warehouseId", val)}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue
                                        placeholder={
                                            warehousesLoading
                                                ? "Loading warehouses…"
                                                : "Select storage warehouse"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses?.map((w) => (
                                        <SelectItem key={w._id} value={w._id}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="size-2 rounded-full"
                                                    style={{ backgroundColor: w.tagColor }}
                                                />
                                                <span>{w.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Supplier / Vendor */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Supplier / Vendor {isRaw && <span className="text-red-500">*</span>}
                            </label>
                            <Select
                                value={form.watch("supplierId")}
                                onValueChange={(val) => form.setValue("supplierId", val)}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue
                                        placeholder={
                                            suppliersLoading
                                                ? "Loading suppliers…"
                                                : "Select supplier or in-house"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {!isRaw && (
                                        <SelectItem value="none">
                                            None (In-House / Factory)
                                        </SelectItem>
                                    )}
                                    {suppliers?.map((s) => (
                                        <SelectItem key={s._id} value={s._id}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="size-2 rounded-full"
                                                    style={{ backgroundColor: s.tagColor }}
                                                />
                                                <span>{s.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isRaw && (
                                <p className="text-[11px] text-slate-400">
                                    Required for raw materials to trace procurement source.
                                </p>
                            )}
                        </div>

                        {/* 4 & 5. Opening Quantity & Unit Cost Rate */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Opening Quantity{" "}
                                    {selectedProduct ? `(${selectedProduct.unit})` : ""}
                                </label>
                                <InputField<FormValues>
                                    name="quantity"
                                    type="number"
                                    step="any"
                                    min={0}
                                    onChange={(e) =>
                                        form.setValue("quantity", Number(e.target.value))
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Unit Cost Rate (₹) <span className="text-red-500">*</span>
                                </label>
                                <InputField<FormValues>
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min={0.01}
                                    onChange={(e) =>
                                        form.setValue("price", Number(e.target.value))
                                    }
                                />
                            </div>
                        </div>

                        {/* 6 & 7. Low Stock Alert Level & Location */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Low Stock Alert Level {isRaw && <span className="text-red-500">*</span>}
                                </label>
                                <InputField<FormValues>
                                    name="alertThreshold"
                                    type="number"
                                    min={0}
                                    placeholder="Threshold"
                                    onChange={(e) =>
                                        form.setValue(
                                            "alertThreshold",
                                            e.target.value === "" ? "" : Number(e.target.value),
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Storage Location <span className="text-red-500">*</span>
                                </label>
                                <InputField<FormValues>
                                    name="location"
                                    type="text"
                                    placeholder="e.g. Godown - Bay 2, Rack A"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting || createMutation.isPending}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {createMutation.isPending ? "Creating…" : "Create Stock Entry"}
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}

export default CreateStockDialog;
