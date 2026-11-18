// src/scripts/seedStaff.ts
//
// Loads the starter staff roster (and its Nov 2026 weekly advances). Unlike `seed`, this
// NEVER touches users, inventory or anything else — and it refuses to run if staff data
// already exists, so it can't overwrite real entries. Pass --force to replace staff data.
import { connectDB, disconnectDB } from "../config/db.js";
import { Employee } from "../models/Employee.model.js";
import { Advance, Attendance, SalaryPayment } from "../models/StaffLedger.model.js";
import { STAFF_SAMPLE } from "@robago/shared";

async function main() {
    const force = process.argv.includes("--force");
    await connectDB();

    const existing = await Employee.countDocuments();
    if (existing > 0 && !force) {
        console.log(`Skipped: ${existing} employees already exist. Re-run with --force to replace all staff data.`);
        return;
    }
    if (existing > 0) {
        await Promise.all([
            Employee.deleteMany({}),
            Advance.deleteMany({}),
            Attendance.deleteMany({}),
            SalaryPayment.deleteMany({}),
        ]);
        console.log(`Removed ${existing} existing employees and their advances/attendance.`);
    }

    // Insert one by one so _id order (the S.No order on the sheet) matches the roster order.
    let advanceCount = 0;
    for (const sample of STAFF_SAMPLE) {
        const emp = await Employee.create({
            name: sample.name,
            monthlySalary: sample.monthlySalary,
            phoneStatus: sample.phoneStatus,
            joinedOn: sample.joinedOn ?? "",
        });
        const rows = Object.entries(sample.advances ?? {}).map(([weekStart, amount]) => ({
            employeeId: emp._id,
            weekStart,
            amount,
        }));
        if (rows.length) await Advance.insertMany(rows);
        advanceCount += rows.length;
    }
    console.log(`Seeded ${STAFF_SAMPLE.length} employees and ${advanceCount} weekly advances.`);
}

main()
    .catch((err) => {
        console.error("Staff seed failed:", err);
        process.exitCode = 1;
    })
    .finally(disconnectDB);
