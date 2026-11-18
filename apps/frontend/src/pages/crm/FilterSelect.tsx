// src/pages/crm/FilterSelect.tsx — a dropdown that matches the glass look (the browser's own <select> arrow and list
// can't be styled). Shows what is chosen, lights up when a filter is active, and offers an "any" choice first.
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface FilterOption {
    value: string;
    label: string;
    /** A small coloured dot before the label (any CSS colour). */
    dot?: string;
    /** Greyed helper text after the label. */
    hint?: string;
}

const ANY = "__any__";

export default function FilterSelect({
    value,
    onChange,
    options,
    anyLabel,
    icon: Icon,
    ariaLabel,
    className,
}: {
    /** "" = no filter. */
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    /** Label of the "no filter" choice, e.g. "Any board". */
    anyLabel: string;
    icon: LucideIcon;
    ariaLabel: string;
    className?: string;
}) {
    const chosen = options.find((o) => o.value === value);
    const active = Boolean(chosen);
    return (
        <SelectPrimitive.Root value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)}>
            <SelectPrimitive.Trigger
                aria-label={ariaLabel}
                className={cn(
                    "group flex h-11 items-center gap-2 rounded-2xl border px-3 text-sm font-medium whitespace-nowrap outline-none transition-all",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    active
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                        : "glass-soft border-transparent text-foreground hover:-translate-y-px",
                    className,
                )}
            >
                <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                    {chosen?.dot && (
                        <span className="size-2 shrink-0 rounded-full" style={{ background: chosen.dot }} />
                    )}
                    <span className="truncate">{chosen ? chosen.label : anyLabel}</span>
                </span>
                <span
                    className={cn(
                        "ml-auto grid size-5 shrink-0 place-items-center rounded-full transition-transform duration-200 group-data-[state=open]:rotate-180",
                        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                >
                    <ChevronDown className="size-3.5" />
                </span>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    position="popper"
                    sideOffset={8}
                    align="start"
                    className="glass z-50 max-h-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                >
                    <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto">
                        {[{ value: ANY, label: anyLabel } as FilterOption, ...options].map((o) => (
                            <SelectPrimitive.Item
                                key={o.value}
                                value={o.value}
                                className="relative flex cursor-pointer items-center gap-2.5 rounded-xl py-2 pr-9 pl-3 text-sm outline-none select-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:font-semibold"
                            >
                                {o.dot && (
                                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: o.dot }} />
                                )}
                                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                                {o.hint && <span className="ml-auto pl-3 text-xs text-muted-foreground">{o.hint}</span>}
                                <SelectPrimitive.ItemIndicator className="absolute right-2.5 grid place-items-center text-primary">
                                    <Check className="size-4" />
                                </SelectPrimitive.ItemIndicator>
                            </SelectPrimitive.Item>
                        ))}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
}
