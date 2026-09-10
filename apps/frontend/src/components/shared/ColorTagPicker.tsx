// src/components/shared/ColorTagPicker.tsx
import { cn } from "@/lib/utils";
import { TAG_COLOR_OPTIONS, type TagColor } from "@robago/shared";
import { Check } from "lucide-react";

interface ColorTagPickerProps {
    value: TagColor | undefined;
    onChange: (value: TagColor) => void;
    disabled?: boolean;
}

export function ColorTagPicker({ value, onChange, disabled }: ColorTagPickerProps) {
    return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tag color">
            {TAG_COLOR_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={value === opt.value}
                    aria-label={opt.label}
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex size-8 items-center justify-center rounded-full border-2 transition-transform disabled:opacity-50",
                        value === opt.value ? "border-slate-900 scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: opt.value }}
                >
                    {value === opt.value && <Check className="size-4 text-slate-900" />}
                </button>
            ))}
        </div>
    );
}

export default ColorTagPicker;
