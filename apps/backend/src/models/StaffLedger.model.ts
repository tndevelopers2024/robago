// src/models/StaffLedger.model.ts
import { Schema, model } from "mongoose";
import { AttendanceStatus } from "@robago/shared";

// One row per employee per week: how much cash advance they took that week.
// `weekStart` is the Sunday date (YYYY-MM-DD) heading the weekly column on the salary sheet.
const advanceSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        weekStart: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
    },
    { timestamps: true },
);
advanceSchema.index({ employeeId: 1, weekStart: 1 }, { unique: true });
advanceSchema.index({ weekStart: 1 });

// One row per employee per day. A missing row means "not marked yet".
const attendanceSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        date: { type: String, required: true }, // YYYY-MM-DD
        status: { type: String, enum: Object.values(AttendanceStatus), required: true },
    },
    { timestamps: true },
);
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export const Advance = model("Advance", advanceSchema);
export const Attendance = model("Attendance", attendanceSchema);

// One row per employee per month once that month's salary has been paid.
// `amount` is the net pay handed over, kept as a snapshot so the payslip stays stable.
const salaryPaymentSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        month: { type: String, required: true }, // YYYY-MM
        amount: { type: Number, required: true },
        paidAt: { type: Date, required: true },
    },
    { timestamps: true },
);
salaryPaymentSchema.index({ employeeId: 1, month: 1 }, { unique: true });
salaryPaymentSchema.index({ month: 1 });

export const SalaryPayment = model("SalaryPayment", salaryPaymentSchema);
