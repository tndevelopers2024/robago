// src/services/staff.service.ts
import { isValidObjectId, type HydratedDocument } from "mongoose";
import type {
    AdvanceEntry,
    AttendanceEntry,
    AttendanceStatus,
    CreateEmployeeInput,
    EmployeeDTO,
    LedgerDTO,
    PaymentEntry,
    UpdateEmployeeInput,
} from "@robago/shared";
import { Employee, type EmployeeDoc } from "../models/Employee.model.js";
import { Advance, Attendance, SalaryPayment } from "../models/StaffLedger.model.js";
import { ApiError } from "../utils/ApiError.js";

type EmployeeRecord = HydratedDocument<EmployeeDoc>;

export function toEmployeeDTO(e: EmployeeRecord): EmployeeDTO {
    return {
        id: e.id as string,
        name: e.name,
        designation: e.designation,
        department: e.department,
        phoneStatus: e.phoneStatus,
        phone: e.phone,
        emergencyName: e.emergencyName,
        emergencyPhone: e.emergencyPhone,
        dob: e.dob,
        bloodGroup: e.bloodGroup as EmployeeDTO["bloodGroup"],
        joinedOn: e.joinedOn,
        address: e.address,
        aadhaar: e.aadhaar,
        bankAccount: e.bankAccount,
        ifsc: e.ifsc,
        upi: e.upi,
        notes: e.notes,
        monthlySalary: e.monthlySalary,
        active: e.active,
    };
}

function assertId(id: string) {
    if (!isValidObjectId(id)) throw ApiError.notFound("Employee not found");
}

// ---- employees ----------------------------------------------------------------------------

/** Oldest first, so the sheet keeps the order people were added in (the S.No order). */
export async function listEmployees(): Promise<EmployeeDTO[]> {
    const rows = await Employee.find().sort({ _id: 1 });
    return rows.map(toEmployeeDTO);
}

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDTO> {
    return toEmployeeDTO(await Employee.create(input));
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<EmployeeDTO> {
    assertId(id);
    const updated = await Employee.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
    if (!updated) throw ApiError.notFound("Employee not found");
    return toEmployeeDTO(updated);
}

/** Deleting a person also removes their advances and attendance — they would be orphans. */
export async function deleteEmployee(id: string): Promise<void> {
    assertId(id);
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) throw ApiError.notFound("Employee not found");
    await Promise.all([
        Advance.deleteMany({ employeeId: id }),
        Attendance.deleteMany({ employeeId: id }),
        SalaryPayment.deleteMany({ employeeId: id }),
    ]);
}

// ---- ledger (advances + attendance) ------------------------------------------------------

/** Dates are `YYYY-MM-DD` strings, so a plain string range is a correct month filter. */
export async function getLedger(month: string): Promise<LedgerDTO> {
    const from = `${month}-01`;
    const to = `${month}-31`;
    const [advances, attendance, payments] = await Promise.all([
        Advance.find({ weekStart: { $gte: from, $lte: to } }).lean(),
        Attendance.find({ date: { $gte: from, $lte: to } }).lean(),
        SalaryPayment.find({ month }).lean(),
    ]);
    return {
        month,
        advances: advances.map((a) => ({
            employeeId: String(a.employeeId),
            weekStart: a.weekStart,
            amount: a.amount,
        })),
        attendance: attendance.map((a) => ({
            employeeId: String(a.employeeId),
            date: a.date,
            status: a.status as AttendanceStatus,
        })),
        payments: payments.map((p) => ({
            employeeId: String(p.employeeId),
            month: p.month,
            amount: p.amount,
            paidAt: p.paidAt.toISOString(),
        })),
    };
}

async function assertEmployeesExist(ids: string[]) {
    const unique = [...new Set(ids)];
    const found = await Employee.countDocuments({ _id: { $in: unique } });
    if (found !== unique.length) {
        throw ApiError.badRequest("One or more employees no longer exist", {
            entries: "Unknown employee — refresh the page and try again",
        });
    }
}

export async function setAdvances(entries: AdvanceEntry[]): Promise<void> {
    await assertEmployeesExist(entries.map((e) => e.employeeId));
    await Advance.bulkWrite(
        entries.map((e) =>
            e.amount === null || e.amount === 0
                ? { deleteOne: { filter: { employeeId: e.employeeId, weekStart: e.weekStart } } }
                : {
                      updateOne: {
                          filter: { employeeId: e.employeeId, weekStart: e.weekStart },
                          update: { $set: { amount: e.amount } },
                          upsert: true,
                      },
                  },
        ),
    );
}

export async function setAttendance(entries: AttendanceEntry[]): Promise<void> {
    await assertEmployeesExist(entries.map((e) => e.employeeId));
    await Attendance.bulkWrite(
        entries.map((e) =>
            e.status === null
                ? { deleteOne: { filter: { employeeId: e.employeeId, date: e.date } } }
                : {
                      updateOne: {
                          filter: { employeeId: e.employeeId, date: e.date },
                          update: { $set: { status: e.status } },
                          upsert: true,
                      },
                  },
        ),
    );
}

/** Mark a month's salary paid (keeping the amount and first paid date) or undo it. */
export async function setPayments(entries: PaymentEntry[]): Promise<void> {
    await assertEmployeesExist(entries.map((e) => e.employeeId));
    await SalaryPayment.bulkWrite(
        entries.map((e) =>
            e.paid
                ? {
                      updateOne: {
                          filter: { employeeId: e.employeeId, month: e.month },
                          update: { $set: { amount: e.amount as number }, $setOnInsert: { paidAt: new Date() } },
                          upsert: true,
                      },
                  }
                : { deleteOne: { filter: { employeeId: e.employeeId, month: e.month } } },
        ),
    );
}
