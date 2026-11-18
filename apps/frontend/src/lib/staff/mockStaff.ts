// src/lib/staff/mockStaff.ts
//
// Offline demo mode only: serves the same /staff routes as the real backend, but keeps the
// data in this browser's localStorage. It is NOT used when the real server is reachable.
import { STAFF_SAMPLE, type EmployeeDTO, type LedgerDTO } from "@robago/shared";

const STORAGE_KEY = "robago_staff_demo_v1";

interface DemoDb {
    employees: EmployeeDTO[];
    advances: LedgerDTO["advances"];
    attendance: LedgerDTO["attendance"];
    payments: LedgerDTO["payments"];
}

const blank = {
    designation: "",
    department: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: "",
    dob: "",
    bloodGroup: "" as const,
    joinedOn: "",
    address: "",
    aadhaar: "",
    bankAccount: "",
    ifsc: "",
    upi: "",
    notes: "",
    monthlySalary: 0,
    active: true,
    phoneStatus: "unknown" as const,
};

function seed(): DemoDb {
    const db: DemoDb = {
        employees: [],
        advances: [],
        attendance: [],
        payments: [],
    };
    STAFF_SAMPLE.forEach((s, i) => {
        const id = `demo-${String(i + 1).padStart(3, "0")}`;
        db.employees.push({
            ...blank,
            id,
            name: s.name,
            monthlySalary: s.monthlySalary,
            phoneStatus: s.phoneStatus,
            joinedOn: s.joinedOn ?? "",
        });
        for (const [weekStart, amount] of Object.entries(s.advances ?? {})) {
            db.advances.push({ employeeId: id, weekStart, amount });
        }
    });
    return db;
}

function load(): DemoDb {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const db = JSON.parse(raw) as DemoDb;
            return { ...db, payments: db.payments ?? [] };
        }
    } catch {
        // fall through
    }
    return seed();
}

function save(db: DemoDb) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
        // storage blocked/full — demo data just won't persist
    }
}

export type StaffMockResult = {
    status: number;
    data?: unknown;
    error?: string;
};

export function handleStaffMock(
    method: string,
    path: string,
    params: Record<string, string | undefined>,
    body: Record<string, unknown>,
): StaffMockResult | null {
    if (path !== "/staff" && !path.startsWith("/staff/")) return null;
    const db = load();
    const rest = path.slice("/staff".length).replace(/^\//, "");

    if (rest === "" && method === "GET") return { status: 200, data: db.employees };

    if (rest === "" && method === "POST") {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) return { status: 400, error: "Validation failed" };
        const created = {
            ...blank,
            ...(body as Partial<EmployeeDTO>),
            name,
            id: `demo-${crypto.randomUUID().slice(0, 8)}`,
        };
        db.employees.push(created);
        save(db);
        return { status: 201, data: created };
    }

    if (rest === "ledger" && method === "GET") {
        const month = params.month ?? "";
        return {
            status: 200,
            data: {
                month,
                advances: db.advances.filter((a) => a.weekStart.startsWith(month)),
                attendance: db.attendance.filter((a) => a.date.startsWith(month)),
                payments: db.payments.filter((p) => p.month === month),
            } satisfies LedgerDTO,
        };
    }

    if (rest === "advances" && method === "PUT") {
        for (const e of (body.entries as {
            employeeId: string;
            weekStart: string;
            amount: number | null;
        }[]) ?? []) {
            db.advances = db.advances.filter((a) => !(a.employeeId === e.employeeId && a.weekStart === e.weekStart));
            if (e.amount)
                db.advances.push({
                    employeeId: e.employeeId,
                    weekStart: e.weekStart,
                    amount: e.amount,
                });
        }
        save(db);
        return { status: 204 };
    }

    if (rest === "payments" && method === "PUT") {
        for (const e of (body.entries as {
            employeeId: string;
            month: string;
            paid: boolean;
            amount?: number;
        }[]) ?? []) {
            const before = db.payments.find((p) => p.employeeId === e.employeeId && p.month === e.month);
            db.payments = db.payments.filter((p) => !(p.employeeId === e.employeeId && p.month === e.month));
            if (e.paid) {
                db.payments.push({
                    employeeId: e.employeeId,
                    month: e.month,
                    amount: e.amount ?? 0,
                    paidAt: before?.paidAt ?? new Date().toISOString(),
                });
            }
        }
        save(db);
        return { status: 204 };
    }

    if (rest === "attendance" && method === "PUT") {
        for (const e of (body.entries as {
            employeeId: string;
            date: string;
            status: "P" | "A" | "H" | "L" | null;
        }[]) ?? []) {
            db.attendance = db.attendance.filter((a) => !(a.employeeId === e.employeeId && a.date === e.date));
            if (e.status)
                db.attendance.push({
                    employeeId: e.employeeId,
                    date: e.date,
                    status: e.status,
                });
        }
        save(db);
        return { status: 204 };
    }

    const idx = db.employees.findIndex((e) => e.id === rest);
    if (method === "PATCH") {
        const target = db.employees[idx];
        if (!target) return { status: 404, error: "Employee not found" };
        const updated = {
            ...target,
            ...(body as Partial<EmployeeDTO>),
            id: target.id,
        };
        db.employees[idx] = updated;
        save(db);
        return { status: 200, data: updated };
    }
    if (method === "DELETE") {
        if (idx < 0) return { status: 404, error: "Employee not found" };
        db.employees.splice(idx, 1);
        db.advances = db.advances.filter((a) => a.employeeId !== rest);
        db.attendance = db.attendance.filter((a) => a.employeeId !== rest);
        db.payments = db.payments.filter((p) => p.employeeId !== rest);
        save(db);
        return { status: 204 };
    }
    return { status: 404, error: "Not found" };
}
