// src/components/TextareaField.tsx
import { cn } from "@/lib/utils";
import toId from "@/utils/toId.utils";
import type { TextareaHTMLAttributes } from "react";
import { type FieldPath, type FieldValues, useFormContext } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Textarea } from "./ui/textarea";

interface TextareaFieldProps<T extends FieldValues = FieldValues>
    extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "className"> {
    name: FieldPath<T>;
    label?: string;
    description?: string;
    required?: boolean;
    className?: {
        itemClass?: string;
        labelClass?: string;
        textareaClass?: string;
        descriptionClass?: string;
        messageClass?: string;
    };
}

export default function TextareaField<T extends FieldValues = FieldValues>({
    name,
    label,
    description,
    required = false,
    className,
    ...restProps
}: TextareaFieldProps<T>) {
    const { control } = useFormContext<T>();
    const { itemClass, labelClass, textareaClass, descriptionClass, messageClass } =
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
                    <FormControl>
                        <Textarea
                            id={safeId}
                            className={cn("", textareaClass)}
                            placeholder={restProps.placeholder || name}
                            {...field}
                            {...restProps}
                        />
                    </FormControl>
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
