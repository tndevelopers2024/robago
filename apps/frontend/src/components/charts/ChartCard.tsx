// A card for one chart, with a Chart / Table switch — the table is the accessible twin of every chart.
import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChartTable {
    head: string[];
    rows: (string | number)[][];
    /** Columns (by index) to right-align, e.g. the amounts. */
    numeric?: number[];
}

interface Props {
    title: string;
    subtitle?: ReactNode;
    children: ReactNode;
    table: ChartTable;
    className?: string;
    /** Held at reduced opacity while data refreshes — no layout jump. */
    refreshing?: boolean;
}

export default function ChartCard({ title, subtitle, children, table, className, refreshing }: Props) {
    const [view, setView] = useState<"chart" | "table">("chart");
    return (
        <section className={cn("rounded-2xl border bg-card p-4 shadow-xs sm:p-5", className)}>
            <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-heading text-base font-semibold">{title}</h3>
                    {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
                </div>
                <div className="flex shrink-0 rounded-lg border p-0.5" role="group" aria-label={`${title} view`}>
                    {(
                        [
                            ["chart", BarChart3, "Chart"],
                            ["table", Table2, "Table"],
                        ] as const
                    ).map(([id, Icon, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setView(id)}
                            aria-pressed={view === id}
                            aria-label={`${label} view`}
                            className={cn(
                                "grid size-7 place-items-center rounded-md transition-colors",
                                view === id
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon className="size-3.5" />
                        </button>
                    ))}
                </div>
            </header>
            <div className={cn("transition-opacity", refreshing && "opacity-60")}>
                {view === "chart" ? (
                    children
                ) : (
                    <div className="scrollbar-thin max-h-80 overflow-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                                <tr>
                                    {table.head.map((h, i) => (
                                        <th
                                            key={h}
                                            className={cn(
                                                "px-3 py-2 font-medium",
                                                table.numeric?.includes(i) ? "text-right" : "text-left",
                                            )}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {table.rows.map((row, r) => (
                                    <tr key={r}>
                                        {row.map((cell, c) => (
                                            <td
                                                key={c}
                                                className={cn(
                                                    "px-3 py-1.5",
                                                    table.numeric?.includes(c) && "text-right tabular-nums",
                                                )}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
