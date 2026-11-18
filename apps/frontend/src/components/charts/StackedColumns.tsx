// Columns (one per day or month), stacked by series. Thin bars, 4px rounded tops, 2px gaps, hairline grid.
import { useState } from "react";
import { compactRupees, niceScale, rupees } from "@/lib/expenses/calc";
import { cn } from "@/lib/utils";
import { useWidth } from "./useSize";

export interface ColumnDatum {
    key: string;
    /** Axis label (may be blank to skip). */
    label: string;
    /** Heading in the tooltip. */
    title: string;
    values: Record<string, number>;
}
export interface ColumnSeries {
    id: string;
    label: string;
    color: string;
}

interface Props {
    data: ColumnDatum[];
    series: ColumnSeries[];
    height?: number;
    /** Column whose total gets a direct label (e.g. the current month) — labelling every bar would be noise. */
    annotateKey?: string | null;
    /** Column drawn at full strength while the others soften. */
    selectedKey?: string | null;
    onSelect?: (key: string) => void;
    ariaLabel: string;
    className?: string;
}

const M = { top: 20, right: 6, bottom: 26, left: 46 };
const BAR_MAX = 24;
const GAP = 2;
const RADIUS = 4;

/** Rect with only its top corners rounded — the data end; the baseline end stays square. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.max(0, Math.min(r, h, w / 2));
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export default function StackedColumns({
    data,
    series,
    height = 230,
    annotateKey,
    selectedKey,
    onSelect,
    ariaLabel,
    className,
}: Props) {
    const [ref, width] = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const innerW = Math.max(40, width - M.left - M.right);
    const innerH = height - M.top - M.bottom;
    const totals = data.map((d) => series.reduce((s, x) => s + (d.values[x.id] ?? 0), 0));
    const { top, step } = niceScale(Math.max(...totals, 0));
    const band = innerW / Math.max(data.length, 1);
    const barW = Math.min(BAR_MAX, Math.max(4, band * 0.68));
    const y = (v: number) => M.top + innerH - (v / top) * innerH;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    const hovered = hover !== null ? data[hover] : null;
    const hoveredX = hover !== null ? M.left + band * hover + band / 2 : 0;

    return (
        <div ref={ref} className={cn("relative w-full", className)}>
            <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
                {/* hairline, solid, recessive grid + the single baseline */}
                {ticks.map((t) => (
                    <g key={t}>
                        <line
                            x1={M.left}
                            x2={width - M.right}
                            y1={y(t)}
                            y2={y(t)}
                            strokeWidth={1}
                            style={{ stroke: t === 0 ? "var(--viz-axis)" : "var(--viz-grid)" }}
                        />
                        <text
                            x={M.left - 8}
                            y={y(t) + 4}
                            textAnchor="end"
                            className="fill-muted-foreground text-[10.5px] tabular-nums"
                        >
                            {compactRupees(t)}
                        </text>
                    </g>
                ))}

                {data.map((d, i) => {
                    const cx = M.left + band * i + band / 2;
                    const x = cx - barW / 2;
                    let acc = 0;
                    const dimmed =
                        (hover !== null && hover !== i) ||
                        (selectedKey != null && selectedKey !== d.key && hover === null);
                    const segs = series.filter((s) => (d.values[s.id] ?? 0) > 0);
                    return (
                        <g key={d.key} opacity={dimmed ? 0.5 : 1} className="transition-opacity duration-150">
                            {segs.map((s, si) => {
                                const v = d.values[s.id] ?? 0;
                                const segTop = y(acc + v);
                                const segBottom = y(acc);
                                const isTop = si === segs.length - 1;
                                const h = Math.max(1.5, segBottom - segTop - (isTop ? 0 : GAP));
                                acc += v;
                                return isTop ? (
                                    <path
                                        key={s.id}
                                        d={topRounded(x, segTop, barW, h, RADIUS)}
                                        style={{ fill: s.color }}
                                    />
                                ) : (
                                    <rect
                                        key={s.id}
                                        x={x}
                                        y={segTop + GAP}
                                        width={barW}
                                        height={Math.max(1.5, segBottom - segTop - GAP)}
                                        style={{ fill: s.color }}
                                    />
                                );
                            })}
                            {annotateKey === d.key && totals[i]! > 0 && (
                                <text
                                    x={cx}
                                    y={y(totals[i]!) - 6}
                                    textAnchor="middle"
                                    className="fill-foreground text-[11px] font-semibold"
                                >
                                    {compactRupees(totals[i]!)}
                                </text>
                            )}
                            {d.label && (
                                <text
                                    x={cx}
                                    y={height - 8}
                                    textAnchor="middle"
                                    className="fill-muted-foreground text-[10.5px]"
                                >
                                    {d.label}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* generous hit areas: the whole column band, full height */}
                {data.map((d, i) => (
                    <rect
                        key={`hit-${d.key}`}
                        x={M.left + band * i}
                        y={M.top}
                        width={band}
                        height={innerH + 4}
                        fill="transparent"
                        tabIndex={0}
                        role="img"
                        aria-label={`${d.title}: ${rupees(totals[i]!)}`}
                        onPointerMove={() => setHover(i)}
                        onPointerLeave={() => setHover(null)}
                        onFocus={() => setHover(i)}
                        onBlur={() => setHover(null)}
                        onClick={() => onSelect?.(d.key)}
                        className={cn("outline-none", onSelect && "cursor-pointer")}
                    />
                ))}
            </svg>

            {hovered && (
                <div
                    className="pointer-events-none absolute z-10 min-w-36 rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg"
                    style={{
                        left: Math.min(Math.max(hoveredX, 80), width - 80),
                        top: 0,
                        transform: "translate(-50%, -4px)",
                    }}
                >
                    <p className="mb-1 font-medium text-muted-foreground">{hovered.title}</p>
                    {series.map((s) => (
                        <p key={s.id} className="flex items-center justify-between gap-4 py-0.5">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                                {s.label}
                            </span>
                            <b className="text-sm font-semibold tabular-nums">{rupees(hovered.values[s.id] ?? 0)}</b>
                        </p>
                    ))}
                    {series.length > 1 && (
                        <p className="mt-1 flex items-center justify-between gap-4 border-t pt-1">
                            <span className="text-muted-foreground">Total</span>
                            <b className="text-sm font-semibold tabular-nums">{rupees(totals[hover!]!)}</b>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

/** Legend for ≥2 series: a swatch beside plain text (text never wears the data colour). */
export function SeriesLegend({ series, className }: { series: ColumnSeries[]; className?: string }) {
    return (
        <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
            {series.map((s) => (
                <li key={s.id} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
                    {s.label}
                </li>
            ))}
        </ul>
    );
}
