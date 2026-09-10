// src/hooks/useMediaQuery.ts
import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia(query).matches : false,
    );

    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, [query]);

    return matches;
}

/** Matches the 768px breakpoint regraft's own useIsMobile hook and Shadcn's sidebar.tsx use. */
export function useIsDesktop(): boolean {
    return useMediaQuery("(min-width: 768px)");
}
