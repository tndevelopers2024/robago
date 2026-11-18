// src/schemas/staff.schema.ts
import { z } from "zod";
import { AttendanceStatus, BLOOD_GROUPS, PhoneStatus } from "../enums.js";
import { objectIdSchema } from "./common.schema.js";

/** A real calendar date as `YYYY-MM-DD` (rejects things like 2026-02-31). */
export const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .refine((s) => {
        const d = new Date(`${s}T00:00:00Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    }, "Enter a valid date");

/** Optional date: a valid ISO date, or "" when not known. */
const optionalDateSchema = z.union([isoDateSchema, z.literal("")]);

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the format YYYY-MM");

const text = () => z.string().trim().max(500);

// No `.default()`s here on purpose: `.partial()` on a schema with defaults would silently
// reset untouched fields on a PATCH. Defaults live in the Mongoose model instead.
const employeeShape = {
    name: z.string().trim().min(1, "Name is required").max(120),
    designation: text(),
    department: text(),
    phoneStatus: z.enum(Object.values(PhoneStatus) as [PhoneStatus, ...PhoneStatus[]]),
    phone: z.string().trim().max(20),
    emergencyName: text(),
    emergencyPhone: z.string().trim().max(20),
    dob: optionalDateSchema,
    bloodGroup: z.union([z.enum(BLOOD_GROUPS), z.literal("")]),
    joinedOn: optionalDateSchema,
    address: z.string().trim().max(1000),
    aadhaar: z.string().trim().max(20),
    bankAccount: z.string().trim().max(40),
    ifsc: z.string().trim().max(20),
    upi: z.string().trim().max(100),
    notes: z.string().trim().max(2000),
    monthlySalary: z.number({ error: "Salary must be a number" }).min(0, "Salary cannot be negative").max(100_000_000),
    active: z.boolean(),
};

/** Only `name` is required; everything else falls back to the model's defaults. */
export const createEmployeeSchema = z.object(employeeShape).partial().required({ name: true });
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object(employeeShape).partial();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

/** What the API returns for one employee. */
export const employeeDtoSchema = z.object(employeeShape).extend({ id: z.string() });
export type EmployeeDTO = z.infer<typeof employeeDtoSchema>;

// ---- weekly advances & daily attendance ---------------------------------------------------

export const ledgerQuerySchema = z.object({ month: monthSchema });
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;

export const advanceEntrySchema = z.object({
    employeeId: objectIdSchema,
    /** The Sunday that heads the weekly column. */
    weekStart: isoDateSchema,
    /** `null` (or 0) clears the advance. */
    amount: z.number().min(0, "Advance cannot be negative").max(100_000_000).nullable(),
});
export type AdvanceEntry = z.infer<typeof advanceEntrySchema>;

export const setAdvancesSchema = z.object({
    entries: z.array(advanceEntrySchema).min(1, "Nothing to save").max(1000),
});
export type SetAdvancesInput = z.infer<typeof setAdvancesSchema>;

export const attendanceEntrySchema = z.object({
    employeeId: objectIdSchema,
    date: isoDateSchema,
    /** `null` clears the mark. */
    status: z.enum(Object.values(AttendanceStatus) as [AttendanceStatus, ...AttendanceStatus[]]).nullable(),
});
export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;

export const setAttendanceSchema = z.object({
    entries: z.array(attendanceEntrySchema).min(1, "Nothing to save").max(2000),
});
export type SetAttendanceInput = z.infer<typeof setAttendanceSchema>;

// ---- monthly salary payment ("payment done for November") ---------------------------------

export const paymentEntrySchema = z
    .object({
        employeeId: objectIdSchema,
        month: monthSchema,
        /** true = salary for that month has been paid; false = undo. */
        paid: z.boolean(),
        /** The net amount handed over. Required when marking paid. */
        amount: z.number().min(-100_000_000).max(100_000_000).optional(),
    })
    .refine((e) => !e.paid || e.amount !== undefined, {
        message: "Amount is required when marking a salary as paid",
        path: ["amount"],
    });
export type PaymentEntry = z.infer<typeof paymentEntrySchema>;

export const setPaymentsSchema = z.object({
    entries: z.array(paymentEntrySchema).min(1, "Nothing to save").max(500),
});
export type SetPaymentsInput = z.infer<typeof setPaymentsSchema>;

export interface LedgerDTO {
    month: string;
    advances: { employeeId: string; weekStart: string; amount: number }[];
    attendance: { employeeId: string; date: string; status: AttendanceStatus }[];
    /** Employees whose salary for this month is marked paid, with the amount and when. */
    payments: { employeeId: string; month: string; amount: number; paidAt: string }[];
}
