// src/pages/crm/SchoolDrawer.tsx — one school: how the last meeting went, every visit with who/when, and the other
// private schools in the same district that we have not approached yet.
import {
    Archive,
    ArchiveRestore,
    CalendarClock,
    MapPin,
    MessageCircle,
    NotebookPen,
    Pencil,
    Phone,
    MapPinned,
    Navigation,
    Plus,
    Route,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import type { SchoolDTO, VisitDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { ago, niceDate } from "@/lib/accounts/format";
import { kmText } from "@/lib/crm/geo";
import { directionsUrl, mapsHint, mapsUrl } from "@/lib/crm/maps";
import { crmActions, useSchoolDetail, useSchools } from "@/lib/crm/store";
import {
    BOARD_LABEL,
    districtCounts,
    firstPhone,
    followUpDue,
    isProspect,
    nearbyProspects,
    STAGE,
    studentsText,
} from "@/lib/crm/meta";
import { cn } from "@/lib/utils";
import { ActorChip } from "@/pages/accounts/accountsUi";
import { StageChip } from "./crmUi";
import { NearbyDistricts } from "./RoutePlanner";

interface Props {
    schoolId: string | null;
    onClose: () => void;
    onLogVisit: (id: string) => void;
    onEdit: (id: string) => void;
    onOpen: (id: string) => void;
    onPlan: (id: string) => void;
    onPickDistrict: (district: string) => void;
    onAdd: () => void;
}

export default function SchoolDrawer({
    schoolId,
    onClose,
    onLogVisit,
    onEdit,
    onOpen,
    onPlan,
    onPickDistrict,
    onAdd,
}: Props) {
    const q = useSchoolDetail(schoolId);
    return (
        <Sheet open={Boolean(schoolId)} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto bg-background p-0 sm:max-w-xl [&>button]:z-10 [&>button]:text-white [&>button]:opacity-80"
            >
                <SheetDescription className="sr-only">
                    School details, visit history and nearby schools
                </SheetDescription>
                {q.data ? (
                    <Body
                        school={q.data.school}
                        visits={q.data.visits}
                        onLogVisit={onLogVisit}
                        onEdit={onEdit}
                        onOpen={onOpen}
                        onPlan={onPlan}
                        onPickDistrict={onPickDistrict}
                        onAdd={onAdd}
                    />
                ) : (
                    <div className="space-y-4 p-6">
                        <SheetTitle className="sr-only">Loading school</SheetTitle>
                        <Skeleton className="h-40 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Body({
    school,
    visits,
    onLogVisit,
    onEdit,
    onOpen,
    onPlan,
    onPickDistrict,
    onAdd,
}: {
    school: SchoolDTO;
    visits: VisitDTO[];
    onLogVisit: Props["onLogVisit"];
    onEdit: Props["onEdit"];
    onOpen: Props["onOpen"];
    onPlan: Props["onPlan"];
    onPickDistrict: Props["onPickDistrict"];
    onAdd: Props["onAdd"];
}) {
    const { data: all = [] } = useSchools();
    const nearby = nearbyProspects(all, school, 15);
    const counts = districtCounts(all);
    const prospect = isProspect(school);
    const phone = firstPhone(school.phone);

    const toggleArchive = async () => {
        try {
            await crmActions.updateSchool(school.id, { active: !school.active });
            toast.success(school.active ? `Hidden ${school.name}` : `Restored ${school.name}`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update."));
        }
    };

    const details: [string, string][] = [
        ["Address", school.address],
        ["Correspondent", school.correspondent],
        ["Last met", school.metWith],
        ["Phone", school.phone],
        ["Students", studentsText(school)],
        ["Reference", school.reference],
    ];

    return (
        <div className="space-y-5 pb-8">
            <div className="relative overflow-hidden bg-sidebar px-5 pt-6 pb-5 text-white">
                <div className="pointer-events-none absolute -top-20 -right-10 size-60 rounded-full bg-brand/30 blur-3xl" />
                <div className="relative">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
                        <MapPin className="size-3.5" />
                        {school.place && school.place !== school.district
                            ? `${school.place}, ${school.district}`
                            : school.district}
                        <span className="rounded-full bg-white/10 px-2 py-0.5 normal-case">
                            {BOARD_LABEL[school.board]}
                        </span>
                        {!school.active && (
                            <span className="rounded-full bg-destructive/40 px-2 py-0.5 normal-case">Hidden</span>
                        )}
                    </p>
                    <h2 className="font-heading mt-1 pr-8 text-2xl font-semibold text-white">{school.name}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
                        <StageChip stage={school.stage} onDark />
                        {studentsText(school) && (
                            <span className="flex items-center gap-1.5">
                                <Users className="size-4" /> {studentsText(school)} students
                            </span>
                        )}
                        {school.visitCount > 0 && (
                            <span>
                                {school.visitCount} visit{school.visitCount === 1 ? "" : "s"} · last{" "}
                                {niceDate(school.lastVisitDate)}
                            </span>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            onClick={() => onLogVisit(school.id)}
                            className="gap-1.5 bg-brand text-sidebar hover:bg-brand/90"
                        >
                            <NotebookPen className="size-4" /> {prospect ? "Log first visit" : "Log a visit"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => onEdit(school.id)} className="gap-1.5">
                            <Pencil className="size-4" /> Edit
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => onPlan(school.id)} className="gap-1.5">
                            <Route className="size-4" /> Plan stop here
                        </Button>
                        <Button size="sm" variant="secondary" asChild className="gap-1.5" title={mapsHint(school)}>
                            <a href={mapsUrl(school)} target="_blank" rel="noreferrer">
                                <MapPinned className="size-4" /> View on map
                            </a>
                        </Button>
                        <Button size="sm" variant="secondary" asChild className="gap-1.5">
                            <a href={directionsUrl(school)} target="_blank" rel="noreferrer">
                                <Navigation className="size-4" /> Directions
                            </a>
                        </Button>
                        {phone && (
                            <>
                                <Button size="sm" variant="secondary" asChild className="gap-1.5">
                                    <a href={`tel:+91${phone.slice(-10)}`}>
                                        <Phone className="size-4" /> Call
                                    </a>
                                </Button>
                                <Button size="sm" variant="secondary" asChild className="gap-1.5">
                                    <a href={`https://wa.me/91${phone.slice(-10)}`} target="_blank" rel="noreferrer">
                                        <MessageCircle className="size-4" /> WhatsApp
                                    </a>
                                </Button>
                            </>
                        )}
                        <Button size="sm" variant="secondary" onClick={toggleArchive} className="gap-1.5">
                            {school.active ? <Archive className="size-4" /> : <ArchiveRestore className="size-4" />}
                            {school.active ? "Hide" : "Restore"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-5 px-5">
                {prospect ? (
                    <p className="rounded-2xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        We haven't visited this school yet.
                        {school.source === "web" &&
                            " It was found in online school directories — confirm the board, contact and strength before going."}
                    </p>
                ) : (
                    <section className="rounded-2xl border bg-card p-4">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Latest outcome
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{school.status}</p>
                        {school.nextFollowUp && (
                            <p
                                className={cn(
                                    "mt-3 flex items-center gap-1.5 text-sm font-medium",
                                    followUpDue(school) ? "text-destructive" : "text-muted-foreground",
                                )}
                            >
                                <CalendarClock className="size-4" />
                                {followUpDue(school) ? "Follow-up due since " : "Follow up on "}
                                {niceDate(school.nextFollowUp)}
                            </p>
                        )}
                    </section>
                )}

                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    {details
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
                                <dd className="mt-0.5 break-words">{v}</dd>
                            </div>
                        ))}
                    {school.notes && (
                        <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
                            <dd className="mt-0.5 whitespace-pre-wrap">{school.notes}</dd>
                        </div>
                    )}
                </dl>

                {!prospect && (
                    <section>
                        <h3 className="mb-2 text-sm font-semibold">Visit history</h3>
                        <ol className="relative space-y-3 border-l pl-5">
                            {visits.map((v) => (
                                <li key={v.id} className="relative">
                                    <span
                                        className={cn(
                                            "absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-background",
                                            STAGE[v.stage].dot,
                                        )}
                                    />
                                    <div className="rounded-xl border bg-card p-3">
                                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                            <b className="text-sm text-foreground">{niceDate(v.date)}</b>
                                            <StageChip stage={v.stage} />
                                            {v.metWith && <span>met {v.metWith}</span>}
                                        </p>
                                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                                            {v.outcome}
                                        </p>
                                        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                            logged by <ActorChip actor={v.by} at={v.createdAt} /> · {ago(v.createdAt)}
                                            {v.nextFollowUp && <span>· follow up {niceDate(v.nextFollowUp)}</span>}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                <section>
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold">Also in {school.district} — not approached yet</h3>
                        <span className="text-xs text-muted-foreground">
                            {
                                all.filter((s) => isProspect(s) && s.district === school.district && s.id !== school.id)
                                    .length
                            }{" "}
                            schools
                        </span>
                    </div>
                    {nearby.length === 0 ? (
                        <p className="rounded-2xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                            No other schools listed for {school.district} yet. Use “Add school” to add the ones you hear
                            about.
                        </p>
                    ) : (
                        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
                            {nearby.map(({ school: n, km }) => (
                                <li key={n.id} className="flex items-center gap-3 px-3.5 py-2.5">
                                    <button
                                        type="button"
                                        onClick={() => onOpen(n.id)}
                                        className="min-w-0 flex-1 text-left"
                                    >
                                        <span className="block truncate text-sm font-medium">{n.name}</span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {[n.place, BOARD_LABEL[n.board]].filter(Boolean).join(" · ")}
                                            {n.place === school.place && n.place ? " · same town" : ""}
                                        </span>
                                    </button>
                                    {km !== null && (
                                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                                            ≈ {kmText(km)}
                                        </span>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 shrink-0 gap-1 px-2.5"
                                        onClick={() => onLogVisit(n.id)}
                                    >
                                        <Plus className="size-3.5" /> Log visit
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <NearbyDistricts from={school.district} counts={counts} onPick={onPickDistrict} onAdd={onAdd} />
            </div>
        </div>
    );
}
