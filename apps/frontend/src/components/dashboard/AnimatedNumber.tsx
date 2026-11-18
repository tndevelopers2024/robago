// A number that counts up (or down) to its value instead of snapping — skipped for reduced-motion users.
import { useEffect, useRef, useState } from "react";

interface Props {
    value: number;
    format?: (n: number) => string;
    duration?: number;
    className?: string;
}

export default function AnimatedNumber({
    value,
    format = (n) => String(Math.round(n)),
    duration = 900,
    className,
}: Props) {
    const [shown, setShown] = useState(value);
    const from = useRef(value);

    useEffect(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce || from.current === value) {
            from.current = value;
            setShown(value);
            return;
        }
        const start = performance.now();
        const origin = from.current;
        let raf = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            const v = origin + (value - origin) * eased;
            from.current = v;
            setShown(v);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return <span className={className}>{format(shown)}</span>;
}
