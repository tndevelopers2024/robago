// src/scripts/seedSchools.ts
//
// Loads the schools the team has already visited (from the client's "school database.xlsx") and a list of other private
// schools in the same districts to approach next (collected from public school directories — UNVERIFIED).
// Safe to run again: a school that is already in the list is skipped, never changed.   Usage:  pnpm seed:schools
import { connectDB, disconnectDB } from "../config/db.js";
import { School, SchoolVisit } from "../models/School.model.js";
import { SCHOOL_PROSPECTS_SAMPLE, SCHOOL_VISITS_SAMPLE, SchoolStage } from "@robago/shared";

const SYSTEM = { id: "system", name: "Import from sheet", phone: "" };
const keyOf = (name: string, district: string, place: string) =>
    [name, district, place].map((s) => s.trim().toLowerCase().replace(/\s+/g, " ")).join("|");

async function main() {
    await connectDB();
    let visited = 0;
    let prospects = 0;
    let skipped = 0;

    for (const r of SCHOOL_VISITS_SAMPLE) {
        const key = keyOf(r.name, r.district, r.place);
        if (await School.exists({ key })) {
            skipped++;
            continue;
        }
        const school = await School.create({
            name: r.name, district: r.district, place: r.place, key, board: r.board,
            studentCount: r.studentCount, studentNote: r.studentNote, correspondent: r.correspondent, phone: r.phone,
            reference: r.reference, notes: r.notes, source: "manual",
            stage: r.stage, status: r.outcome, metWith: r.metWith, firstVisitDate: r.date, lastVisitDate: r.date, visitCount: 1,
            createdBy: SYSTEM, updatedBy: SYSTEM,
        });
        await SchoolVisit.create({
            schoolId: school._id, date: r.date, metWith: r.metWith || r.correspondent, outcome: r.outcome, stage: r.stage, by: SYSTEM,
        });
        visited++;
    }

    for (const p of SCHOOL_PROSPECTS_SAMPLE) {
        const key = keyOf(p.name, p.district, p.place);
        if (await School.exists({ key })) {
            skipped++;
            continue;
        }
        await School.create({
            name: p.name, district: p.district, place: p.place, key, board: p.board, source: "web", stage: SchoolStage.Prospect,
            createdBy: SYSTEM, updatedBy: SYSTEM,
        });
        prospects++;
    }
    console.log(`Loaded ${visited} visited schools and ${prospects} prospects (${skipped} already there, left untouched).`);
}

main()
    .catch((err) => {
        console.error("Schools seed failed:", err);
        process.exitCode = 1;
    })
    .finally(disconnectDB);
