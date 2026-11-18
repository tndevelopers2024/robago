// A thin ring split into the top spenders (+ grey "Other"). Always paired with a legend that spells out
// every name, amount and share, so colour is never the only way to read it.
import type { ReactNode } from "react";
import { rupees, type Slice } from "@/lib/expenses/calc";
import { cn } from "@/lib/utils";

interface Props {
    slices: Slice[];
    total: number;
    active: string | null;
    onActive: (id: string | null) => void;
    /** Shown in the middle when nothing is hovered, e.g. "Spent". */
    centerLabel: string;
    ariaLabel: string;
    className?: string;
    empty?: ReactNode;
}

const SIZE = 232;
const R = 92;
const STROKE = 24;
const GAP = 2; // px of surface between slices

export default function DonutChart({
    slices,
    total,
    active,
    onActive,
    centerLabel,
    ariaLabel,
    className,
    empty,
}: Props) {
    const C = 2 * Math.PI * R;
    const hovered = slices.find((s) => s.id === active) ?? null;

    if (total <= 0 || slices.length === 0) {
        return (
            <div className={cn("grid aspect-square place-items-center text-sm text-muted-foreground", className)}>
                {empty ?? "No spending yet"}
            </div>
        );
    }

    // Where each slice starts along the ring, worked out up front (no mutation while rendering).
    const starts = slices.map((_, i) => slices.slice(0, i).reduce((sum, x) => sum + x.share * C, 0));
    return (
        <div className={cn("relative mx-auto aspect-square w-full max-w-[17rem]", className)}>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel} className="size-full -rotate-90">
                {/* faint track so a thin ring still reads as one whole */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    strokeWidth={STROKE}
                    style={{ stroke: "var(--viz-grid)" }}
                />
                {slices.map((s, i) => {
                    const len = s.share * C;
                    const dash = slices.length === 1 ? C : Math.max(0, len - GAP);
                    const start = starts[i] ?? 0;
                    const isActive = active === s.id;
                    return (
                        <circle
                            key={s.id}
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={R}
                            fill="none"
                            strokeWidth={isActive ? STROKE + 5 : STROKE}
                            strokeDasharray={`${dash} ${C - dash}`}
                            strokeDashoffset={-start}
                            tabIndex={0}
                            role="img"
                            aria-label={`${s.label}: ${rupees(s.value)}, ${Math.round(s.share * 100)}%`}
                            onPointerEnter={() => onActive(s.id)}
                            onPointerLeave={() => onActive(null)}
                            onFocus={() => onActive(s.id)}
                            onBlur={() => onActive(null)}
                            className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-150"
                            style={{ stroke: s.color, opacity: active && !isActive ? 0.45 : 1 }}
                        />
                    );
                })}
            </svg>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="max-w-[9rem] text-center leading-tight">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {hovered ? hovered.label : centerLabel}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {rupees(hovered ? hovered.value : total)}
                    </p>
                    {hovered && (
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                            {Math.round(hovered.share * 100)}% of spend
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
