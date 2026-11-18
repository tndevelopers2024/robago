// src/models/Employee.model.ts
import { Schema, model, type InferSchemaType } from "mongoose";
import { PhoneStatus } from "@robago/shared";

// Staff on the factory floor / office. This is deliberately separate from `User` (app login
// accounts): most employees never log in.
const employeeSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        designation: { type: String, default: "" },
        department: { type: String, default: "" },
        phoneStatus: { type: String, enum: Object.values(PhoneStatus), default: PhoneStatus.Unknown },
        phone: { type: String, default: "" },
        emergencyName: { type: String, default: "" },
        emergencyPhone: { type: String, default: "" },
        dob: { type: String, default: "" }, // YYYY-MM-DD or ""
        bloodGroup: { type: String, default: "" },
        joinedOn: { type: String, default: "" }, // YYYY-MM-DD or ""
        address: { type: String, default: "" },
        aadhaar: { type: String, default: "" },
        bankAccount: { type: String, default: "" },
        ifsc: { type: String, default: "" },
        upi: { type: String, default: "" },
        notes: { type: String, default: "" },
        monthlySalary: { type: Number, default: 0, min: 0 },
        active: { type: Boolean, default: true, index: true },
    },
    { timestamps: true },
);

export type EmployeeDoc = InferSchemaType<typeof employeeSchema>;
export const Employee = model("Employee", employeeSchema);
