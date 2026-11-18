// src/expense.test.ts — DB-independent checks: guards, validation and shared schemas.
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
    EXPENSE_DEFAULT_ITEMS,
    createExpenseItemSchema,
    createExpenseSchema,
    expenseRangeQuerySchema,
    updateExpenseSchema,
} from "@robago/shared";

beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
    process.env.CORS_ORIGIN = "http://localhost:5173";
});

async function ctx() {
    const { createApp } = await import("./app.js");
    const { signAccessToken } = await import("./utils/jwt.js");
    return {
        app: createApp(),
        admin: signAccessToken({ sub: "a1", phoneNumber: "1234567890", role: "superadmin" }),
        user: signAccessToken({ sub: "u1", phoneNumber: "9500088697", role: "manager" }),
    };
}
const ID = "507f1f77bcf86cd799439011";

describe("expenses API guards & validation", () => {
    it("401 without a token, 403 for non-admins", async () => {
        const { app, user } = await ctx();
        expect((await request(app).get("/api/v1/expenses/items")).status).toBe(401);
        expect((await request(app).get("/api/v1/expenses/items").set("Authorization", `Bearer ${user}`)).status).toBe(403);
    });

    it("rejects a zero or negative amount", async () => {
        const { app, admin } = await ctx();
        for (const amount of [0, -50]) {
            const res = await request(app)
                .post("/api/v1/expenses")
                .set("Authorization", `Bearer ${admin}`)
                .send({ date: "2026-11-10", itemId: ID, amount });
            expect(res.status).toBe(400);
            expect(res.body.fieldErrors.amount).toMatch(/more than 0/);
        }
    });

    it("rejects an impossible date and a bad month", async () => {
        const { app, admin } = await ctx();
        const bad = await request(app)
            .post("/api/v1/expenses")
            .set("Authorization", `Bearer ${admin}`)
            .send({ date: "2026-02-31", itemId: ID, amount: 100 });
        expect(bad.status).toBe(400);
        const q = await request(app).get("/api/v1/expenses?month=2026-13").set("Authorization", `Bearer ${admin}`);
        expect(q.status).toBe(400);
    });

    it("requires a name and a valid type to create an item", async () => {
        const { app, admin } = await ctx();
        const res = await request(app)
            .post("/api/v1/expenses/items")
            .set("Authorization", `Bearer ${admin}`)
            .send({ name: "  ", type: "Whatever" });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.name).toBeDefined();
        expect(res.body.fieldErrors.type).toBeDefined();
    });
});

describe("expense shared schemas", () => {
    it("ships the starting heads from the brief", () => {
        const general = EXPENSE_DEFAULT_ITEMS.find((g) => g.type === "General")?.names ?? [];
        const operational = EXPENSE_DEFAULT_ITEMS.find((g) => g.type === "Operational")?.names ?? [];
        expect(general).toEqual(expect.arrayContaining(["Tea", "Porter", "Tempo", "Chicken", "Cylinder"]));
        expect(operational).toEqual(expect.arrayContaining(["Electricity", "Godown rent", "Auditor fees", "BNI subscription"]));
        expect(new Set([...general, ...operational]).size).toBe(general.length + operational.length); // no duplicates
    });

    it("create needs date, item and a positive amount; note optional; update is partial", () => {
        expect(createExpenseSchema.safeParse({ date: "2026-11-10", itemId: ID, amount: 120 }).success).toBe(true);
        expect(createExpenseSchema.safeParse({ date: "2026-11-10", amount: 120 }).success).toBe(false);
        expect(updateExpenseSchema.parse({ amount: 150 })).toEqual({ amount: 150 });
    });

    it("trims item names and limits the type", () => {
        expect(createExpenseItemSchema.parse({ name: "  Biscuits ", type: "General" }).name).toBe("Biscuits");
        expect(createExpenseItemSchema.safeParse({ name: "X", type: "Other" }).success).toBe(false);
    });

    it("range must be ordered and at most 36 months", () => {
        expect(expenseRangeQuerySchema.safeParse({ from: "2026-06", to: "2026-11" }).success).toBe(true);
        expect(expenseRangeQuerySchema.safeParse({ from: "2026-11", to: "2026-06" }).success).toBe(false);
        expect(expenseRangeQuerySchema.safeParse({ from: "2020-01", to: "2026-11" }).success).toBe(false);
    });
});
