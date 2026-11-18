// A frosted card with a soft spotlight that follows the pointer.
import { useEffect, useRef, type ElementType, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLElement> {
    as?: ElementType;
    /** Makes the whole card a link. */
    to?: string;
    /** `ink` = dark hero glass, `light` = frosted white. */
    tone?: "light" | "ink";
    /** Lift + glow on hover (turn off for cards that aren't clickable). */
    lift?: boolean;
    /** Stagger the entrance, in ms. */
    delay?: number;
    children: ReactNode;
}

const SPOT = 320; // px

export default function GlassCard({
    as,
    to,
    tone = "light",
    lift = false,
    delay = 0,
    className,
    children,
    onPointerMove,
    style,
    ...rest
}: Props) {
    const spot = useRef<HTMLSpanElement>(null);
    const frame = useRef(0);
    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    const move = (e: PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left - SPOT / 2;
        const y = e.clientY - r.top - SPOT / 2;
        // One transform write per frame: it is composited on the GPU and never re-lays-out or repaints the card.
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            if (spot.current) spot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
        onPointerMove?.(e);
    };

    const Tag: ElementType = to ? Link : (as ?? "section");
    return (
        <Tag
            {...rest}
            {...(to ? { to } : {})}
            onPointerMove={move}
            style={{ animationDelay: `${delay}ms`, ...style }}
            className={cn(
                "rise-in group/glass relative overflow-hidden rounded-3xl",
                tone === "ink" ? "glass-ink text-white" : "glass",
                lift && "glass-lift",
                className,
            )}
        >
            <span
                ref={spot}
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 rounded-full opacity-0 transition-opacity duration-300 will-change-transform group-hover/glass:opacity-100"
                style={{
                    width: SPOT,
                    height: SPOT,
                    background: `radial-gradient(circle, ${tone === "ink" ? "rgba(56,189,248,0.24)" : "rgba(56,189,248,0.2)"}, transparent 62%)`,
                }}
            />
            <div className="relative">{children}</div>
        </Tag>
    );
}
