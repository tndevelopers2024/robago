// Small shared pieces for the CRM screens.
import type { SchoolStage } from "@robago/shared";
import { STAGE } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";

/** A small coloured pill: where a school stands. */
export function StageChip({ stage, onDark, className }: { stage: SchoolStage; onDark?: boolean; className?: string }) {
    const s = STAGE[stage];
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                onDark ? "bg-white/10 text-white" : s.chip,
                className,
            )}
        >
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
        </span>
    );
}
