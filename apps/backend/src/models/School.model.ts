// src/models/School.model.ts — schools we visit (or could visit), and the append-only log of visits to them.
import { Schema, model } from "mongoose";
import { SchoolBoard, SchoolSource, SchoolStage } from "@robago/shared";

/** Who did something. A snapshot — it must stay readable even if the user is later renamed or removed. */
const actorSchema = new Schema({ id: String, name: String, phone: String }, { _id: false });

const schoolSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        district: { type: String, required: true, trim: true },
        place: { type: String, default: "", trim: true }, // town / area inside the district
        // lower-cased name + district + place: stops the same school being added twice
        key: { type: String, required: true },
        board: { type: String, enum: Object.values(SchoolBoard), default: SchoolBoard.Other },
        studentCount: { type: Number, default: null },
        studentNote: { type: String, default: "" },
        lat: { type: Number, default: null }, // exact map pin; null = placed by town
        lng: { type: Number, default: null },
        stage: { type: String, enum: Object.values(SchoolStage), default: SchoolStage.Prospect },
        status: { type: String, default: "" }, // outcome of the latest visit
        correspondent: { type: String, default: "" },
        metWith: { type: String, default: "" },
        phone: { type: String, default: "" },
        reference: { type: String, default: "" },
        notes: { type: String, default: "" },
        address: { type: String, default: "" },
        source: { type: String, enum: Object.values(SchoolSource), default: SchoolSource.Manual },
        firstVisitDate: { type: String, default: "" },
        lastVisitDate: { type: String, default: "" },
        nextFollowUp: { type: String, default: "" },
        visitCount: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
        createdBy: { type: actorSchema, required: true },
        updatedBy: { type: actorSchema, required: true },
    },
    { timestamps: true },
);
schoolSchema.index({ key: 1 }, { unique: true });
schoolSchema.index({ district: 1, stage: 1 });

// Every meeting, newest first. Never edited in place — the school's current status is worked out from the latest one.
const visitSchema = new Schema(
    {
        schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
        date: { type: String, required: true }, // YYYY-MM-DD
        metWith: { type: String, default: "" },
        outcome: { type: String, required: true },
        stage: { type: String, enum: Object.values(SchoolStage), required: true },
        nextFollowUp: { type: String, default: "" },
        by: { type: actorSchema, required: true },
    },
    { timestamps: true },
);
visitSchema.index({ schoolId: 1, date: -1, createdAt: -1 });

export const School = model("School", schoolSchema);
export const SchoolVisit = model("SchoolVisit", visitSchema);
