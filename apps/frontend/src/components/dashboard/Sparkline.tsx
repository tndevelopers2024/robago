// A tiny trend line: 2px stroke, a ~10% wash under it, and a ringed dot on the latest point.
import { useId } from "react";

interface Props {
    values: number[];
    width?: number;
    height?: number;
    color?: string;
    ariaLabel: string;
}

export default function Sparkline({ values, width = 120, height = 38, color = "var(--primary)", ariaLabel }: Props) {
    const id = useId();
    if (values.length < 2) return null;
    const pad = 5;
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const span = max - min || 1;
    const pts = values.map(
        (v, i) =>
            [
                pad + (i / (values.length - 1)) * (width - pad * 2),
                pad + (1 - (v - min) / span) * (height - pad * 2),
            ] as const,
    );
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const [lx, ly] = pts[pts.length - 1] as readonly [number, number];
    const [fx] = pts[0] as readonly [number, number];
    return (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
            <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${line} L${lx.toFixed(1)},${height} L${fx.toFixed(1)},${height} Z`} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={lx} cy={ly} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
        </svg>
    );
}
