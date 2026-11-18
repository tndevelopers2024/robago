// src/accounts.test.ts — DB-independent checks: guards, validation, reminder wording and WhatsApp links.
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
    buildReminderMessage,
    buildReminderSubject,
    createAccountSchema,
    createEntrySchema,
    sendReminderSchema,
    voidEntrySchema,
    whatsappLink,
    whatsappNumber,
    updateAccountSchema,
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

describe("accounts API guards & validation", () => {
    it("401 without a token, 403 for non-admins — on every kind of route", async () => {
        const { app, user } = await ctx();
        for (const path of ["/api/v1/accounts", "/api/v1/accounts/summary", "/api/v1/accounts/activity"]) {
            expect((await request(app).get(path)).status).toBe(401);
            expect((await request(app).get(path).set("Authorization", `Bearer ${user}`)).status).toBe(403);
        }
        expect((await request(app).post(`/api/v1/accounts/${ID}/reminders`).set("Authorization", `Bearer ${user}`).send({})).status).toBe(403);
    });

    it("needs a name and a kind to create an account", async () => {
        const { app, admin } = await ctx();
        const res = await request(app).post("/api/v1/accounts").set("Authorization", `Bearer ${admin}`).send({ name: " ", kind: "friend" });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.name).toBeDefined();
        expect(res.body.fieldErrors.kind).toBeDefined();
    });

    it("rejects zero/negative amounts and impossible dates on entries", async () => {
        const { app, admin } = await ctx();
        const bad = await request(app).post(`/api/v1/accounts/${ID}/entries`).set("Authorization", `Bearer ${admin}`).send({ type: "payment", amount: 0, date: "2026-02-30" });
        expect(bad.status).toBe(400);
        expect(bad.body.fieldErrors.amount).toMatch(/more than 0/);
        expect(bad.body.fieldErrors.date).toBeDefined();
    });

    it("will not void without a reason", async () => {
        const { app, admin } = await ctx();
        const res = await request(app).post(`/api/v1/accounts/entries/${ID}/void`).set("Authorization", `Bearer ${admin}`).send({ reason: "x" });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.reason).toBeDefined();
    });

    it("validates the activity filters", async () => {
        const { app, admin } = await ctx();
        const res = await request(app).get("/api/v1/accounts/activity?action=hacked&limit=9999").set("Authorization", `Bearer ${admin}`);
        expect(res.status).toBe(400);
    });
});

describe("accounts shared schemas", () => {
    it("create: only name + kind required; email must look like an email", () => {
        expect(createAccountSchema.safeParse({ name: "NSE", kind: "creditor" }).success).toBe(true);
        expect(createAccountSchema.safeParse({ name: "NSE", kind: "debtor", email: "not-an-email" }).success).toBe(false);
        expect(createAccountSchema.safeParse({ name: "NSE", kind: "debtor", email: "a@b.com", openingBalance: 5000 }).success).toBe(true);
    });
    it("update is fully partial (no injected defaults) and carries the concurrency stamp", () => {
        expect(updateAccountSchema.parse({ phone: "9876543210" })).toEqual({ phone: "9876543210" });
        expect(updateAccountSchema.safeParse({ name: "X", expectedUpdatedAt: "2026-11-17T10:00:00.000Z" }).success).toBe(true);
    });
    it("entries and voids", () => {
        expect(createEntrySchema.safeParse({ type: "payment", amount: 50000, date: "2026-11-17", method: "upi", note: "part payment" }).success).toBe(true);
        expect(createEntrySchema.safeParse({ type: "refund", amount: 5, date: "2026-11-17" }).success).toBe(false);
        expect(voidEntrySchema.safeParse({ reason: "wrong amount typed" }).success).toBe(true);
    });
    it("reminders need a channel and a real message", () => {
        expect(sendReminderSchema.safeParse({ channel: "email", message: "Please pay", subject: "Reminder" }).success).toBe(true);
        expect(sendReminderSchema.safeParse({ channel: "sms", message: "Please pay" }).success).toBe(false);
        expect(sendReminderSchema.safeParse({ channel: "whatsapp", message: "hi" }).success).toBe(false);
    });
});

describe("reminder wording & WhatsApp links", () => {
    const ctxr = { name: "Raptee", balance: 300000, dueDate: "2026-12-05", senderName: "Hijaz", company: "Robago", lastPayment: { date: "2026-10-12", amount: 50000 } };
    it("builds a polite, complete message", () => {
        const m = buildReminderMessage(ctxr);
        expect(m).toContain("Dear Raptee,");
        expect(m).toContain("Rs. 3,00,000");
        expect(m).toContain("Rs. 50,000 on 12 October 2026");
        expect(m).toContain("by 5 December 2026");
        expect(m).toContain("Hijaz");
        expect(buildReminderSubject(ctxr)).toBe("Payment reminder from Robago — Rs. 3,00,000 pending");
    });
    it("works without a due date or a previous payment", () => {
        const m = buildReminderMessage({ ...ctxr, dueDate: "", lastPayment: null });
        expect(m).toContain("at your earliest convenience");
        expect(m).not.toContain("We last received");
    });
    it("normalises Indian mobile numbers for WhatsApp", () => {
        expect(whatsappNumber("98765 43210")).toBe("919876543210");
        expect(whatsappNumber("09876543210")).toBe("919876543210");
        expect(whatsappNumber("+91 98765-43210")).toBe("919876543210");
        expect(whatsappNumber("12345")).toBeNull();
        expect(whatsappNumber("")).toBeNull();
    });
    it("builds a wa.me link with the message safely encoded", () => {
        const link = whatsappLink("9876543210", "Pay Rs. 500 & thanks\nBye")!;
        expect(link.startsWith("https://wa.me/919876543210?text=")).toBe(true);
        expect(decodeURIComponent(link.split("text=")[1]!)).toBe("Pay Rs. 500 & thanks\nBye");
        expect(whatsappLink("abc", "hi")).toBeNull();
    });
});
