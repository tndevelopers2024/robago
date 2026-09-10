// src/components/domain/manage/ProductForm.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, ProductType, Unit, type CreateProductInput } from "@robago/shared";
import type { z } from "zod";
import InputField from "@/components/InputField";
import TextareaField from "@/components/TextareaField";
import SelectField from "@/components/SelectField";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQueries";
import type { ProductDTO } from "@/types";

// See CategoryForm.tsx for why this uses z.input (schema-input shape) rather than the
// shared package's CreateProductInput (z.infer's output shape, post-defaults).
type ProductFormValues = z.input<typeof createProductSchema>;

interface ProductFormProps {
    initial?: ProductDTO;
    onSubmit: (values: CreateProductInput) => Promise<unknown>;
    onCancel: () => void;
}

export function ProductForm({ initial, onSubmit, onCancel }: ProductFormProps) {
    const { data: categories } = useCategoriesQuery();
    const initialCategoryId =
        typeof initial?.categoryId === "object" && initial.categoryId !== null
            ? initial.categoryId._id
            : (initial?.categoryId ?? "");

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            name: initial?.name ?? "",
            description: initial?.description ?? "",
            categoryId: initialCategoryId,
            unit: initial?.unit ?? Unit.Piece,
            type: initial?.type ?? ProductType.RawMaterial,
        },
    });

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(async (values) => {
                    // The resolver has already applied schema defaults by the time this runs, so
                    // this is a safe upcast from the input type to the output type.
                    await onSubmit(values as unknown as CreateProductInput);
                })}
                className="space-y-4"
            >
                <InputField<ProductFormValues> name="name" type="text" label="Name" required />
                <TextareaField<ProductFormValues> name="description" label="Description" rows={2} />
                <SelectField<ProductFormValues>
                    name="categoryId"
                    label="Category"
                    required
                    placeholder="Select a category"
                    options={(categories ?? []).map((c) => ({ value: c._id, label: c.title }))}
                />
                <div className="grid grid-cols-2 gap-4">
                    <SelectField<ProductFormValues>
                        name="unit"
                        label="Unit"
                        required
                        options={Object.values(Unit).map((u) => ({ value: u, label: u }))}
                    />
                    <SelectField<ProductFormValues>
                        name="type"
                        label="Type"
                        required
                        options={[
                            { value: ProductType.RawMaterial, label: "Raw Material" },
                            { value: ProductType.FinishedProduct, label: "Finished Product" },
                        ]}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {initial ? "Save changes" : "Create product"}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}

export default ProductForm;
