// src/components/SelectField.tsx
import { cn } from "@/lib/utils";
import toId from "@/utils/toId.utils";
import type { ReactNode } from "react";
import { type FieldPath, type FieldValues, useFormContext } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export interface SelectFieldOption {
    value: string;
    label: string;
    icon?: ReactNode;
}

interface SelectFieldProps<T extends FieldValues = FieldValues> {
    name: FieldPath<T>;
    label?: string;
    placeholder?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
    options: SelectFieldOption[];
    className?: {
        itemClass?: string;
        labelClass?: string;
        triggerClass?: string;
        descriptionClass?: string;
        messageClass?: string;
    };
}

/** Mirrors InputField.tsx's shape (same FormItem/FormLabel/FormMessage scaffolding) for
 *  select-driven fields — category/warehouse/supplier/production-unit pickers, tagColor,
 *  unit, type, role, etc. across the manage CRUD forms. */
export default function SelectField<T extends FieldValues = FieldValues>({
    name,
    label,
    placeholder,
    description,
    required = false,
    disabled = false,
    options,
    className,
}: SelectFieldProps<T>) {
    const { control } = useFormContext<T>();
    const { itemClass, labelClass, triggerClass, descriptionClass, messageClass } =
        className ?? {};
    const safeId = toId(name);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn("space-y-1", itemClass)}>
                    <FormLabel
                        className={cn(
                            "flex items-center justify-start text-sm font-medium",
                            label ? "" : "hidden",
                            labelClass,
                        )}
                        htmlFor={safeId}
                    >
                        <span>{label ? label : name}</span>
                        {required && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                        disabled={disabled}
                    >
                        <FormControl>
                            <SelectTrigger id={safeId} className={cn("w-full", triggerClass)}>
                                <SelectValue placeholder={placeholder ?? `Select ${label ?? name}`} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    <span className="flex items-center gap-2">
                                        {opt.icon}
                                        {opt.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {description && (
                        <FormDescription
                            className={cn("text-sm text-gray-600", descriptionClass)}
                        >
                            {description}
                        </FormDescription>
                    )}
                    <FormMessage className={cn("", messageClass)} />
                </FormItem>
            )}
        />
    );
}
