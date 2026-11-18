// src/pages/crm/SchoolsPage.tsx — School visits, on one screen: pick a district, see who we have visited there and how it
// went, and who we have NOT approached yet. Every visit is logged from here, and the outcome is the first thing recorded.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    BadgeCheck,
    Building2,
    CalendarClock,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Compass,
    GraduationCap,
    List,
    Map as MapIcon,
    MapPin,
    MessagesSquare,
    Plus,
    Search,
    SlidersHorizontal,
    Sparkles,
    X,
    type LucideIcon,
} from "lucide-react";
import { SchoolStage, type SchoolBoard } from "@robago/shared";
import Aurora from "@/components/dashboard/Aurora";
import GlassCard from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { kmBetween, placeAll } from "@/lib/crm/geo";
import { useSchools } from "@/lib/crm/store";
import { BOARDS, districtCounts, followUpDue, isProspect, nearbyProspects, STAGES, VISIT_STAGES } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";
import SchoolCard from "./SchoolCard";
import SchoolDrawer from "./SchoolDrawer";
import FilterSelect from "./FilterSelect";
import RoutePlanner, { NearbyDistricts } from "./RoutePlanner";
import SchoolFormDialog from "./SchoolFormDialog";
import SchoolsSheet from "./SchoolsSheet";
import VisitDialog from "./VisitDialog";

// The map library is large — only fetched when someone opens the map.
const SchoolsMap = lazy(() => import("./SchoolsMap"));

type Tab = "visited" | "prospects" | "all";
const TABS: [Tab, string][] = [
    ["visited", "Visited"],
    ["prospects", "Not yet approached"],
    ["all", "All"],
];
interface Tile {
    label: string;
    /** Label used on the folded one-line summary. */
    short: string;
    value: number;
    sub: string;
    icon: LucideIcon;
    tone: keyof typeof TILE_TONE;
    onClick?: () => void;
}
/** Each stat tile has its own colour; "still to approach" is loudest, because that is where the next sale is. */
const TILE_TONE = {
    ink: { card: "", num: "text-foreground", icon: "bg-slate-700/10 text-slate-700" },
    violet: { card: "", num: "text-violet-700", icon: "bg-violet-500/10 text-violet-600" },
    green: { card: "", num: "text-success", icon: "bg-success/10 text-success" },
    red: { card: "ring-1 ring-destructive/30", num: "text-destructive", icon: "bg-destructive/10 text-destructive" },
    slate: { card: "", num: "text-foreground", icon: "bg-muted text-muted-foreground" },
    brand: {
        card: "ring-1 ring-primary/30 bg-linear-to-br from-primary/15 to-transparent",
        num: "text-primary",
        icon: "bg-primary text-white shadow-md shadow-primary/30",
    },
} as const;

const PLAN_KEY = "robago_crm_plan";
const VIEW_KEY = "robago_crm_view";
const STATS_KEY = "robago_crm_stats";
const today = () => new Date().toISOString().slice(0, 10);
const BOARD_RANK: Record<string, number> = { cbse: 0, icse: 0, matric: 1, state: 2, other: 3 };

export default function SchoolsPage() {
    const q = useSchools();
    const all = useMemo(() => q.data ?? [], [q.data]);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const wide = useMediaQuery("(min-width: 1536px)");
    const sideBySide = useMediaQuery("(min-width: 1280px)");

    const [district, setDistrict] = useState("");
    const [tab, setTab] = useState<Tab>("visited");
    const [place, setPlace] = useState("");
    const [board, setBoard] = useState<SchoolBoard | "">("");
    const [stage, setStage] = useState<SchoolStage | "">("");
    const [dueOnly, setDueOnly] = useState(false);
    const [query, setQuery] = useState("");
    const [view, setView] = useState<"list" | "map">(() => {
        try {
            return localStorage.getItem(VIEW_KEY) === "map" ? "map" : "list";
        } catch {
            return "list";
        }
    });
    // Today's stop: where we are going today. Remembered for the day, so a refresh doesn't lose it.
    const [planId, setPlanId] = useState<string | null>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "null") as { id?: string; day?: string } | null;
            return saved?.id && saved.day === today() ? saved.id : null;
        } catch {
            return null;
        }
    });
    const [radius, setRadius] = useState<number | null>(25);
    // The numbers at the top fold into one line so the schools below get the room. Folded by default.
    const [statsOpen, setStatsOpen] = useState<boolean>(() => {
        try {
            return localStorage.getItem(STATS_KEY) === "open";
        } catch {
            return false;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(VIEW_KEY, view);
            localStorage.setItem(STATS_KEY, statsOpen ? "open" : "closed");
            if (planId) localStorage.setItem(PLAN_KEY, JSON.stringify({ id: planId, day: today() }));
            else localStorage.removeItem(PLAN_KEY);
        } catch {
            // ignore
        }
    }, [view, planId, statsOpen]);

    const [openId, setOpenId] = useState<string | null>(null);
    const [visitId, setVisitId] = useState<string | null>(null);
    const [form, setForm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const resultsRef = useRef<HTMLDivElement>(null);
    const onOpen = useCallback((id: string) => setOpenId(id), []);
    const onLogVisit = useCallback((id: string) => setVisitId(id), []);

    // ---- the district list: how much we have covered in each ---------------------------------------------
    const districts = useMemo(() => {
        const by = new Map<string, { name: string; visited: number; prospects: number; confirmed: number }>();
        for (const s of all) {
            const d = by.get(s.district) ?? { name: s.district, visited: 0, prospects: 0, confirmed: 0 };
            if (isProspect(s)) d.prospects++;
            else d.visited++;
            if (s.stage === SchoolStage.Confirmed) d.confirmed++;
            by.set(s.district, d);
        }
        return [...by.values()].sort((a, b) => b.visited - a.visited || a.name.localeCompare(b.name));
    }, [all]);

    const totals = useMemo(() => {
        const prospects = all.filter(isProspect).length;
        return { prospects, visited: all.length - prospects };
    }, [all]);

    const inArea = useMemo(
        () => all.filter((s) => (!district || s.district === district) && (!place || s.place === place)),
        [all, district, place],
    );
    const placed = useMemo(() => placeAll(all), [all]);
    const dCounts = useMemo(() => districtCounts(all), [all]);
    const plan = useMemo(() => all.find((s) => s.id === planId) ?? null, [all, planId]);
    const distances = useMemo(() => {
        const m = new Map<string, number | null>();
        if (plan) for (const s of all) m.set(s.id, s.id === plan.id ? 0 : kmBetween(placed, plan.id, s.id));
        return m;
    }, [all, plan, placed]);
    const nearForPlan = useMemo(
        () => (plan ? nearbyProspects(all, plan, 500, radius ?? Infinity, false) : []),
        [all, plan, radius],
    );
    const visitedNear = useMemo(
        () =>
            plan
                ? all.filter(
                      (s) =>
                          !isProspect(s) &&
                          s.id !== plan.id &&
                          (distances.get(s.id) ?? Infinity) <= (radius ?? Infinity),
                  ).length
                : 0,
        [all, plan, distances, radius],
    );

    const places = useMemo(
        () =>
            district
                ? [
                      ...new Set(
                          all
                              .filter((s) => s.district === district)
                              .map((s) => s.place)
                              .filter(Boolean),
                      ),
                  ].sort()
                : [],
        [all, district],
    );

    const counts = useMemo(() => {
        const c = { visited: 0, prospects: 0, all: inArea.length, confirmed: 0, talks: 0, due: 0 };
        for (const s of inArea) {
            if (isProspect(s)) c.prospects++;
            else c.visited++;
            if (s.stage === SchoolStage.Confirmed) c.confirmed++;
            if (s.stage === SchoolStage.Sampled || s.stage === SchoolStage.Negotiating) c.talks++;
            if (followUpDue(s)) c.due++;
        }
        return c;
    }, [inArea]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return inArea
            .filter(
                (s) =>
                    (tab === "all" || (tab === "prospects") === isProspect(s)) &&
                    (!board || s.board === board) &&
                    (!stage || s.stage === stage) &&
                    (!dueOnly || followUpDue(s)) &&
                    (!plan || radius === null || (distances.get(s.id) ?? Infinity) <= radius) &&
                    (!needle ||
                        `${s.name} ${s.place} ${s.district} ${s.phone} ${s.correspondent} ${s.status} ${s.reference}`
                            .toLowerCase()
                            .includes(needle)),
            )
            .sort((a, b) => {
                if (plan)
                    return (
                        (distances.get(a.id) ?? 9999) - (distances.get(b.id) ?? 9999) || a.name.localeCompare(b.name)
                    );
                if (tab === "prospects")
                    return (
                        (BOARD_RANK[a.board] ?? 3) - (BOARD_RANK[b.board] ?? 3) ||
                        a.place.localeCompare(b.place) ||
                        a.name.localeCompare(b.name)
                    );
                if (tab === "visited")
                    return (
                        Number(followUpDue(b)) - Number(followUpDue(a)) ||
                        b.lastVisitDate.localeCompare(a.lastVisitDate) ||
                        a.name.localeCompare(b.name)
                    );
                return a.district.localeCompare(b.district) || a.name.localeCompare(b.name);
            });
    }, [inArea, tab, board, stage, dueOnly, query, plan, radius, distances]);

    const pickDistrict = (d: string) => {
        setDistrict(d);
        setPlace("");
    };
    /** "I'm going to this school today": show what else is close, nearest first, across district borders. */
    const planStop = (id: string) => {
        setPlanId(id);
        setOpenId(null);
        setDistrict("");
        setPlace("");
        setTab("prospects");
        setStage("");
        setDueOnly(false);
    };
    /** Heading for another district: its own list, not the radius around today's stop. */
    const goToDistrict = (d: string) => {
        setPlanId(null);
        setOpenId(null);
        pickDistrict(d);
        setTab("prospects");
        setStage("");
        setBoard("");
        setDueOnly(false);
        setQuery("");
        // Show the actual list of schools to approach (not the map), and bring it into view.
        setView("list");
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    };
    const filtersOn = Boolean(query || board || stage || dueOnly || place);
    const clearFilters = () => {
        setQuery("");
        setBoard("");
        setStage("");
        setDueOnly(false);
        setPlace("");
    };

    if (q.isPending) {
        return (
            <div className="space-y-3 p-5">
                <Skeleton className="h-24 w-full rounded-3xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    /** Today's stop (with what is close), or — when only a district is picked — the districts next to it. */
    const panel = plan ? (
        <RoutePlanner
            compact={sideBySide && view === "map"}
            plan={plan}
            nearby={nearForPlan}
            visitedNear={visitedNear}
            radiusKm={radius}
            counts={dCounts}
            onRadius={setRadius}
            onClear={() => setPlanId(null)}
            onOpen={onOpen}
            onLogVisit={onLogVisit}
            onPickDistrict={goToDistrict}
            onAdd={() => setForm({ open: true, id: null })}
        />
    ) : district ? (
        <div className="glass rounded-3xl p-4">
            <NearbyDistricts
                compact={sideBySide && view === "map"}
                from={district}
                counts={dCounts}
                onPick={goToDistrict}
                onAdd={() => setForm({ open: true, id: null })}
            />
        </div>
    ) : null;

    const tiles: Tile[] = [
        {
            label: "Schools visited",
            short: "visited",
            value: counts.visited,
            sub: district ? `in ${district}` : "across all districts",
            icon: Building2,
            tone: "ink",
            onClick: () => setTab("visited"),
        },
        {
            label: "In talks",
            short: "in talks",
            value: counts.talks,
            sub: "sample / quote sent or near confirmation",
            icon: MessagesSquare,
            tone: "violet",
        },
        {
            label: "Orders confirmed",
            short: "confirmed",
            value: counts.confirmed,
            sub: "schools that ordered",
            icon: BadgeCheck,
            tone: "green",
        },
        {
            label: "Follow-ups due",
            short: "follow-ups due",
            value: counts.due,
            sub: counts.due ? "tap to see them" : "nothing waiting",
            icon: CalendarClock,
            tone: counts.due ? "red" : "slate",
            onClick: () => {
                setTab("visited");
                setDueOnly(true);
            },
        },
        {
            label: "Still to approach",
            short: "to approach",
            value: counts.prospects,
            sub: "private schools we haven't met",
            icon: Compass,
            tone: "brand",
            onClick: () => setTab("prospects"),
        },
    ];

    const sheetHeight = "max-h-[max(24rem,calc(100dvh-27rem))]";

    return (
        <div className="relative isolate min-h-full">
            <Aurora />
            <div className="w-full space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
                {/* ---- the picture so far: folds down to one line ---- */}
                <GlassCard className="p-0">
                    <button
                        type="button"
                        onClick={() => setStatsOpen((o) => !o)}
                        aria-expanded={statsOpen}
                        aria-label={statsOpen ? "Collapse summary" : "Expand summary"}
                        className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-5"
                    >
                        {tiles.map((t) => {
                            const tone = TILE_TONE[t.tone];
                            return (
                                <span key={t.label} className="flex items-center gap-2" title={t.sub}>
                                    <span className={cn("grid size-8 place-items-center rounded-xl", tone.icon)}>
                                        <t.icon className="size-4" />
                                    </span>
                                    <span className={cn("text-xl leading-none font-semibold tabular-nums", tone.num)}>
                                        {t.value}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">{t.short}</span>
                                </span>
                            );
                        })}
                        <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            {statsOpen ? "Hide details" : "Show details"}
                            <ChevronDown
                                className={cn("size-4 transition-transform duration-300", statsOpen && "rotate-180")}
                            />
                        </span>
                    </button>
                    <div
                        className={cn(
                            "grid transition-[grid-template-rows] duration-300 ease-out",
                            statsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                    >
                        <div className="overflow-hidden">
                            <div className="border-t border-white/70 p-3 sm:p-4">
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                                    {tiles.map((t, i) => {
                                        const tone = TILE_TONE[t.tone];
                                        return (
                                            <GlassCard
                                                key={t.label}
                                                lift={Boolean(t.onClick)}
                                                delay={i * 40}
                                                className={cn("p-4", t.onClick && "cursor-pointer", tone.card)}
                                                role={t.onClick ? "button" : undefined}
                                                tabIndex={t.onClick ? 0 : undefined}
                                                onClick={t.onClick}
                                                onKeyDown={(e) => e.key === "Enter" && t.onClick?.()}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-muted-foreground">
                                                            {t.label}
                                                        </p>
                                                        <p
                                                            className={cn(
                                                                "mt-1 text-4xl font-semibold tracking-tight tabular-nums",
                                                                tone.num,
                                                            )}
                                                        >
                                                            {t.value}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "grid size-11 shrink-0 place-items-center rounded-2xl",
                                                            tone.icon,
                                                        )}
                                                    >
                                                        <t.icon className="size-5.5" />
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 truncate text-xs text-muted-foreground">{t.sub}</p>
                                            </GlassCard>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="grid gap-3 2xl:grid-cols-[14.5rem_minmax(0,1fr)] 2xl:gap-4">
                    {/* ---- districts ---- */}
                    <aside
                        aria-label="Districts"
                        className="glass rounded-3xl p-2 2xl:sticky 2xl:top-3 2xl:max-h-[calc(100dvh-8rem)] 2xl:self-start 2xl:overflow-y-auto"
                    >
                        {wide ? (
                            <ul className="space-y-0.5">
                                <DistrictRow
                                    name="All districts"
                                    visited={totals.visited}
                                    prospects={totals.prospects}
                                    active={!district}
                                    onClick={() => pickDistrict("")}
                                    icon
                                />
                                {districts.map((d) => (
                                    <DistrictRow
                                        key={d.name}
                                        name={d.name}
                                        visited={d.visited}
                                        prospects={d.prospects}
                                        active={district === d.name}
                                        onClick={() => pickDistrict(d.name)}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <FilterSelect
                                ariaLabel="District"
                                icon={MapPin}
                                value={district}
                                onChange={pickDistrict}
                                anyLabel={`All districts · ${totals.visited} visited · ${totals.prospects} to approach`}
                                className="w-full"
                                options={districts.map((d) => ({
                                    value: d.name,
                                    label: d.name,
                                    hint: `${d.visited} visited · ${d.prospects} to approach`,
                                }))}
                            />
                        )}
                    </aside>

                    <div className="min-w-0 space-y-3">
                        {/* ---- today's stop, or the districts next to the one being looked at ---- */}
                        {view === "list" && panel}

                        {/* ---- find, add, and narrow down: one control panel ---- */}
                        <div className="glass space-y-3 rounded-3xl p-3 sm:p-4">
                            <div className="flex gap-2">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-4.5 -translate-y-1/2 text-primary" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search school, town, contact or what was said…"
                                        aria-label="Search"
                                        className="h-12 w-full rounded-2xl border border-white/80 bg-white/75 pr-10 pl-11 text-sm shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                    />
                                    {query && (
                                        <button
                                            aria-label="Clear search"
                                            onClick={() => setQuery("")}
                                            className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    onClick={() => setForm({ open: true, id: null })}
                                    className="h-12 shrink-0 gap-1.5 rounded-2xl px-5 font-semibold shadow-md shadow-primary/25"
                                >
                                    <Plus /> <span className="hidden sm:inline">Add school</span>
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div
                                    className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white/60 p-1 ring-1 ring-white/80"
                                    role="group"
                                    aria-label="Show"
                                >
                                    {TABS.map(([id, label]) => {
                                        const attention = id === "prospects";
                                        const on = tab === id;
                                        return (
                                            <button
                                                key={id}
                                                aria-pressed={on}
                                                onClick={() => {
                                                    setTab(id);
                                                    if (id === "prospects") setStage("");
                                                }}
                                                className={cn(
                                                    "flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-all",
                                                    on
                                                        ? attention
                                                            ? "bg-primary text-white shadow-md shadow-primary/30"
                                                            : "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                                        : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
                                                )}
                                            >
                                                {attention && !on && (
                                                    <span className="size-2 rounded-full bg-primary" />
                                                )}
                                                {label}
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 text-xs tabular-nums",
                                                        on
                                                            ? "bg-white/25"
                                                            : attention
                                                              ? "bg-primary/10 text-primary"
                                                              : "bg-muted",
                                                    )}
                                                >
                                                    {counts[id]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div
                                    className="ml-auto flex rounded-2xl bg-white/60 p-1 ring-1 ring-white/80"
                                    role="group"
                                    aria-label="View"
                                >
                                    {(
                                        [
                                            ["list", List, "List"],
                                            ["map", MapIcon, "Map"],
                                        ] as const
                                    ).map(([id, Icon, label]) => (
                                        <button
                                            key={id}
                                            aria-pressed={view === id}
                                            onClick={() => setView(id)}
                                            title={`${label} view`}
                                            className={cn(
                                                "flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
                                                view === id
                                                    ? "bg-foreground text-background shadow-md"
                                                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
                                            )}
                                        >
                                            <Icon className="size-4" /> {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 border-t border-white/70 pt-3">
                                <span className="mr-1 hidden items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:flex">
                                    <SlidersHorizontal className="size-3.5" /> Filter
                                </span>
                                {district && places.length > 1 && (
                                    <FilterSelect
                                        ariaLabel="Town"
                                        icon={MapPin}
                                        value={place}
                                        onChange={setPlace}
                                        anyLabel={`All towns in ${district}`}
                                        options={places.map((p) => ({ value: p, label: p }))}
                                    />
                                )}
                                <FilterSelect
                                    ariaLabel="Board"
                                    icon={GraduationCap}
                                    value={board}
                                    onChange={(v) => setBoard(v as SchoolBoard | "")}
                                    anyLabel="Any board"
                                    options={BOARDS.filter((b) => b.id !== "other").map((b) => ({
                                        value: b.id,
                                        label: b.label,
                                    }))}
                                />
                                {tab !== "prospects" && (
                                    <FilterSelect
                                        ariaLabel="Status"
                                        icon={CircleDot}
                                        value={stage}
                                        onChange={(v) => setStage(v as SchoolStage | "")}
                                        anyLabel="Any status"
                                        options={(tab === "all" ? STAGES : VISIT_STAGES).map((x) => ({
                                            value: x.id,
                                            label: x.label,
                                            dot: x.hex,
                                        }))}
                                    />
                                )}
                                <button
                                    aria-pressed={dueOnly}
                                    onClick={() => setDueOnly((d) => !d)}
                                    className={cn(
                                        "flex h-11 items-center gap-2 rounded-2xl border px-3.5 text-sm font-medium transition-all",
                                        dueOnly
                                            ? "border-transparent bg-destructive text-white shadow-md shadow-destructive/25"
                                            : "glass-soft border-transparent hover:-translate-y-px",
                                    )}
                                >
                                    <CalendarClock className={cn("size-4", !dueOnly && "text-muted-foreground")} />{" "}
                                    Follow-up due
                                    {counts.due > 0 && (
                                        <span
                                            className={cn(
                                                "rounded-full px-1.5 text-xs tabular-nums",
                                                dueOnly ? "bg-white/25" : "bg-destructive/10 text-destructive",
                                            )}
                                        >
                                            {counts.due}
                                        </span>
                                    )}
                                </button>
                                {filtersOn && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-primary hover:bg-primary/10"
                                    >
                                        <X className="size-4" /> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ---- the nudge: more schools to approach in this area ---- */}
                        {district && tab === "visited" && counts.prospects > 0 && (
                            <button
                                onClick={() => setTab("prospects")}
                                className="glass glass-lift flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <Sparkles className="size-4.5" />
                                </span>
                                <span className="min-w-0 flex-1 text-sm">
                                    <b>
                                        {counts.prospects} more private schools in {place || district}
                                    </b>{" "}
                                    that we haven't approached yet — CBSE, ICSE and matriculation.
                                </span>
                                <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary">
                                    See them <ChevronRight className="size-4" />
                                </span>
                            </button>
                        )}
                        {district && tab === "prospects" && counts.prospects > 0 && (
                            <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                These schools come from public online directories (government schools left out). Confirm
                                the board and contact details, then use “Log visit” after you go.
                            </p>
                        )}

                        {/* ---- the schools ---- */}
                        <div ref={resultsRef} className="scroll-mt-4" />
                        {all.length === 0 ? (
                            <div className="glass grid place-items-center rounded-3xl px-6 py-16 text-center">
                                <h2 className="text-xl font-semibold">No schools yet</h2>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Add the first school you visited and what came of the meeting.
                                </p>
                                <Button className="mt-5 gap-1.5" onClick={() => setForm({ open: true, id: null })}>
                                    <Plus /> Add school
                                </Button>
                            </div>
                        ) : view === "map" ? (
                            <div className={cn("grid gap-3", sideBySide && "grid-cols-[minmax(0,1fr)_24rem]")}>
                                <Suspense fallback={<Skeleton className="h-[28rem] w-full rounded-3xl" />}>
                                    <SchoolsMap
                                        schools={visible}
                                        placed={placed}
                                        plan={plan}
                                        radiusKm={plan ? radius : null}
                                        distances={distances}
                                        heightClass={sideBySide ? "h-[max(28rem,calc(100dvh-24rem))]" : "h-[62dvh]"}
                                        onOpen={onOpen}
                                        onLogVisit={onLogVisit}
                                        onPlan={planStop}
                                    />
                                </Suspense>
                                {panel && (
                                    <div
                                        className={cn(
                                            sideBySide &&
                                                "max-h-[max(28rem,calc(100dvh-24rem))] self-start overflow-y-auto rounded-3xl",
                                        )}
                                    >
                                        {panel}
                                    </div>
                                )}
                            </div>
                        ) : isDesktop ? (
                            <SchoolsSheet
                                rows={visible}
                                showDistrict={!district || Boolean(plan)}
                                heightClass={sheetHeight}
                                onOpen={onOpen}
                                onLogVisit={onLogVisit}
                                onPlan={planStop}
                                distances={plan ? distances : undefined}
                            />
                        ) : visible.length === 0 ? (
                            <p className="glass rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground">
                                Nothing matches. Try a different search or filter.
                            </p>
                        ) : (
                            <ul className="space-y-2.5">
                                {visible.map((s) => (
                                    <SchoolCard
                                        key={s.id}
                                        school={s}
                                        km={plan ? distances.get(s.id) : undefined}
                                        onOpen={() => setOpenId(s.id)}
                                        onLogVisit={() => setVisitId(s.id)}
                                        onPlan={() => planStop(s.id)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <SchoolDrawer
                    schoolId={openId}
                    onClose={() => setOpenId(null)}
                    onLogVisit={setVisitId}
                    onEdit={(id) => setForm({ open: true, id })}
                    onOpen={setOpenId}
                    onPlan={planStop}
                    onPickDistrict={goToDistrict}
                    onAdd={() => setForm({ open: true, id: null })}
                />
                <VisitDialog schoolId={visitId} onClose={() => setVisitId(null)} />
                <SchoolFormDialog
                    open={form.open}
                    schoolId={form.id}
                    defaultDistrict={district}
                    onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
                />
            </div>
        </div>
    );
}

function DistrictRow({
    name,
    visited,
    prospects,
    active,
    onClick,
    icon,
}: {
    name: string;
    visited: number;
    prospects: number;
    active: boolean;
    onClick: () => void;
    icon?: boolean;
}) {
    const total = visited + prospects;
    return (
        <li>
            <button
                onClick={onClick}
                aria-pressed={active}
                className={cn(
                    "w-full rounded-2xl px-3 py-2.5 text-left transition-all",
                    active
                        ? "bg-linear-to-r from-primary to-brand text-white shadow-md shadow-primary/25"
                        : "hover:bg-white/70",
                )}
            >
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {icon && <MapPin className="size-3.5 shrink-0" />}
                    {name}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums">
                    <span className={active ? "text-white/90" : "font-medium text-slate-600"}>{visited} visited</span>
                    <span className={active ? "text-white/50" : "text-muted-foreground/50"}>·</span>
                    <span className={active ? "text-white/90" : "font-medium text-primary"}>{prospects} to go</span>
                </span>
                <span
                    className={cn("mt-2 flex h-1.5 overflow-hidden rounded-full", active ? "bg-white/25" : "bg-muted")}
                >
                    <span
                        className={cn("h-full", active ? "bg-white" : "bg-slate-500")}
                        style={{ width: total ? `${(visited / total) * 100}%` : 0 }}
                    />
                    <span
                        className={cn("h-full", active ? "bg-white/50" : "bg-primary")}
                        style={{ width: total ? `${(prospects / total) * 100}%` : 0 }}
                    />
                </span>
            </button>
        </li>
    );
}
