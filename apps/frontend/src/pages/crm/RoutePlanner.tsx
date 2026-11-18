// src/pages/crm/RoutePlanner.tsx — "today's stop": what else is close by, and which districts are next on the way.
import { ChevronRight, MapPin, MapPinned, Navigation, NotebookPen, Plus, X } from "lucide-react";
import { nearbyDistricts, type SchoolDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/dashboard/GlassCard";
import { kmText } from "@/lib/crm/geo";
import { mapsHint, mapsUrl } from "@/lib/crm/maps";
import { BOARD_LABEL, type WithDistance } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";

export const RADII: { km: number | null; label: string }[] = [
    { km: 10, label: "10 km" },
    { km: 25, label: "25 km" },
    { km: 50, label: "50 km" },
    { km: 100, label: "100 km" },
    { km: null, label: "Any distance" },
];

type Counts = Map<string, { visited: number; prospects: number }>;

/** Districts next to `from`, nearest first, with how many schools we know there and how many we haven't approached. */
export function NearbyDistricts({
    from,
    counts,
    onPick,
    onAdd,
    className,
    compact,
}: {
    from: string;
    counts: Counts;
    onPick: (district: string) => void;
    onAdd: () => void;
    className?: string;
    /** Narrow side panel: one column. */
    compact?: boolean;
}) {
    const near = nearbyDistricts(from, 8, 150);
    if (near.length === 0) return null;
    return (
        <div className={className}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Navigation className="size-3.5" /> Next districts on the way from {from}
            </p>
            <ul className={cn("grid gap-2", !compact && "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4")}>
                {near.map((d) => {
                    const c = counts.get(d.name);
                    const known = c ? c.visited + c.prospects : 0;
                    return (
                        <li key={d.name} className="min-w-0">
                            <button
                                type="button"
                                onClick={() => (known ? onPick(d.name) : onAdd())}
                                className="glass-soft group w-full rounded-2xl px-3.5 py-2.5 text-left transition-transform hover:-translate-y-0.5"
                            >
                                <span className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm font-semibold">{d.name}</span>
                                    <span className="text-xs text-muted-foreground tabular-nums">≈ {d.km} km</span>
                                </span>
                                {known ? (
                                    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <b
                                            className={cn(
                                                "rounded-full px-2 py-0.5 font-semibold",
                                                c!.prospects
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-muted text-foreground",
                                            )}
                                        >
                                            {c!.prospects} to approach
                                        </b>
                                        {c!.visited ? <span>{c!.visited} visited</span> : null}
                                        <span className="ml-auto flex items-center font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                            See list <ChevronRight className="size-3.5" />
                                        </span>
                                    </span>
                                ) : (
                                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Plus className="size-3" /> No schools listed yet — add one
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

interface Props {
    compact?: boolean;
    plan: SchoolDTO;
    nearby: WithDistance[];
    visitedNear: number;
    radiusKm: number | null;
    counts: Counts;
    onRadius: (km: number | null) => void;
    onClear: () => void;
    onOpen: (id: string) => void;
    onLogVisit: (id: string) => void;
    onPickDistrict: (district: string) => void;
    onAdd: () => void;
}

export default function RoutePlanner({
    compact,
    plan,
    nearby,
    visitedNear,
    radiusKm,
    counts,
    onRadius,
    onClear,
    onOpen,
    onLogVisit,
    onPickDistrict,
    onAdd,
}: Props) {
    const within = radiusKm ? `within ${radiusKm} km` : "";
    return (
        <GlassCard className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                        <MapPin className="size-3.5" /> Today's stop
                    </p>
                    <h3 className="font-heading mt-0.5 text-lg leading-tight font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {[plan.place, plan.district].filter((v, i, a) => v && a.indexOf(v) === i).join(", ")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="glass-soft flex rounded-xl p-0.5" role="group" aria-label="How far">
                        {RADII.map((r) => (
                            <button
                                key={r.label}
                                aria-pressed={radiusKm === r.km}
                                onClick={() => onRadius(r.km)}
                                className={cn(
                                    "h-8 rounded-[10px] px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                                    radiusKm === r.km
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1 rounded-xl" onClick={onClear}>
                        <X className="size-3.5" /> Clear stop
                    </Button>
                </div>
            </div>

            <div className="mt-4">
                <p className="mb-2 text-sm">
                    <b>
                        {nearby.length === 0 ? "No" : nearby.length} school{nearby.length === 1 ? "" : "s"}
                    </b>{" "}
                    still to approach {within || "nearby"}
                    {visitedNear > 0 && (
                        <span className="text-muted-foreground"> · {visitedNear} you've already visited close by</span>
                    )}
                </p>
                {nearby.length > 0 ? (
                    <ul className={cn("grid gap-2", !compact && "md:grid-cols-2 2xl:grid-cols-3")}>
                        {nearby.slice(0, 6).map(({ school: s, km }) => (
                            <li
                                key={s.id}
                                className="glass-soft flex min-w-0 items-center gap-3 rounded-2xl px-3.5 py-2.5"
                            >
                                <button type="button" onClick={() => onOpen(s.id)} className="min-w-0 flex-1 text-left">
                                    <span className="block truncate text-sm font-medium">{s.name}</span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {[s.place || s.district, BOARD_LABEL[s.board]].join(" · ")}
                                    </span>
                                </button>
                                {km !== null && (
                                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                                        ≈ {kmText(km)}
                                    </span>
                                )}
                                <a
                                    href={mapsUrl(s)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={mapsHint(s)}
                                    aria-label={`Open ${s.name} in Google Maps`}
                                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-white/70 text-primary hover:bg-primary/5"
                                >
                                    <MapPinned className="size-3.5" />
                                </a>
                                <Button
                                    size="icon"
                                    className="size-8 shrink-0 rounded-lg"
                                    title="Log visit"
                                    aria-label={`Log visit to ${s.name}`}
                                    onClick={() => onLogVisit(s.id)}
                                >
                                    <NotebookPen className="size-3.5" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                        Nothing {within || "near"} yet. Try a bigger distance, or look at the districts below.
                    </p>
                )}
                {nearby.length > 6 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        + {nearby.length - 6} more — they're all in the list and on the map below, nearest first.
                    </p>
                )}
            </div>

            <NearbyDistricts
                compact={compact}
                from={plan.district}
                counts={counts}
                onPick={onPickDistrict}
                onAdd={onAdd}
                className="mt-5 border-t border-white/70 pt-4"
            />
            <p className="mt-3 text-[11px] text-muted-foreground">
                Distances are rough road estimates from town positions, not turn-by-turn directions.
            </p>
        </GlassCard>
    );
}
