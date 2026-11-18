// Inventory-side cards: the low-stock KPI, the godown/factory split, and the low-stock watchlist.
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Building2, Factory } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { rupees } from "@/lib/expenses/calc";
import type { InventoryDTO } from "@/types";
import { cn } from "@/lib/utils";
import AnimatedNumber from "./AnimatedNumber";
import GlassCard from "./GlassCard";
import { KpiCard } from "./AdminWidgets";

export function LowStockKpi({ count, loading, delay }: { count: number; loading: boolean; delay: number }) {
    return (
        <KpiCard
            to="/inventory/alerts"
            label="Low stock"
            icon={AlertTriangle}
            delay={delay}
            tint={count ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}
        >
            {loading ? (
                <Skeleton className="mt-3 h-9 w-24" />
            ) : (
                <>
                    <p className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight">
                        <AnimatedNumber value={count} />
                        {count > 0 && <span className="warn-pulse size-3 rounded-full bg-amber-500" aria-hidden />}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {count
                            ? `item${count === 1 ? "" : "s"} at or below the alert level`
                            : "everything is above its alert level"}
                    </p>
                </>
            )}
        </KpiCard>
    );
}

interface Split {
    raw: number;
    finished: number;
    total: number;
    skus: number;
}

export function StockSplitCard({
    godown,
    factory,
    loading,
    delay,
}: {
    godown: Split;
    factory: Split;
    loading: boolean;
    delay: number;
}) {
    return (
        <GlassCard lift delay={delay} className="p-5">
            <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">Stock value by location</h3>
                <Link
                    to="/inventory"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5"
                >
                    Inventory <ArrowRight className="size-3.5" />
                </Link>
            </div>
            {loading ? (
                <Skeleton className="mt-4 h-40 w-full" />
            ) : (
                <div className="mt-4 space-y-5">
                    <Bar icon={Building2} name="Parrys Central Godown" split={godown} />
                    <Bar icon={Factory} name="Factory Workshop Floor" split={factory} />
                    <ul className="flex gap-4 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-[3px] bg-primary" /> Raw materials
                        </li>
                        <li className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-[3px] bg-brand" /> Finished goods
                        </li>
                    </ul>
                </div>
            )}
        </GlassCard>
    );
}

function Bar({ icon: Icon, name, split }: { icon: typeof Building2; name: string; split: Split }) {
    const rawPct = split.total > 0 ? (split.raw / split.total) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-3.5" />
                    </span>
                    {name}
                </p>
                <p className="text-sm font-semibold tabular-nums">{rupees(split.total)}</p>
            </div>
            <div
                className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${name}: raw materials ${rupees(split.raw)}, finished goods ${rupees(split.finished)}`}
            >
                <div
                    className="h-full rounded-full bg-primary transition-[width] duration-1000"
                    style={{ width: `${rawPct}%` }}
                />
                <div className="h-full flex-1 rounded-full bg-brand" />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
                {split.skus} items · raw {rupees(split.raw)} · finished {rupees(split.finished)}
            </p>
        </div>
    );
}

export function LowStockList({ items, loading, delay }: { items: InventoryDTO[]; loading: boolean; delay: number }) {
    // Most urgent first: smallest stock relative to its alert level.
    const ranked = [...items]
        .filter((i) => (i.alertThreshold ?? 0) > 0)
        .sort((a, b) => a.quantity / (a.alertThreshold as number) - b.quantity / (b.alertThreshold as number))
        .slice(0, 5);

    return (
        <GlassCard lift delay={delay} className="p-5">
            <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">Needs restocking</h3>
                <Link
                    to="/inventory/alerts"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5"
                >
                    All alerts <ArrowRight className="size-3.5" />
                </Link>
            </div>
            {loading ? (
                <Skeleton className="mt-4 h-40 w-full" />
            ) : ranked.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nothing is running low. 🎉</p>
            ) : (
                <ul className="mt-4 space-y-3.5">
                    {ranked.map((i) => {
                        const ratio = Math.min(1, i.quantity / (i.alertThreshold as number));
                        const critical = ratio < 0.5;
                        return (
                            <li key={i._id}>
                                <Link
                                    to={`/inventory/${i._id}`}
                                    className="group block rounded-xl px-1 py-0.5 transition-colors hover:bg-white/50"
                                >
                                    <div className="flex items-baseline justify-between gap-3 text-sm">
                                        <span className="min-w-0 truncate font-medium group-hover:text-primary">
                                            {i.productId?.name ?? "Item"}
                                        </span>
                                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                            <b
                                                className={cn(
                                                    "text-sm",
                                                    critical ? "text-destructive" : "text-foreground",
                                                )}
                                            >
                                                {i.quantity}
                                            </b>{" "}
                                            / {i.alertThreshold} {i.productId?.unit}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-[width] duration-1000",
                                                critical
                                                    ? "bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                                                    : "bg-warning",
                                            )}
                                            style={{ width: `${Math.max(4, ratio * 100)}%` }}
                                        />
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </GlassCard>
    );
}
