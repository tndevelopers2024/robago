// src/staff.test.ts — DB-independent checks: auth guards, validation, and the shared schemas.
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
    advanceEntrySchema,
    createEmployeeSchema,
    isoDateSchema,
    ledgerQuerySchema,
    paymentEntrySchema,
    updateEmployeeSchema,
} from "@robago/shared";

beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
    process.env.CORS_ORIGIN = "http://localhost:5173";
});

async function appAndTokens() {
    const { createApp } = await import("./app.js");
    const { signAccessToken } = await import("./utils/jwt.js");
    return {
        app: createApp(),
        admin: signAccessToken({ sub: "a1", phoneNumber: "1234567890", role: "superadmin" }),
        user: signAccessToken({ sub: "u1", phoneNumber: "9500088697", role: "manager" }),
    };
}

describe("staff API guards & validation", () => {
    it("rejects unauthenticated requests", async () => {
        const { app } = await appAndTokens();
        expect((await request(app).get("/api/v1/staff")).status).toBe(401);
    });

    it("forbids non-admin users from reading salaries", async () => {
        const { app, user } = await appAndTokens();
        const res = await request(app).get("/api/v1/staff").set("Authorization", `Bearer ${user}`);
        expect(res.status).toBe(403);
    });

    it("requires a name to create an employee", async () => {
        const { app, admin } = await appAndTokens();
        const res = await request(app).post("/api/v1/staff").set("Authorization", `Bearer ${admin}`).send({ monthlySalary: 100 });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.name).toBeDefined();
    });

    it("rejects a negative salary", async () => {
        const { app, admin } = await appAndTokens();
        const res = await request(app)
            .post("/api/v1/staff")
            .set("Authorization", `Bearer ${admin}`)
            .send({ name: "Test", monthlySalary: -5 });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.monthlySalary).toMatch(/negative/);
    });

    it("requires a month for the ledger", async () => {
        const { app, admin } = await appAndTokens();
        const res = await request(app).get("/api/v1/staff/ledger?month=2026-13").set("Authorization", `Bearer ${admin}`);
        expect(res.status).toBe(400);
    });

    it("rejects malformed attendance entries before touching the database", async () => {
        const { app, admin } = await appAndTokens();
        const res = await request(app)
            .put("/api/v1/staff/attendance")
            .set("Authorization", `Bearer ${admin}`)
            .send({ entries: [{ employeeId: "507f1f77bcf86cd799439011", date: "2026-02-31", status: "P" }] });
        expect(res.status).toBe(400);
    });
});

describe("salary payment status", () => {
    it("rejects marking paid without an amount", async () => {
        const { app, admin } = await appAndTokens();
        const res = await request(app)
            .put("/api/v1/staff/payments")
            .set("Authorization", `Bearer ${admin}`)
            .send({ entries: [{ employeeId: "507f1f77bcf86cd799439011", month: "2026-11", paid: true }] });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors["entries.0.amount"]).toMatch(/required/);
    });

    it("forbids non-admins", async () => {
        const { app, user } = await appAndTokens();
        const res = await request(app)
            .put("/api/v1/staff/payments")
            .set("Authorization", `Bearer ${user}`)
            .send({ entries: [] });
        expect(res.status).toBe(403);
    });

    it("schema: undo needs no amount, bad month rejected", () => {
        const base = { employeeId: "507f1f77bcf86cd799439011" };
        expect(paymentEntrySchema.safeParse({ ...base, month: "2026-11", paid: false }).success).toBe(true);
        expect(paymentEntrySchema.safeParse({ ...base, month: "2026-11", paid: true, amount: 18500 }).success).toBe(true);
        expect(paymentEntrySchema.safeParse({ ...base, month: "11-2026", paid: false }).success).toBe(false);
    });
});

describe("staff shared schemas", () => {
    it("accepts real dates and rejects impossible ones", () => {
        expect(isoDateSchema.safeParse("2026-11-08").success).toBe(true);
        expect(isoDateSchema.safeParse("2026-02-30").success).toBe(false);
        expect(isoDateSchema.safeParse("08/11/2026").success).toBe(false);
    });

    it("create needs only a name; update is fully partial and does not inject defaults", () => {
        expect(createEmployeeSchema.safeParse({ name: "Asha" }).success).toBe(true);
        expect(createEmployeeSchema.safeParse({}).success).toBe(false);
        const patch = updateEmployeeSchema.parse({ monthlySalary: 20000 });
        expect(patch).toEqual({ monthlySalary: 20000 }); // untouched fields must not be reset
    });

    it("advance amount may be null (clear) but not negative", () => {
        const base = { employeeId: "507f1f77bcf86cd799439011", weekStart: "2026-11-01" };
        expect(advanceEntrySchema.safeParse({ ...base, amount: null }).success).toBe(true);
        expect(advanceEntrySchema.safeParse({ ...base, amount: -1 }).success).toBe(false);
    });

    it("ledger month must be YYYY-MM", () => {
        expect(ledgerQuerySchema.safeParse({ month: "2026-11" }).success).toBe(true);
        expect(ledgerQuerySchema.safeParse({ month: "2026-1" }).success).toBe(false);
    });
});
