// src/services/crm.service.ts — school visits: the schools list, the visit log, and prospects not yet approached.
import { isValidObjectId, type HydratedDocument, type Types } from "mongoose";
import {
    SchoolStage,
    type ActorDTO,
    type CreateSchoolInput,
    type LogVisitInput,
    type SchoolDTO,
    type SchoolDetailDTO,
    type UpdateSchoolInput,
    type VisitDTO,
} from "@robago/shared";
import { School, SchoolVisit } from "../models/School.model.js";
import { ApiError } from "../utils/ApiError.js";

export { resolveActor } from "./accounts.service.js";

const keyOf = (name: string, district: string, place: string) =>
    [name, district, place].map((s) => s.trim().toLowerCase().replace(/\s+/g, " ")).join("|");

type SchoolDoc = HydratedDocument<{
    name: string; district: string; place: string; key: string; board: string; studentCount: number | null;
    studentNote: string; lat: number | null; lng: number | null; stage: string; status: string; correspondent: string; metWith: string; phone: string;
    reference: string; notes: string; address: string; source: string; firstVisitDate: string; lastVisitDate: string;
    nextFollowUp: string; visitCount: number; active: boolean; createdBy: ActorDTO; updatedBy: ActorDTO;
}> & { createdAt: Date; updatedAt: Date };

function assertId(id: string) {
    if (!isValidObjectId(id)) throw ApiError.notFound("School not found");
}

function toSchoolDTO(s: SchoolDoc): SchoolDTO {
    return {
        id: String(s._id),
        name: s.name,
        district: s.district,
        place: s.place,
        board: s.board as SchoolDTO["board"],
        studentCount: s.studentCount ?? null,
        studentNote: s.studentNote,
        lat: s.lat ?? null,
        lng: s.lng ?? null,
        stage: s.stage as SchoolDTO["stage"],
        status: s.status,
        correspondent: s.correspondent,
        metWith: s.metWith,
        phone: s.phone,
        reference: s.reference,
        notes: s.notes,
        address: s.address ?? "",
        source: s.source as SchoolDTO["source"],
        firstVisitDate: s.firstVisitDate,
        lastVisitDate: s.lastVisitDate,
        nextFollowUp: s.nextFollowUp,
        visitCount: s.visitCount,
        active: s.active,
        createdBy: s.createdBy,
        updatedBy: s.updatedBy,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    };
}

interface VisitLike {
    _id: Types.ObjectId; schoolId: Types.ObjectId; date: string; metWith: string; outcome: string; stage: string;
    nextFollowUp: string; by: ActorDTO; createdAt: Date;
}
const toVisitDTO = (v: VisitLike): VisitDTO => ({
    id: String(v._id),
    schoolId: String(v.schoolId),
    date: v.date,
    metWith: v.metWith,
    outcome: v.outcome,
    stage: v.stage as VisitDTO["stage"],
    nextFollowUp: v.nextFollowUp,
    by: v.by,
    createdAt: v.createdAt.toISOString(),
});

/**
 * The school's current status is always worked out from its visits (latest meeting wins), so two people logging
 * visits at the same moment can never overwrite each other's record.
 */
async function syncFromVisits(schoolId: Types.ObjectId, actor: ActorDTO) {
    const visits = await SchoolVisit.find({ schoolId }).sort({ date: -1, createdAt: -1 }).lean();
    const latest = visits[0];
    if (!latest) return;
    const oldest = visits[visits.length - 1]!;
    await School.updateOne(
        { _id: schoolId },
        {
            $set: {
                stage: latest.stage,
                status: latest.outcome,
                metWith: latest.metWith || "",
                lastVisitDate: latest.date,
                firstVisitDate: oldest.date,
                nextFollowUp: latest.nextFollowUp,
                visitCount: visits.length,
                updatedBy: actor,
            },
        },
    );
}

export async function listSchools(archived: boolean): Promise<SchoolDTO[]> {
    const docs = await School.find(archived ? {} : { active: true }).sort({ district: 1, name: 1 });
    return docs.map((d) => toSchoolDTO(d as unknown as SchoolDoc));
}

export async function getSchoolDetail(id: string): Promise<SchoolDetailDTO> {
    assertId(id);
    const doc = await School.findById(id);
    if (!doc) throw ApiError.notFound("School not found");
    const visits = await SchoolVisit.find({ schoolId: doc._id }).sort({ date: -1, createdAt: -1 }).lean();
    return {
        school: toSchoolDTO(doc as unknown as SchoolDoc),
        visits: visits.map((v) => toVisitDTO(v as unknown as VisitLike)),
    };
}

export async function createSchool(input: CreateSchoolInput, actor: ActorDTO): Promise<SchoolDTO> {
    const { visit, ...fields } = input;
    const key = keyOf(fields.name, fields.district, fields.place);
    const clash = await School.findOne({ key });
    if (clash) {
        throw ApiError.conflict(`"${clash.name}" is already in the list for ${clash.district}`, {
            name: "This school is already in the list",
        });
    }
    const doc = await School.create({
        ...fields,
        key,
        source: "manual",
        stage: SchoolStage.Prospect,
        createdBy: actor,
        updatedBy: actor,
    });
    if (visit) {
        await SchoolVisit.create({ ...visit, schoolId: doc._id, by: actor });
        await syncFromVisits(doc._id, actor);
    }
    return toSchoolDTO((await School.findById(doc._id)) as unknown as SchoolDoc);
}

const EDITABLE = [
    "name", "district", "place", "board", "studentCount", "studentNote", "lat", "lng", "correspondent", "phone", "reference",
    "notes", "address", "stage", "nextFollowUp", "active",
] as const;

export async function updateSchool(id: string, input: UpdateSchoolInput, actor: ActorDTO): Promise<SchoolDTO> {
    assertId(id);
    const doc = await School.findById(id);
    if (!doc) throw ApiError.notFound("School not found");
    if (input.expectedUpdatedAt && doc.updatedAt.toISOString() !== input.expectedUpdatedAt) {
        throw ApiError.conflict(
            `${doc.updatedBy?.name ?? "Someone"} changed this school while you were editing. Reload to see their changes, then try again.`,
        );
    }
    for (const f of EDITABLE) {
        const next = input[f];
        if (next !== undefined) (doc as unknown as Record<string, unknown>)[f] = next;
    }
    doc.key = keyOf(doc.name, doc.district, doc.place);
    doc.updatedBy = actor;
    try {
        await doc.save();
    } catch (err) {
        if ((err as { code?: number }).code === 11000) {
            throw ApiError.conflict("Another school with this name, district and place already exists", {
                name: "This school is already in the list",
            });
        }
        throw err;
    }
    return toSchoolDTO(doc as unknown as SchoolDoc);
}

export async function logVisit(id: string, input: LogVisitInput, actor: ActorDTO): Promise<SchoolDetailDTO> {
    assertId(id);
    const doc = await School.findById(id);
    if (!doc) throw ApiError.notFound("School not found");
    await SchoolVisit.create({ ...input, schoolId: doc._id, by: actor });
    await syncFromVisits(doc._id, actor);
    return getSchoolDetail(id);
}
