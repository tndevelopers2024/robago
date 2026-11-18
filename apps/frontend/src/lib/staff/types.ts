// src/lib/staff/types.ts
import type { AttendanceStatus, EmployeeDTO, PhoneStatus } from "@robago/shared";

export type { AttendanceStatus, PhoneStatus };

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
    P: "Present",
    A: "Absent",
    H: "Half day",
    L: "Leave",
};

/** Days of work an attendance mark counts for. */
export const ATTENDANCE_VALUE: Record<AttendanceStatus, number> = {
    P: 1,
    H: 0.5,
    A: 0,
    L: 0,
};

/** An employee as the API returns it. */
export type Employee = EmployeeDTO;
/** Every editable employee field (everything except the id). */
export type EmployeeInput = Omit<EmployeeDTO, "id">;

/** The staff data the screens work with, merged from the employee list and the month ledger(s). */
export interface PaymentRecord {
    /** Net pay handed over when the month was marked paid. */
    amount: number;
    /** ISO timestamp of the first time it was marked paid. */
    paidAt: string;
}

export interface StaffState {
    employees: Employee[];
    /** `${employeeId}|${YYYY-MM}` → payment record. Missing = salary not paid yet. */
    payments: Record<string, PaymentRecord>;
    /** `${employeeId}|${weekStartISO}` → advance amount handed over that week. */
    advances: Record<string, number>;
    /** `${employeeId}|${dateISO}` → attendance mark. */
    attendance: Record<string, AttendanceStatus>;
}
