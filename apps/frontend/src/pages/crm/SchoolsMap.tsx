// src/pages/crm/SchoolsMap.tsx — the schools on a map: pick a stop, see what is close, and how far.
import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Eye, Navigation, NotebookPen, Route } from "lucide-react";
import { ROAD_FACTOR, type SchoolDTO } from "@robago/shared";
import { BOARD_LABEL, isProspect, STAGE, STAGES, studentsText } from "@/lib/crm/meta";
import { kmText, type Placed } from "@/lib/crm/geo";
import { directionsUrl } from "@/lib/crm/maps";
import { cn } from "@/lib/utils";

interface Props {
    schools: SchoolDTO[];
    placed: Map<string, Placed>;
    plan: SchoolDTO | null;
    /** Road-km radius drawn around the planned stop (null = none). */
    radiusKm: number | null;
    /** Distance of each school from the planned stop, by id. */
    distances: Map<string, number | null>;
    heightClass: string;
    onOpen: (id: string) => void;
    onLogVisit: (id: string) => void;
    onPlan: (id: string) => void;
}

const TAMIL_NADU: L.LatLngBoundsExpression = [
    [8.0, 76.2],
    [13.6, 80.4],
];

/** Re-frames the map whenever what is shown (or the planned stop) changes — but not on every re-render. */
function Frame({
    points,
    plan,
    radiusKm,
}: {
    points: [number, number][];
    plan: [number, number] | null;
    radiusKm: number | null;
}) {
    const map = useMap();
    const signature = `${points.length}:${points[0]?.join(",") ?? ""}:${points.at(-1)?.join(",") ?? ""}|${plan?.join(",") ?? ""}|${radiusKm}`;
    useEffect(() => {
        if (plan && radiusKm) {
            map.fitBounds(L.latLng(plan).toBounds((radiusKm / ROAD_FACTOR) * 2000 * 1.15), { animate: true });
        } else if (points.length > 1) {
            map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 11, animate: true });
        } else if (points.length === 1) {
            map.setView(points[0]!, 11, { animate: true });
        } else {
            map.fitBounds(TAMIL_NADU);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, signature]);
    return null;
}

export default function SchoolsMap({
    schools,
    placed,
    plan,
    radiusKm,
    distances,
    heightClass,
    onOpen,
    onLogVisit,
    onPlan,
}: Props) {
    const points = useMemo(
        () =>
            schools.flatMap((s) =>
                placed.get(s.id) ? [[placed.get(s.id)!.drawLat, placed.get(s.id)!.drawLng] as [number, number]] : [],
            ),
        [schools, placed],
    );
    const planPos =
        plan && placed.get(plan.id) ? ([placed.get(plan.id)!.lat, placed.get(plan.id)!.lng] as [number, number]) : null;
    const unplaced = schools.length - points.length;
    const approx = schools.filter((s) => placed.get(s.id)?.level === "district").length;

    return (
        <div className="space-y-2">
            <div className={cn("glass relative isolate z-0 overflow-hidden rounded-3xl", heightClass)}>
                <MapContainer bounds={TAMIL_NADU} scrollWheelZoom className="relative z-0 size-full" attributionControl>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={18}
                    />
                    <Frame points={points} plan={planPos} radiusKm={radiusKm} />

                    {planPos && radiusKm && (
                        <Circle
                            center={planPos}
                            radius={(radiusKm / ROAD_FACTOR) * 1000}
                            pathOptions={{
                                color: "#0369a1",
                                weight: 2,
                                dashArray: "6 6",
                                fillColor: "#0ea5e9",
                                fillOpacity: 0.07,
                            }}
                        />
                    )}

                    {schools.map((s) => {
                        const at = placed.get(s.id);
                        if (!at) return null;
                        const stage = STAGE[s.stage];
                        const prospect = isProspect(s);
                        const isPlan = plan?.id === s.id;
                        const km = distances.get(s.id);
                        return (
                            <CircleMarker
                                key={s.id}
                                center={[at.drawLat, at.drawLng]}
                                radius={isPlan ? 13 : prospect ? 8 : 9}
                                pathOptions={{
                                    color: isPlan ? "#0f172a" : "#ffffff",
                                    weight: isPlan ? 3 : 2,
                                    fillColor: stage.hex,
                                    fillOpacity: 0.95,
                                }}
                            >
                                <Tooltip direction="top" offset={[0, -6]}>
                                    <b>{s.name}</b>
                                    <br />
                                    {[
                                        s.place,
                                        stage.label,
                                        km !== null && km !== undefined && plan && !isPlan ? `≈ ${kmText(km)}` : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </Tooltip>
                                <Popup minWidth={230}>
                                    <div className="space-y-1.5 text-[13px]">
                                        <p className="text-sm leading-tight font-semibold">{s.name}</p>
                                        <p className="text-muted-foreground">
                                            {[
                                                s.place || s.district,
                                                BOARD_LABEL[s.board],
                                                studentsText(s) && `${studentsText(s)} students`,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                        <p className="flex items-center gap-1.5 font-medium">
                                            <span className="size-2 rounded-full" style={{ background: stage.hex }} />{" "}
                                            {stage.label}
                                        </p>
                                        {s.status && <p className="line-clamp-3 text-foreground/80">{s.status}</p>}
                                        {plan && !isPlan && km !== null && km !== undefined && (
                                            <p className="font-semibold text-primary">
                                                ≈ {kmText(km)} from {plan.name}
                                            </p>
                                        )}
                                        {at.level !== "pin" && (
                                            <p className="text-xs text-muted-foreground">
                                                Position is approximate ({at.level}-level).
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => onOpen(s.id)}
                                                className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium hover:bg-muted"
                                            >
                                                <Eye className="size-3.5" /> Details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onLogVisit(s.id)}
                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground"
                                            >
                                                <NotebookPen className="size-3.5" /> Log visit
                                            </button>
                                            <a
                                                href={directionsUrl(s)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium text-primary hover:bg-primary/5"
                                            >
                                                <Navigation className="size-3.5" /> Directions
                                            </a>
                                            {!isPlan && (
                                                <button
                                                    type="button"
                                                    onClick={() => onPlan(s.id)}
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/40 px-2.5 text-xs font-medium text-primary hover:bg-primary/5"
                                                >
                                                    <Route className="size-3.5" /> Plan stop here
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>

                <div className="pointer-events-none absolute bottom-3 left-3 z-[500] hidden flex-wrap gap-x-3 gap-y-1 rounded-xl bg-white/85 px-3 py-2 text-[11px] font-medium shadow-sm backdrop-blur sm:flex">
                    {STAGES.map((s) => (
                        <span key={s.id} className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full" style={{ background: s.hex }} /> {s.label}
                        </span>
                    ))}
                </div>
                {schools.length === 0 && (
                    <div className="absolute inset-0 z-[500] grid place-items-center bg-white/60 text-sm font-medium text-muted-foreground backdrop-blur-[1px]">
                        No schools match these filters.
                    </div>
                )}
            </div>
            <p className="px-1 text-xs text-muted-foreground">
                {schools.length - unplaced} on the map. Positions are the town's centre unless a school has been pinned
                {approx ? ` — ${approx} are only placed by district` : ""}, so distances are rough road estimates. Edit
                a school to pin its exact spot.
            </p>
        </div>
    );
}
