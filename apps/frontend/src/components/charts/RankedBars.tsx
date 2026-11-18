// Every item, biggest first, on one shared baseline — the precise way to compare spending.
import { rupees } from "@/lib/expenses/calc";
import { cn } from "@/lib/utils";

export interface RankedRow {
    id: string;
    label: string;
    value: number;
    color: string;
    /** Small grey text under the name, e.g. "Operational · 3 entries". */
    note?: string;
}

interface Props {
    rows: RankedRow[];
    total: number;
    active?: string | null;
    onActive?: (id: string | null) => void;
    className?: string;
}

export default function RankedBars({ rows, total, active, onActive, className }: Props) {
    const max = Math.max(...rows.map((r) => r.value), 1);
    return (
        <ul className={cn("space-y-3", className)}>
            {rows.map((r) => {
                const pct = total > 0 ? (r.value / total) * 100 : 0;
                const isActive = active === r.id;
                return (
                    <li
                        key={r.id}
                        onPointerEnter={() => onActive?.(r.id)}
                        onPointerLeave={() => onActive?.(null)}
                        className={cn("rounded-lg px-2 py-1 transition-colors", isActive && "bg-muted/60")}
                    >
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate font-medium">{r.label}</span>
                            <span className="shrink-0 tabular-nums">
                                <b className="font-semibold">{rupees(r.value)}</b>
                                <span className="ml-2 inline-block w-10 text-right text-xs text-muted-foreground">
                                    {pct < 1 ? "<1" : Math.round(pct)}%
                                </span>
                            </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                            <div
                                className="h-full rounded-full transition-[width] duration-300"
                                style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: r.color }}
                            />
                        </div>
                        {r.note && <p className="mt-1 text-[11px] text-muted-foreground">{r.note}</p>}
                    </li>
                );
            })}
        </ul>
    );
}
