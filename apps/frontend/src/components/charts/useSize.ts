import { useEffect, useRef, useState } from "react";

/** Width of an element, kept up to date as it resizes (so SVG charts can fill their card). */
export function useWidth<T extends HTMLElement>(fallback = 600) {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(fallback);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.round(entry.contentRect.width)));
        ro.observe(el);
        setWidth(Math.round(el.getBoundingClientRect().width) || fallback);
        return () => ro.disconnect();
    }, [fallback]);
    return [ref, width] as const;
}
