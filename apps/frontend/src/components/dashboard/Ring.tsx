// A glowing progress ring (0–1) with the value in the middle.
import { useEffect, useId, useState, type ReactNode } from "react";

interface Props {
    value: number;
    size?: number;
    stroke?: number;
    children?: ReactNode;
    ariaLabel: string;
}

export default function Ring({ value, size = 104, stroke = 10, children, ariaLabel }: Props) {
    const id = useId();
    const [shown, setShown] = useState(0);
    useEffect(() => {
        const t = requestAnimationFrame(() => setShown(Math.max(0, Math.min(1, value))));
        return () => cancelAnimationFrame(t);
    }, [value]);
    const r = (size - stroke) / 2;
    const C = 2 * Math.PI * r;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={ariaLabel}>
            <svg
                width={size}
                height={size}
                className="-rotate-90"
                style={{ filter: "drop-shadow(0 0 7px rgba(14,165,233,0.45))" }}
            >
                <defs>
                    <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#2a78d6" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    stroke="rgba(100,116,139,0.18)"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    stroke={`url(#${id})`}
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - shown)}
                    style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
        </div>
    );
}
