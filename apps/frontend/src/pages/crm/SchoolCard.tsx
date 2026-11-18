// src/pages/crm/SchoolCard.tsx — one school as a card (used on phones, where a wide sheet is awkward).
import { CalendarClock, Eye, MapPinned, NotebookPen, Route } from "lucide-react";
import type { SchoolDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { niceDate } from "@/lib/accounts/format";
import { kmText } from "@/lib/crm/geo";
import { mapsHint, mapsUrl } from "@/lib/crm/maps";
import { BOARD_LABEL, followUpDue, isProspect, studentsText } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";
import { StageChip } from "./crmUi";

export default function SchoolCard({
    school: s,
    km,
    onOpen,
    onLogVisit,
    onPlan,
}: {
    school: SchoolDTO;
    /** Estimated road-km from today's planned stop. */
    km?: number | null;
    onOpen: () => void;
    onLogVisit: () => void;
    onPlan: () => void;
}) {
    return (
        <li
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onOpen()}
            className="glass glass-lift rise-in cursor-pointer space-y-2.5 overflow-hidden rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {[
                            s.place || s.district,
                            s.place && s.place !== s.district ? s.district : "",
                            BOARD_LABEL[s.board],
                            studentsText(s) && `${studentsText(s)} students`,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <StageChip stage={s.stage} />
                    {km !== null && km !== undefined && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                            ≈ {kmText(km)}
                        </span>
                    )}
                </div>
            </div>
            {s.status ? (
                <p className="line-clamp-2 text-sm text-foreground/80">{s.status}</p>
            ) : (
                isProspect(s) && <p className="text-sm text-muted-foreground">Not visited yet</p>
            )}
            {s.nextFollowUp && (
                <p
                    className={cn(
                        "flex items-center gap-1.5 text-xs font-medium",
                        followUpDue(s) ? "text-destructive" : "text-muted-foreground",
                    )}
                >
                    <CalendarClock className="size-3.5" /> Follow up {niceDate(s.nextFollowUp)}
                </p>
            )}
            <div className="flex gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" className="h-10 flex-1 gap-1.5 rounded-xl" onClick={onOpen}>
                    <Eye className="size-4" /> View details
                </Button>
                <Button className="h-10 flex-1 gap-1.5 rounded-xl font-semibold" onClick={onLogVisit}>
                    <NotebookPen className="size-4" /> Log visit
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl"
                    onClick={onPlan}
                    title="Plan today's stop here"
                    aria-label={`Plan today's stop at ${s.name}`}
                >
                    <Route className="size-4" />
                </Button>
                <Button asChild variant="outline" size="icon" className="size-10 shrink-0 rounded-xl text-primary">
                    <a
                        href={mapsUrl(s)}
                        target="_blank"
                        rel="noreferrer"
                        title={mapsHint(s)}
                        aria-label={`Open ${s.name} in Google Maps`}
                    >
                        <MapPinned className="size-4" />
                    </a>
                </Button>
            </div>
        </li>
    );
}
