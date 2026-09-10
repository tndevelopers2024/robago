// src/components/domain/manage/CategoryForm.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema, ProductType, type CreateCategoryInput } from "@robago/shared";
import type { z } from "zod";
import InputField from "@/components/InputField";
import TextareaField from "@/components/TextareaField";
import SelectField from "@/components/SelectField";
import ColorTagPicker from "@/components/shared/ColorTagPicker";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { CategoryDTO } from "@/types";

// react-hook-form's generic must match the schema's *input* shape (pre-default), not
// z.infer's *output* shape (post-default) — createCategorySchema.type has a `.default()`,
// which makes it optional on input but required on output. Using the output type
// (CreateCategoryInput) as useForm's generic is what causes the resolver type mismatch.
type CategoryFormValues = z.input<typeof createCategorySchema>;

interface CategoryFormProps {
    initial?: CategoryDTO;
    onSubmit: (values: CreateCategoryInput) => Promise<unknown>;
    onCancel: () => void;
}

export function CategoryForm({ initial, onSubmit, onCancel }: CategoryFormProps) {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            title: initial?.title ?? "",
            description: initial?.description ?? "",
            tagColor: initial?.tagColor,
            type: initial?.type ?? ProductType.RawMaterial,
        },
    });

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(async (values) => {
                    // The resolver has already applied schema defaults by the time this
                    // runs, so this is a safe upcast from the input type to the output type.
                    await onSubmit(values as CreateCategoryInput);
                })}
                className="space-y-4"
            >
                <InputField<CategoryFormValues> name="title" type="text" label="Title" required />
                <TextareaField<CategoryFormValues> name="description" label="Description" rows={2} />
                <SelectField<CategoryFormValues>
                    name="type"
                    label="Type"
                    required
                    options={[
                        { value: ProductType.RawMaterial, label: "Raw Material" },
                        { value: ProductType.FinishedProduct, label: "Finished Product" },
                    ]}
                />
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
                        {initial ? "Save changes" : "Create category"}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}

export default CategoryForm;
