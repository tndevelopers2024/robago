// src/components/shared/ColorTagPicker.tsx
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { TAG_COLOR_OPTIONS, type TagColor } from "@robago/shared";
import { Check, Plus } from "lucide-react";

interface ColorTagPickerProps {
    value: TagColor | undefined;
    onChange: (value: TagColor) => void;
    disabled?: boolean;
}

export function ColorTagPicker({ value, onChange, disabled }: ColorTagPickerProps) {
    const colorInputRef = useRef<HTMLInputElement>(null);

    const isPreset = TAG_COLOR_OPTIONS.some(
        (opt) => opt.value.toLowerCase() === value?.toLowerCase(),
    );
    const isCustom = Boolean(value && !isPreset);

    function handleCustomColorClick() {
        if (disabled) return;
        colorInputRef.current?.click();
    }

    function handleColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const hex = e.target.value.toUpperCase();
        onChange(hex);
    }

    return (
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Tag color">
            {/* 8 Preset Pastel Circles */}
            {TAG_COLOR_OPTIONS.map((opt) => {
                const isSelected = value?.toLowerCase() === opt.value.toLowerCase();
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={opt.label}
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full border-2 transition-all hover:scale-105 disabled:opacity-50",
                            isSelected
                                ? "scale-110 border-slate-900 shadow-sm"
                                : "border-transparent hover:border-slate-300",
                        )}
                        style={{ backgroundColor: opt.value }}
                        title={opt.label}
                    >
                        {isSelected && <Check className="size-4 text-slate-900" />}
                    </button>
                );
            })}

            {/* 9th Multi-Color Wheel Button */}
            <div className="relative">
                <button
                    type="button"
                    role="radio"
                    aria-checked={isCustom}
                    aria-label="Custom Color Picker"
                    disabled={disabled}
                    onClick={handleCustomColorClick}
                    className={cn(
                        "relative flex size-8 items-center justify-center rounded-full border-2 transition-all hover:scale-105 disabled:opacity-50",
                        isCustom
                            ? "scale-110 border-slate-900 shadow-md ring-2 ring-slate-900/20"
                            : "border-slate-200 hover:border-slate-400",
                    )}
                    style={{
                        background: isCustom
                            ? value
                            : "conic-gradient(from 0deg, #FF453A, #FF9F0A, #FFD60A, #32D74B, #64D2FF, #0A84FF, #BF5AF2, #FF375F, #FF453A)",
                    }}
                    title={isCustom ? `Custom Color: ${value}` : "Custom color wheel picker"}
                >
                    {isCustom ? (
                        <Check className="size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
                    ) : (
                        <span className="flex size-4 items-center justify-center rounded-full bg-white/90 shadow-xs">
                            <Plus className="size-2.5 text-slate-800" />
                        </span>
                    )}
                </button>

                {/* Hidden Native Color Picker Input */}
                <input
                    ref={colorInputRef}
                    type="color"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    disabled={disabled}
                    value={value?.startsWith("#") ? value : "#1565C0"}
                    onChange={handleColorInputChange}
                />
            </div>
        </div>
    );
}

export default ColorTagPicker;
