// src/pages/crm/SchoolsSheet.tsx — the schools as a spreadsheet: sortable by eye, resizable, with the actions pinned right.
import { useMemo } from "react";
import { Eye, MapPinned, NotebookPen, Route } from "lucide-react";
import type { SchoolDTO } from "@robago/shared";
import SheetGrid, { type SheetColumn } from "@/components/sheet/SheetGrid";
import { niceDate } from "@/lib/accounts/format";
import { kmText } from "@/lib/crm/geo";
import { mapsHint, mapsUrl } from "@/lib/crm/maps";
import { BOARD_LABEL, followUpDue, isProspect, STAGE, studentsText } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";
import { StageChip } from "./crmUi";

interface Props {
    rows: SchoolDTO[];
    showDistrict: boolean;
    heightClass?: string;
    onOpen: (id: string) => void;
    onLogVisit: (id: string) => void;
    onPlan: (id: string) => void;
    /** Road-km from today's planned stop, by school id — adds a “From stop” column when given. */
    distances?: Map<string, number | null>;
}

const dash = <span className="text-muted-foreground/50">—</span>;

export default function SchoolsSheet({
    rows,
    showDistrict,
    heightClass,
    onOpen,
    onLogVisit,
    onPlan,
    distances,
}: Props) {
    const columns = useMemo<SheetColumn<SchoolDTO>[]>(
        () => [
            {
                id: "name",
                label: "School",
                header: "School",
                width: 220,
                sticky: true,
                getValue: (r) => r.name,
                render: (r) => (
                    <span className="flex min-w-0 items-center gap-2">
                        <span className={cn("size-2 shrink-0 rounded-full", STAGE[r.stage].dot)} />
                        <span className="truncate font-medium" title={r.name}>
                            {r.name}
                        </span>
                    </span>
                ),
                footer: (rs) => <span className="text-muted-foreground">{rs.length} schools</span>,
            },
            {
                id: "place",
                label: "Place",
                header: showDistrict ? "District · place" : "Place",
                width: showDistrict ? 190 : 120,
                getValue: (r) => (showDistrict ? `${r.district} · ${r.place}` : r.place),
                render: (r) => (
                    <span className="truncate" title={`${r.place}, ${r.district}`}>
                        {showDistrict && <b className="font-semibold">{r.district}</b>}
                        {showDistrict && r.place && r.place !== r.district ? " · " : ""}
                        {(!showDistrict || r.place !== r.district) && r.place}
                    </span>
                ),
            },
            ...(distances
                ? [
                      {
                          id: "fromStop",
                          label: "Distance from today's stop",
                          header: "From stop",
                          subHeader: "≈ km by road",
                          width: 105,
                          align: "right" as const,
                          getValue: (r: SchoolDTO) => distances.get(r.id) ?? null,
                          getNumber: (r: SchoolDTO) => distances.get(r.id) ?? null,
                          render: (r: SchoolDTO) =>
                              distances.get(r.id) === null || distances.get(r.id) === undefined ? (
                                  dash
                              ) : (
                                  <span className="font-semibold text-primary tabular-nums">
                                      {kmText(distances.get(r.id))}
                                  </span>
                              ),
                      },
                  ]
                : []),
            {
                id: "stage",
                label: "Status",
                header: "Status",
                width: 170,
                getValue: (r) => STAGE[r.stage].label,
                render: (r) => <StageChip stage={r.stage} />,
            },
            {
                id: "last",
                label: "Last visit",
                header: "Last visit",
                width: 115,
                getValue: (r) => r.lastVisitDate,
                render: (r) => (r.lastVisitDate ? niceDate(r.lastVisitDate) : dash),
            },
            {
                id: "outcome",
                label: "Outcome of the last meeting",
                header: "Outcome of the last meeting",
                width: 300,
                grow: true,
                getValue: (r) => r.status,
                render: (r) =>
                    r.status ? (
                        <span className="truncate" title={r.status}>
                            {r.status}
                        </span>
                    ) : isProspect(r) ? (
                        <span className="text-muted-foreground/60">Not visited yet</span>
                    ) : (
                        dash
                    ),
            },
            {
                id: "board",
                label: "Board",
                header: "Board",
                width: 120,
                getValue: (r) => BOARD_LABEL[r.board],
                render: (r) => <span className="text-muted-foreground">{BOARD_LABEL[r.board]}</span>,
            },
            {
                id: "students",
                label: "Students",
                header: "Students",
                width: 100,
                align: "right",
                getValue: (r) => studentsText(r),
                getNumber: (r) => r.studentCount,
                render: (r) => (studentsText(r) ? <span className="tabular-nums">{studentsText(r)}</span> : dash),
            },
            {
                id: "phone",
                label: "Contact",
                header: "Contact",
                width: 190,
                getValue: (r) => r.phone,
                render: (r) =>
                    r.phone ? (
                        <span className="truncate" title={r.phone}>
                            {r.phone}
                        </span>
                    ) : (
                        dash
                    ),
            },
            {
                id: "followUp",
                label: "Follow up",
                header: "Follow up",
                width: 120,
                getValue: (r) => r.nextFollowUp,
                render: (r) =>
                    r.nextFollowUp ? (
                        <span className={cn(followUpDue(r) && "font-semibold text-destructive")}>
                            {niceDate(r.nextFollowUp)}
                        </span>
                    ) : (
                        dash
                    ),
            },
            {
                id: "actions",
                label: "",
                header: "",
                width: 325,
                stickyRight: true,
                getValue: () => null,
                render: (r) => (
                    <span className="flex items-center gap-2 pr-1" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => onOpen(r.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white/70 px-3 text-[13px] font-medium whitespace-nowrap text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            <Eye className="size-3.5" /> View details
                        </button>
                        <button
                            type="button"
                            onClick={() => onLogVisit(r.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold whitespace-nowrap text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            <NotebookPen className="size-3.5" /> Log visit
                        </button>
                        <button
                            type="button"
                            onClick={() => onPlan(r.id)}
                            title="Plan today's stop here — see what else is close"
                            aria-label={`Plan today's stop at ${r.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white/70 text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            <Route className="size-3.5" />
                        </button>
                        <a
                            href={mapsUrl(r)}
                            target="_blank"
                            rel="noreferrer"
                            title={mapsHint(r)}
                            aria-label={`Open ${r.name} in Google Maps`}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white/70 text-primary shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            <MapPinned className="size-3.5" />
                        </a>
                    </span>
                ),
            },
        ],
        [showDistrict, onOpen, onLogVisit, onPlan, distances],
    );

    return (
        <SheetGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            emptyMessage="No schools match."
            heightClass={heightClass}
            className="glass border-white/75 bg-transparent shadow-none"
            storageKey="robago_sheet_widths_crm_schools"
        />
    );
}
