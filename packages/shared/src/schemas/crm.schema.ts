// src/schemas/crm.schema.ts — school visits: schools, the visit log, and the prospects we have not approached yet.
import { z } from "zod";
import { SchoolBoard, SchoolSource, SchoolStage } from "../enums.js";
import { isoDateSchema } from "./staff.schema.js";
import type { ActorDTO } from "./accounts.schema.js";

const boardSchema = z.enum(Object.values(SchoolBoard) as [SchoolBoard, ...SchoolBoard[]]);
const stageSchema = z.enum(Object.values(SchoolStage) as [SchoolStage, ...SchoolStage[]]);
/** The stage a visit can leave a school in — a visit means it is no longer a prospect. */
const visitStageSchema = z.enum(
    Object.values(SchoolStage).filter((s) => s !== SchoolStage.Prospect) as [SchoolStage, ...SchoolStage[]],
);
const optionalDate = z.union([isoDateSchema, z.literal("")]);
const text = (max: number) => z.string().trim().max(max);

// ---- a visit -------------------------------------------------------------------------------------------

export const logVisitSchema = z.object({
    date: isoDateSchema,
    metWith: text(160),
    /** What happened in the meeting — the heart of the record. */
    outcome: z.string().trim().min(1, "Write what happened in the meeting").max(2000),
    stage: visitStageSchema,
    nextFollowUp: optionalDate,
});
export type LogVisitInput = z.infer<typeof logVisitSchema>;

// ---- a school ------------------------------------------------------------------------------------------

const schoolFields = {
    name: z.string().trim().min(1, "School name is required").max(160),
    district: z.string().trim().min(1, "District is required").max(80),
    place: text(80),
    board: boardSchema,
    studentCount: z.number().int().min(0).max(1_000_000).nullable(),
    studentNote: text(80),
    correspondent: text(120),
    phone: text(80),
    reference: text(120),
    notes: text(1000),
    /** Street address — used to find the school on the map. */
    address: text(300).optional(),
    /** Exact map pin (optional). Without it a school sits at its town. */
    lat: z.number().min(5).max(16).nullable().optional(),
    lng: z.number().min(74).max(84).nullable().optional(),
};

export const createSchoolSchema = z.object({
    ...schoolFields,
    /** Fill this in when you have already been to the school: the school is saved together with that first visit. */
    visit: logVisitSchema.optional(),
});
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;

export const updateSchoolSchema = z
    .object({
        ...schoolFields,
        stage: stageSchema,
        nextFollowUp: optionalDate,
        active: z.boolean(),
        /** Version the editor started from; a newer save by someone else is refused instead of overwritten. */
        expectedUpdatedAt: z.string(),
    })
    .partial();
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;

export const schoolListQuerySchema = z.object({
    /** "true" to include schools that were hidden (archived). */
    archived: z.enum(["true", "false"]).optional(),
});
export type SchoolListQuery = z.infer<typeof schoolListQuerySchema>;

// ---- what the API returns ------------------------------------------------------------------------------

export interface SchoolDTO {
    id: string;
    name: string;
    district: string;
    place: string;
    board: SchoolBoard;
    studentCount: number | null;
    /** For counts that are not a clean number, e.g. "6000 kids & 1100". */
    studentNote: string;
    /** Exact map pin, or null when the school is placed by its town. */
    lat: number | null;
    lng: number | null;
    stage: SchoolStage;
    /** The outcome of the latest visit (empty for prospects). */
    status: string;
    correspondent: string;
    metWith: string;
    phone: string;
    reference: string;
    notes: string;
    address: string;
    source: SchoolSource;
    firstVisitDate: string;
    lastVisitDate: string;
    nextFollowUp: string;
    visitCount: number;
    active: boolean;
    createdBy: ActorDTO;
    updatedBy: ActorDTO;
    createdAt: string;
    updatedAt: string;
}

export interface VisitDTO {
    id: string;
    schoolId: string;
    date: string;
    metWith: string;
    outcome: string;
    stage: SchoolStage;
    nextFollowUp: string;
    by: ActorDTO;
    createdAt: string;
}

export interface SchoolDetailDTO {
    school: SchoolDTO;
    visits: VisitDTO[];
}
