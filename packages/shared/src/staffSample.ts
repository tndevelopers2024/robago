// src/staffSample.ts
//
// Starter roster copied from the client's salary sheet (name, monthly salary, Phone Yes/No
// and the weekly advances for 1 Nov and 8 Nov 2026). Used by the backend `seed:staff`
// script and by the frontend's offline demo mode, so both show identical data.
import type { PhoneStatus } from "./enums.js";

export interface StaffSampleRow {
    name: string;
    monthlySalary: number;
    phoneStatus: PhoneStatus;
    joinedOn?: string;
    /** Advances keyed by the Sunday that heads the weekly column. */
    advances?: Record<string, number>;
}

const W1 = "2026-11-01";
const W2 = "2026-11-08";

const row = (
    name: string,
    monthlySalary: number,
    phoneStatus: PhoneStatus,
    a1?: number,
    a2?: number,
    joinedOn?: string,
): StaffSampleRow => ({
    name,
    monthlySalary,
    phoneStatus,
    ...(joinedOn ? { joinedOn } : {}),
    advances: { ...(a1 ? { [W1]: a1 } : {}), ...(a2 ? { [W2]: a2 } : {}) },
});

export const STAFF_SAMPLE: StaffSampleRow[] = [
    row("Shahid", 26000, "yes", 2000, 2000),
    row("Ijhar", 26000, "no"),
    row("Ashok", 18000, "no", 1500, 1500),
    row("Ujale", 23000, "yes", 2000, 2000),
    row("Abdul Barick", 25000, "yes", 2000, 2000),
    row("Sandip", 23000, "yes"),
    row("Rustam", 27000, "yes", 2000, 3000),
    row("Tanvir", 17000, "yes", 2000, 2000),
    row("Esrafil", 20000, "no", 2000, 2000),
    row("Riyazhuddin", 17000, "yes", 2000, 2000),
    row("Nousad", 26000, "yes", 3000, 3000),
    row("Samsuddin", 23000, "yes", 2000, 2000),
    row("Nooruashan", 23000, "no", 2000, 2000),
    row("Murtaza", 23000, "no", 4000, 2000),
    row("Thilsad", 22000, "yes", 2000, 2000),
    row("Reyaz", 20000, "yes", 4000, 12000),
    row("Aftab", 0, "no", 2000, 2000),
    row("Arju", 12000, "unknown", 1000, 1000),
    row("Sufyian", 11000, "yes", 1000, 1000),
    row("Jisan", 10000, "yes", 1000, 1000),
    row("Faisal", 12000, "no", 1000, 1000),
    row("Firoz", 13000, "yes", 1000, 1000),
    row("Rehan", 10000, "no", 1000, 1000),
    row("Musthafa", 12000, "yes", 1000, 1000),
    row("Sadham Helper", 12000, "yes", 1000, 1000),
    row("Irshath Khan", 12000, "yes", 1000, 1000),
    row("Tausif", 10000, "yes", 1000, 1000),
    row("Migayil", 9000, "unknown", 1000, 1000),
    row("Amrullah", 0, "unknown", undefined, 2000, "2026-11-06"),
    row("Jiwan", 13000, "unknown"),
    row("Mushthappa Cutting", 0, "unknown", undefined, undefined, "2026-11-04"),
];
