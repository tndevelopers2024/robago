// src/lib/crm/meta.ts — labels and colours for school stages and boards, plus small helpers shared by the CRM screens.
import { locate, roadKm, SchoolBoard, SchoolStage, type SchoolDTO } from "@robago/shared";
import { todayIso } from "@/lib/accounts/format";

export const STAGES: { id: SchoolStage; label: string; hint: string; chip: string; dot: string; hex: string }[] = [
    {
        id: SchoolStage.Prospect,
        label: "Not approached",
        hint: "We haven't been there yet",
        chip: "bg-primary/10 text-primary",
        dot: "bg-primary",
        hex: "#0284c7",
    },
    {
        id: SchoolStage.Visited,
        label: "Visited",
        hint: "Met them, nothing sent yet",
        chip: "bg-slate-500/10 text-slate-700",
        dot: "bg-slate-600",
        hex: "#475569",
    },
    {
        id: SchoolStage.Sampled,
        label: "Sample / quote sent",
        hint: "They have seen a sample or a price",
        chip: "bg-amber-500/10 text-amber-700",
        dot: "bg-amber-500",
        hex: "#f59e0b",
    },
    {
        id: SchoolStage.Negotiating,
        label: "Near confirmation",
        hint: "Talks are on, order is close",
        chip: "bg-violet-500/10 text-violet-700",
        dot: "bg-violet-500",
        hex: "#8b5cf6",
    },
    {
        id: SchoolStage.Confirmed,
        label: "Order confirmed",
        hint: "We have an order",
        chip: "bg-success/10 text-success",
        dot: "bg-success",
        hex: "#16a34a",
    },
    {
        id: SchoolStage.Lost,
        label: "Not interested",
        hint: "Buying elsewhere / not giving",
        chip: "bg-destructive/10 text-destructive",
        dot: "bg-destructive",
        hex: "#ef4444",
    },
];
export const STAGE = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<SchoolStage, (typeof STAGES)[number]>;
/** The stages a visit can leave a school in (everything except "not approached"). */
export const VISIT_STAGES = STAGES.filter((s) => s.id !== SchoolStage.Prospect);

export const BOARD_LABEL: Record<SchoolBoard, string> = {
    cbse: "CBSE",
    icse: "ICSE",
    matric: "Matriculation",
    state: "State board",
    other: "Board not set",
};
export const BOARDS = Object.entries(BOARD_LABEL).map(([id, label]) => ({ id: id as SchoolBoard, label }));

export const isProspect = (s: SchoolDTO) => s.stage === SchoolStage.Prospect;
export const followUpDue = (s: SchoolDTO) => Boolean(s.nextFollowUp) && s.nextFollowUp <= todayIso() && !isProspect(s);

export function studentsText(s: Pick<SchoolDTO, "studentCount" | "studentNote">): string {
    if (s.studentNote) return s.studentNote;
    return s.studentCount === null ? "" : s.studentCount.toLocaleString("en-IN");
}

/** A phone string may hold several numbers and names; pull out the first dialable number. */
export function firstPhone(raw: string): string {
    const m = raw.replace(/[\s-]/g, "").match(/\d{10,12}/);
    return m ? m[0] : "";
}

/** A school with how far it is from somewhere, in km by road (an estimate). */
export interface WithDistance {
    school: SchoolDTO;
    km: number | null;
}

/**
 * Schools we haven't approached yet, nearest first. Uses the map distance from `of` when both have a position (this also
 * reaches across district borders); otherwise same district, same town first.
 */
export function nearbyProspects(
    all: SchoolDTO[],
    of: SchoolDTO,
    limit = 12,
    maxKm = Infinity,
    sameDistrictOnly = true,
): WithDistance[] {
    const boardRank: Record<string, number> = { cbse: 0, icse: 0, matric: 1, state: 2, other: 3 };
    const origin = locate(of);
    return all
        .filter((s) => s.id !== of.id && isProspect(s) && (!sameDistrictOnly || s.district === of.district))
        .map((school) => {
            const there = locate(school);
            return { school, km: origin && there ? roadKm(origin, there) : null };
        })
        .filter((r) => r.km === null || r.km <= maxKm)
        .sort(
            (a, b) =>
                (a.km ?? 9999) - (b.km ?? 9999) ||
                (boardRank[a.school.board] ?? 3) - (boardRank[b.school.board] ?? 3) ||
                (b.school.studentCount ?? 0) - (a.school.studentCount ?? 0) ||
                a.school.name.localeCompare(b.school.name),
        )
        .slice(0, limit);
}

/** What we know about each district: schools visited, schools still to approach. */
export function districtCounts(all: SchoolDTO[]): Map<string, { visited: number; prospects: number }> {
    const by = new Map<string, { visited: number; prospects: number }>();
    for (const s of all) {
        const d = by.get(s.district) ?? { visited: 0, prospects: 0 };
        if (isProspect(s)) d.prospects++;
        else d.visited++;
        by.set(s.district, d);
    }
    return by;
}
